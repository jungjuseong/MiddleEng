import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { Observer, observer } from 'mobx-react';
import { hot } from 'react-hot-loader';
import { observable } from 'mobx';

import { ToggleBtn } from '@common/component/button';
import * as kutil from '@common/util/kutil';

import { App } from '../App';
import * as felsocket from '../felsocket';

import { Timer, TimerState } from './Timer';
import { ResultGroup, Result } from './result';
import { Loading } from './loading';
const SwiperComponent = require('react-id-swiper').default;


class NItem extends React.Component<{idx: number, on: boolean, onClick: (idx: number) => void}> {
	private _click = () => {
		this.props.onClick(this.props.idx);
	}
	public render() {
		const {idx, on} = this.props;
		return <span className={on ? 'on' : ''} onClick={this._click}>{idx + 1}</span>;
	}
}

const _soption: SwiperOptions = {
	direction: 'horizontal',
	observer: true,
	noSwiping: true,
	followFinger: false,
};
interface IQuizTeacher<T> {
	view: boolean;
	className: string;
	quizProg: TypeQuizProg;
	numOfReturn: number;
	isGroup: boolean;
	qtime: number;

	numOfGa: number;
	numOfNa: number;
	hasPreview: boolean;
	quizs: T[];

	ItemComponent?: React.ComponentClass<IQuizPageProps<T>>;
	qtype: string;

	getSingleInfo: () => IQuizSingleResult;
	getGroupInfo: () => IQuizGroupResult;
	setQIdx: (idx: number) => void;
	gotoQuizSelect: () => void;
	
	setNaviView: (view: boolean) => void;
	setNaviFnc: (left: (() => void)|null, right: (() => void)|null) => void;
	setNavi: (left: boolean, right: boolean) => void;
	waitResult: () => void;
}
@observer
class QuizTeacher<T extends IShareQuizData> extends React.Component<IQuizTeacher<T>> {
	private _timerState = new TimerState(60);
	
	@observable private _curIdx = -1;
	@observable private _curIdx_tgt = -1;
	@observable private _resultDiv: 'question'|'student' = 'question';

	private _waitStart: number = -1;
	private _swiper: Swiper|null = null;

	private _refSwiper = (el: SwiperComponent|null) => {
		if(this._swiper || !el) return;

		const swiper = el.swiper;
		this._swiper = swiper;
		this._swiperEvent(swiper);
	}
	private _swiperEvent(swiper: Swiper) {
		swiper.on('transitionStart', () => {
			this._curIdx = -1;
			this._timerState.pause();
			App.pub_stop();
		});
		swiper.on('transitionEnd', () => {
			this._timerState.reset();
			if(this.props.view) {
				this._curIdx = swiper.activeIndex;
				this._curIdx_tgt = this._curIdx;
				this._setNavi();
				if( this.props.quizProg === 'quiz' ) {
					this.props.setQIdx(this._curIdx);
				}
			}
		});
	}

	private _setNavi() {
		if(this._curIdx_tgt >= this.props.quizs.length) {
			this.props.setNaviView(true);
			this.props.setNavi(false, false);
		} else {
			this.props.setNaviView(true);
			// console.log(this.props.quizProg, this.props.quizProg !== 'result' && this._curIdx_tgt > 0);

			const isResult = this.props.quizProg === 'result';
			const len = this.props.quizs.length;

			this.props.setNavi(
				isResult && this._curIdx_tgt > 0, 
				isResult ? this._curIdx_tgt < len - 1 : this._curIdx_tgt < len,
			);
			// console.log('this._curIdx_tgt', this._curIdx_tgt, this._quizs.length, this.props.quizProg === 'result' && this._curIdx_tgt > 0,this._curIdx_tgt < this._quizs.length);
		}

	}
	private _setNaviFnc() {
		this.props.setNaviFnc(
			() => {
				if(this.props.quizProg !== 'result') {
					return;
				}
				if(this._swiper) this._swiper.slidePrev();
			},
			() => {
				if(this._curIdx !== this._curIdx_tgt) return;
				if(this.props.quizProg !== 'result') {
					const fmsg: IFlipMsg = {
						msgtype: 'force_stop',
						idx: this._curIdx,
					};
					felsocket.sendPAD($SocketType.MSGTOPAD, fmsg);
					if(this._timerState.isRunning) this._timerState.pause();

					if(this._curIdx === this.props.quizs.length - 1) {
						this._curIdx_tgt = this._curIdx + 1;
						this.props.waitResult();
						return;
					}
				}
				if(this._swiper) this._swiper.slideNext();
			},		
		);
	}

