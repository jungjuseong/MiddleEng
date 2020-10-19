import * as React from 'react';
import * as ReactDOM from 'react-dom';

import { observable, action, _interceptReads } from 'mobx';
import { observer } from 'mobx-react';

import * as _ from 'lodash';

import { ToggleBtn } from '@common/component/button';
import * as kutil from '@common/util/kutil';

import { App } from '../App';
import * as felsocket from '../felsocket';

import { Timer, TimerState } from './Timer';

import SendUINew from './sendui_new';
import { Loading } from './loading';
import TeamCurtain from './team-curtain';
import TeamWinner from './team-winner';
import TeamBoardAB from './team-board-ab';
import { BtnAudio } from './BtnAudio';
import { IStateBase, IActionsBase } from './tcontext';
import { _toStringTimestamp } from '@common/util/StrUtil';


function _setAudio(id: string, url: string) {
	let audio = document.getElementById(id) as HTMLMediaElement;
	if(!audio) {
		audio = document.createElement('audio');
		audio.id = id;
		audio.preload = 'true';
		audio.src = url;
		document.body.appendChild(audio);
	}
}

function _init() {
/*
	<audio id="group_point" src="/content/digenglish_lib/mp3/group_point.mp3" preload="true"></audio>
	<audio id="qpoint_popup" src="/content/digenglish_lib/mp3/qpoint_popup.mp3" preload="true"></audio>
	<audio id="spindle" src="/content/digenglish_lib/mp3/spindle.wav" preload="true"></audio>
	<audio id="all_zero" src="/content/digenglish_lib/mp3/all_zero.mp3" preload="true"></audio>
*/
	_setAudio('group_point', `${_digenglish_lib_}mp3/group_point.mp3`);
	_setAudio('qpoint_popup', `${_digenglish_lib_}mp3/qpoint_popup.mp3`);
	_setAudio('spindle', `${_digenglish_lib_}mp3/spindle.wav`);
	_setAudio('all_zero', `${_digenglish_lib_}mp3/all_zero.mp3`);
}


function _playSpinddle() {
	const audio = document.getElementById('spindle') as HTMLMediaElement;
	if (audio) {
		audio.currentTime = 0;
		audio.play();
	}
}

function _playQpointPopup() {
	const audio = document.getElementById('qpoint_popup') as HTMLMediaElement;
	if (audio) {
		audio.currentTime = 0;
		audio.play();
	}
}

function _playAllZero() {
	const audio = document.getElementById('all_zero') as HTMLMediaElement;
	if (audio) {
		audio.currentTime = 0;
		audio.play();
	}
}
function _playGroupPoint() {
	const audio = document.getElementById('group_point') as HTMLMediaElement;
	if (audio) {
		audio.currentTime = 0;
		audio.play();
	}
}



const enum QuizProg {
	INIT,
	ROTATING,
	ROTATED,
	SENDING,
	ON_QUIZ,
	WAITING,
	POINTING,
	COMPLETE,
}

