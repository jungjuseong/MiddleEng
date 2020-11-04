import * as React from 'react';
import * as _ from 'lodash';
import { observer, Observer } from 'mobx-react';
import { observable, observe, _allowStateChangesInsideComputed } from 'mobx';
import { DraggableCore, DraggableData, DraggableEvent } from 'react-draggable';

import { MPlayer, MConfig, IMedia, MPRState } from '@common/mplayer/mplayer';
import { ToggleBtn } from '@common/component/button';

import { App } from '../../../App';
import { Loading } from '../../../share/loading';

import * as common from '../../common';

function _getCurrentIdx(scripts: common.IScriptWarmup[], time: number) {
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
		const {player } = this.props;
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
							<ToggleBtn className="prog_btn" style={{ left: btnLeft + '%' }} />
						</div>
					</DraggableCore>
				</div>
				<div className="video_time" style={{ width: (player.duration >= 600000 ? 100 : 115) + 'px' }}><span>{_getTimeStr(player.viewTime, player.duration)}</span> / <span>{_getTimeStr(player.duration, player.duration)}</span></div>
			</>
		);
	}
}

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
		const {player} = this.props;
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
export class CaptionBox extends React.Component<{view: boolean, script?: common.IScriptWarmup}> {
	@observable private _viewEng = true;
	@observable private _viewTrans = true;
	private _toggleEng = () => {
		this._viewEng = !this._viewEng;
	}
	private _toggleTrans = () => {
		this._viewTrans = !this._viewTrans;
	}
	public componentDidUpdate(prev: {view: boolean}) {
		if(this.props.view && !prev.view) {
			this._viewEng = true;
			this._viewTrans = true;
		}
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
			<div className="caption_box" style={{display: view ? '' : 'none'}}>
				<div className="caption_eng"><span>{eng}</span><ToggleBtn className="btn_eng" on={this._viewEng} onClick={this._toggleEng}/></div>
				{/* <div className="caption_trans"><span>{trans}</span><ToggleBtn className="btn_trans" on={this._viewTrans} onClick={this._toggleTrans}/></div> */}
			</div>
		);
	}
}

interface IVideoItem {
	view: boolean;
	player: MPlayer;
	data: common.IData;
	onZoomed?: () => void;
}
@observer
class WarmupVideo extends React.Component<IVideoItem> {
	
	private m_box!: HTMLElement;
	@observable private m_viewCaption = false;
    @observable private m_curIdx: number = -1;

    private _player_inittime = 0; // 비디오 시작시간 

    constructor(props: IVideoItem) {
        super(props);

        this._player_inittime = props.data.warmup_video_start;
    }
    
	private _refBox = (el: HTMLElement | null) => {
		if (this.m_box || !el) return;
		this.m_box = el;
	}