	public componentWillUpdate(next: IQuizTeacher<T>) {
		if(next.view && !this.props.view) {
			this._timerState.setMax(next.qtime);
			this._timerState.reset();
		}
	}
	public componentDidUpdate(prev: IQuizTeacher<T>) {
		const { view, quizProg } = this.props;
		
		let isWaitResult = (quizProg === 'wait-result' && prev.quizProg !== 'wait-result');
		let isResult = (quizProg === 'result' && prev.quizProg !== 'result');
		/*
		isWaitResult = (quizProg === 'wait-result' && prev.quizProg !== 'wait-result');
		if(quizProg === 'result' && prev.quizProg !== 'result') isResult = this.props.view;
		*/
		if(view && !prev.view) {
			if(this._swiper) {
				const swiper = this._swiper;
				(async () => {
					await kutil.wait(100);
					swiper.update();
					if(swiper.scrollbar) swiper.scrollbar.updateSize();
					await kutil.wait(100);
					swiper.update();
					this.forceUpdate();
					
					if(this.props.view) {
						if(this.props.quizProg === 'result') {
							swiper.slideTo(this.props.quizs.length, 0);
							this._curIdx = this.props.quizs.length;
							this._curIdx_tgt = this._curIdx;
						} else {
							await kutil.wait(200);
							swiper.slideTo(0, 0);
							this._curIdx = 0;
							this._curIdx_tgt = this._curIdx;
						}
					}
				})();				
			}
			this._curIdx = -1;
			this._curIdx_tgt = 0;
			this._setNavi();
			this._setNaviFnc();
			this._timerState.reset();
			this.props.setQIdx(0);

			isResult = this.props.quizProg === 'result';
		} else if(!view && prev.view) {
			(async () => {
				await kutil.wait(300);
				this.props.setQIdx(0);
				this._curIdx = -1;
				this._curIdx_tgt = -1;
				this._resultDiv = 'question';
				if(this._swiper) {
					this._swiper.slideTo(0, 0);
				}
			})();

			this._timerState.pause();
			App.pub_stop();	
		}

		if(this.props.quizProg !== prev.quizProg) {
			if(this.props.view) this._setNavi();
		}
		if(this._swiper) {
			if(isResult) {
				this._swiper.slideTo(this.props.quizs.length, 0);
				this._curIdx = this.props.quizs.length;
				this._curIdx_tgt = this._curIdx;
				// console.log('Navi', this._curIdx, this._curIdx_tgt, this._quizs.length, this._swiper.slideTo(this._quizs.length, 0));
			} else if(isWaitResult) {
				this._swiper.slideTo(this.props.quizs.length);
				this._curIdx = this.props.quizs.length;
				this._curIdx_tgt = this._curIdx;
			}
		}
	}

	private _onStart = () => {
		//
	}
	private _waitResult = (f: number) => {
		if(!this.props.view || this._curIdx !== this._curIdx_tgt) return;

		const diff = Date.now() - this._waitStart;
		if(this.props.numOfReturn >= App.students.length || diff > 3000) { 
			this._curIdx_tgt = this._curIdx + 1;
			if(this._swiper) this._swiper.slideNext();
		} else window.requestAnimationFrame(this._waitResult);
	}

	private _timeComplete = async () => {
		if(!this.props.view || this._curIdx !== this._curIdx_tgt) return;
		
		if(this._curIdx === this.props.quizs.length - 1) {
			this._curIdx_tgt = this._curIdx + 1;
			this.props.waitResult();
		} else {
			await kutil.wait(300);
			this._waitStart = Date.now();
			window.requestAnimationFrame(this._waitResult);
		}
	}