interface IQuizBoxItem extends IGaNaResult {
	idx: number;
	progidx: number;
	prog: QuizProg;
	ga_num: number;
	na_num: number;
}
@observer
class QuizBoxItem extends React.Component<IQuizBoxItem> {
	public render() {
		const {idx, progidx, prog, ga_correct, na_correct, ga_num, na_num} = this.props;
		let cName = '';
		let bText = false;
		if(idx < progidx) {
			bText = true;
			cName = 'complete';
		} else if(idx === progidx) {
			cName = 'current';
			if(prog === QuizProg.COMPLETE || prog === QuizProg.POINTING) bText = true;
		}
		if(bText) {
			const p_ga = ga_num > 0 ? Math.round((ga_correct / ga_num) * 100) / 100.0 : 0;  // 정답률을 소수2번째자리까지 반올림
			const p_na = na_num > 0 ? Math.round((na_correct / na_num) * 100) / 100.0 : 0;	// 정답률을 소수2번째자리까지 반올림
			if(p_ga > p_na) cName = cName + ' ga';
			else if(p_ga < p_na) cName = cName + ' na';
			else if((p_ga && p_na) <= 0) cName = cName + ' zero';		// 두 그룹 모두 0점일 경우
			else cName = cName + ' tie';
		}

		return (
			<div className={cName}>
				{this.props.idx + 1}
				<div/>
			</div>
		);
	}
}
interface IInfoBox {
	className: string;
	percent: number;
	point: number;
	blink: boolean;
	all_zero: boolean;
	div: 'ga'|'na';
}
@observer
class InfoBox extends React.Component<IInfoBox> {
	@observable private _onani = false;
	@observable private _zoomin = false;
	@observable private _all_zero = false;
	private _onAniEnd = () => {
		this._zoomin = false;
		_.delay(() => {
			if(!this._zoomin) this._onani = false;
		}, 300);
	}
	public componentDidUpdate(prev: IInfoBox) {

		if(this.props.blink && !prev.blink) {
			this._zoomin = true;
			this._onani = true;
			// this._zoomin = true;
		} else if(!this.props.blink && prev.blink) {
			this._zoomin = false;
			this._onani = false;
			// this._blink = false;
		}
		if(this.props.all_zero && !prev.all_zero) this._all_zero = true;
		else if(!this.props.all_zero && prev.all_zero) this._all_zero = false;
	}
	public render() {
		let {className, percent, point, div} = this.props;
		const sPoint = (point < 10) ? '0' + point : '' + point;
		let progjsx;

		const style: React.CSSProperties = {
			opacity: percent < 0 ? 0 : 1,
		};
		if(percent < 0) percent = 0;

		const arr: string[] = ['point'];

		if(this._onani) arr.push('onani');
		if(this._zoomin) arr.push('zoomin');


		return (
			<div className={className}>
				<div className="prog_box" style={style}>
					<span className="bnd"><span style={{width: percent + '%'}}/></span>
					<span className={'text' + (this._all_zero ? ' all_zero' : '')}>{Math.round(percent)}%</span>
				</div>
				<div className={arr.join(' ')}>
					<TeamBoardAB className="board-gana" ga_na={this.props.div} view={true} start={this._zoomin} point={sPoint} onAniEnd={this._onAniEnd}/>
				</div>
			</div>
		);
	}
}


interface ITeamSpindle {
	view: boolean;
	numOfReturn: number; 
	numOfGa: number;
	numOfNa: number;
	hasAudio: boolean;
	getAudio: (qidx: number) => string;
	gotoResult: () => void;

	getGroupInfo: () => IQuizGroupResult;
	setQIdx: (idx: number) => void;
	gotoQuizSelect: () => void;
	
	
	setNaviView: (view: boolean) => void;
	setNaviFnc: (left: (() => void)|null, right: (() => void)|null) => void;
	setNavi: (left: boolean, right: boolean) => void;
	
}

@observer
class TeamSpindle extends React.Component<ITeamSpindle> {

	@observable private _prog: QuizProg = QuizProg.INIT;
	@observable private _resultPopup: ''|'ga'|'na'|'tie' = '';
	@observable private _rotate: number = 0;

	@observable private _percent_ga = 0;
	@observable private _percent_na = 0;

	@observable private _qidx = 0;

	@observable private _curtain_view = false;
	@observable private _curtain_start = false;

	@observable private _all_zero = false;

	private _timerState = new TimerState(60);
	@observable private _win: 'ga'|'na'|'same'|'' = '';
	@observable private isAudioPlay:boolean = false;
	@observable private isDisabled:boolean = true;

	private _playCnt = 0;
	constructor(props: ITeamSpindle) {
		super(props);
		
		_init();
	}
	private _spindleClick = () => {

		const group = this.props.getGroupInfo();
		const questions = group.questions;
		const qlen = questions.length;

		if(this._prog === QuizProg.COMPLETE && this._qidx < qlen - 1) {
			this._qidx++;
			this._timerState.reset();

			const msg: IMsgQuizIdx = {
				msgtype: 'next_quiz',
				qidx: this._qidx,
				point: 0,
			};
			felsocket.sendPAD($SocketType.MSGTOPAD, msg);

			this._prog = QuizProg.INIT;

			this._setNavi();
		}
	
		if(this._prog === QuizProg.INIT || this._prog === QuizProg.ROTATED) {
			const q = questions[this._qidx];
			if(q) {
				_playSpinddle();
				this._prog = QuizProg.ROTATING;
				this._setNavi();
				this._rotate = this._rotate + Math.round(Math.random() * 10000) + 36000;

				let deg = this._rotate % 360;
				deg = Math.floor(5 * deg / 360);
				if(deg === 0) deg = 1;
				else deg = 6 - deg;

				if(deg > 5) deg = 5;
				q.point = deg * 10;  
			}
		}
	}
	private _rotateEnd = async () => {
		if(this._prog === QuizProg.ROTATING) {
			await kutil.wait(100);
			if(this._prog === QuizProg.ROTATING) {
				_playQpointPopup();
				this._prog = QuizProg.ROTATED;
				this._setNavi();
			}
		}
	}
	private async _startTimer(qidx: number) {
		if(this.props.view && this._prog === QuizProg.ON_QUIZ && qidx === this._qidx) {
			const group = this.props.getGroupInfo();
			const questions = group.questions;

			const msg2: IMsgQuizIdx = {
				msgtype: 'start_quiz',
				qidx: this._qidx,
				point: questions[this._qidx].point,
			};
			felsocket.sendPAD($SocketType.MSGTOPAD, msg2);

			await kutil.wait(300);

			if(this.props.view && this._prog === QuizProg.ON_QUIZ && qidx === this._qidx) {
				this._timerState.reset();
				this._timerState.start();
			}
		}
	}

