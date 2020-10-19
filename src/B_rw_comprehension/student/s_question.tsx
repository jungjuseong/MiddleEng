import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { Observer, observer } from 'mobx-react';
import * as _ from 'lodash';

import { IStateCtx, IActionsCtx, SENDPROG } from './s_store';
import * as common from '../common';
import { observable } from 'mobx';
import { App } from '../../App';
import * as felsocket from '../../felsocket';

import { ResponsiveText } from '../../share/ResponsiveText';
import { ToggleBtn } from '@common/component/button';
import NItem from '@common/component/NItem';
import WrapTextNew from '@common/component/WrapTextNew';
import QuizMCBtn from '../../share/QuizMCBtn';
import * as kutil from '@common/util/kutil';
import * as StrUtil from '@common/util/StrUtil';

import SendUI from '../../share/sendui_new';
import * as style from '../../share/style';

const SwiperComponent = require('react-id-swiper').default;

interface IPassItem {
	page: number;
	scripts:  common.IScript[];
}
interface IScript {
	view: boolean;
	scripts: common.IScript[];
}

@observer
class Script extends React.Component<IScript> {
	@observable private _swiper: Swiper|null = null;

	private _jsxs: JSX.Element;

	constructor(props: IScript) {
		super(props);
		const scripts = props.scripts;

		const data: IPassItem[] = [];

		for(let i = 0; i < scripts.length; i++) {
			const script = scripts[i];
			let item: IPassItem|null = null;
			for(let j = 0; j < data.length; j++) {
				if(data[j].page === script.passage_page) {
					item = data[j];
					break;
				}
			}
			if(!item) {
				item = {page: script.passage_page, scripts: []};
				data.push(item);
			}
			item.scripts.push(script);
		}
		this._jsxs = (
			<>{data.map((item, idx) => (
				<div key={idx} className="passage">{item.scripts.map((script, sidx) => (
					<span key={sidx} dangerouslySetInnerHTML={{__html: script.dms_passage + ' '}}/>
				))}</div>
			))}</>
		);
	}

	private _refSwiper = (el: SwiperComponent) => {
		if(this._swiper || !el) return;
		this._swiper = el.swiper;
	}
	public componentDidUpdate(prev: IScript) {
		if(this.props.view && !prev.view) {
			if(this._swiper) {
				this._swiper.slideTo(0, 0);
				_.delay(() => {
					if(this._swiper) {
						this._swiper.update();
						if(this._swiper.scrollbar) this._swiper.scrollbar.updateSize();
					}
				}, 100);
			}
		}
	}
	public render() {
		const scripts = this.props.scripts;
		return (
			<SwiperComponent
				ref={this._refSwiper}
				direction="vertical"
				scrollbar={{ el: '.swiper-scrollbar', draggable: true,}}
				observer={true}
				slidesPerView="auto"
				freeMode={true}						
			>
				<div className="script-wrap">{this._jsxs}</div>
			</SwiperComponent>
		);
	}
}

interface IQuestion {
	view: boolean;
	idx: number;
	selected: number;
	prog: SENDPROG;
	question: common.IQuestion;
	onSelect: (selected: number) => void;
}
@observer
class Question extends React.Component<IQuestion> {
	public render() {
		const { view, question, prog, selected, onSelect } = this.props;
		
		const questionChoice = (question.choice_4 === '') ? [question.choice_1,question.choice_2,question.choice_3] : [question.choice_1,question.choice_2,question.choice_3,question.choice_4];
		
		return (
			<>
			<div className="question">
			    <div>
                    <WrapTextNew 
                        view={view}
                        maxLineNum={1}
                        maxSize={38}
                        minSize={34}
                        lineHeight={120}
                        textAlign={'left'}
                    >
                        {question.question}
                    </WrapTextNew>
			    </div>
			</div>
			<div className="choice_box">
			{questionChoice.map((value:string, idx:number) => {
			    ++idx;
                let arr = [];
                if(prog >= SENDPROG.COMPLETE) {
                    if(question.answer === idx) arr[idx] = 'correct';
                    else if(selected === idx) arr[idx] = 'wrong';
                    else arr[idx] = '';
                }
			    return(
                    <QuizMCBtn
                        key={value}
                        className={`btn_choice ${arr[idx]}`}
                        num={idx}
                        on={selected === idx}
                        disabled={prog >= SENDPROG.SENDED}
                        onClick={onSelect.bind(idx)}
                    >
                        <div>
                            <WrapTextNew view={view} maxLineNum={1} lineHeight={120} minSize={29} maxSize={31} textAlign="left">
                                {value}
                            </WrapTextNew>
                        </div>
                    </QuizMCBtn>
                )
			})}
			</div>
			</>
		);
	}
}

interface ISQuestion {
	view: boolean;
	state: IStateCtx;
	actions: IActionsCtx;
}
@observer
class SQuestion extends React.Component<ISQuestion> {
	@observable private _curIdx = 0;
	@observable private _swiper: Swiper|null = null;

