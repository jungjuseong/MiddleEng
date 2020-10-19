import * as React from 'react';
import * as ReactDOM from 'react-dom';
import * as _ from 'lodash';
import { observer, Observer } from 'mobx-react';
import { observable, observe } from 'mobx';
import { DraggableCore, DraggableData, DraggableEvent } from 'react-draggable';

import { MPlayer, MConfig, IMedia, MPRState } from '@common/mplayer/mplayer';

import { ToggleBtn } from '@common/component/button';

import { App } from '../../App';
import { Loading } from '../../share/loading';
import { CountDown2, TimerState } from '../../share/Timer';

import Yourturn from '../../share/yourturn';


import * as common from '../common';

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
class ProgBox extends React.Component<{ player: MPlayer, disable: boolean }> {
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
		const player = this.props.player;
		let percent = 0;
		if (player.duration > 0) {
			percent = (player.viewTime / player.duration) * 100;
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
							<ToggleBtn className="prog_btn" style={{ left: btnLeft + '%' }} />
						</div>
					</DraggableCore>
				</div>
				<div className="video_time" style={{ width: (player.duration >= 600000 ? 110 : 105) + 'px' }}><span>{_getTimeStr(player.viewTime, player.duration)}</span> / <span>{_getTimeStr(player.duration, player.duration)}</span></div>
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
	isPlay: boolean;
	toggleMute: () => void;
	toggleFullscreen: () => void;
	toggleCaption: () => void;
	togglePlay: () => void;
	stopClick: () => void;

	prevClick: () => void;
	nextClick: () => void;
}
@observer
class ControlBox extends React.Component<IControlBox> {
	public render() {
		const player = this.props.player;
		return (
			<div className="control">
				<div className="control_left">
					<ToggleBtn className="btn_play_pause" on={this.props.isPlay} onClick={this.props.togglePlay} />
					<ToggleBtn className="btn_stop" onClick={this.props.stopClick} />
					<ToggleBtn className="btn_prev" onClick={this.props.prevClick} />
					<ToggleBtn className="btn_next" onClick={this.props.nextClick} />
				</div>
				<div className="control_top">
					<div>
						<ProgBox player={player} disable={this.props.disable}/>
					</div>
				</div>
				{/* btn_subscript, btn_audio 추가*/}
				<div className="control_right">
					<ToggleBtn className="btn_subscript" on={this.props.viewCaption} onClick={this.props.toggleCaption} />
					<ToggleBtn className="btn_audio" onClick={this.props.toggleMute} on={player.muted} />
					<ToggleBtn className="btn_fullscreen" onClick={this.props.toggleFullscreen} />
					<ToggleBtn className="btn_fullscreen_off" onClick={this.props.toggleFullscreen} />
				</div>
			</div>
		);
	}
}

@observer
export class CaptionBox extends React.Component<{view: boolean, script?: common.IScript}> {
	@observable private _viewEng = true;
	@observable private _viewTrans = true;
	private _toggleEng = () => {
		this._viewEng = !this._viewEng;
	}
	private _toggleTrans = () => {
		this._viewTrans = !this._viewTrans;
	}	
	public render() {
		const {view, script} = this.props;
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
			<div className="caption_box" style={{display: this.props.view ? '' : 'none'}}>
				<div className="caption_eng"><span>{eng}</span><ToggleBtn className="btn_eng" on={this._viewEng} onClick={this._toggleEng}/></div>
				{/* <div className="caption_trans"><span>{trans}</span><ToggleBtn className="btn_trans" on={this._viewTrans} onClick={this._toggleTrans}/></div> */}
			</div>
		);
	}
}
interface IVideoBox {
    player: MPlayer;
    playerInitTime: number;  // 비디오 시작시간
	data: common.IData;
	roll: ''|'A'|'B';
	shadowing: boolean;
	countdown: TimerState;
	isShadowPlay: boolean;
	setShadowPlay: (val: boolean) => void;
	compDiv: 'COMPREHENSION'|'DIALOGUE';
	stopClick: () => void;
	onChangeScript: (idx: number) => void;
}
@observer
class VideoBox extends React.Component<IVideoBox> {
	private m_box!: HTMLElement;
	@observable private m_viewCaption = false;
	@observable private m_curIdx: number = -1;
	@observable private m_viewCountDown = false;
	@observable private m_yourturn = -1;
	@observable private m_ytNext = -1;

	private _refBox = (el: HTMLElement | null) => {
        if (this.m_box || !el) return;
        this.m_box = el;
	}