	private _onToPad = () => {
		if(this.props.view && this._prog === QuizProg.ROTATED) {
			const group = this.props.getGroupInfo();
			const questions = group.questions;

			App.pub_playToPad();
			this._prog = QuizProg.SENDING;
			this._setNavi();
			const msg1: IMsgQuizIdx = {
				msgtype: 'send_point',
				qidx: this._qidx,
				point: questions[this._qidx].point,
			};
			felsocket.sendPAD($SocketType.MSGTOPAD, msg1);
			App.pub_reloadStudents( async () => {
			    this.isDisabled = true;
				await kutil.wait(100);
				
				if(this.props.view && this._prog === QuizProg.SENDING) {
					this._prog = QuizProg.ON_QUIZ;
					this._setNavi();
					const qidx = this._qidx;
					const quizIdx = questions[qidx].qidx;
					
					this.props.setQIdx(this._qidx);
					if(this.props.hasAudio) {
						await kutil.wait(500);
						const url = App.data_url + this.props.getAudio(quizIdx);
						this.isAudioPlay = true;
						App.pub_play(url, async (isEnded1: boolean) => {
                            this.isAudioPlay = false;
							await kutil.wait(300);
							if(this.props.view && this._prog === QuizProg.ON_QUIZ && qidx === this._qidx) {
						        this.isAudioPlay = true;
								App.pub_play(url, (isEnded2: boolean) => {
                                    this.isAudioPlay = false;
								    this.isDisabled = false;
									this._startTimer(qidx);
								});
							}
						});
					} else {
						await kutil.wait(1000);
                        this.isDisabled = false;
                        this.isAudioPlay = false;
						this._startTimer(qidx);
					}
				}
			});
		}
	}
	private _onDone = () => {
		if(!this.props.view || this._prog !== QuizProg.ON_QUIZ) return;
		if(this._timerState.isRunning) this._timerState.pause();
		const fmsg: IFlipMsg = {
			msgtype: 'force_stop',
			idx: this._qidx,
		};
		felsocket.sendPAD($SocketType.MSGTOPAD, fmsg);
		this._onTime();
	}
	private _onTime = async () => {
		if(!this.props.view || this._prog !== QuizProg.ON_QUIZ) return;
		this._prog = QuizProg.WAITING;
		this._setNavi();
		await kutil.wait(5000);
		if(this.props.view && this._prog === QuizProg.WAITING) this._complete();
	}
	private _complete = async () => {
		if(!this.props.view || this._prog !== QuizProg.WAITING) return;

		const result = this.props.getGroupInfo();
		const ga_num = this.props.numOfGa;
		const na_num = this.props.numOfNa;
		const qidx = this._qidx;

		const q = result.questions[qidx];
		this._percent_ga = 0;
		this._percent_na = 0;
		this._win = '';

		let ga_pct = (ga_num > 0) ? q.ga_correct / ga_num : 0;
		let na_pct = (na_num > 0) ? q.na_correct / na_num : 0;
		ga_pct = Math.round(100 * ga_pct);
		na_pct = Math.round(100 * na_pct);

		let ga_point = 0;
		let na_point = 0;

		if(ga_pct === na_pct) {
			if(ga_pct > 0) {
				ga_point = q.point;
				na_point = q.point;
			}
		} else if(ga_pct > na_pct) {
			ga_point = q.point;
		} else {
			na_point = q.point;
		}
		const max_pct = Math.max(ga_pct, na_pct);
		this._prog = QuizProg.POINTING;
		this._setNavi();
		if(max_pct > 0) {
			let pcnt = 0;
			let aniFrames = Math.round( 60 / max_pct);
			const prun = (f: number) => {
				if(!this.props.view || this._prog !== QuizProg.POINTING) return;

				let bStop = false;
				if(pcnt % aniFrames === 0) {
					if(this._percent_ga < ga_pct) this._percent_ga++;
					if(this._percent_na < na_pct) this._percent_na++;
					bStop = this._percent_ga >= ga_pct && this._percent_na >= na_pct;
				}
				pcnt++;
				if(bStop) {
					_.delay(() => {
						this._pointEnd(ga_point, na_point);
					}, 300);
				} else window.requestAnimationFrame(prun);
			};

			window.requestAnimationFrame(prun);
		} else {
			
			this._all_zero = false;
			await kutil.wait(300);
			_playAllZero();
			this._all_zero = true;

			await kutil.wait(300);
			this._pointEnd(ga_point, na_point);
		}
		
	} 
	private _pointEnd = async (ga_point: number, na_point: number) => {
		if(!this.props.view || this._prog !== QuizProg.POINTING) return;

		if(ga_point > na_point) this._win = 'ga';
		else if(ga_point < na_point) this._win = 'na';
		else if(ga_point > 0 ) this._win = 'same';
		else this._win = '';

		const result = this.props.getGroupInfo();
		const qidx = this._qidx;
		result.ga_point = result.ga_point + ga_point;
		result.na_point = result.na_point + na_point;
		if(qidx >= result.questions.length - 1) {
			await kutil.wait(200);
			if( this._win !== '') _playGroupPoint();
			await kutil.wait(800);

			if(!this.props.view || this._prog !== QuizProg.POINTING) return;

			this._prog = QuizProg.COMPLETE;
			this._setNavi();
			if(result.ga_point === result.na_point) {
				this._resultPopup = 'tie';
			} else if(result.ga_point > result.na_point) {
				this._resultPopup = 'ga';
			} else {
				this._resultPopup = 'na';
			}	
			const msg: IMsgGaNaResult = {
				msgtype: 'end_quiz',
				ga_point: result.ga_point,
				na_point: result.na_point,
			};
			felsocket.sendPAD($SocketType.MSGTOPAD, msg);

		} else {
			await kutil.wait(200);
			if( this._win !== '') _playGroupPoint();
			await kutil.wait(800);
			this._all_zero = false;
			this._prog = QuizProg.COMPLETE;
			this._setNavi();
		}
	}