	@observable private _choices: common.IQuizReturn[] = [];
	@observable private selectedNumber: number = 0;

	constructor(props: ISQuestion) {
		super(props);
		const questions = props.actions.getData().question;
		for(let i = 0; i < questions.length; i++) {
			this._choices[i] = {
				answer: 0,
				stime: i === 0 ? Date.now() : 0,
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
			}
		});		
		this._swiper = swiper;
	}

	private _onPage = (idx: number) => {
		const prog = this.props.state.questionProg;
		if(prog < SENDPROG.SENDED) return;
		App.pub_playBtnTab();
		if(this._swiper) this._swiper.slideTo(idx);
	}
	private _onSend = async () => {
		let prog = this.props.state.questionProg;
		if(!this.props.view) return;
		else if(prog >= SENDPROG.SENDING) return;
		else if(!App.student) return;

		this.props.state.questionProg = SENDPROG.SENDING;
		App.pub_playToPad();

		const choices: common.IQuizReturn[] = [];
		this._choices.forEach((choice, idx) => {
			choices.push({
				answer: choice.answer,
				stime: choice.stime,
				etime: choice.etime,				
			});
		});
		const msg: common.IQuizReturnMsg = {
			msgtype: 'question_return',
			id: App.student.id,
			returns: choices,
		};
		felsocket.sendTeacher($SocketType.MSGTOTEACHER, msg);
		await kutil.wait(600);

		prog = this.props.state.questionProg;
		if(!this.props.view) return;
		else if(prog !== SENDPROG.SENDING) return;
		
		this.props.state.questionProg = SENDPROG.SENDED;
		App.pub_playGoodjob();
		this.props.actions.startGoodJob();
	}
	private _onNext = () => {
		if(this._curIdx >= this._choices.length - 1) return;
		App.pub_playBtnTab();

		if(this._choices[this._curIdx + 1]) {
			this._choices[this._curIdx + 1].stime =  Date.now()
		}

		if(this._swiper) this._swiper.slideNext();
	}
	public componentDidUpdate(prev: ISQuestion) {
		if(this.props.view && !prev.view) {
			const stime = Date.now();
			for(let i = 0; i < this._choices.length; i++) {
				this._choices[i].answer = 0;
				this._choices[i].stime = stime;
				this._choices[i].etime = 0;
			}

			if(this._swiper) {
				this._swiper.slideTo(0, 0);
				_.delay(() => {
					if(this._swiper) {
						this._swiper.update();
					}
				}, 300);
			}
			this._curIdx = 0;
		} else if(!this.props.view && prev.view) {
			if(this._swiper) {
				this._swiper.slideTo(0, 0);
			}
		}
	}
	private _onSelect = (idx:number, selected: number) => {
	    App.pub_playBtnTab();
		this._curIdx = idx;
		if(this._choices[idx]) {
			this._choices[idx].answer = selected;
			this._choices[idx].etime = Date.now();
		}
	}
	public render() {
		const { view, state, actions } = this.props;
		const prog = state.questionProg;
		const curIdx = this._curIdx;
		const data = actions.getData();
		const qlen = data.question.length;

		const isLast = curIdx === qlen - 1;

		const curChoice = this._curIdx >= 0 ? this._choices[this._curIdx] : undefined;
		const curAnswer = curChoice ? curChoice.answer : 0;

		const viewSend = isLast && prog < SENDPROG.SENDED && curAnswer > 0; 
		const viewBtnNext = !isLast && prog === SENDPROG.READY && curAnswer > 0; 
		return (
			<div className="s_question" style={view ? undefined : style.HIDE}>
				<div className="left"><Script view={view} scripts={data.scripts}/></div>
				<div className="right">
					<div className="btn_page_box">
						{data.question.map((question, idx) => {
							let className = '';
							if(prog >= SENDPROG.COMPLETE) {
								if(question.answer === this._choices[idx].answer) className = 'correct';
								else className = 'wrong';
							}
							return <NItem key={idx} className={className} on={idx === curIdx} idx={idx} onClick={this._onPage} />;
						})}
					</div>
					<SwiperComponent
						ref={this._refSwiper}
						direction="horizontal"
						observer={true}					
					>
						{data.question.map((question, idx) => {
							return(
							<div 
								key={question.seq} 
								className={prog < SENDPROG.SENDED ? 'swiper-no-swiping' : ''}
							>
								<Question 
									idx={idx}
									view={view} 
									question={question}
									selected={this._choices[idx].answer} //curAnswer
									prog={prog}
									onSelect={this._onSelect.bind(this.selectedNumber, idx)}
								/>
							</div>
                            )
                        })}
					</SwiperComponent>
					<ToggleBtn 
						className="btn_next" 
						view={viewBtnNext}
						onClick={this._onNext}
					/>
				</div>
				<SendUI
					view={viewSend}
					type={'pad'}
					originY={0}
					sended={false}
					onSend={this._onSend}
				/>
			</div>
		);
	}
}
export default SQuestion;


