import * as React from 'react';
import * as ReactDOM from 'react-dom';
import * as _ from 'lodash';
import { observer, Observer } from 'mobx-react';
import { observable, observe } from 'mobx';
import { DraggableCore, DraggableData } from 'react-draggable';

import { MPlayer, MConfig, IMedia, MPRState } from '@common/mplayer/mplayer';
import { ToggleBtn } from '@common/component/button';
import WrapTextNew from '@common/component/WrapTextNew';
import * as kutil from '@common/util/kutil';

import { App } from '../../App';
import * as felsocket from '../../felsocket';

import { SENDPROG, IStateCtx, IActionsCtx } from './t_store';


import SendUINew from '../../share/sendui_new';
import { CorrectBar, StandBar } from '../../share/Progress_bar';

import { CoverPopup } from '../../share/CoverPopup';
import { Loading } from '../../share/loading';
import * as common from '../common';
import * as butil from '@common/component/butil';

import ScriptContainer from '../script-container';

import VideoBox from './t_video_box';
import { TimerState } from '../../share/Timer';
import QuizMCBtn from '../../share/QuizMCBtn';
import { BtnAudio } from '../../share/BtnAudio';

const SwiperComponent = require('react-id-swiper').default;

interface IImgPopup {
	url: string;
	view: boolean;
	onClosed: () => void;
}
@observer
class ImgPopup extends React.Component<IImgPopup> {
	@observable private m_view = false;

	private _onClose = () => {
		App.pub_playBtnTab();
		this.m_view = false;
	}
	public componentDidUpdate(prev: IImgPopup) {
		if(this.props.view && !prev.view) {
			this.m_view = true;
		} else if(!this.props.view && prev.view) {
			this.m_view = false;
		}
	}

	public render() {
		return (
			<CoverPopup className="img_popup" view={this.m_view} onClosed={this.props.onClosed}>
				<div>
					<img src={this.props.url} />
					<ToggleBtn className="btn_zoom" onClick={this._onClose}/>
				</div>
			</CoverPopup>
		);
	}
}

function _getJSX(text: string) {
	const els = butil.sentence2jsx(text, 'block', undefined, true, 'word');
	return (
		<>{els.map((el, idx) => {
			if(idx === els.length - 1) return el;
			else return <React.Fragment key={idx}>{el}<br/></React.Fragment>;
		})}</>
	);
}

function _getBlockJSX(text: string) {
	const els = sentence2jsx(text, 'block', undefined, true, 'word');
	return (
		<>{els.map((el, idx) => {
			if(idx === els.length - 1) return el;
			else return <React.Fragment key={idx}>{el}<br/></React.Fragment>;
		})}</>
	);
}

