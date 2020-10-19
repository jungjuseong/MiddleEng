import * as React from 'react';
import * as ReactDOM from 'react-dom';
import * as _ from 'lodash';
import { observer, Observer } from 'mobx-react';
import { observable, observe, _allowStateChangesInsideComputed } from 'mobx';
import { DraggableCore, DraggableData, DraggableEvent } from 'react-draggable';

import { IStateCtx, IActionsCtx } from './t_store';
import { MPlayer, MConfig, IMedia, MPRState } from '@common/mplayer/mplayer';

import * as t_store from './t_store';
import { ToggleBtn } from '@common/component/button';

import { App } from '../../App';
import * as felsocket from '../../felsocket';
import { CoverPopup } from '../../share/CoverPopup';
import { Loading } from '../../share/loading';

import * as common from '../common';
import * as kutil from '@common/util/kutil';
import * as butil from '@common/component/butil';
import SendUI from '../../share/sendui_new';
import * as style from '../../share/style';
import { SENDPROG } from './t_store';
import { CountDown2, TimerState } from '../../share/Timer';
import WrapTextNew from '@common/component/WrapTextNew';

const SwiperComponent = require('react-id-swiper').default;

function _getCurrentIdx(scripts: common.IScript[], time: number) {
    let timeRound = Math.round(time / 0.01) * 0.01;
    for (let i = 0, len = scripts.length; i < len; i++) {
        const s = scripts[i];
        if (timeRound >= s.dms_start && timeRound <= s.dms_end) {
            return i;
            break;
        } else if (timeRound < s.dms_start) {
            break;
        }
    }
    return -1;
}
function _getLastIdx(scripts: common.IScript[], time: number) {
	for (let i = 0, len = scripts.length; i < len; i++) {
		const s = scripts[i];
		if (time >= s.dms_start && time <= s.dms_end) {
			return i;
		} else if (time < s.dms_start) {
			return i;
		}
	}
	return -1;
}

function _getTimeStr(ms: number, max: number) {
	const maxSec = Math.round(max / 1000);

	let sec = Math.round(ms / 1000);
	let min = Math.floor(sec / 60);
	let hour = Math.floor(min / 60);
	let ret = '';
	sec = sec % 60;
	min = min % 60;
	if (hour > 0 || maxSec >= 3600) {
		ret = hour + ':';
		if (min >= 10) ret += min + ':';
		else ret += '0' + min + ':';
	} else if (maxSec >= 600) {
		if (min >= 10) ret += min + ':';
		else ret += '0' + min + ':';
	} else ret = min + ':';

	if (sec >= 10) ret += sec;
	else ret += '0' + sec;

	return ret;
}
@observer
class ProgBox extends React.Component<{ player: MPlayer, disable: boolean, checkups: common.IScript[] }> {
	private m_dragging = false;
	private m_bg!: HTMLElement;
	private m_bgW = 0;
	private m_s = 0;
	@observable private m_dragLeft = 0;
	private m_dragLeft_s = 0;
	private _seek = _.throttle((percent: number) => {
		if(this.props.disable) return;
		const player = this.props.player;
		player.seek(player.duration * percent / 100);
	}, 300, { leading: false });
	private _refBG = (el: HTMLElement | null) => {
		if (this.m_bg || !el) return;
		this.m_bg = el;
	}

	private _start = (evt: DraggableEvent, data: DraggableData) => {
		if (!this.m_bg || this.props.disable) return;
		const player = this.props.player;
		if (player.duration <= 0) return;

		this.m_bgW = this.m_bg.getBoundingClientRect().width;
		if (this.m_bgW <= 0) return;

		let left = 100 * data.x / this.m_bgW;
		if (left < 0) left = 0;
		else if (left > 100) left = 100;
		this.m_dragLeft_s = left;
		this.m_dragLeft = left;
		this.m_s = data.x;
		this.m_dragging = true;
	}
	private _drag = (evt: DraggableEvent, data: DraggableData) => {
		if (!this.m_dragging || this.props.disable) return;
		let left = this.m_dragLeft_s + 100 * (data.x - this.m_s) / this.m_bgW;
		if (left < 0) left = 0;
		else if (left > 100) left = 100;
		this.m_dragLeft = left;

		const player = this.props.player;
		if (!player.bPlay) this._seek(left);
	}
	private _stop = (evt: DraggableEvent, data: DraggableData) => {
		if (!this.m_dragging || this.props.disable) return;

		this.m_dragging = false;
		const player = this.props.player;
		player.seek(player.duration * this.m_dragLeft / 100);
	}

	public render() {
		const {player, checkups} = this.props;
		let percent = 0;
		const duration = player.duration;
		if (duration > 0) {
			percent = (player.viewTime / duration) * 100;
		}
		let btnLeft = 0;
		let dragLeft = this.m_dragLeft;
		if (this.m_dragging) btnLeft = dragLeft;
		else btnLeft = percent;

		return (
			<>
				<div className="prog_box">
					<DraggableCore
						onDrag={this._drag}
						onStart={this._start}
						onStop={this._stop}
					>
						<div className="prog_bg" ref={this._refBG}>
							<div className="prog_bar" style={{ width: percent + '%' }} />
							<div className="prog_tmp" />
							{checkups.map((script, idx) => {
								let per = (duration > 0) ? (script.dms_end * 1000 / duration) * 100 : 0;
								return <span key={idx} className="checkup" style={{ left: per + '%' }}/>;
							})}

							<ToggleBtn className="prog_btn" style={{ left: btnLeft + '%' }} />


						</div>
					</DraggableCore>
				</div>
				<div className="video_time" style={{ width: (player.duration >= 600000 ? 110 : 135) + 'px' }}><span>{_getTimeStr(player.viewTime, player.duration)}</span> / <span>{_getTimeStr(player.duration, player.duration)}</span></div>
			</>
		);
	}
}