	private _aniEnd = async () => {
		this._resultPopup = '';
		if(this.props.view && this._prog === QuizProg.COMPLETE) {
			const result = this.props.getGroupInfo();
			const qidx = this._qidx;
			if( qidx >= result.questions.length - 1) {

				this.props.gotoResult();
			}
		}
	}



	private _setNaviAll() {
		this.props.setNaviView(true);
		this._setNavi();
		this.props.setNaviFnc(
			() => {
				return;
			},
			() => {
				this._onDone();
			}
		);
	}
	private _setNavi() {
		// return;	19-02-01 190108_검수사항 p.4 수정 
		this.props.setNavi(false, this._prog === QuizProg.ON_QUIZ);
	}
	public componentDidUpdate(prev: ITeamSpindle) {
		if(this.props.view) {
			if(!prev.view) {
				this.props.setQIdx(0);
				this._prog = QuizProg.INIT;
				this._rotate = 0;
				this._resultPopup = '';
				this._qidx = 0;
				this._setNaviAll();
				const result = this.props.getGroupInfo();
				this._timerState.setMax(result.qtime);
				this._timerState.reset();
				// this._curtain_view = true;
				// this._curtain_start = false;
				// (async () => {
				// 	await kutil.wait(500);
				// 	this._curtain_start = true;
				// 	await kutil.wait(1200);
				// 	this._curtain_view = false;
				// 	this._curtain_start = false;					
				// })();
			}

			if(
				this.props.numOfReturn !== prev.numOfReturn && 
				(this._prog === QuizProg.ON_QUIZ ||  this._prog === QuizProg.WAITING)
			) {
				const result = this.props.getGroupInfo();
				if(result.users.length === this.props.numOfReturn) {
					(async () => {
						if(this._prog === QuizProg.ON_QUIZ) {
							this._prog = QuizProg.WAITING;
							this._setNavi();
							await kutil.wait(300);
							if(this.props.view && this._prog === QuizProg.WAITING) this._complete();
						} else if(this._prog === QuizProg.WAITING) this._complete();
					})();

				}
			}
			// store.navistate.set(false, this.m_prog === QuizProg.COMPLETE);
		} else if(!this.props.view && prev.view) {
			this.props.setQIdx(0);
			this._prog = QuizProg.INIT;
			this._rotate = 0;	
			this._resultPopup = '';
			this._curtain_view = false;
			this._curtain_start = false;
			this._timerState.reset();
		}
	}
	private _onBack = () => {
		this._timerState.pause();
		App.pub_stop();

		this.props.gotoQuizSelect();
	}