function sentence2jsx(
	sentence: string,
	blockClass: string|null = 'block',
	blockStr?: string,
	isBlockWorkWrap?: boolean,
	splitClass?: string,
	) {
		const pattern = new RegExp(/\{(.*?)\}/g);
		let keyObj = {key: 0};

		const ret: JSX.Element[] = [];
		const arrLine = sentence.replace(/\s\s+/ig, ' ').replace(/<\s*br\s*\/*\s*>/ig, '<br>').split('<br>');

		let jsx;
		arrLine.forEach((line, idx) => {
			if(blockClass) {
				let result = pattern.exec(line);
				let lastIdx = 0;
				let sTmp = '';
				let arr: React.ReactNode[] = [];

				while (result) {
					if(result.index > lastIdx) {
						sTmp = line.substring(lastIdx, result.index);
						arr.push(_splitSpace(sTmp, keyObj, splitClass));
					}
					sTmp = result[1];
					let str = blockStr;
					if(!str) str = sTmp;
					
					if(isBlockWorkWrap) jsx = _splitSpace(str, keyObj, splitClass);
					else jsx = str;

					arr.push((<span key={keyObj.key++} className={blockClass} data-correct={sTmp}>aaaaaaaaaa</span>));
			
					lastIdx = pattern.lastIndex;
					result = pattern.exec(line);
				}
				if(lastIdx < line.length) {
					sTmp = line.substring(lastIdx);
					arr.push(_splitSpace(sTmp, keyObj, splitClass));
				}
				ret[idx] = <React.Fragment key={keyObj.key++}>{arr}</React.Fragment>;
			} else {
				ret[idx] = <React.Fragment key={keyObj.key++}>{_splitSpace(line, keyObj, splitClass)}</React.Fragment>;
			}
			
		});
		return ret;
}

function _splitSpace(sentence: string, keyObj: {key: number}, splitClass?: string) {
	const arrS = sentence.split(/\s/g);
	const pattern = new RegExp(/[\.\!\?\s]/g);

	let ret: JSX.Element[] = [];
	for(let i = 0; i < arrS.length; i++ ) {
		const txt = arrS[i];
		if(txt === '') continue;

		let arr: React.ReactNode[] = [];

		let result = pattern.exec(txt);
		let lastIdx = 0;
		let sTmp = '';
		
		while (result) {
			if(result.index > lastIdx) {
				sTmp = txt.substring(lastIdx, result.index);
				arr.push(<span key={keyObj.key++}>{sTmp}</span>);
			}
			sTmp = result[0];

			arr.push(sTmp);
	
			lastIdx = pattern.lastIndex;
			result = pattern.exec(txt);
		}
		if(lastIdx < txt.length) {
			sTmp = txt.substring(lastIdx);
			arr.push(<span key={keyObj.key++}>{sTmp}</span>);
		}

		ret.push(<span key={keyObj.key++} className={splitClass}>{arr.map((node) => node)}</span>);
	}

	return ret;

}

interface ITletstalk {
	view: boolean;
	onClosed: () => void;
	data: common.ILetstalk;
}
@observer
class Tletstalk extends React.Component<ITletstalk> {
	@observable private _view = false;
	@observable private _hint = false;
	@observable private _zoom = false;
	@observable private _zoomImgUrl = '';
	
	private _swiper?: Swiper;

	private _soption: SwiperOptions = {
		direction: 'vertical',
		observer: true,
		slidesPerView: 'auto',
		freeMode: true,
		mousewheel: true,			
		noSwiping: false,
		followFinger: true,
		scrollbar: {el: '.swiper-scrollbar',draggable: true, hide: false},	
	};

	private _jsx_sentence: JSX.Element;
	private _jsx_sample: JSX.Element;
	private _jsx_hint: JSX.Element;
	private _character: string;

	private _btnAudio?: BtnAudio;
	
	public constructor(props: ITletstalk) {
		super(props);
		
		this._jsx_sentence = _getJSX(props.data.sentence);
		this._jsx_sample = _getBlockJSX(props.data.sample);
		this._jsx_hint = _getJSX(props.data.hint);

		const rnd = Math.floor(Math.random() * 3);
		if(rnd === 0) this._character = _project_ + 'teacher/images/letstalk_bear.png';
		else if(rnd === 1) this._character = _project_ + 'teacher/images/letstalk_boy.png';
		else this._character = _project_ + 'teacher/images/letstalk_girl.png';
	}


	private _viewHint = () => {
		App.pub_playBtnTab();
		this._hint = !this._hint;

		if(this._swiper) {
			this._swiper.slideTo(0, 0);
			this._swiper.update();
			if(this._swiper.scrollbar) this._swiper.scrollbar.updateSize();
		}
		_.delay(() => {
			if(this._swiper) {
				this._swiper.slideTo(0, 0);
				this._swiper.update();
				if(this._swiper.scrollbar) this._swiper.scrollbar.updateSize();
			}				
		}, 300);
	}

	private _refSwiper = (el: SwiperComponent) => {
		if(this._swiper || !el) return;
		this._swiper = el.swiper;
	}

	private _onClosepop = () => {
		App.pub_playBtnTab();
		this._view = false;
	}

	private _refAudio = (btn: BtnAudio) => {
		if(this._btnAudio || !btn) return;
		this._btnAudio = btn;
	}

	private _onClick = () => {
		if(this._btnAudio) this._btnAudio.toggle();
	}

	private _clickZoom1 = () => {
		if(!this._view) return;
		App.pub_playBtnTab();
		this._zoomImgUrl = App.data_url + this.props.data.img1;
		this._zoom = true;
	}

	private _clickZoom2 = () => {
		if(!this._view) return;
		App.pub_playBtnTab();
		this._zoomImgUrl = App.data_url + this.props.data.img2;
		this._zoom = true;
	}

	private _closedZoom = () => {
		this._zoom = false;
		this._zoomImgUrl = '';
	}

 	public componentDidUpdate(prev: ITletstalk) {
		if(this.props.view && !prev.view) {
			this._view = true;
			this._hint = false;
			this._zoom = false;
			this._zoomImgUrl = '';
			if(this._swiper) {
				this._swiper.slideTo(0, 0);
				this._swiper.update();
				if(this._swiper.scrollbar) this._swiper.scrollbar.updateSize();
			}
			_.delay(() => {
				if(this._swiper) {
					this._swiper.slideTo(0, 0);
					this._swiper.update();
					if(this._swiper.scrollbar) this._swiper.scrollbar.updateSize();
				}				
			}, 300);

		} else if(!this.props.view && prev.view) {
			this._view = false;	
			this._zoom = false;
			this._zoomImgUrl = '';
			App.pub_stop();
		}
	}
	
	public render() {
		const { view, onClosed, data, } = this.props;

		const img2 = (data.img2 && data.img2 !== '') ? <img  src={App.data_url + data.img2} draggable={false}/> : undefined;
		const zoomImg = App.data_url + data.img1;

		return (
			<>
			<CoverPopup className="lets_talk" view={this._view} onClosed={onClosed} >

				<div className="pop_bg">
					<ToggleBtn className="btn_letstalk_close" onClick={this._onClosepop}/>
					<ToggleBtn className="btn_hint" on={this._hint} onClick={this._viewHint}/>

						<div className="popbox">

							<div className="image_box">
								<img  src={App.data_url + data.img1} draggable={false}/>
								{img2}
								<ToggleBtn className={'btn_zoom1' + (img2 !== undefined ? ' notonly' : '')} onClick={this._clickZoom1} />
								<ToggleBtn className="btn_zoom2" onClick={this._clickZoom2} view={img2 !== undefined} />
							</div>
							<div className="sentence_box">
								<div>
									<BtnAudio className="btn_audio" url={App.data_url + data.audio} ref={this._refAudio} />
									<div className="question_box" onClick={this._onClick}>
										{this._jsx_sentence}
									</div>
								</div>
							</div>
							<div className="speechbubble_box" >
								<div>
									<div className="char_box">
										<img src={this._character} draggable={false}/> 
									</div>
									<div className={'balloon' + (this._hint ? ' view-hint' : '')}>
										<SwiperComponent {...this._soption} ref={this._refSwiper}>
											<div>
												<div className={'sample' + (this._hint ? ' hide' : '')}>{this._jsx_sample}</div>
												<div className={'hint' + (this._hint ? '' : ' hide')}>{this._jsx_hint}</div>
											</div>
										</SwiperComponent>
									</div>
								</div>
							</div>
						</div>
					{/* </SwiperComponent> */}
				</div>
			</CoverPopup>
			<ImgPopup url={this._zoomImgUrl} view={this._zoom} onClosed={this._closedZoom}/> 
			</>
		);
	}
}


/* 팝업Page */
interface IPopupItem {
	type: 'off'|'Q&A' |'ROLE PLAY'|'SHADOWING';	// 19-02-01 190108_검수사항 p.13 수정 
	view: boolean;
	imgA: string;
	imgB: string;
	onSend: (roll: ''|'A'|'B') => void;
	onClosed: () => void;
}
@observer
class ComprePopup extends React.Component<IPopupItem> {
	@observable private m_view = false;
	@observable private m_sendView = false;