/*
	roll: ''|'A'|'B';
	shadowing: boolean;
	viewCountDown: boolean;
*/
interface IControlBox {
	player: MPlayer;
	viewCaption: boolean;
	disable: boolean;
	vpop: POPUPTYPE;
	study: POPUPTYPE;
	checkups: common.IScript[];
	isPlay: boolean;
	toggleMute: () => void;
	toggleFullscreen: () => void;
	toggleCaption: () => void;
	togglePlay: () => void;
	stopClick: () => void;

	readaloudClick: () => void;
	shadowingClick: () => void;
	checkupClick: () => void;

	prevClick: () => void;
	nextClick: () => void;
}
@observer
class ControlBox extends React.Component<IControlBox> {
	public render() {
		const {player, study, vpop} = this.props;
		return (
			<div className="control">
				<div className="control_left">
					<ToggleBtn className="btn_play_pause" on={this.props.isPlay} onClick={this.props.togglePlay} />
					<ToggleBtn className="btn_stop" onClick={this.props.stopClick} />
					<ToggleBtn className="btn_prev" onClick={this.props.prevClick} />
					<ToggleBtn className="btn_next" onClick={this.props.nextClick} />
				</div>
				<div className={'control_top ' + study}>
					<div>
						<ProgBox player={player} checkups={this.props.checkups} disable={this.props.disable}/>
					</div>
				</div>
				{/* btn_subscript, btn_audio 추가*/}
				<div className="control_right">
					<ToggleBtn className={'btn_subscript ' + study} on={this.props.viewCaption} onClick={this.props.toggleCaption} />
					<ToggleBtn className="btn_audio" onClick={this.props.toggleMute} on={player.muted} />
					<ToggleBtn className="btn_fullscreen" onClick={this.props.toggleFullscreen} />
					<ToggleBtn className="btn_fullscreen_off" onClick={this.props.toggleFullscreen} />
				</div>
				<div className="control_center">
					<ToggleBtn 
						className="btn_v_listen_repeat" 
						on={vpop === 'SHADOWING' || study === 'SHADOWING'}
						disabled={study === 'READALOUD' || study === 'CHECKUP'}
						onClick={this.props.shadowingClick}
					/>
					<ToggleBtn 
						className="btn_v_readalong"
						on={vpop === 'READALOUD' || study === 'READALOUD'}
						disabled={study === 'CHECKUP' || study === 'SHADOWING'}
						onClick={this.props.readaloudClick}
					/>
					<ToggleBtn 
						className="btn_v_checkup" 
						on={vpop === 'CHECKUP' || study === 'CHECKUP'}
						disabled={study === 'READALOUD' || study === 'SHADOWING'}
						onClick={this.props.checkupClick}
					/>
				</div>
			</div>
		);
	}
}

@observer
class CaptionBox extends React.Component<{view: boolean, inview: boolean, script?: common.IScript}> {
	@observable private _viewEng = true;
	@observable private _viewTrans = true;
	private _toggleEng = () => {
		this._viewEng = !this._viewEng;
	}
	private _toggleTrans = () => {
		this._viewTrans = !this._viewTrans;
	}
	public componentDidUpdate(prev: {view: boolean, inview: boolean}) {
		if(this.props.view && !prev.view) {
			this._viewEng = true;
			this._viewTrans = true;
		}
	}	
	public render() {
		const {inview, script} = this.props;
		// console.log(App.lang);
		let eng;
		let trans;
		if(script) {
			if(this._viewEng) eng = script.dms_eng;
			else eng = <>&nbsp;</>;
			if(this._viewTrans) trans = script.dms_kor[App.lang];
			else trans = <>&nbsp;</>;
		} else {
			eng = <>&nbsp;</>;
			trans = <>&nbsp;</>;
		}
		return (
			<div className="caption_box" style={{display: inview ? '' : 'none'}}>
				<div className="caption_eng"><span>{eng}</span><ToggleBtn className="btn_eng" on={this._viewEng} onClick={this._toggleEng}/></div>
				{/* <div className="caption_trans"><span>{trans}</span><ToggleBtn className="btn_trans" on={this._viewTrans} onClick={this._toggleTrans}/></div> */}
			</div>
		);
	}
}