	private _soundComplete = async (idx: number) => {
		if(this.props.view && this.props.quizProg === 'quiz' && idx === this._curIdx) {
			if(this._curIdx === 0) await kutil.wait(300);
			else await kutil.wait(100);

			const msg2: IMsgQuizIdx = {
				msgtype: 'start_quiz',
				qidx: idx,
				point: 0,
			};
			felsocket.sendPAD($SocketType.MSGTOPAD, msg2);
			await kutil.wait(100);

			if(this.props.view && this.props.quizProg === 'quiz' && idx === this._curIdx) {
				this._timerState.start();
			}
		}
	}
	private _onPage = (idx: number) => {
		if(!this._swiper) return;
		else if(this.props.quizProg !== 'result') return;

		App.pub_playBtnPage();
		this._swiper.slideTo(idx);
		this._curIdx_tgt = idx;
	}
	private _onBack = () => {
		App.pub_playBtnTab();
		if(this.props.quizProg === 'quiz' ) {
			this._timerState.pause();
			App.pub_stop();
			this.props.gotoQuizSelect();
		} else if(this.props.quizProg === 'result' && this._swiper) {
			this._timerState.pause();
			App.pub_stop();
			if(this._swiper.activeIndex >= this.props.quizs.length ) {
				this.props.gotoQuizSelect();				
			} else {
				this._swiper.slideTo(this.props.quizs.length);
			}
		}
	}
	private _onQuestion = (ev: React.MouseEvent<HTMLElement>, idx: number) => {
		if(this._swiper) {
			App.pub_playBtnTab();
			this._swiper.slideTo(idx);
		}
	}
	private _onResultDiv = (ev: React.MouseEvent<HTMLElement>, viewDiv: 'question'|'student') => {
		this._resultDiv = viewDiv;
	}
	public render() {
		const {view, quizProg, quizs, isGroup, ItemComponent, qtype} = this.props;

		const curIdx = this._curIdx;
		const curIdx_tgt = this._curIdx_tgt;
		const qlen = quizs.length;
		const arr: string[] = [this.props.className, qtype, quizProg];
		let resultJSX;

		

		const group = this.props.getGroupInfo();
		const single = this.props.getSingleInfo();

		let numOfStudents = App.students.length;
		let numOfReturn = this.props.numOfReturn;

		let point = -1;

		if(isGroup) {
			const maxIdx = (curIdx >= 0) ? curIdx : curIdx_tgt;
			if(this.props.quizProg === 'result' && maxIdx >= 0 && maxIdx < group.questions.length) {
				point = group.questions[maxIdx].point;
			}
			numOfStudents = group.users.length;
			resultJSX = (
				<ResultGroup 
					view={view} 
					div={this._resultDiv}
					users={group.users}
					questions={group.questions}
					ga_point={group.ga_point}
					na_point={group.na_point}
					numOfGa={this.props.numOfGa}
					numOfNa={this.props.numOfNa}
					viewBtnBack={false}
					tmp={numOfReturn}
					onQuestion={this._onQuestion}
					onChangeDiv={this._onResultDiv}
				/>
			);
		} else {
			numOfStudents = single.users.length;
			resultJSX = (
				<Result
					view={view}
					haspre={this.props.hasPreview}
					div={this._resultDiv}
					users={single.users}
					questions={single.questions}
					viewBtnBack={false}
					tmp={numOfReturn}
					onQuestion={this._onQuestion}
					onChangeDiv={this._onResultDiv}
				/>
			);
		}
		return (
			<div className={arr.join(' ')}>
				<SwiperComponent 
					ref={this._refSwiper}
					{..._soption}
				>
					{quizs.map((quiz, idx) => {
						let percent = 0;
						if(quizProg === 'result' && numOfStudents > 0) {
							if(this.props.isGroup) {
								const qs = group.questions[idx];
								percent = Math.round(100 * (qs.ga_correct + qs.na_correct) / numOfStudents);
							} else {
								const qs = single.questions[idx];
								percent = Math.round(100 * qs.numOfCorrect / numOfStudents);								//
							}
						}
						if(ItemComponent) {
							return (
								<div key={qtype + quiz.app_idx} className={`quiz_${qtype} teacher ${quizProg}`}>
									<ItemComponent
										view={view}
										key={qtype + quiz.app_idx} 
										on={view && idx === curIdx}
										idx={idx}
										isTeacher={true} 
										hasPreview={this.props.hasPreview}
										isGroup={this.props.isGroup} 
										percent={percent}
										quizProg={quizProg} 
										quiz={quiz}
										onSoundComplete={this._soundComplete}
									/>
								</div>
							);
						} else return null;
					})}

					<div className="result">{resultJSX}</div>
				</SwiperComponent>
				<div className="icon_point" style={{display: point >= 0 ? '' : 'none'}}>
					<span>{point}</span><span>POINTS</span>
				</div>
				<div className="btn_page_box" style={{display: curIdx >= qlen ? 'none' : ''}}>	
					{quizs.map((quiz, idx) => {
						return <NItem key={idx} on={idx === curIdx_tgt} idx={idx} onClick={this._onPage}/>;
					})}	
				</div>
				<div className="timer full">
					<Timer 
						state={this._timerState} 
						view={quizProg === 'quiz'} 
						onComplete={this._timeComplete} 
						onStart={this._onStart} 
					/>
				</div>

				<ToggleBtn className="btn_back"  onClick={this._onBack}/>
				<Loading view={quizProg === 'wait-result'}/>
			</div>
		);
	}
}
export default QuizTeacher;