	@observable private m_roll: ''|'A'|'B' = '';
	private onSend = async () => {
		this.props.onSend(this.m_roll);
		await kutil.wait(400);
		this.m_view = false;
	}
	private _onClose = () => {
		this.m_view = false;
	}
	private _onRollA = () => {
		if(this.props.type !== 'ROLE PLAY') return;
		App.pub_playBtnTab();
		this.m_roll = 'A';
		this.m_sendView = true;
	}
	private _onRollB = () => {
		if(this.props.type !== 'ROLE PLAY') return;
		App.pub_playBtnTab();
		this.m_roll = 'B';
		this.m_sendView = true;
	}
	public componentDidUpdate(prev: IPopupItem) {
		if (this.props.view && !prev.view) {
			this.m_view = true;
			this.m_sendView = this.props.type !== 'ROLE PLAY' ;
			this.m_roll = '';
		} else if (!this.props.view && prev.view) {
			this.m_view = false;
			this.m_sendView = false;
			this.m_roll = '';
		}
	}
	public render() {
		const { view, onClosed, imgA, imgB } = this.props;
		return (
			<CoverPopup className={'compre_popup ' + this.props.type} view={view && this.m_view} onClosed={this.props.onClosed} >
				<span>{this.props.type === 'SHADOWING' ? 'LISTEN & REPEAT' : this.props.type}</span><ToggleBtn className="btn_close" onClick={this._onClose} />
				<div className="popup_content">
					<span>Do you have any questions?</span>
					<span>Choose the role.</span>
					<span>Listen and repeat.</span>
					<div className="img_box">
						<div className={'A' + (this.m_roll === 'A' ? ' on' : '')}>
							<span className="icon_check A" />
							<img src={App.data_url + imgA} onClick={this._onRollA}/>
						</div>
						<div className={'B' + (this.m_roll === 'B' ? ' on' : '')}>
							<span className="icon_check B" />
							<img src={App.data_url + imgB} onClick={this._onRollB}/>
						</div>
					</div>
				</div>
				<SendUINew
					view={this.m_sendView}
					preventUpWhenView={true}
					type={'teacher'}
					sended={false}
					originY={0}
					onSend={this.onSend}
				/>
			</CoverPopup>
		);
	}
}

/* 페이지 관련 class */
class NItem extends React.Component<{ idx: number, on: boolean, onClick: (idx: number) => void }> {
	private _click = () => {
		this.props.onClick(this.props.idx);
	}
	public render() {
		const { idx, on } = this.props;
		return <span className={on ? 'on' : ''} onClick={this._click}>{idx + 1}</span>;
	}
}

interface IComprehension {
	view: boolean;
	state: IStateCtx;
	actions: IActionsCtx;
}
@observer
class Comprehension extends React.Component<IComprehension> {
    private m_player = new MPlayer(new MConfig(true));
    private m_player_inittime = 0; // 비디오 시작시간 
	private m_swiper: SwiperComponent|null = null;
	private m_data: common.IData;
	
	@observable private c_popup: 'off'|'Q&A' |'ROLE PLAY'|'SHADOWING' = 'off';
	@observable private _Title: 'COMPREHENSION'|'DIALOGUE' = 'COMPREHENSION';
	@observable private _Tab: 'QUESTION'|'SCRIPT' = 'QUESTION';

	private _Tab_save: 'QUESTION'|'SCRIPT' = 'QUESTION';
	@observable private _Hint = false;

	@observable private _view = false;
	@observable private _curQidx = 0;
	@observable private _viewClue = false;
	@observable private _viewTrans = false;
	@observable private _viewScript = true;
	@observable private _letstalk = false;

	@observable private _roll: ''|'A'|'B' = '';
	@observable private _shadowing = false;
	@observable private _focusIdx = -1;
	@observable private _isShadowPlay = false;

	@observable private _qselected: number[] = [];

	private _selected: number[] = [];

	private _lastFocusIdx = -1;

	private _countdown = new TimerState(3);

	// private _rollProg: SENDPROG = SENDPROG.READY;
	private _scontainer?: ScriptContainer;
	
	public constructor(props: IComprehension) {
        super(props);
        this.m_data = props.actions.getData();
        this.m_player_inittime = this.m_data.video_start;

        const quizs = this.m_data.quizs;
        for(let i = 0; i < quizs.length; i++) {
            this._qselected[i] = -1;
        }

        this.m_player.addOnPlayEnd(() => {
            this._lastFocusIdx = -1;
            this._focusIdx = -1;
            this.m_player.setMutedTemp(false);
            this._sendDialogueEnd();
            if (this._Title === 'DIALOGUE' && this._roll === '' && !this._shadowing) this.props.actions.setNavi(true, true);
            else if(this._Title === 'DIALOGUE' && this._shadowing) this._isShadowPlay = false;
        });
        this.m_player.addOnState((newState, oldState) => {
            let msgtype: 'playing'|'paused';
            if(this._shadowing) msgtype = this._isShadowPlay ? 'playing' : 'paused';
            else msgtype = newState !== MPRState.PAUSED && this.m_player.bPlay ? 'playing' : 'paused';
            const msg: common.IMsg = {
                msgtype,
            };
            felsocket.sendPAD($SocketType.MSGTOPAD, msg);
        });
	}
	
	private _refScriptContainer = (el: ScriptContainer) => {
		if(this._scontainer || !el) return;
		this._scontainer = el;
	}

	public componentDidMount() {
		this.m_data = this.props.actions.getData();
		const quizs = this.m_data.quizs;
		for(let i = 0; i < quizs.length; i++) {
			this._qselected[i] = -1;
		}
	}
	private onSend = () => {
        const {state, actions} = this.props;

        if(	this._Title === 'COMPREHENSION' ) {
            if(this._Tab === 'QUESTION' && state.questionProg !==  SENDPROG.READY) return;
            else if(this._Tab === 'SCRIPT' && state.scriptProg !==  SENDPROG.READY) return;
        } else {
            if(state.dialogueProg !== SENDPROG.READY) return;
        }

        if(	this._Title === 'COMPREHENSION' ) {
            if(this._Tab === 'QUESTION') state.questionProg = SENDPROG.SENDING;
            else state.scriptProg = SENDPROG.SENDING;
        } else state.dialogueProg = SENDPROG.SENDING;

        App.pub_playToPad();
        App.pub_reloadStudents(() => {
            let msg: common.IMsg;
            if(	this._Title === 'COMPREHENSION' ) {
                this.props.actions.clearReturnUsers();
                this.props.actions.setRetCnt(0);
                this.props.actions.setNumOfStudent(App.students.length);
                
                if(this._Tab === 'QUESTION') {
                    if(state.questionProg !==  SENDPROG.SENDING) return;
                    state.questionProg = SENDPROG.SENDED;
                    msg = {msgtype: 'quiz_send',};
                } else {
                    if(state.scriptProg !==  SENDPROG.SENDING) return;
                    state.scriptProg = SENDPROG.SENDED;
                    msg = {msgtype: 'script_send',};
                    if(this._viewClue) {
                        felsocket.sendPAD($SocketType.MSGTOPAD, msg);
                        msg = {msgtype: 'view_clue',};
                    }
                } 
            } else {
                if(state.dialogueProg !== SENDPROG.SENDING) return;
                state.dialogueProg = SENDPROG.SENDED;
                msg = {msgtype: 'dialogue_send',};
            }
            felsocket.sendPAD($SocketType.MSGTOPAD, msg);
            this._setNavi();
        });
	}