function _splitSpace(sentence: string, keyObj: {key: number}, splitClass?: string) {
    const arrS = sentence.split(/\s/g);
    const pattern = new RegExp(/[\s]/g);

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
                sTmp = sTmp.replace(/@@1@@/g, '."').replace(/@@2@@/g, '?"').replace(/@@3@@/g, '!"');
                arr.push(<span key={keyObj.key++}>{sTmp}</span>);
            }
            sTmp = result[0];
            
            arr.push(sTmp);

            lastIdx = pattern.lastIndex;
            result = pattern.exec(txt);
        }
        if(lastIdx < txt.length) {
            sTmp = txt.substring(lastIdx);
            sTmp = sTmp.replace(/@@1@@/g, '."').replace(/@@2@@/g, '?"').replace(/@@3@@/g, '!"');
            arr.push(<span key={keyObj.key++}>{sTmp}</span>);
        }

        ret.push(<span key={keyObj.key++} className={splitClass}>{arr.map((node) => node)}</span>);
    }

    return ret;

}

function _sentence2jsx(
    sentence: string,
    blockClass: string|null = 'block',
    blockStr?: string,
    isBlockWorkWrap?: boolean,
    splitClass?: string,
) {
    const pattern = new RegExp(/\{(.*?)\}/g);
    let keyObj = {key: 0};

    const ret: JSX.Element[] = [];
    sentence = sentence.replace(/\.\"/g, '@@1@@').replace(/\?\"/g, '@@2@@').replace(/\!\"/g, '@@3@@');
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

                arr.push((<span key={keyObj.key++} className={blockClass} data-correct={sTmp}>{jsx}</span>));
        
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

interface IScript {
	idx: number;
	on: boolean;
	studentturn: boolean;
	script: common.IScript;
	viewScript: boolean;
}
class Script extends React.Component<IScript> {
	private _jsx: JSX.Element[];
	constructor(props: IScript) {
        super(props);
        this._jsx = _sentence2jsx(props.script.dms_eng, 'closure', undefined, false, 'word');
	}
	public render() {
		const {on, viewScript, studentturn} = this.props;
		const arr: string[] = [];
		const img_arr: string[] = [];
		
		if(viewScript) arr.push('view');
		if(on) arr.push('on');

		const className = arr.join(' ');

		if(viewScript) img_arr.push('view');
		if(on && studentturn) img_arr.push('on');

		const imgClassName = img_arr.join(' ');

		return (
			<>
				<span>
					<img className={imgClassName} src={_project_ + 'teacher/images/arrow_script.png'} draggable={false}/>
				</span>
				<div className={className}>{this._jsx}</div>
			</>
		);
	}
}

type POPUPTYPE = 'off'|'READALOUD' | 'SHADOWING' | 'CHECKUP' | 'CHECKUPSET';

interface IVPopup {
	type: POPUPTYPE;
	data: common.IData;
    checkupIdx: number;
    actions: IActionsCtx;
	onSend: (type: POPUPTYPE) => void;
	onClosed: () => void;
}
@observer
class VPopup extends React.Component<IVPopup> {
	@observable private _view = false;
	@observable private _prog = SENDPROG.READY;
    @observable private _selected = 0;
    @observable private _retCnt = 0;
    @observable private _numOfStudent = 0;
    private _returnUsers: string[] = [];
	private _onClose = () => {
		App.pub_playBtnTab();
		this._view = false;
	}
	public componentDidUpdate(prev: IVPopup) {
		if (this.props.type !== 'off' && prev.type === 'off') {
			this._view = true;
			this._selected = 0;
			this._prog = SENDPROG.READY;
			this._retCnt = 0;
			this._numOfStudent = 0;
			while(this._returnUsers.length > 0) this._returnUsers.pop();
			this.props.actions.setCheckupFnc(null);
		} else if (this.props.type === 'off' && prev.type !== 'off') {
			this._view = false;
			this._selected = 0;
		}
	}
	private _onSend = () => {
        if (this.props.type === 'off') return;
        else if(this._prog !== SENDPROG.READY) return;

        if(this.props.type === 'CHECKUP') {
            const msg: common.IMsgForIdx = {msgtype: 'v_checkup_send', idx: this.props.checkupIdx};
            felsocket.sendPAD($SocketType.MSGTOPAD, msg);
            this._retCnt = 0;
            while(this._returnUsers.length > 0) this._returnUsers.pop();
        } else if(this.props.type !== 'CHECKUPSET') {
            const msg: common.IMsg = {msgtype: this.props.type === 'READALOUD' ? 'v_readaloud_send' : 'v_shadowing_send',};
            felsocket.sendPAD($SocketType.MSGTOPAD, msg);
        }
        
        this._prog = SENDPROG.SENDING;
        App.pub_playToPad();
        
        if(this.props.type === 'CHECKUP') this.props.actions.setCheckupFnc(this._onReturn);
        App.pub_reloadStudents(async () => {
            if(this._prog !== SENDPROG.SENDING) return;

            await kutil.wait(500);

            if(this._prog !== SENDPROG.SENDING) return;

            this._prog = SENDPROG.SENDED;
            this.props.onSend(this.props.type);

            if(this.props.type !== 'CHECKUP') {
                this._view = false;
            } else {
                this._retCnt = 0;
                this._numOfStudent = App.students.length;
            }
        });
	}
	private _clickTrue = () => {
		if(this._prog >= SENDPROG.COMPLETE) return;
		App.pub_playBtnTab();
		if(this._selected === 1) this._selected = 0;
		else this._selected = 1;
	}
	private _clickFalse = () => {
		if(this._prog >= SENDPROG.COMPLETE) return;
		App.pub_playBtnTab();
		if(this._selected === 2) this._selected = 0;
		else this._selected = 2;
    }
    private _onReturn = (msg: common.IQNAMsg) => {
        if(!this._view) return;

        const student = _.find(App.students, {id: msg.id});
        if(!student) return;
        
        this._returnUsers.push(msg.id);
        felsocket.addStudentForStudentReportType6(msg.id);
        let retCnt = this._retCnt + 1;
        if(retCnt >= this._numOfStudent) retCnt =  this._numOfStudent;
        this._retCnt = retCnt;
    }
    private _clickReturn = () => {
        App.pub_playBtnTab();
        felsocket.startStudentReportProcess($ReportType.JOIN, this._returnUsers);	
    }
	private _clickAnswer = () => {
		if(this._prog !== SENDPROG.SENDED) return;
		App.pub_playBtnTab();

		const msg: common.IMsg = {msgtype: 'v_checkup_end',};
		felsocket.sendPAD($SocketType.MSGTOPAD, msg);
		this._prog = SENDPROG.COMPLETE;
		this.props.actions.setCheckupFnc(null);
	}
	public render() {
		const { type, checkupIdx, data } = this.props;
		let title;
		if(this.props.type === 'READALOUD') title = 'READ ALONG';
		else if(this.props.type === 'SHADOWING') title = 'LISTEN & REPEAT';
		else if(type === 'CHECKUP' || type === 'CHECKUPSET') title = 'CHECK UP';
		else title = type;

		let question = '';
		let answer = 0;
		if(type === 'CHECKUP') {
			const checkup = data.checkup[checkupIdx];
			if(checkup) {
				question = checkup.question;
				answer = checkup.answer;
			}
		}

		return (
			<CoverPopup className="v_popup" view={this._view} onClosed={this.props.onClosed} >
				<div>
					<div className="head">
						<span>{title}</span>
						<ToggleBtn className="btn_close" onClick={this._onClose} />
					</div>
					<div className="READALOUD content" style={type === 'READALOUD' ? undefined : style.NONE}>
						Read along together.
					</div>
					<div className="SHADOWING content" style={type === 'SHADOWING' ? undefined : style.NONE}>
						Listen and repeat.
					</div>
                    <div className="CHECKUPSET content" style={type === 'CHECKUPSET' ? undefined : style.NONE}>
						Watch the video and answer.
					</div>

					<div className="CHECKUP content" style={type === 'CHECKUP' ? undefined : style.NONE}>
						
						<div className="question">
							<span>{checkupIdx + 1}.</span>
							<div className="qtext">
							<WrapTextNew 
								view={type === 'CHECKUP'}
								maxLineNum={2}
								maxSize={44}
								minSize={36}
								lineHeight={160}
								textAlign={'left'}
							>
								{question}
							</WrapTextNew>
							</div>
						</div>
						<div className="choice-box">
							<ToggleBtn 
								className="btn_true" 
								on={ 
										(this._selected === 1 && this._prog < SENDPROG.COMPLETE)
									||  ( answer === 1 && this._prog === SENDPROG.COMPLETE)
								} 
								onClick={this._clickTrue}
							/>
							<ToggleBtn 
								className="btn_false" 
								on={ 
									(this._selected === 2 && this._prog < SENDPROG.COMPLETE)
								||  ( answer === 2 && this._prog === SENDPROG.COMPLETE)
								} 
								onClick={this._clickFalse}
							/>
						</div>
						<div className="return_cnt_box white" style={{display: this._prog >= SENDPROG.SENDED ? '' : 'none'}} onClick={this._clickReturn}>
							<div>{this._retCnt}/{this._numOfStudent}</div>
						</div>
						<ToggleBtn className="btn_answer" view={this._prog >= SENDPROG.SENDED} disabled={this._prog === SENDPROG.COMPLETE} onClick={this._clickAnswer}/>
						<ToggleBtn className="btn_v_next" view={this._prog === SENDPROG.COMPLETE} onClick={this._onClose}/>
					</div>
					<SendUI
						view={this._prog < SENDPROG.SENDED}
						type={'teacher'}
						sended={false}
						originY={0}
						onSend={this._onSend}
					/>
				</div>
			</CoverPopup>
		);
	}
}

interface IVideoBox {
	view: boolean;
	state: IStateCtx;
	actions: IActionsCtx;
	data: common.IData;
	onClosed: () => void;
}
@observer
class VideoPopup extends React.Component<IVideoBox> {
	private _box!: HTMLElement;
	private _swiper: Swiper|null = null;
    private _player = new MPlayer(new MConfig(true));
    private _player_inittime = 0; // 비디오 시작시간 
	private _countdown = new TimerState(3);

	@observable private _view = false;
	@observable private _viewCaption = false;
	@observable private _curIdx: number = -1;
	@observable private _viewCountDown = false;
	@observable private _play = false;

	@observable private _vpop: POPUPTYPE = 'off';
	@observable private _study: POPUPTYPE = 'off';

	@observable private _yourturn = -1;

	private _checkupIdx = -1;
	private _curCheckup = -1;

	
	private _ytNext = -1;
	private _checkups: common.IScript[] = [];


	constructor(props: IVideoBox) {
        super(props);
        const scripts = props.data.scripts;
        const checkups = props.data.checkup;

        for(let i = 0; i < checkups.length; i++) {
            const checkup = checkups[i];
            for(let j = 0; j < scripts.length; j++) {
                const script = scripts[j];
                if(checkup.seq === script.checkup_num) {
                    this._checkups.push(script);
                }
            }
        }
        
        this._player_inittime = props.data.video_start;
	}

	private _onClose = () => {
		console.log('VideoBox close');
		this._view = false;
		this._player.gotoAndPause(this._player_inittime * 1000);
	}

	private _refBox = (el: HTMLElement | null) => {
		if (this._box || !el) return;
		this._box = el;
	}
	private _refSwiper = (el: SwiperComponent) => {
		if(this._swiper || !el) return;
		this._swiper = el.swiper;
	}

	private _refVideo = (el: HTMLMediaElement | null) => {
		if (!el) return;
		if (this._player.media) return;
		this._player.mediaInited(el as IMedia);

		// player.load(App.data_url + this.props.data.video);
		const scripts = this.props.data.scripts;
		this._player.addOnTime((time: number) => {
			time = time / 1000;
			const curIdx = _getCurrentIdx(scripts, time);
			if(this._curIdx !== curIdx) {
				if(this._study === 'SHADOWING') {
					if(this._yourturn < 0) {
						if(this._curIdx >= 0 && this._player.bPlay) {
							const msg: common.IMsgForIdx = {msgtype: 'view_yourturn',idx: this._curIdx,};
							felsocket.sendPAD($SocketType.MSGTOPAD, msg);
							this._ytNext = curIdx;
							
							const script = scripts[this._curIdx];
							const delay = (script.dms_end - script.dms_start) * 2000;

							// const ymsg: common.IMsg = {msgtype: 'view_yourturn'};
							// felsocket.sendPAD($SocketType.MSGTOPAD, ymsg);

							this._yourturn = _.delay(() => {
								if(this._yourturn >= 0) {
									this._player.play();
									this._curIdx = this._ytNext;
									this._yourturn = -1;

									const fmsg: common.IMsgForIdx = {msgtype: 'focusidx',idx: this._curIdx,};
									felsocket.sendPAD($SocketType.MSGTOPAD, fmsg);
									if(this._curIdx >= 0 && this._swiper) this._swiper.slideTo(this._curIdx === 0 ? 0 : this._curIdx - 1);
								}
							}, delay); 

							this._player.pause();

							return;
						} else if(this._player.bPlay) {
							const msg: common.IMsgForIdx = {msgtype: 'focusidx',idx: curIdx,};
							felsocket.sendPAD($SocketType.MSGTOPAD, msg);
						} else return;
					} else return;
				} else if(this._study === 'READALOUD') {
					const msg: common.IMsgForIdx = {msgtype: 'focusidx',idx: curIdx,};
					felsocket.sendPAD($SocketType.MSGTOPAD, msg);					
				}
				this._curIdx = curIdx;

				if(this._curIdx >= 0 && this._swiper) this._swiper.slideTo(this._curIdx === 0 ? 0 : this._curIdx - 1);
				// this.props.onChangeScript(curIdx);
			}
			if(this._study === 'CHECKUP' && this._player.bPlay) {
				let curCheckup = _getCurrentIdx(this._checkups, time);

				if(this._curCheckup !== curCheckup) {
					if(this._curCheckup >= 0) {
						this._player.pause();
						this._checkupIdx = this._curCheckup;
						this._vpop = 'CHECKUP';
					}
					this._curCheckup = curCheckup;
				}
			}			
		});

		this._player.addOnState((newState: MPRState, oldState: MPRState) => {
			if(this._study !== 'SHADOWING' && this._study !== 'READALOUD') return;

			let msgtype: 'playing'|'paused';
			if(this._study === 'SHADOWING' && this._yourturn >= 0) msgtype = 'playing';
			else if(this._viewCountDown) msgtype = 'playing';
			else if(newState !== MPRState.PAUSED && this._player.bPlay) msgtype = 'playing';
			else msgtype = 'paused';
			const msg: common.IMsg = {
				msgtype,
			};
			felsocket.sendPAD($SocketType.MSGTOPAD, msg);
		});
	}
	private _playClick = () => {
		this._play = !this._play;
		if(this._viewCountDown || this._study === 'SHADOWING') return;
		App.pub_playBtnTab();
		if(this._play) this._player.play();
		else if(!this._play) this._player.pause();
	}
	private _clickVideo = () => {
		if(this._viewCountDown || this._study === 'SHADOWING') return;
		if (this._player.bPlay) {
			App.pub_playBtnTab();
			this._player.pause();
		} else {
            App.pub_playBtnTab();
            if(this._player.currentTime >= this._player.duration || this._player.currentTime < this._player_inittime) this._player.seek(this._player_inittime * 1000);
            this._player.play();			
		}
	}
	private _toggleFullscreen = () => {
		App.pub_playBtnTab();
		if (document['fullscreenElement'] === this._box || document['webkitFullscreenElement'] === this._box) { 	// tslint:disable-line
			if (document.exitFullscreen) document.exitFullscreen();
			else if (document['webkitExitFullscreen']) document['webkitExitFullscreen'](); 	// tslint:disable-line
		} else {
			if (this._box.requestFullscreen) this._box.requestFullscreen();
			else if (this._box['webkitRequestFullscreen']) this._box['webkitRequestFullscreen'](); 	// tslint:disable-line
		}
	}
	private _prevClick = () => {
		if(this._viewCountDown) return;
		App.pub_playBtnTab();

		const yourturn = this._yourturn;
		if(this._yourturn >= 0) {
			clearTimeout(this._yourturn);
			this._yourturn = -1;
		}
		const scripts = this.props.data.scripts;
		const time = this._player.currentTime / 1000;

		let curIdx = -1;
		let bPlay = false;
		if(	this._study === 'SHADOWING' && yourturn >= 0) {	
			if( this._curIdx >= 0) curIdx = this._curIdx;

			bPlay = true;
		} else curIdx = _getCurrentIdx(scripts, time);


		this._curIdx = -1;
		this._curCheckup = -1;

		if(bPlay && !this._player.bPlay) this._player.play();
		if (curIdx >= 0) {
			if (curIdx > 0) {
                const script = scripts[curIdx - 1];
                if(this._player_inittime > script.dms_start) this._player.seek(this._player_inittime * 1000);
				else this._player.seek(script.dms_start * 1000);
			} else this._player.seek(this._player_inittime * 1000);
		} else {
			for (let len = scripts.length, i = len - 1; i >= 0; i--) {
				if (time > scripts[i].dms_start) {
                    if(this._player_inittime > scripts[i].dms_start) this._player.seek(this._player_inittime * 1000);
                    else this._player.seek(scripts[i].dms_start * 1000);
                    break;
				} else if (i === 0) {
					this._player.seek(this._player_inittime * 1000);
				}
			}
		}
	}
	private _nextClick = () => {
		if(this._viewCountDown) return;
		App.pub_playBtnTab();
		const yourturn = this._yourturn;
		if(this._yourturn >= 0) {
			clearTimeout(this._yourturn);
			this._yourturn = -1;
		}
		const scripts = this.props.data.scripts;
		const time = this._player.currentTime / 1000;

		let curIdx = -1;
		let bPlay = false;
		if(	this._study === 'SHADOWING' && yourturn >= 0) {	
			
			if(this._ytNext >= 0 ) curIdx = this._ytNext - 1;
			else if( this._curIdx >= 0) curIdx = this._curIdx;
			bPlay = true;
		} else curIdx = _getCurrentIdx(scripts, time);

		this._curIdx = -1;
		this._curCheckup = -1;

		if(bPlay && !this._player.bPlay) this._player.play();

		if (curIdx >= 0) {
			if (curIdx < scripts.length - 1) {
				const script = scripts[curIdx + 1];
				this._player.seek(script.dms_start * 1000);
			} else {
				this._player.seek(this._player.duration);
			}
		} else {
			for (let i = 0, len = scripts.length; i < len; i++) {
				if (time < scripts[i].dms_start) {
					this._player.seek(scripts[i].dms_start * 1000);
					break;
				} else if (i === len - 1) {
					this._player.seek(this._player.duration);
				}
			}
		}
    }
	private _toggleMute = () => {
		// if(this.props.roll !== '' || this.props.shadowing) return;
		App.pub_playBtnTab();
		this._player.setMuted(!this._player.muted);
	}
	private _togglePlay = () => {
		if(this._viewCountDown) return;
		App.pub_playBtnTab();

		const yourturn = this._yourturn;
		if(	this._yourturn >= 0) {
			clearTimeout(this._yourturn);
			this._yourturn = -1;
		} 
		if(this._study === 'SHADOWING') {
			if(yourturn >= 0) {
				if(this._player.bPlay) this._player.pause();
				return;
			} else {
				if(this._ytNext >= 0 ) this._curIdx = this._ytNext;
				this._ytNext = -1;
				const msg: common.IMsgForIdx = {msgtype: 'focusidx',idx: this._curIdx,};
				felsocket.sendPAD($SocketType.MSGTOPAD, msg);				
			}
		}


		if (this._player.bPlay) this._player.pause();
		else {
            // if(this._study === 'SHADOWING') this._curIdx = this._ytNext;
            if(this._player.currentTime >= this._player.duration || this._player.currentTime < this._player_inittime) this._player.seek(this._player_inittime * 1000);
            this._player.play();
            if(this._curIdx >= 0 && this._swiper) this._swiper.slideTo(this._curIdx === 0 ? 0 : this._curIdx - 1);
		}
	}
	private _clearStudy() {
		this._curIdx = -1;
		this._checkupIdx = -1;
		this._curCheckup = -1;

		if(this._study === 'off') return;
		if(	this._yourturn >= 0) {
			clearTimeout(this._yourturn);
			this._yourturn = -1;
		}
		this._viewCaption = false;
		this._countdown.pause();
		this._countdown.reset();
		this._viewCountDown = false;
		this._study = 'off';

		const msg: common.IMsg = {msgtype: 'v_dialogue_end',};
		felsocket.sendPAD($SocketType.MSGTOPAD, msg);
	
	}

	private _stopClick = () => {
        App.pub_playBtnTab();
        this._player.gotoAndPause(this._player_inittime * 1000);
        
        this._curIdx = -1;
        this._checkupIdx = -1;
        this._curCheckup = -1;

        if(this._study === 'off') return;
        if(	this._yourturn >= 0) {
            clearTimeout(this._yourturn);
            this._yourturn = -1;
        }
        // this._viewCaption = false;
        this._countdown.pause();
        this._countdown.reset();
        this._viewCountDown = false;
        // this._study = 'off';

        // const msg: common.IMsg = {msgtype: 'v_dialogue_end',};
        // felsocket.sendPAD($SocketType.MSGTOPAD, msg);
        
        // this.props.stopClick();
	}

	private _toggleCaption = () => {
		App.pub_playBtnTab();

		const sidx = (this._swiper) ? this._swiper.activeIndex : -1;

		this._viewCaption = !this._viewCaption;

		if(this._study === 'READALOUD' || this._study === 'SHADOWING') {
			/*
			if( sidx >= 0 && this._swiper) {
				this._swiper.update();
				if(this._swiper.scrollbar) this._swiper.scrollbar.updateSize();
				this._swiper.slideTo(sidx);

				_.delay(() => {
					if(this._swiper && this._player) {
						this._swiper.update();
						if(this._swiper.scrollbar) this._swiper.scrollbar.updateSize();
						this._swiper.slideTo(sidx);
					}
				}, 50);

			}
			*/
		}
	}

	private _countStart = () => {
		// console.log('_countStart');
	}
	private _countZero = async () => {
		this._viewCountDown = false;

		if(!this.props.view) return;

		await kutil.wait(300);
		if(!this.props.view) return;

		if(this._study === 'READALOUD' || this._study === 'SHADOWING') {
            if(this._player.currentTime !== this._player_inittime 
                || this._player.currentTime < this._player_inittime) this._player.seek(this._player_inittime * 1000);
            this._player.play();
            if(this._swiper) {
                this._swiper.update();
                if(this._swiper.scrollbar) this._swiper.scrollbar.updateSize();
            }
		}
		
	}
	public componentDidUpdate(prev: IVideoBox) {
		if (this.props.view && !prev.view) {
            this._view = true;

            if(this._player.myState <= MPRState.LOADING) {
                this._player.load(App.data_url + this.props.data.video);
            }
            this._player.setMuted(false);
            this._player.setMutedTemp(false);

            this._viewCaption = false;
            this._curIdx = -1;
            
            this._countdown.pause();
            this._countdown.reset();
            this._viewCountDown = false;

            this._vpop = 'off';
            this._yourturn = -1;
            this._ytNext = -1;

            this._study = 'off';

            this._checkupIdx = -1;
            this._curCheckup = -1;

            // felsocket.sendPAD($SocketType.PAD_ONSCREEN, null);
            if(this._player.currentTime < this._player_inittime) this._player.seek(this._player_inittime * 1000);
            this._player.play();
			
		} else if (!this.props.view && prev.view) {
			if(this._study !== 'off') {
				felsocket.sendPAD($SocketType.PAD_ONSCREEN, null);
			}
			this._view = false;
			this._player.gotoAndPause(this._player_inittime * 1000);

			this._vpop = 'off';
			this._viewCaption = false;
			this._curIdx = -1;
			
			this._countdown.pause();
			this._countdown.reset();
			this._viewCountDown = false;
			if(	this._yourturn >= 0) {
				clearTimeout(this._yourturn);
				this._yourturn = -1;
			}
			this._ytNext = -1;

			// 
			if(this._player.bPlay) {
				this._player.pause();
			}
		}

	}

	private _readaloudClick = () => {
		if(this._study === 'READALOUD') {
			App.pub_playBtnTab();
			this._clearStudy();
			this._player.pause();
		} else if(this._study === 'off' ) {
			App.pub_playBtnTab();
			this._vpop = 'READALOUD';
			this._player.pause();
			this.props.state.isVideoStudied = true;
		}
	}
	private _shadowingClick = () => {
		if(this._study === 'SHADOWING') {
			App.pub_playBtnTab();
			this._clearStudy();
			this._player.pause();
		} else if(this._study === 'off' ) {
			App.pub_playBtnTab();
			this._vpop = 'SHADOWING';
			this._player.pause();
			this.props.state.isVideoStudied = true;
		}
	}
	private _checkupClick = () => {
		// if(this._study === 'CHECKUP') {
		// 	App.pub_playBtnTab();
		// 	this._clearStudy();
		// 	this._player.pause();
		// } else if(this._study === 'off' ) {
		// 	App.pub_playBtnTab();
		// 	this._study = 'CHECKUP';
		// 	this._player.seek(0);
		// 	if(!this._player.bPlay) this._player.play();
		// 	felsocket.sendPAD($SocketType.PAD_ONSCREEN, null);
		// 	this.props.state.isVideoStudied = true;
        // }
        if(this._study === 'CHECKUP') {
			App.pub_playBtnTab();
			this._clearStudy();
			this._player.pause();
		} else if(this._study === 'CHECKUPSET') {
            App.pub_playBtnTab();
            this.props.state.isVideoStudied = false;
		} else if(this._study === 'off' ) {
            App.pub_playBtnTab();
            this._vpop = 'CHECKUPSET';
            this._player.pause();
            this.props.state.isVideoStudied = true;
        }
	}
	private _offVideo = () => {
        if(this._vpop === 'CHECKUP') {
        	const msg: common.IMsg = {msgtype: 'v_dialogue_end',};
        	felsocket.sendPAD($SocketType.MSGTOPAD, msg);			
        	this._player.play();
        }
        this._vpop = 'off';
	}
	private _onSend = async (type: POPUPTYPE) => {
        if(!this.props.view) return;
        else if(this._vpop !== type ) return;
        else if(this._vpop === 'off' ) return;

        if(this._vpop === 'CHECKUPSET') {
            App.pub_playBtnTab();
            await kutil.wait(300);
            this._study = 'CHECKUP';
            this._vpop = 'CHECKUP';
            this._player.seek(this._player_inittime * 1000);
            if(!this._player.bPlay) this._player.play();
            felsocket.sendPAD($SocketType.PAD_ONSCREEN, null);
        } else if(this._vpop === 'CHECKUP') {
            //
        } else {
            this._study = type;
            this._viewCaption = false;
            this._countdown.pause();
            this._countdown.reset();
            this._viewCountDown = true;
            this._viewCaption = true;
            this._countdown.start();
            this._player.seek(this._player_inittime * 1000);
            this._curIdx = -1;
            if(this._swiper) this._swiper.slideTo(0, 0);

            const msg: common.IMsg = {
                msgtype: 'playing',
            };
            felsocket.sendPAD($SocketType.MSGTOPAD, msg);			
        }
	}

	public render() {
		const {view, data, actions} = this.props;
		const scripts = data.scripts;
		let script;
		if(this._viewCaption && this._curIdx >= 0) script = scripts[this._curIdx];
		// const isOnRoll = roll === 'A' || roll === 'B';
		const viewLoading = this._study === 'off' && (this._player.myState === MPRState.BUFFERING || this._player.myState === MPRState.LOADING); // !isOnRoll && 제외
		const viewBtnPlay = this._study === 'off' && !this._player.bPlay;	// !isOnRoll && 제외
		const isPlay = ((this._study === 'SHADOWING' && this._yourturn >= 0) || this._player.bPlay); 	// || (shadowing && this.props.isShadowPlay)

		
		const isRAOrSD = (this._study === 'READALOUD' || this._study === 'SHADOWING');
		const isStudentTurn = (this._study === 'READALOUD' || (this._study === 'SHADOWING' && this._yourturn >= 0));

		return (
			<CoverPopup 
				className="video_popup" 
				view={this.props.view && this._view} 
				onClosed={this.props.onClosed} 
			>
				<div className="wrapper" ref={this._refBox}>
					<div className="video_box">
						<div className={'video ' + this._study}>
							<video controls={false} ref={this._refVideo} onClick={this._clickVideo} />
							
							<SwiperComponent
								ref={this._refSwiper}
								direction="vertical"
								scrollbar={{ el: '.swiper-scrollbar', draggable: true,}}
								observer={true}
								slidesPerView="auto"
								freeMode={true}						
							>
								{scripts.map((scr, idx) => {
									return (
										<div key={idx} className={'script' + (isPlay ? ' swiper-no-swiping' : '')}>
											<Script 
												key={idx}
												idx={idx}
												on={isRAOrSD && this._curIdx === idx}
												studentturn={isStudentTurn}
												script={scr}
												viewScript={isRAOrSD && this._viewCaption}
											/>
										</div>
									);
								})}
							</SwiperComponent>

							<Loading view={viewLoading} />
							{/*
								<ToggleBtn className="playbtn" view={viewBtnPlay} onClick={this._playClick} />
							*/}
							<CaptionBox 
								view={view}
								inview={!isRAOrSD && this._viewCaption} 
								script={script} 
							/>
							
							<CountDown2 state={this._countdown} view={this._viewCountDown} onStart={this._countStart}  onComplete={this._countZero}/>
						</div>
						<ControlBox
							player={this._player}
							disable={this._viewCountDown || this._study === 'SHADOWING'}
							vpop={this._vpop}
							study={this._study}
							isPlay={isPlay}
							checkups={this._checkups}
							toggleFullscreen={this._toggleFullscreen}
							togglePlay={this._togglePlay}
							stopClick={this._stopClick}
							prevClick={this._prevClick}
							nextClick={this._nextClick}
							viewCaption={this._viewCaption}
							toggleCaption={this._toggleCaption}
							toggleMute={this._toggleMute}
							readaloudClick={this._readaloudClick}
							shadowingClick={this._shadowingClick}
							checkupClick={this._checkupClick}
						/>
					</div>
					<VPopup 
						type={this._vpop} 
						data={data}
						checkupIdx={this._checkupIdx}
						actions={actions}
						onSend={this._onSend}
						onClosed={this._offVideo} 
					/>							
				
				</div>
				<ToggleBtn className="btn_back" onClick={this._onClose}/>
			</CoverPopup>
		);
	}
}
export default VideoPopup;
