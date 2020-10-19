import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { observable, action } from 'mobx';
import { observer } from 'mobx-react';

import * as _ from 'lodash';

import { DraggableCore, DraggableData, DraggableEvent } from 'react-draggable';
import { App } from '../App';
import * as StrUtil from '@common/util/StrUtil';
import * as kutil from '@common/util/kutil';

import { ToggleBtn } from '@common/component/button';
import { MPlayer, MConfig, MPRState, IMedia } from '@common/mplayer/mplayer';

@observer
class ProgBox  extends React.Component<{player: MPlayer}> {
	private m_dragging = false;
	private m_bg!: HTMLElement;
	private m_bgW = 0;
	private m_s = 0;
	@observable private m_dragLeft = 0;
	private m_dragLeft_s = 0;
	

	private _seek = _.throttle((percent: number) => {
		const player = this.props.player;

		player.seek(player.duration * percent / 100 );
	}, 300, {leading: false});

	private _refBG = (el: HTMLElement|null) => {
		if(this.m_bg || !el) return;
		this.m_bg = el;
	}

	private _start = (evt: DraggableEvent, data: DraggableData) => {
		if(!this.m_bg) return;
		const player = this.props.player;
		if(player.duration <= 0) return;

		this.m_bgW = this.m_bg.getBoundingClientRect().width;
		if(this.m_bgW <= 0) return;
		let left = 100 * data.x / this.m_bgW;
		if(left < 0) left = 0;
		else if(left > 100) left = 100;
		this.m_dragLeft_s = left;
		this.m_dragLeft = left;
		this.m_s = data.x;
		this.m_dragging = true;
	}
	private _drag = (evt: DraggableEvent, data: DraggableData) => {
		if(!this.m_dragging) return;
		let left = this.m_dragLeft_s + 100 * (data.x - this.m_s) / this.m_bgW;
		if(left < 0) left = 0;
		else if(left > 100) left = 100;
		this.m_dragLeft = left;

		const player = this.props.player;
		if(!player.bPlay) this._seek(left);
	}
	private _stop = (evt: DraggableEvent, data: DraggableData) => {
		if(!this.m_dragging) return;
		this.m_dragging = false;
		const player = this.props.player;
		player.seek(player.duration * this.m_dragLeft / 100 );
	}

	public render() {
		const player = this.props.player;
		let percent = 0;
		if(player.duration > 0) {
			percent = (player.viewTime / player.duration) * 100;
		}
		let btnLeft = 0;
		let dragLeft = this.m_dragLeft;
		if(this.m_dragging) btnLeft = dragLeft;
		else btnLeft = percent;

		return (
			<div className="prog_box">
				<DraggableCore
					onDrag={this._drag}
					onStart={this._start}
					onStop={this._stop}
				>
					<div className="prog_bg" ref={this._refBG}>
						<div className="prog_bar" style={{width: percent + '%'}}/>
						<ToggleBtn className="prog_btn" style={{left: btnLeft + '%'}}/>
					</div>
				</DraggableCore>
			</div>
			
		);
	}
}

interface IPlayerUI {
	className: string;
	url: string;
	onFullscreen: () => void;
	onPlayChange: (isPlay: boolean) => void;
}

@observer
export class PlayerUI  extends React.Component<IPlayerUI> {
	private m_box?: HTMLDivElement;
	private m_player = new MPlayer(new MConfig(true));
	@observable private m_fullscreen = false;
	private _playToggle = () => {
		const player = this.m_player;
		if(player.bPlay) return;
		App.pub_playBtnTab();
		player.play();

		this.props.onPlayChange(true);
		
	}
	private _stopClick = () => {
		const player = this.m_player;
		if(!player.bPlay) return;
		App.pub_playBtnTab();
		player.pause();
		this.props.onPlayChange(false);
	}
	private _toggleFullscreen = () => {
		if(!this.m_box) return; 
		App.pub_playBtnTab();
		const box = this.m_box;

		if(document['fullscreenElement'] === box || document['webkitFullscreenElement'] === box) { // tslint:disable-line
			if(document.exitFullscreen) document.exitFullscreen();
			else if(document['webkitExitFullscreen']) document['webkitExitFullscreen']();       // tslint:disable-line
		} else {
			if(box.requestFullscreen) box.requestFullscreen();
			else if(box['webkitRequestFullscreen']) box['webkitRequestFullscreen']();   // tslint:disable-line
		}

	}
	private _refVideo = (el: HTMLVideoElement|null) => {
		if(this.m_player.media || !el) return;
		this.m_player.mediaInited(el as IMedia);	
	}
	private _refBox = (el: HTMLDivElement|null) => {
		if(this.m_box || !el) return;
		this.m_box = el;
	}
	public componentDidUpdate(prev: IPlayerUI) {
		if(this.props.url !== prev.url) {
			this.props.onPlayChange(false);
			this.m_player.unload();
			if(this.props.url !== '') {
				_.delay(() => {
					this.m_player.load(this.props.url);
				}, 300);
			}
		}
	}
	public render() {
		const player = this.m_player;
		return (
			<div ref={this._refBox} className={this.props.className}>
				<video ref={this._refVideo} controls={false}/>
				<div className="control">
					<div className="control_left">
						<ToggleBtn className="btn_play_pause" on={player.bPlay} onClick={this._playToggle}/>
						<ToggleBtn className="btn_stop" onClick={this._stopClick}/>
					</div>
					<div className="control_top">
						<ProgBox player={this.m_player}/>
					</div>
					<div className="video_time" style={{width: (player.duration >= 600000 ? 110 : 95) * (this.m_fullscreen ? 1.2 : 1) + 'px'}}><span>{kutil.getTimeStr(player.viewTime, player.duration)}</span> / <span>{kutil.getTimeStr(player.duration, player.duration)}</span></div>
					<div className="control_right">
						<ToggleBtn className="btn_fullscreen" onClick={this._toggleFullscreen}/>
					</div>
				</div>
			</div>
		);
	}
}