	private _onPopupSend = (roll: ''|'A'|'B') => {
        const {state, actions} = this.props;
        if(this.c_popup === 'Q&A') {
            if(this._Title !== 'COMPREHENSION') return;
            else if(state.qnaProg > SENDPROG.READY) return;

            state.qnaProg = SENDPROG.SENDING;
            App.pub_playToPad();

            let msg: common.IMsg = {msgtype: 'qna_send',};
            felsocket.sendPAD($SocketType.MSGTOPAD, msg);

            // this._viewClue = false;
            _.delay(() => {
                if(	this._Title !== 'COMPREHENSION' ) return;
                else if(state.qnaProg !== SENDPROG.SENDING) return;

                state.qnaProg = SENDPROG.SENDED;
            }, 300);
            
            
        } else if(this.c_popup === 'ROLE PLAY') {
            if(this._Title !== 'DIALOGUE') return;
            else if(state.dialogueProg !== SENDPROG.SENDED) return;
            else if(this._roll !== '' || roll === '') return;

            if(this.m_player.currentTime !== this.m_player_inittime
                || this.m_player.currentTime < this.m_player_inittime) this.m_player.gotoAndPause(this.m_player_inittime * 1000);
            App.pub_playToPad();

            this._lastFocusIdx = 0;
            this._focusIdx = -1;
            this.m_player.setMuted(false);
            this.m_player.setMutedTemp(false);

            let msg: common.IRollMsg = {msgtype: 'roll_send', roll};
            felsocket.sendPAD($SocketType.MSGTOPAD, msg);
            _.delay(() => {
                if(this._Title !== 'DIALOGUE') return;
                else if(state.dialogueProg !== SENDPROG.SENDED) return;
                this._roll = roll;
            }, 300);

        } else if(this.c_popup === 'SHADOWING') {
            if(this._Title !== 'DIALOGUE') return;
            else if(state.dialogueProg !== SENDPROG.SENDED) return;
            else if(this._shadowing) return;

            if(this.m_player.currentTime !== this.m_player_inittime
                || this.m_player.currentTime < this.m_player_inittime) this.m_player.gotoAndPause(this.m_player_inittime * 1000);
            App.pub_playToPad();

            this._lastFocusIdx = 0;
            this._focusIdx = -1;
            this.m_player.setMuted(false);
            this.m_player.setMutedTemp(false);

            let msg: common.IMsg = {msgtype: 'shadowing_send'};
            felsocket.sendPAD($SocketType.MSGTOPAD, msg);
            _.delay(() => {
                if(this._Title !== 'DIALOGUE') return;
                else if(state.dialogueProg !== SENDPROG.SENDED) return;
                this._shadowing = true;
            }, 300);
        }
        this.props.actions.setNavi(false, false);
	}
	/* Hint Bubble */
	private _clickClue = () => {
		const {state, actions} = this.props;
		if(this._Title !== 'COMPREHENSION') return;
		else if(this._Tab !== 'SCRIPT') return;
		
		App.pub_playBtnTab();
		if(this._viewClue) {
			this._viewClue = false;
			
			let msg: common.IMsg = {msgtype: 'hide_clue',};
			felsocket.sendPAD($SocketType.MSGTOPAD, msg);
		} else {
			this._viewClue = true;
			
			let msg: common.IMsg = {msgtype: 'view_clue',};
			felsocket.sendPAD($SocketType.MSGTOPAD, msg);
		}	

	}
	private _clickCloseHint = () => {
		App.pub_playBtnTab();
		this._Hint = false;
	}
	private _clickItem = (idx: number, script: common.IScript) => {
		if(this._roll !== '' || this._shadowing) {
			/*
			if(!this._countdown.isRunning) {
				this.m_player.seek(script.dms_start * 1000);
				if(!this.m_player.bPlay) this.m_player.play();
			}
			*/
		} else {
			this.m_player.gotoAndPlay(script.dms_start * 1000, script.dms_end * 1000, 1);
		}
	}
	private _setShadowPlay = (val: boolean) => {
		if(this._shadowing) {
			this._isShadowPlay = val;
			const msg: common.IMsg = {
				msgtype: val ? 'playing' : 'paused',
			};
			felsocket.sendPAD($SocketType.MSGTOPAD, msg);
		} else this._isShadowPlay = val;
	}
	private _qnaReturnsClick = (idx: number) => {
		if(this._Title !== 'COMPREHENSION') return;
		else if(this._Tab !== 'SCRIPT') return;
		else if(this.props.state.qnaProg < SENDPROG.SENDED) return;

		const returns = this.props.actions.getQnaReturns();
		if(idx >= returns.length) return;
		const ret = returns[idx];
		if(ret.users.length <= 0) return;
		
		App.pub_playBtnTab();

		felsocket.startStudentReportProcess($ReportType.JOIN, ret.users);	
	}


	private _onPage = (idx: number) => {
		App.pub_stop();
		App.pub_playBtnTab();
		if(this._Title !== 'COMPREHENSION') return;

		this._curQidx = idx;
		this._Hint = (this._Tab === 'SCRIPT');
	}
	private _clearAll() {
        App.pub_stop();
        this._Title = 'COMPREHENSION';
        this._Tab = 'QUESTION';

        const quizs = this.m_data.quizs;
        for(let i = 0; i < quizs.length; i++) {
            this._qselected[i] = -1;
        }
        this._curQidx = 0;
        this._Hint = false;
        this.c_popup = 'off';
        this._viewClue = false;
        this._viewTrans = false;
        this._viewScript = true;
        this._roll = '';
        this._isShadowPlay = false;
        this._shadowing = false;

        this._lastFocusIdx = -1;
        this._focusIdx = -1;

        this.m_player.setMutedTemp(false);
        if(this.m_player.currentTime !== this.m_player_inittime
            || this.m_player.currentTime < this.m_player_inittime) this.m_player.gotoAndPause(this.m_player_inittime * 1000);
                    
        this.props.actions.init();
        felsocket.sendPAD($SocketType.PAD_ONSCREEN, null);
	}

