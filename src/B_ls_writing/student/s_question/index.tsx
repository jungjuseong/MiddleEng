import * as React from 'react';
import { observer } from 'mobx-react';
import { observable } from 'mobx';

import { App } from '../../../App';
import * as felsocket from '../../../felsocket';
import { ToggleBtn } from '@common/component/button';
import * as kutil from '@common/util/kutil';

import { IStateCtx, IActionsCtx, QPROG, SPROG } from '../s_store';
import * as common from '../../common';
import SendUINew from '../../../share/sendui_new';

import QuizItem from './_quiz_item';

const SwiperComponent = require('react-id-swiper').default;

interface INItem {
	idx: number;
	on: boolean;
	OX: ''|'O'|'X';
	onClick: (idx: number) => void;
}

/*  페이지 인디게이터 관련  */
class NItem extends React.Component<INItem> {
	private _click = () => {
		this.props.onClick(this.props.idx);
	}
	public render() {
		const { idx, on } = this.props;
		return <span className={this.props.OX + (on ? ' on' : '')} onClick={this._click}>{idx + 1}</span>;
	}
}

interface ISQuestion {
	view: boolean;
	questionView: boolean;
	questionProg: QPROG;
	scriptProg: SPROG;
	scriptMode: 'COMPREHENSION'|'DIALOGUE';
	qsMode: ''|'question'|'script';
	state: IStateCtx;
	actions: IActionsCtx;
}

@observer
class SQuestion extends React.Component<ISQuestion> {
	@observable private _curIdx = 0;
	@observable private _curIdx_tgt = 0;
	@observable private _choices: common.IQuizReturn[] = [];

	private _style: React.CSSProperties = {};
	private _swiper: Swiper|null = null;

	constructor(props: ISQuestion) {
		super(props);
		const quizs = props.actions.getData().quizs;
		for(let i = 0; i < quizs.length; i++) {
			this._choices[i] = {
				answer: 0,
				stime: 0,
				etime: 0,
			};
		}
	}

	private _refSwiper = (el: SwiperComponent) => {
		if(this._swiper || !el) return;

		const swiper = el.swiper;
		swiper.on('transitionStart', () => {
			this._curIdx = -1;
		});
		swiper.on('transitionEnd', () => {
			if(this.props.view) {
				this._curIdx = swiper.activeIndex;
				this._curIdx_tgt = this._curIdx;
			}
		});
		this._swiper = swiper;
	}

	/* 페이지 관련 */
	private _onPage = (idx: number) => {
		if(this.props.questionProg === QPROG.ON) return; 

		App.pub_playBtnTab();
		this._curIdx_tgt = idx;
		if(this._swiper) this._swiper.slideTo(idx);
	}

	private _onSend = async () => {
		if(this.props.questionProg !== QPROG.ON) return;
		App.pub_playToPad();
		this.props.state.questionProg = QPROG.SENDING;
		if(App.student) {
			const choices: common.IQuizReturn[] = [];
			this._choices.forEach((choice, idx) => {
				choices.push({
					answer: choice.answer,
					stime: choice.stime,
					etime: choice.etime,				
				});
			});
			const msg: common.IQuizReturnMsg = {
				msgtype: 'quiz_return',
				id: App.student.id,
				returns: choices,
			};

			felsocket.sendTeacher($SocketType.MSGTOTEACHER, msg);
			await kutil.wait(600);

			if(this.props.state.questionProg === QPROG.SENDING) {
				this.props.state.questionProg = QPROG.SENDED;

				App.pub_playGoodjob();	// 19-02-01 190108_검수사항 p.14 수정 
				this.props.actions.startGoodJob(); 	// 19-02-01 190108_검수사항 p.14 수정 
			}
		}
	}
	private _onNext = () => {
		const qProg = this.props.questionProg;
		const curChoice = this._curIdx >= 0 ? this._choices[this._curIdx] : undefined;

		const curAnswer = curChoice ? curChoice.answer : 0;
		const canNext = curAnswer > 0 && qProg === QPROG.ON;
		const isLast = this._curIdx === this._choices.length - 1;

		if(canNext && !isLast && this._swiper) {
			if(this._choices[this._curIdx + 1]) {
				this._choices[this._curIdx + 1].stime = Date.now();
			}
			this._swiper.slideNext();
			App.pub_playBtnTab();
		}
	}

