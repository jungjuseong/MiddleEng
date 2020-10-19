import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { hot } from 'react-hot-loader';
import { observable } from 'mobx';
import { Observer, observer } from 'mobx-react';

import * as kutil from '@common/util/kutil';
import * as StrUtil from '@common/util/StrUtil';

import { App } from '../App';
import * as felsocket from '../felsocket';

import { Timer, TimerState } from './Timer';
import TeamPadSelected from './team-pad-selected';

import { Loading } from './loading';
import TeamPadResult from './team-pad-result';

const SwiperComponent = require('react-id-swiper').default;

const NO_SWIPING = 'swiper-wrapper';
const CAN_SWIPING = 'swiper-no-swiping';
const _soption: SwiperOptions = {
	direction: 'horizontal',
	observer: true,
	noSwipingClass: NO_SWIPING,
};


interface INItem {
	viewResult: boolean;
	result: boolean;
	idx: number;
	on: boolean;
	onClick: (idx: number) => void;
}
class NItem extends React.Component<INItem> {
	private _click = () => {
		this.props.onClick(this.props.idx);
	}
	public render() {
		const {idx, on, viewResult, result} = this.props;
		const arr: string[] = [];
		if(on) arr.push('on');
		if(viewResult) arr.push(result ? 'correct' : 'wrong');

		return <span className={arr.join(' ')} onClick={this._click}>{idx + 1}</span>;
	}
}
interface IQuizStudent<T> {
	view: boolean;
	className: string;
	isGroup: boolean;
	quizProg: TypeQuizProg;
	qidx: number;
	forceStopIdx: number;
	groupProg: TypeGroupProg;
	groupResult: ''|'win'|'lose'|'tie';
	qtype: string;
	qtime: number;
	points: number[];
	ga_na: undefined|'ga'|'na';
	startSelectedAni: boolean;

	quizs: T[];
	ItemComponent?: React.ComponentClass<IQuizPageProps<T>>;

	unsetForceStop: () => void;
	setQuizProg: (prog: TypeQuizProg) => void;
}
@observer
class QuizStudent<T extends IShareQuizData> extends React.Component<IQuizStudent<T>> {
	private _timerState = new TimerState(60);
	private _groupResult_save: ''|'win'|'lose'|'tie' = '';

	@observable private _groupResult: ''|'win'|'lose'|'tie' = '';
	@observable private _curIdx = -1;
	@observable private _curIdx_tgt = -1;

	private _stime: string = '';
	private _etime: string = '';
	private _input: string = '';

	
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
			