	/* 화면전환 */
	private _clickCompre = (ev: React.MouseEvent<HTMLElement>) => {
		if(this._Title === 'COMPREHENSION') return;
		else if(this._roll === 'A' || this._roll === 'B' || this._shadowing) return;

		App.pub_stop();
		App.pub_playBtnTab();
		if(this.m_player.bPlay) this.m_player.pause();
		this._clearAll();
		this._Title = 'COMPREHENSION';
		this._Tab = 'QUESTION';
	}
	private _clickDial = (ev: React.MouseEvent<HTMLElement>) => {
		if(this._Title === 'DIALOGUE') return;
		else if(
				this.props.state.questionProg === SENDPROG.SENDED ||
				this.props.state.questionProg === SENDPROG.SENDING ||
				this.props.state.qnaProg >= SENDPROG.SENDING
		) return;
		

		App.pub_playBtnTab();
		if(this.m_player.bPlay) this.m_player.pause();
		this._clearAll();
		this._Title = 'DIALOGUE';
		this._Tab_save = this._Tab;
		this._Tab = 'SCRIPT';
		this._viewScript = false;
	}
	private _clickQuestion = (ev: React.MouseEvent<HTMLElement>) => {
		const state = this.props.state;
		if(this._Title !== 'COMPREHENSION') return;
		else if(this._Tab === 'QUESTION') return;
		else if(
			state.questionProg === SENDPROG.SENDED ||
			state.questionProg === SENDPROG.SENDING ||
			state.qnaProg >= SENDPROG.SENDING
		) return;
		App.pub_playBtnTab();
		this._Hint = false;
		this._Tab = 'QUESTION';
		if(state.scriptProg > SENDPROG.READY) {
			state.scriptProg = SENDPROG.READY;
			felsocket.sendPAD($SocketType.PAD_ONSCREEN, null);
			this.props.actions.clearQnaReturns();
		}
		
	}
	private _clickScript = (ev: React.MouseEvent<HTMLElement>) => {
		if(this._Title !== 'COMPREHENSION') return;
		else if(this._Tab === 'SCRIPT') return;
		else if(
			this.props.state.questionProg === SENDPROG.SENDED ||
			this.props.state.questionProg === SENDPROG.SENDING ||
			this.props.state.qnaProg >= SENDPROG.SENDING
		) return;

		App.pub_stop();
		App.pub_playBtnTab();
		this._Hint = false;
		this._Tab = 'SCRIPT';
	}
	private _clickReturn = () => {
		App.pub_playBtnTab();

		const isCompQ = (this._Title === 'COMPREHENSION' && this._Tab === 'QUESTION');

		if(isCompQ) felsocket.startStudentReportProcess($ReportType.JOIN, this.props.actions.getReturnUsersForQuiz());
        else felsocket.startStudentReportProcess($ReportType.JOIN, this.props.actions.getReturnUsers());
	}

	/* 누른 학생만 보이게 하는 런쳐결과  수정안됨*/
	private _clickPerson = (idx: number) => {
		App.pub_playBtnTab();
		const quizResults = this.props.actions.getResult();
		const quizResult = quizResults[this._curQidx];
		if(!quizResult) return;

		if(idx === 1) felsocket.startStudentReportProcess($ReportType.JOIN, quizResult.u1);
		else if(idx === 2) felsocket.startStudentReportProcess($ReportType.JOIN, quizResult.u2);
		else if(idx === 3) felsocket.startStudentReportProcess($ReportType.JOIN, quizResult.u3);
	}
	/* 누른 학생만 보이게 하는 런쳐결과  수정안됨*/
	private _clickPerson1 = () => this._clickPerson(1);
	private _clickPerson2 = () => this._clickPerson(2);
	private _clickPerson3 = () => this._clickPerson(3);

	private _clickAnswer = () => {
        const {state, actions} = this.props;
        const quizProg = state.questionProg;

        if(	this._Title !== 'COMPREHENSION' || 
            this._Tab !== 'QUESTION' || 
            quizProg !== SENDPROG.SENDED
        ) return;

        App.pub_playBtnTab();
        const msg: common.IMsg = {
            msgtype: 'quiz_end',
        };
        felsocket.sendPAD($SocketType.MSGTOPAD, msg);

        actions.quizComplete();
        this.props.actions.setNavi(true, true);
	}	
	/* Popup화면 */
	private _onPopupClosed = () => {
        if(this._Title === 'COMPREHENSION' && this._Tab === 'SCRIPT' && this.props.state.qnaProg === SENDPROG.READY) this.props.actions.setNavi(true, true);
        else if (this._Title === 'DIALOGUE' && this._roll === '' && !this._shadowing) this.props.actions.setNavi(true, true);
        this.c_popup = 'off';
    }
    private _onQAClick = () => {
        const {state} = this.props;

        if(	this._Title !== 'COMPREHENSION') return;
        else if(this.c_popup !== 'off') return;
        else if(state.scriptProg < SENDPROG.SENDED) return;

        if(state.qnaProg === SENDPROG.READY) {
            App.pub_playBtnTab();
            this.c_popup = 'Q&A';
            this.props.actions.setNavi(false, false);
        } else if(state.qnaProg >= SENDPROG.SENDING) {
            
            App.pub_playBtnTab();
            const msg: common.IMsg = {
                msgtype: 'qna_end',
            };
            felsocket.sendPAD($SocketType.MSGTOPAD, msg);	
            state.qnaProg = SENDPROG.READY;	
            
            this.props.actions.clearQnaReturns();
            this.props.actions.setNavi(true, true);
        }

	}
	private _onChangeScript = (idx: number) => {
		if(this._Title === 'DIALOGUE') {
			const scripts = this.m_data.scripts;
			if(idx >= 0 && idx < scripts.length) {

				if(this._roll !== '' || this._shadowing) {
					const script = scripts[idx];
					if(this._roll !== '') {
						this.m_player.setMutedTemp(this._roll === script.roll);
					}
				}
				this._lastFocusIdx = idx;
				this._focusIdx = idx;
			} else {
				this._focusIdx = -1;
				if(this._roll !== '') this.m_player.setMutedTemp(false);
			}
		}
		this._sendFocusIdx(idx);
	}
	private _sendFocusIdx(idx: number) {
		const msg: common.IFocusMsg = {
			msgtype: 'focusidx',
			idx,
		};
		felsocket.sendPAD($SocketType.MSGTOPAD, msg);
	}
	private _sendDialogueEnd() {
		const msg: common.IMsg = {
			msgtype: 'dialogue_end',
		};
		felsocket.sendPAD($SocketType.MSGTOPAD, msg);
	}