	private _refVideo = (el: HTMLMediaElement | null) => {
		if (!el) return;
		const { player } = this.props;
		if (player.media) return;
		player.mediaInited(el as IMedia);

		player.load(App.data_url + this.props.data.video);
		const scripts = this.props.data.scripts;
		player.addOnTime((time: number) => {
			time = time / 1000;
			const curIdx = _getCurrentIdx(scripts, time);
			if(this.m_curIdx !== curIdx) {
				if(this.props.shadowing) {
					if(this.m_yourturn < 0) {
						if(this.m_curIdx >= 0) {
                            this.m_ytNext = curIdx;
                            player.pause();
                            const script = scripts[this.m_curIdx];
                            const delay = (script.dms_end - script.dms_start) * 2000;
                            this.m_yourturn = _.delay(() => {
                                if(this.m_yourturn >= 0 && this.props.isShadowPlay) {
                                    this.m_curIdx = this.m_ytNext;
                                    this.m_yourturn = -1;
                                    player.play();
                                }
                            }, delay); 
                            return;
						}
					} else {
						return;
					}

				}	
				this.m_curIdx = curIdx;
				this.props.onChangeScript(curIdx);
			}
		});
	}
	private _playClick = () => {
		if(this.m_viewCountDown || this.props.shadowing) return;
		App.pub_playBtnTab();
		this.props.player.play();
	}
	private _clickVideo = () => {
		if(this.m_viewCountDown || this.props.shadowing) return;
		const player = this.props.player;
		if (player.bPlay) {
			App.pub_playBtnTab();
			player.pause();
		} else {
            App.pub_playBtnTab();
            if(player.currentTime >= player.duration || player.currentTime < this.props.playerInitTime) player.seek(this.props.playerInitTime * 1000);
            player.play();			
		}
	}
	private _toggleFullscreen = () => {
		App.pub_playBtnTab();
		if (document['fullscreenElement'] === this.m_box || document['webkitFullscreenElement'] === this.m_box) { 	// tslint:disable-line
			if (document.exitFullscreen) document.exitFullscreen();
			else if (document['webkitExitFullscreen']) document['webkitExitFullscreen'](); 	// tslint:disable-line
		} else {
			if (this.m_box.requestFullscreen) this.m_box.requestFullscreen();
			else if (this.m_box['webkitRequestFullscreen']) this.m_box['webkitRequestFullscreen'](); 	// tslint:disable-line
		}
	}
	private _prevClick = () => {
		if(this.m_viewCountDown) return;
		App.pub_playBtnTab();

		this.m_curIdx = -1;
		if(	this.m_yourturn >= 0) {
			
			clearTimeout(this.m_yourturn);
			this.m_yourturn = -1;
		}					
	
		const player = this.props.player;
		const scripts = this.props.data.scripts;
		const time = player.currentTime / 1000;
		const curIdx = _getCurrentIdx(scripts, time);
		if (curIdx >= 0) {
			if (curIdx > 0) {
                const script = scripts[curIdx - 1];
                if(this.props.playerInitTime > script.dms_start) player.seek(this.props.playerInitTime * 1000);
				else player.seek(script.dms_start * 1000);
			} else player.seek(this.props.playerInitTime * 1000);
		} else {
			for (let len = scripts.length, i = len - 1; i >= 0; i--) {
				if (time > scripts[i].dms_start) {
					if(this.props.playerInitTime > scripts[i].dms_start) player.seek(this.props.playerInitTime * 1000);
				    else player.seek(scripts[i].dms_start * 1000);
					break;
				} else if (i === 0) {
					player.seek(this.props.playerInitTime * 1000);
				}
			}
		}
		if(this.props.shadowing) {
			if (this.props.isShadowPlay) player.play();
			else player.pause();
		}
	}
	private _nextClick = () => {
		if(this.m_viewCountDown) return;
		App.pub_playBtnTab();
		this.m_curIdx = -1;
		if(	this.m_yourturn >= 0) {
			clearTimeout(this.m_yourturn);
			this.m_yourturn = -1;
		}
		const player = this.props.player;
		const scripts = this.props.data.scripts;
		const time = player.currentTime / 1000;
		const curIdx = _getCurrentIdx(scripts, time);

		if (curIdx >= 0) {
			if (curIdx < scripts.length - 1) {
				const script = scripts[curIdx + 1];
				player.seek(script.dms_start * 1000);
			} else {
				this.props.setShadowPlay(false);
				player.seek(player.duration);
			}
		} else {
			for (let i = 0, len = scripts.length; i < len; i++) {
				if (time < scripts[i].dms_start) {
					player.seek(scripts[i].dms_start * 1000);
					break;
				} else if (i === len - 1) {
					// console.log('a->next', this.m_shadowPlay, this.props.shadowing);
					this.props.setShadowPlay(false);
					player.seek(player.duration);
				}
			}
		}
		// console.log('next', this.m_shadowPlay, this.props.shadowing);
		if(this.props.shadowing) {
			
			if (this.props.isShadowPlay) player.play();
			else player.pause();
		}

	}
	private _toggleMute = () => {
		if(this.props.roll !== '' || this.props.shadowing) return;

		App.pub_playBtnTab();
		const player = this.props.player;
		player.setMuted(!player.muted);
	}
	private _togglePlay = () => {
		if(this.m_viewCountDown) return;
		App.pub_playBtnTab();


		const player = this.props.player;
		if(	this.m_yourturn >= 0) {
			this.m_curIdx = this.m_ytNext;
			clearTimeout(this.m_yourturn);
			this.m_yourturn = -1;
		}
		if(this.props.shadowing) {
			let isShadowPlay = !this.props.isShadowPlay;
			this.props.setShadowPlay(isShadowPlay);

			if (isShadowPlay) player.play();
			else player.pause();
		} else {
			if (player.bPlay) player.pause();
			else {
                if(player.currentTime >= player.duration || player.currentTime < this.props.playerInitTime) player.seek(this.props.playerInitTime * 1000);
                player.play();
            }
		}
	}
	private _stopClick = () => {
        App.pub_playBtnTab();
        this.props.player.gotoAndPause(this.props.playerInitTime * 1000);
        if(	this.m_yourturn >= 0) {
            
            clearTimeout(this.m_yourturn);
            this.m_yourturn = -1;
        }
        this.props.stopClick();
	}