			if(this.props.view) {
				App.pub_stop();
			}
		});
		swiper.on('transitionEnd', () => {
			this._timerState.reset();
			if(this.props.view) {
				this._curIdx = swiper.activeIndex;
				this._curIdx_tgt = this._curIdx;
				this._etime = '';
				this._input = '';
				this._stime = StrUtil._toStringTimestamp(new Date());

				if(this._curIdx === this.props.forceStopIdx && !this.props.isGroup) {
					if(this._timerState.isRunning) this._timerState.pause();
					this._timeComplete();
				}
			}
		});
	}


	public componentWillUpdate(next: IQuizStudent<T>) {
		let bReset = false;
		if(next.view && !this.props.view) {
			bReset = true;
		} else if(next.isGroup && next.groupProg === 'inited' && this.props.groupProg === 'initing') {
			bReset = true;
		}
		if(bReset) {
			/*
			while(this._quizs.length > 0) this._quizs.pop();

			const info = next.actions.getQuizInfo();
			const words = next.actions.getWords();
			let qtime = 60;

			for(let i = 0; i < info.widxs.length; i++) {
				const word = words[info.widxs[i]];
				word.app_result = false;
				this._quizs[i] = word;
			}
			this._qtype = info.qtype;
			*/
			this._timerState.setPlaySound(false);
			this._timerState.setMax(next.qtime);
			this._timerState.reset();
		}
	}
	public componentDidUpdate(prev: IQuizStudent<T>) {
		const { view, quizProg, qidx, forceStopIdx, groupResult, groupProg } = this.props;
		
		// let isWaitResult = (quizProg === 'wait-result' && prev.quizProg !== 'wait-result');
		// let isResult = (quizProg === 'result' && prev.quizProg !== 'result');
		// console.log(quizProg,  prev.quizProg);

		let isViewChange = false;	
		let toIdx = -1;

		if(view && !prev.view) {
			isViewChange = true;
			toIdx = 0;
			this._input = '';
			this._stime = '';
			this._etime = '';
			this._curIdx = -1;
			this._curIdx_tgt = 0;
			this._timerState.reset();
		} else if(!view && prev.view) {
			toIdx = 0;
			this._curIdx = -1;
			this._curIdx_tgt = -1;
			this._input = '';
			this._stime = '';
			this._etime = '';
			this._timerState.pause();
			App.pub_stop();	
		}

		if(view) {
			if(quizProg === 'quiz' && prev.quizProg === '') {
				toIdx = qidx;
				this._timerState.reset();
				this._timerState.start();
			} else if(qidx !== prev.qidx) {
				toIdx = qidx;
			}
		}
		if(	prev.view !== view || 
			prev.groupResult !== groupResult ||
			prev.groupProg !== groupProg ||
			prev.quizProg !== quizProg
		) {
			if(view && groupProg === 'complete' && quizProg === 'result') this._groupResult_save = groupResult;
			else this._groupResult_save = '';

			this._groupResult = this._groupResult_save;
		}



		if(this._swiper) {
			let goto0;
			if(this.props.isGroup) {
				goto0 = this.props.groupProg === 'complete' && prev.groupProg !== 'complete';
			} else {
				goto0 = this.props.quizProg === 'result' && prev.quizProg !== 'result';
			}
			
			if(goto0) {
				this._swiper.slideTo(0);
			} else {
				let canSwipe = this._checkCanSwipe();
				let curCanSwipe = this._swiper.params.noSwipingClass !== NO_SWIPING;

				if(canSwipe !== curCanSwipe || isViewChange) {
					if(canSwipe !== curCanSwipe) {
						_soption.noSwipingClass = canSwipe ? CAN_SWIPING : NO_SWIPING;
						this._swiper.params.noSwipingClass = _soption.noSwipingClass;
					}
					const swiper = this._swiper;
					if(isViewChange) {
						(async () => {
							await kutil.wait(100);
							swiper.update();
							if(swiper.scrollbar) swiper.scrollbar.updateSize();
							await kutil.wait(100);
							swiper.update();
						
							if(this.props.view && toIdx >= 0) {
								await kutil.wait(200);
								swiper.slideTo(toIdx, 0);
								this._curIdx = toIdx;
								this._curIdx_tgt = this._curIdx;	
							}
						})();
					} else {
						swiper.update();
						if(toIdx >= 0) {
							this._swiper.slideTo(toIdx);
							if(this.props.view) {
								this._curIdx = toIdx;
								this._curIdx_tgt = this._curIdx;
							} else {
								this._curIdx = -1;
								this._curIdx_tgt = -1;
							}	
						}
					}


				} else {
					if(toIdx >= 0) {
						this._swiper.slideTo(toIdx);
						if(this.props.view) {
							this._curIdx = toIdx;
							this._curIdx_tgt = this._curIdx;
						} else {
							this._curIdx = -1;
							this._curIdx_tgt = -1;
						}	
					}				
				}
			}
		
		}
		if(this.props.view && forceStopIdx >= 0 && forceStopIdx !== prev.forceStopIdx ) {
			if(forceStopIdx === this._curIdx) {
				if(this._timerState.isRunning) this._timerState.pause();
				this._timeComplete();
			} else if(!this.props.isGroup) {
				if(this._timerState.isRunning) this._timerState.pause();
				if(this._swiper) {
					this._swiper.slideTo(forceStopIdx + 1);
				}
			}
		}
	}
	private _onStart = () => {
		this._etime = '';
		this._stime = StrUtil._toStringTimestamp(new Date());
		// console.log('_onStart', this._stime, this._etime);
	}
	private _timeComplete = () => {
		if(!this.props.view || 
			(this.props.quizProg !== 'quiz' && this.props.forceStopIdx < 0)
		) return;

		if(App.student) {
			if(this._etime === '') this._etime = StrUtil._toStringTimestamp(new Date());
			const quiz = this.props.quizs[this._curIdx];
			const msg: IQuizResultMsg = {
				msgtype: 'quiz_result',
				result: quiz.app_result,
				input: this._input,
				stime: this._stime,
				etime: this._etime,
				id: App.student.id,
				idx: this._curIdx,
			};
			// console.log('_timeComplete', this._stime, this._etime);
			felsocket.sendTeacher($SocketType.MSGTOTEACHER, msg);
		}
		this.props.unsetForceStop();
		if(this._curIdx === this.props.quizs.length - 1) {
			if(this.props.isGroup) {
				this.props.setQuizProg('wait-result');
			} else {
				this.props.setQuizProg('result');
			}
		} else {
			if(this.props.isGroup) {
				this.props.setQuizProg('result');
			} else {
				this.props.setQuizProg('');
				if(this._swiper) this._swiper.slideNext();
			}
		}
	}

	private _itemChange = (idx: number, input: string) => {
		if(!this.props.view || this.props.quizProg !== 'quiz' || this._curIdx !== idx) return;
		else if(!this._timerState.isRunning) return;
		
		this._input = input;
		this._etime = StrUtil._toStringTimestamp(new Date());
		// console.log(this._stime, this._etime);
	}
	private _onPage = (idx: number) => {
		if(!this._swiper) return;
		else if(this.props.quizProg !== 'result') return;

		App.pub_playBtnPage();
		this._swiper.slideTo(idx);
		this._curIdx_tgt = idx;
	}
	private _soundComplete = (idx: number) => {
		//
	}

	private _checkCanSwipe() {
		const {view, quizProg, groupProg, isGroup} = this.props;
		return (isGroup && groupProg === 'complete') || (!isGroup && quizProg === 'result');
	}

	private _aniEnd = () => {
		this._groupResult = '';
	}

	public render() {
		const {view, quizProg, groupProg, quizs, qtype, ga_na, ItemComponent, startSelectedAni, isGroup} = this.props;
		const curIdx = this._curIdx;
		const curIdx_tgt = this._curIdx_tgt;
		const qlen = quizs.length;
		const arr: string[] = [this.props.className, qtype, quizProg];
		const points = this.props.points;
		let point = 0;

		if(!view) arr.push('hide');
		let viewBoxGana  = false;
		if(isGroup) {
			arr.push('group');
			if(groupProg !== 'complete' && groupProg !== 'onquiz' && ga_na) {
				viewBoxGana = true;
			}
			if(curIdx_tgt >= 0 && curIdx_tgt < points.length) point = points[curIdx_tgt];
		}
		if(viewBoxGana) arr.push('view-gana');
		if(this._checkCanSwipe()) arr.push('can-swipe');
		

		return (
			<div className={arr.join(' ')}>
				<SwiperComponent 
					ref={this._refSwiper}
					{..._soption}
				>
					{quizs.map((quiz, idx) => {
						if(ItemComponent) {
							return (
								<div key={quiz.app_idx + '_' + qtype} className={`quiz_${qtype} student ${quizProg}`}>
									<ItemComponent 
										view={view} 
										key={quiz.app_idx + '_' + qtype}
										on={view && idx === curIdx}
										idx={idx}
										isTeacher={false} 
										hasPreview={false}
										isGroup={isGroup} 
										percent={0}
										quizProg={quizProg} 
										quiz={quiz}
										onSoundComplete={this._soundComplete}
										onItemChange={this._itemChange}
									/>
								</div>
							);
						} else return null;
					})}
				</SwiperComponent>
				<div className="icon_point" style={{display: isGroup === true && groupProg !== 'complete' ? '' : 'none'}}>
					<div className={'icon_team ' + ga_na}/>
					<div>
						<span>{point}</span> <span>POINTS</span>
					</div>
				</div>
				<div className={'icon_crown ' + ga_na + ' ' + this._groupResult_save} style={{display: isGroup === true && groupProg === 'complete' ? '' : 'none'}}/>

				<div className="btn_page_box">	
					{quizs.map((quiz, idx) => {
						let viewResult = false;
						if(isGroup) {
							/* if(groupProg === 'complete') viewResult = true; */
							if(groupProg === 'complete') viewResult = true;
							else if(quizProg === 'result' && idx <= this._curIdx) viewResult = true;
							else if(quizProg !== 'result' && idx < this._curIdx) viewResult = true;
						} else if( quizProg === 'result') viewResult = true;

						return (
							<NItem 
								key={idx} 
								on={idx === curIdx_tgt} 
								viewResult={viewResult}
								result={quiz.app_result}
								idx={idx} 
								onClick={this._onPage}
							/>
						);
					})}	
				</div>

				<div className="timer full">
					<Timer 
						state={this._timerState} 
						view={quizProg === 'quiz' || quizProg === ''} 
						onComplete={this._timeComplete} 
						onStart={this._onStart} 
					/>
				</div>
				<TeamPadSelected className="box-gana" ga_na={ga_na} view={viewBoxGana} viewBG={this.props.groupProg !== 'initing'} start={viewBoxGana && this.props.groupProg === 'initing' && startSelectedAni}/>
				<TeamPadResult className="team-pad-result" result={this._groupResult} onAniEnd={this._aniEnd}/>
				
				{/* <div className={'box-gana'}><div/></div> */}
				<div className={'icon-gana icon-' + ga_na}/>
				{/* <div className="icon_win" hidden={!viewWin}/> */}
				<Loading view={quizProg === 'wait-result'}/>
			</div>
		);
	}
}

export default QuizStudent;