	public render() {
		const { view, hasAudio} = this.props; 

		// const words = this.props.actions.getWords();

		// const audio = words[this._qidx].audio;
		const result = this.props.getGroupInfo();
		const questions = result.questions;
		const question = questions[this._qidx];

		const audio = (question && hasAudio) ? this.props.getAudio(question.qidx) : '';
		
		const point = (question) ? question.point : 0;


		const qlen = questions.length;
		const ga_num = this.props.numOfGa;
		const na_num = this.props.numOfNa;

		const viewProg = true;
		let percent_ga = -1;
		let percent_na = -1;
		let win: 'ga'|'na'|'same'|'' = this._win;
		if(this._prog === QuizProg.COMPLETE || this._prog === QuizProg.POINTING) {
			percent_ga = this._percent_ga;
			percent_na = this._percent_na;
			win = this._win;
		} else win = '';

		const enableStart = this._prog === QuizProg.INIT || this._prog === QuizProg.COMPLETE;

		let jsx;
		if(questions.length > 0) {
			jsx = questions.map((q, idx) => {
				return <QuizBoxItem key={idx} idx={idx} progidx={this._qidx} prog={this._prog} {...q} ga_num={ga_num} na_num={na_num}/>;
			});
		} else jsx = '';

		const arr: string[] = ['point_result'];
		if(this._prog === QuizProg.ROTATED || this._prog === QuizProg.SENDING) arr.push('on');
		if(point > 0) arr.push('p' + point);

		const isHL = this._prog === QuizProg.ROTATING || this._prog === QuizProg.ROTATED || this._prog === QuizProg.SENDING;

		return (
			<div className="t_board" >
				<div className={'quizbox' + (questions.length > 10 ? ' small' : '')}>{jsx}</div>
				<InfoBox 
					className="info ga" 
					percent={percent_ga} 
					point={result.ga_point} 
					div="ga"
					all_zero={this._all_zero} 
					blink={this._qidx < qlen - 1 && (win === 'ga' || win === 'same')}
				/>
				<InfoBox 
					className="info na" 
					percent={percent_na} 
					point={result.na_point} 
					div="na" 
					all_zero={this._all_zero} 
					blink={this._qidx < qlen - 1 && (win === 'na' || win === 'same')}
				/>
				<div className="timer">
					<Timer 
						state={this._timerState} 
						view={this._prog >= QuizProg.ON_QUIZ} 
						onComplete={this._onTime}
					/>
					<ToggleBtn className="btn_done" onClick={this._onDone} view={this._prog >= QuizProg.ON_QUIZ} disabled={this._prog !== QuizProg.ON_QUIZ}/>
				</div>
				<BtnAudio className={`btn_audio ${this.isAudioPlay? 'on': ''}`} url={App.data_url + audio} view={this.props.hasAudio && (this._prog >= QuizProg.ON_QUIZ)} disabled={this.isDisabled}/>
				<div className="cover" style={{display: isHL ? '' : 'none'}}/>
				<div className={'spindle_box' + (isHL ? ' on' : '')}>
					<div className="spindle" style={{transform: `rotate(${this._rotate}deg)`}} onTransitionEnd={this._rotateEnd} >
						<ToggleBtn className={'btn_start' + (enableStart ? ' on' : '')} onClick={this._spindleClick} disabled={!enableStart}/>
					</div>
				</div>


				<div className={arr.join(' ')} >
					<ToggleBtn className="btn_repoint" onClick={this._spindleClick}/>
					<div className="point">
						<span>{point}</span>
						<div className="icon"/>
					</div>
					<SendUINew 
						onSend={this._onToPad} 
						preventUpWhenView={true}
						type="teacher" 
						view={this._prog === QuizProg.ROTATED} 
						sended={this._prog >= QuizProg.ON_QUIZ}
						originY={0}
					/>
				</div>
				<div className={'pointer' + (isHL ? ' on' : '')} style={{display: this._prog >= QuizProg.ROTATED &&  this._prog < QuizProg.SENDING ? 'none' : '' }}/>

				
				<Loading view={this._prog === QuizProg.WAITING}/>

				<TeamWinner className="team-winner" winner={this._resultPopup} onAniEnd={this._aniEnd}/>
				{/* <TeamCurtain className="team-curtain" view={this._curtain_view} start={this._curtain_start} /> */}
				<ToggleBtn className="btn_back"  onClick={this._onBack}/>
			</div>
		);
	}
}

export default TeamSpindle;