	private _refVideo = (el: HTMLMediaElement | null) => {
		if (!el) return;
		const { player } = this.props;
		if (player.media) return;
		player.mediaInited(el as IMedia);

		


		const scripts = this.props.data.warmup_scripts;
		player.addOnTime((time: number) => {
			time = time / 1000;
			const curIdx = _getCurrentIdx(scripts, time);
			// console.log('player.addOnTime', time, curIdx);
			if(this.m_curIdx !== curIdx) {
				this.m_curIdx = curIdx;
			}
		});
	}
	private _clickVideo = () => {
		const player = this.props.player;
		App.pub_playBtnTab();
		if (player.bPlay) {
			player.pause();
		} else {
            if(player.currentTime >= player.duration || player.currentTime < this._player_inittime) player.seek(this._player_inittime * 1000);
            player.play();
		}
	}
	private _toggleFullscreen = () => {
		App.pub_playBtnTab();
		if (document['fullscreenElement'] === this.m_box || document['webkitFullscreenElement'] === this.m_box) { 	// tslint:disable-line
			if (document.exitFullscreen) document.exitFullscreen();
			else if (document['webkitExitFullscreen']) document['webkitExitFullscreen'](); 	// tslint:disable-line
			if(this.props.onZoomed) this.props.onZoomed();
		} else {
			if (this.m_box.requestFullscreen) this.m_box.requestFullscreen();
			// tslint:disable-next-line:no-string-literal
			else if (this.m_box['webkitRequestFullscreen']) this.m_box['webkitRequestFullscreen']();
		}
	}
	private _prevClick = () => {
		App.pub_playBtnTab();

		this.m_curIdx = -1;
	
		const player = this.props.player;
		const scripts = this.props.data.warmup_scripts;
		const time = player.currentTime / 1000;
		const curIdx = _getCurrentIdx(scripts, time);
		if (curIdx >= 0) {
			if (curIdx > 0) {
                const script = scripts[curIdx - 1];
                if(this._player_inittime > script.dms_start) player.seek(this._player_inittime * 1000);
                else player.seek(script.dms_start * 1000);
			} else player.seek(this._player_inittime * 1000);
		} else {
			for (let len = scripts.length, i = len - 1; i >= 0; i--) {
				if (time > scripts[i].dms_start) {
                    if(this._player_inittime > scripts[i].dms_start) player.seek(this._player_inittime * 1000);
                    else player.seek(scripts[i].dms_start * 1000);
                    break;
				} else if (i === 0) {
					player.seek(this._player_inittime * 1000);
				}
			}
		}
	}
	private _nextClick = () => {
		App.pub_playBtnTab();
		this.m_curIdx = -1;
		const player = this.props.player;
		const scripts = this.props.data.warmup_scripts;
		const time = player.currentTime / 1000;
		const curIdx = _getCurrentIdx(scripts, time);

		if (curIdx >= 0) {
			if (curIdx < scripts.length - 1) {
				const script = scripts[curIdx + 1];
				player.seek(script.dms_start * 1000);
			} else {
				player.seek(player.duration);
			}
		} else {
			for (let i = 0, len = scripts.length; i < len; i++) {
				if (time < scripts[i].dms_start) {
					player.seek(scripts[i].dms_start * 1000);
					break;
				} else if (i === len - 1) {
					player.seek(player.duration);
				}
			}
		}
	}
	private _toggleMute = () => {
		App.pub_playBtnTab();
		const player = this.props.player;
		player.setMuted(!player.muted);
	}
	private _togglePlay = () => {
		App.pub_playBtnTab();

		const player = this.props.player;
		if (player.bPlay) player.pause();
		else {
            if(player.currentTime >= player.duration || player.currentTime < this._player_inittime) player.seek(this._player_inittime * 1000);
            player.play();
        }
	}
	private _stopClick = () => {
		App.pub_playBtnTab();
		this.props.player.gotoAndPause(this._player_inittime * 1000);
		// this.props.stopClick();
	}

	private _toggleCaption = () => {
		App.pub_playBtnTab();
		this.m_viewCaption = !this.m_viewCaption;
	}
	public componentDidUpdate(prev: IVideoItem) {
		const { player, view} = this.props;

		if(view && !prev.view) {
			if(player.myState < MPRState.LOADING) player.load(App.data_url + this.props.data.warmup_video);
			if(player.bPlay) player.pause();
			this.m_curIdx = -1;
			player.seek(this._player_inittime * 1000);
		} else if(!view && prev.view) {
			if(player.bPlay) player.pause();
			this.m_curIdx = -1;
			player.seek(this._player_inittime * 1000);
		}

	}
	public render() {
		const { player, data} = this.props;
		const scripts = data.warmup_scripts;
		let script;
		if(this.m_viewCaption && this.m_curIdx >= 0) script = scripts[this.m_curIdx];
		const viewLoading = (player.myState === MPRState.BUFFERING || player.myState === MPRState.LOADING);
		const viewBtnPlay = !player.bPlay;

		const isPlay = player.bPlay;

		return (
			<div className="video_box" ref={this._refBox}>
				<div className="video">
					<video controls={false} ref={this._refVideo} onClick={this._clickVideo} />
					<Loading view={viewLoading} />
					<CaptionBox view={this.m_viewCaption} script={script} />
				</div>
				<ControlBox
					player={player}
					disable={false}
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
export default WarmupVideo;