	private _onRollClick = () => {
        if(
            this._Title === 'DIALOGUE' && 
            this.props.state.dialogueProg >= SENDPROG.SENDED && 
            !this._shadowing
        ) {		
            App.pub_playBtnTab();
            if(this._roll === '') {
                this.c_popup = 'ROLE PLAY';
                this.m_player.pause();
                this.props.actions.setNavi(false, false);
            } else {
                this._lastFocusIdx = -1;
                this._focusIdx = -1;
                this.m_player.setMutedTemp(false);
                this._roll = '';
                this._sendDialogueEnd();
                this.props.actions.setNavi(true, true);
            }
        }
	}
	private _onShadowClick = () => {
        if(
            this._Title === 'DIALOGUE' && 
            this.props.state.dialogueProg >= SENDPROG.SENDED && 
            this._roll === ''
        ) {
            App.pub_playBtnTab();
            if(this._shadowing) {
                this._isShadowPlay = false;
                this._shadowing = false;
                this.props.actions.setNavi(true, true);
            } else {
                this._lastFocusIdx = -1;
                this._focusIdx = -1;
                this._sendFocusIdx(-1);
                this.c_popup = 'SHADOWING';
                this.m_player.pause();	
                this._sendDialogueEnd();
                this.props.actions.setNavi(false, false);		
            }
        }
	}

	private _onLetsTalk = () => {
		if(this.m_player.bPlay) this.m_player.pause();
		App.pub_playBtnTab();
		this._letstalk = true;
		this.props.actions.setNaviView(false);
	}
	private _letstalkClosed = () => {
		this._letstalk = false;
		this.props.actions.setNaviView(true);
	}
	private _toggleTrans = () => {
		if(this._Title !== 'DIALOGUE') return;
		App.pub_playBtnTab();
		this._viewTrans = !this._viewTrans;
		if(this._viewTrans) this._viewScript = true;
		
		if(this._lastFocusIdx >= 0 && this._scontainer && this.m_player.bPlay) {
			this._scontainer.scrollTo(this._lastFocusIdx, 0);
			_.delay(() => {
				if(this._lastFocusIdx >= 0 && this._scontainer) {
					this._scontainer.scrollTo(this._lastFocusIdx, 0);
				}
			}, 5);
			_.delay(() => {
				if(this._lastFocusIdx >= 0 && this._scontainer) {
					this._scontainer.scrollTo(this._lastFocusIdx, 0);
				}
			}, 50);
			_.delay(() => {
				if(this._lastFocusIdx >= 0 && this._scontainer) {
					this._scontainer.scrollTo(this._lastFocusIdx, 0);
				}
			}, 300);
		}
		
	}
	private _toggleScript = () => {
		if(this._Title !== 'DIALOGUE') return;
		App.pub_playBtnTab();
		this._viewScript = !this._viewScript;
	}
	private _stopClick = () => {
        this._sendFocusIdx(-1);
        this._lastFocusIdx = -1;
        this._focusIdx = -1;

        this.m_player.setMutedTemp(false);

        this._sendDialogueEnd();
        
        const isOnStudy = this._roll === 'A' || this._roll === 'B' || this._shadowing;
        if(this._Title === 'COMPREHENSION' && this._Tab === 'SCRIPT' && (this.props.state.qnaProg < SENDPROG.SENDING || this.props.state.qnaProg >= SENDPROG.COMPLETE)) this._setNavi();
        else if(this._Title === 'DIALOGUE') {
            this._isShadowPlay = false;
            if(!isOnStudy) this._setNavi();
        }
	}

	private _setNavi() {
        this.props.actions.setNaviView(true);
        if(this.props.state.questionProg === SENDPROG.SENDED) this.props.actions.setNavi(this._curQidx === 0 ? false : true, this._curQidx === this.m_data.quizs.length - 1 ? false : true);
		else this.props.actions.setNavi(true, true);
		
        this.props.actions.setNaviFnc(
            () => {
                if(this._Title === 'COMPREHENSION') {
                    if(this._Tab === 'QUESTION') {
                        if(this._curQidx === 0) {
                            this.props.actions.gotoDirection();
                        } else {
                            App.pub_stop();
                            App.pub_playBtnTab();
                            this._Hint = false;
                            this._curQidx = this._curQidx - 1;
                            this._setNavi();
                        }
                    } else {
                        if(
                            this.props.state.questionProg === SENDPROG.SENDED ||
                            this.props.state.questionProg === SENDPROG.SENDING ||
                            this.props.state.qnaProg >= SENDPROG.SENDING
                        ) return;

                        App.pub_stop();
                        App.pub_playBtnTab();
                        this._Hint = false;
                        this._Tab = 'QUESTION';
                        if(this.props.state.scriptProg > SENDPROG.READY) {
                            this.props.state.scriptProg = SENDPROG.READY;
                            felsocket.sendPAD($SocketType.PAD_ONSCREEN, null);
                            this.props.actions.clearQnaReturns();
                        }
                        this._curQidx = this.m_data.quizs.length - 1;
                    }
                } else {
                    if(this._roll === 'A' || this._roll === 'B' || this._shadowing) return;

                    App.pub_stop();
                    App.pub_playBtnTab();
                    if(this.m_player.bPlay) this.m_player.pause();
                    this._clearAll();
                    this._Title = 'COMPREHENSION';
                    this._Tab = 'SCRIPT';
                    this._curQidx = 0;
                }
            },
            () => {
                if(this._Title === 'COMPREHENSION') {
                    if(this._Tab === 'QUESTION') {
                        if(this._curQidx === this.m_data.quizs.length - 1) {
                            if(
                                this.props.state.questionProg === SENDPROG.SENDED ||
                                this.props.state.questionProg === SENDPROG.SENDING ||
                                this.props.state.qnaProg >= SENDPROG.SENDING
                            ) return;
                    
                            App.pub_stop();
                            App.pub_playBtnTab();
                            this._Hint = false;
                            this._Tab = 'SCRIPT';
                            this._curQidx = 0;
                        } else {
                            App.pub_stop();
                            App.pub_playBtnTab();
                            this._Hint = false;
                            this._curQidx = this._curQidx + 1;
                            this._setNavi();
                        }
                    } else {
                        if(
                            this.props.state.questionProg === SENDPROG.SENDED ||
                            this.props.state.questionProg === SENDPROG.SENDING ||
                            this.props.state.qnaProg >= SENDPROG.SENDING
                        ) return;
                        
                        App.pub_stop();
                        App.pub_playBtnTab();
                        if(this.m_player.bPlay) this.m_player.pause();
                        this._clearAll();
                        this._Title = 'DIALOGUE';
                        this._Tab_save = this._Tab;
                        this._Tab = 'SCRIPT';
                        this._viewScript = false;
                    }
                } else {
                    this.props.actions.gotoNextBook();
                }
            }
        );
	}