	private _onChoice = (idx: number, choice: number) => {
		if(this.props.questionProg !== QPROG.ON) return;
		else if(idx !== this._curIdx) return;

		App.pub_playBtnTab();
		if(this._choices[idx]) {
			this._choices[idx].answer = choice;
			this._choices[idx].etime = Date.now();
		}
	}
	private _gotoScript = () => {
		if(this.props.state.qsMode === 'script') return;

		App.pub_playBtnTab();
		this.props.state.qsMode = 'script';
	}
	private _setStyle(props: ISQuestion) {
		if(
			props.scriptMode === 'COMPREHENSION' &&
			props.questionView &&
			props.scriptProg > SPROG.UNMOUNT
		) this._style.transition = 'left 0.3s';
		else this._style.transition = '';
		
		if(
			props.scriptMode === 'COMPREHENSION' && 
			props.questionView && 
			props.qsMode === 'question'
		) this._style.left = '0px';
		else this._style.left = '1280px';
		// console.log(props, this._style);
	}
	public componentWillMount() {
		this._setStyle(this.props);		
	}

	public componentWillReceiveProps(next: ISQuestion) {
		if(
			next.questionProg !== this.props.questionProg ||
			next.scriptProg !== this.props.scriptProg ||
			next.scriptMode !== this.props.scriptMode ||
			next.qsMode !== this.props.qsMode
		) {
			this._setStyle(next);		
		}
	}
	
	public componentDidUpdate(prev: ISQuestion) {
		if (this.props.view && !prev.view) {			
			this._curIdx = 0;
			this._curIdx_tgt = 0;

			if(this._swiper) {
				this._swiper.slideTo(0, 0);
				this._swiper.update();
			}
			if(this.props.questionProg < QPROG.COMPLETE) {
				for(let i = 0; i < this._choices.length; i++) {
					this._choices[i].answer = 0;
					this._choices[i].stime = Date.now();
					this._choices[i].etime = 0;
				}
			}
		} else if (!this.props.view && prev.view) {
			if(this.props.questionProg < QPROG.COMPLETE) {
				for(let i = 0; i < this._choices.length; i++) {
					this._choices[i].answer = 0;
					this._choices[i].stime = Date.now();
					this._choices[i].etime = 0;
				}
			}
		}
		if(this.props.questionProg === QPROG.COMPLETE && prev.questionProg < QPROG.COMPLETE) {
			if(this._swiper) {
				this._swiper.slideTo(0);
			}			
		} 

		if(this.props.qsMode === 'script' && prev.qsMode === 'question') {
			if(this._swiper) {
				this._swiper.slideTo(0);
			}			
		}
	}

	public render() {
		const {view, state, actions, questionProg} = this.props;
		const c_data = actions.getData();
		const quizs = c_data.quizs;
		const noSwiping = questionProg === QPROG.ON;

		const curChoice = this._curIdx >= 0 ? this._choices[this._curIdx] : undefined;
		const curAnswer = curChoice ? curChoice.answer : 0;
		const canNext = curAnswer > 0 && questionProg === QPROG.ON;
		const isLast = this._curIdx === quizs.length - 1;
		
		return (
			<div className="s_question" style={{...this._style}}>
				<ToggleBtn className="btn_SCRIPT" onClick={this._gotoScript} view={state.scriptProg > SPROG.UNMOUNT}/>
				<div className="btn_page_box">
						{quizs.map((quiz, idx) => {
							let OX: ''|'O'|'X' = '';
							if(questionProg === QPROG.COMPLETE) {
								const choice = this._choices[idx];
								if(choice && choice.answer === quiz.answer) OX = 'O';
								else OX = 'X';
							}
							return (
								<NItem 
									key={idx} 
									on={idx === this._curIdx_tgt} 
									idx={idx} 
									OX={OX}
									onClick={this._onPage} 
								/>
							);
						})}
				</div>
				<div className="question">
					<SwiperComponent ref={this._refSwiper}>
						{quizs.map((quiz, idx) => {
							return (
								<div key={idx} className={'q-item' + (noSwiping ? ' swiper-no-swiping' : '')}>
									<QuizItem
										view={view} 
										idx={idx}
										choice={this._choices[idx].answer}
										quiz={quiz}
										questionProg={questionProg}
										onChoice={this._onChoice}
									/>
								</div>
							);
						})}
					</SwiperComponent>
				</div>
				<ToggleBtn 
					className="btn_next" 
					view={canNext && !isLast}
					onClick={this._onNext}
				/>
				<SendUINew
					view={curAnswer > 0 && (questionProg === QPROG.ON || questionProg === QPROG.SENDING) && isLast}
					type={'pad'}
					sended={false}
					originY={0}
					onSend={this._onSend}
				/>
			</div>
		);
	}
}
export default SQuestion;