	private _toggleCaption = () => {
		App.pub_playBtnTab();
		this.m_viewCaption = !this.m_viewCaption;
	}
	private _countStart = () => {
		// console.log('_countStart');
	}
	private _countZero = () => {
        const { player, data, roll, shadowing} = this.props;
        this.m_viewCountDown = false;
        if(roll === '') return;

        if(player.currentTime !== this.props.playerInitTime 
            || player.currentTime < this.props.playerInitTime) player.seek(this.props.playerInitTime * 1000);
        player.play();
		
	}
	public componentDidUpdate(prev: IVideoBox) {
		const { player, data, roll, shadowing} = this.props;
		if(this.props.compDiv !== prev.compDiv) {
			this.m_curIdx = -1;
			this.m_viewCountDown = false;
			if(	this.m_yourturn >= 0) {
				clearTimeout(this.m_yourturn);
				this.m_yourturn = -1;
			}
			this.props.setShadowPlay(false);
		}
		if(this.props.roll !== prev.roll) {
			if(	this.m_yourturn >= 0) {
				clearTimeout(this.m_yourturn);
				this.m_yourturn = -1;
			}
			this.props.setShadowPlay(false);
			if(this.props.roll === '') {
				player.pause();
				
				this.props.countdown.pause();
				this.props.countdown.reset();
				this.m_viewCountDown = false;
				
			} else {
                if(player.currentTime !== this.props.playerInitTime 
                    || player.currentTime < this.props.playerInitTime) player.seek(this.props.playerInitTime * 1000);
                this.m_curIdx = -1;
                player.pause();
                player.setMuted(false);
                this.m_viewCountDown = true;
                this.props.countdown.reset();
                this.props.countdown.start();
			}
		}
		if(this.props.shadowing !== prev.shadowing) {
			if(	this.m_yourturn >= 0) {
				clearTimeout(this.m_yourturn);
				this.m_yourturn = -1;
			}
			
			this.props.setShadowPlay(this.props.shadowing);

			if(this.props.shadowing) {
                if(player.currentTime !== this.props.playerInitTime 
                    || player.currentTime < this.props.playerInitTime) player.seek(this.props.playerInitTime * 1000);
                this.m_curIdx = -1;
                player.play();
                
                player.setMuted(false);
			} else {
				player.pause();
			}
		}
	}
	public render() {
		const { player, data, roll, shadowing, isShadowPlay} = this.props;
		const scripts = data.scripts;
		let script;
		if(this.m_viewCaption && this.m_curIdx >= 0) script = scripts[this.m_curIdx];
		const isOnRoll = roll === 'A' || roll === 'B';
		const viewLoading = !isOnRoll && !shadowing && (player.myState === MPRState.BUFFERING || player.myState === MPRState.LOADING);
		const viewBtnPlay = !isOnRoll && !shadowing && !player.bPlay;

		const isPlay = (!shadowing && player.bPlay) || (shadowing && this.props.isShadowPlay);

		return (
			<div className="video_box" ref={this._refBox}>
				<div className="video">
					<video controls={false} ref={this._refVideo} onClick={this._clickVideo} />
					<Loading view={viewLoading} />
					{/* <ToggleBtn className="playbtn" view={viewBtnPlay} onClick={this._playClick} /> */}
					<CaptionBox view={this.m_viewCaption} script={script} />
					<CountDown2 state={this.props.countdown} view={this.m_viewCountDown} onStart={this._countStart}  onComplete={this._countZero}/>

					<Yourturn 
						className="yourturn" 
						view={this.m_yourturn >= 0 && isShadowPlay}
						start={this.m_yourturn >= 0}
					/>
				</div>
				<ControlBox
					player={player}
					disable={this.m_viewCountDown || shadowing}
					isPlay={isPlay}
					toggleFullscreen={this._toggleFullscreen}
					togglePlay={this._togglePlay}
					stopClick={this._stopClick}
					prevClick={this._prevClick}
					nextClick={this._nextClick}
					viewCaption={this.m_viewCaption}
					toggleCaption={this._toggleCaption}
					toggleMute={this._toggleMute}
				/>
			</div>
		);
	}
}
export default VideoBox;