	public componentDidUpdate(prev: IComprehension) {
		if (this.props.view && !prev.view) {
			this._clearAll();
			this._view = true;
			this._setNavi();
			this._letstalk = false;
		} else if (!this.props.view && prev.view) {
			this.c_popup = 'off';
			this._lastFocusIdx = -1;
			this._focusIdx = -1;
			this._roll = '';
			this._isShadowPlay = false;
			this._shadowing = false;
			App.pub_stop();
			if(this.m_player.bPlay) this.m_player.pause();
			this.m_player.setMuted(false);
			this.m_player.setMutedTemp(false);
			_.delay(() => {
				if(this.props.view) return;
				this.m_player.seek(this.m_player_inittime * 1000);
				this._view = false;
			}, 300);
		}
	}

	private _onMc = (selected: number) => {
		if(this.props.state.questionProg >= SENDPROG.COMPLETE) return;

		this._qselected[this._curQidx] = selected; 
		// console.log('_onMc', selected);
		// this._qselected[i] = -1;
		
	}

	private _onClickQuestion = () => {
		const quiz = this.m_data.quizs[this._curQidx];
		if(quiz) {
			App.pub_play(App.data_url + quiz.audio, (isEnded: boolean) => {
				//
			});
		}

	}

	public render() {
        const {state} = this.props;

        const quizs = this.m_data.quizs;
        const isQComplete = state.questionProg >= SENDPROG.COMPLETE;

        const isOnStudy = (this._Title === 'COMPREHENSION' &&
                            (state.questionProg === SENDPROG.SENDING ||
                                state.questionProg === SENDPROG.SENDED ||
                                state.qnaProg >= SENDPROG.SENDING)) 
                        || (this._Title === 'DIALOGUE' && (
                                this._roll === 'A' || this._roll === 'B' || this._shadowing
                            )
                        );

        
        const quizPreview = quizs[this._curQidx].app_preview;
        const quizResult = this.props.actions.getResult();
        let qResult = -1;
        if(isQComplete) {
            if(state.numOfStudent > 0) qResult = Math.round(100 * quizResult[this._curQidx].numOfCorrect / state.numOfStudent);
            else qResult = 0;
            if(qResult > 100) qResult = 100;
        }

        const isDialogue = (this._Title === 'DIALOGUE');
        const isCompQ = (this._Title === 'COMPREHENSION' && this._Tab === 'QUESTION');
        const isCompS = (this._Title === 'COMPREHENSION' && this._Tab === 'SCRIPT');
        
        const isScriptSended = this._Title === 'COMPREHENSION' && state.scriptProg >= SENDPROG.SENDED;
        const isDialogueSended = isDialogue && state.dialogueProg >= SENDPROG.SENDED;

        // const isViewDialogueSended = isDialogue && state.dialogueProg >= SENDPROG.SENDED;

        const isViewSend = (isCompQ && state.questionProg < SENDPROG.SENDED) ||
                        (isCompS && state.scriptProg < SENDPROG.SENDED) ||
                        (isDialogue && state.dialogueProg < SENDPROG.SENDED);
        // const isSended = 	(isCompQ && state.quizProg >= SENDPROG.SENDED) || 	(isCompS && isScriptSended);

        const isViewInfo = (isCompQ && state.questionProg >= SENDPROG.SENDED)
                    || isCompS;

        const isViewReturn = (isCompQ && state.questionProg >= SENDPROG.SENDED)
                    || (isCompS && state.qnaProg >=  SENDPROG.SENDED);


        const isViewAnswer = (isCompQ && state.questionProg >= SENDPROG.SENDED);
        const isViewClue = isCompS;

        const style: React.CSSProperties = {};

        const qlen = quizs.length;
        const gap = 32;
        const arrowL = (this._curQidx - (qlen - 1) / 2) * gap;
        
        const letstalk = this.m_data.letstalk;
        const viewLetstalk = !(letstalk.sentence === '' || letstalk.audio === '' || letstalk.img1 === '' || letstalk.sample === '' || letstalk.hint === '');
        
        return (
            <div className={'t_comprehension ' + this._Title} style={style}>
                <div className="top">
                    <ToggleBtn onClick={this._clickCompre} on={this._Title === 'COMPREHENSION'} disabled={this._Title === 'COMPREHENSION' || isOnStudy} className="btn_compre" />
                    <ToggleBtn onClick={this._clickDial} on={this._Title === 'DIALOGUE'} disabled={this._Title === 'DIALOGUE' || isOnStudy} className="btn_dialogue" />
                </div>
                <div className="left_box" >
                    <div className="video_container">
                        <VideoBox 
                            player={this.m_player} 
                            playerInitTime={this.m_player_inittime} 
                            data={this.m_data}
                            compDiv={this._Title}
                            roll={this._roll}
                            shadowing={this._shadowing}
                            countdown={this._countdown}
                            onChangeScript={this._onChangeScript}
                            stopClick={this._stopClick}
                            isShadowPlay={this._isShadowPlay}
                            setShadowPlay={this._setShadowPlay}
                        />
                    </div>
                </div>
                <div className="btn_tabs">
                    <ToggleBtn className="btn_tab_question" onClick={this._clickQuestion} on={this._Tab === 'QUESTION'} disabled={this._Tab === 'QUESTION' || isOnStudy} />
                    <ToggleBtn className="btn_tab_script" onClick={this._clickScript} on={this._Tab === 'SCRIPT'} disabled={this._Tab === 'SCRIPT' || isOnStudy} />
                </div>
                <div className={'info_box' + (isViewInfo ? ' on' : '')}>
                    <div className="return_cnt_box white" style={{display: isViewReturn ? '' : 'none'}} onClick={this._clickReturn}>
                        <div>{state.retCnt}/{state.numOfStudent}</div>
                    </div>
                    <ToggleBtn className="btn_answer" on={isQComplete} onClick={this._clickAnswer} view={isViewAnswer}/>
                    <ToggleBtn className="btn_clue" onClick={this._clickClue} on={this._viewClue} view={isViewClue}/>
                </div>	
                <div className="right_box">
                    <div className="btn_page_box">
                        {quizs.map((page, idx) => {
                            return <NItem key={idx} on={(this._Hint === true || this._Tab === 'QUESTION') && idx === this._curQidx} idx={idx} onClick={this._onPage}/>;
                        })}
                    </div>
                    <div className="right_top">
                        <CorrectBar 
                            className={'correct_box' + (isCompQ ? '' : ' hide') + (qResult < 0 ? ' no-result' : '')} 
                            preview={-1} 
                            result={qResult}
                        />
                        <div className="hint_box"  style={{display: (isCompS && this._Hint ? '' : 'none'), left: '13px'}} >
                            <div className="arrow" style={{left: arrowL + 'px'}}/>
                            <div className="content">
                                <ToggleBtn className="btn_hint_close" onClick={this._clickCloseHint}/>

                                <div>
                                    <WrapTextNew view={isCompS && this._Hint} rcalcNum={this._curQidx}>
                                        {quizs[this._curQidx].app_question}
                                    </WrapTextNew>
                                </div>
                                {/* quizs.map((quiz, idx) => {
                                    return <div key={idx} style={{ display: idx === this._curQidx ? '' : 'none' }}></div>;
                                }) */}
                            </div>
                        </div>
                        
                        <ToggleBtn className="btn_lets_talk" view={viewLetstalk} on={this._letstalk} onClick={this._onLetsTalk} disabled={this._shadowing || this._roll === 'A' || this._roll === 'B'}/>
                        {/* <ToggleBtn className={'btn_script_trans' + (this._viewTrans ? ' on' : '')} on={this._viewTrans} onClick={this._toggleTrans} /> */}
                        <ToggleBtn className={'btn_script_show' + (this._viewScript ? ' on' : '')} on={this._viewScript} onClick={this._toggleScript} />
                    </div>
                    <div className={'question' + (state.questionProg >= SENDPROG.COMPLETE ? ' complete' : '')} style={{display: this._Tab === 'QUESTION' ? '' : 'none'}}>
                            {quizs.map((quiz, idx) => {
                                return (
                                    <div key={idx} style={{ display: idx === this._curQidx ? '' : 'none' }}>
                                        <div className="quiz">
                                            {/*<span>{quiz.question}</span>*/}
                                            <WrapTextNew view={this.props.view && idx === this._curQidx} maxLineNum={2} minSize={24} maxSize={36} lineHeight={120} textAlign="left" onClick={this._onClickQuestion}>
                                                {quiz.app_question}
                                            </WrapTextNew>
                                        </div>
                                        <hr className="line"/>
                                        <div className={'choice' + (isQComplete ? ' correct' : '')}>
                                            <span onClick={this._clickPerson1}>{quizResult[idx].c1}</span>
                                            <QuizMCBtn 
                                                className="btn_choice" 
                                                num={1} 
                                                on={isQComplete ? quiz.answer === 1 : this._qselected[idx] === 1} 
                                                onClick={this._onMc} 
                                                disabled={isQComplete}
                                            >
                                                <WrapTextNew view={this.props.view && idx === this._curQidx} maxLineNum={2} minSize={24} maxSize={33} lineHeight={120} textAlign="left">
                                                    {quiz.choice_1}
                                                </WrapTextNew>
                                            </QuizMCBtn>

                                            <span onClick={this._clickPerson2}>{quizResult[idx].c2}</span>
                                            <QuizMCBtn 
                                                className="btn_choice" 
                                                num={2} 
                                                on={isQComplete ? quiz.answer === 2 : this._qselected[idx] === 2} 
                                                onClick={this._onMc} 
                                                disabled={isQComplete}
                                            >
                                                <WrapTextNew view={this.props.view && idx === this._curQidx} maxLineNum={2} minSize={24} maxSize={33} lineHeight={120} textAlign="left">
                                                    {quiz.choice_2}
                                                </WrapTextNew>
                                            </QuizMCBtn>
                                            <span onClick={this._clickPerson3}>{quizResult[idx].c3}</span>
                                            <QuizMCBtn 
                                                className="btn_choice" 
                                                num={3} 
                                                on={isQComplete ? quiz.answer === 3 : this._qselected[idx] === 3} 
                                                onClick={this._onMc} 
                                                disabled={isQComplete}
                                            >
                                                <WrapTextNew view={this.props.view && idx === this._curQidx} maxLineNum={2} minSize={24} maxSize={33} lineHeight={120} textAlign="left">
                                                    {quiz.choice_3}
                                                </WrapTextNew>
                                            </QuizMCBtn>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    
                    <div className={'script_container' + (this._Tab === 'SCRIPT' ? '' : ' hide')}>
                        <ScriptContainer
                            ref={this._refScriptContainer}
                            view={this.props.view}
                            data={this.m_data}
                            focusIdx={this._focusIdx}
                            selected={this._selected}
                            qnaReturns={this.props.actions.getQnaReturns()}
                            qnaReturnsClick={this._qnaReturnsClick}
                            roll={this._roll}
                            shadowing={this._shadowing}
                            clickThumb={this._clickItem}
                            noSwiping={this._Title === 'DIALOGUE' && ((this._shadowing && this._isShadowPlay) || (!this._shadowing && this.m_player.bPlay))}
                            compDiv={this._Title}
                            viewClue={this._viewClue}
                            viewScript={this._viewScript}
                            viewTrans={this._viewTrans}
                            numRender={state.retCnt}
                        />
                    </div>
                </div>
                <div className="bottom">
                    <ToggleBtn className="btn_QA"  view={isCompS || isScriptSended} disabled={!isScriptSended} on={state.qnaProg >= SENDPROG.SENDING} onClick={this._onQAClick} />
                    <ToggleBtn className="btn_role" view={isDialogue} on={this._roll === 'A' || this._roll === 'B'} disabled={!isDialogueSended || this._shadowing} onClick={this._onRollClick} />
                    <ToggleBtn className="btn_shadowing" view={isDialogue} on={this._shadowing} disabled={!isDialogueSended || this._roll !== ''} onClick={this._onShadowClick} />
                </div>
                <ComprePopup 
                    type={this.c_popup}
                    view={this.c_popup === 'Q&A' || this.c_popup === 'ROLE PLAY' || this.c_popup === 'SHADOWING'} 
                    imgA={this.m_data.speakerA.image_l}
                    imgB={this.m_data.speakerB.image_l}
                    onSend={this._onPopupSend}
                    onClosed={this._onPopupClosed}
                />
                <SendUINew
                    view={isViewSend}
                    type={'teacher'}
                    sended={false}
                    originY={0}
                    onSend={this.onSend}
                />
                <Tletstalk 
                    view={this._letstalk} 
                    data={this.m_data.letstalk} 
                    onClosed={this._letstalkClosed}
                />
            </div>
        );
    }
}



export default Comprehension;
