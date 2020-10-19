import { observable, action } from 'mobx';
import { App, IMain } from '../App';
import * as felsocket from '../felsocket';

export type VIEWDIV = 'direction'|'eyeon'|'content';
export interface IStateBase {
	viewDiv: VIEWDIV;
	directionON: boolean;
	loading: boolean;
	goodjob: boolean;
	likeSet: {on: boolean, id: string};
	likeSoundOff: boolean;
	svg_bg: {
		view: boolean,
		bPlay: boolean,
		viewCharactor: boolean,
	};
}
export interface IActionsBase {
	startGoodJob: () => void;
	goodjobComplete: () => void;
	setLoading: (loading: boolean) => void;
}
export abstract class StudentContextBase implements IMain {
	@observable public state: IStateBase = {
		viewDiv: 'direction' as VIEWDIV,
		directionON: false,
		loading: false,
		goodjob: false,
		likeSet: {on: false, id: ''},
		likeSoundOff: false,
		svg_bg: {
			view: true,
			bPlay: false,
			viewCharactor: true,
		},
	};
	public actions: IActionsBase = {
		startGoodJob: () => {
			this.state.goodjob = true;
		},
		goodjobComplete: () => {
			this.state.goodjob = false;
		},

		setLoading: (loading: boolean) => {
			this.state.loading = loading;
		},
	};

	@action protected _setViewDiv(viewDiv: VIEWDIV) {
		if(this.state.viewDiv !== viewDiv) {
			App.pub_stop();
			if(viewDiv === 'direction') {
				this.state.directionON = true;

				this.state.svg_bg.bPlay = true;
				this.state.svg_bg.viewCharactor = true;
			} else {
				this.state.directionON = false;
				this.state.svg_bg.bPlay = false;
				this.state.svg_bg.viewCharactor = false;
			}
			this.state.loading = false;
			this.state.goodjob = false;
			this.state.likeSet.on  = false;
			this.state.likeSet.id  = '';
			this.state.viewDiv = viewDiv;
		}
	}
	public start() {
		//
	}
	@action public receive(data: ISocketData) {
		switch(data.type) {
		case $SocketType.PAD_START_DIRECTION:
			if(this.state.viewDiv === 'direction') {
				this.state.directionON = true;
				this.state.svg_bg.bPlay = true;
				this.state.svg_bg.viewCharactor = true;
			} else this._setViewDiv('direction');
			break;
		case $SocketType.PAD_END_DIRECTION:
			this.state.directionON = false;
			break;
		case $SocketType.PAD_ONSCREEN:
			this._setViewDiv('eyeon');
			break;
		case $SocketType.LIKE_SET:
			const lmsg = data.data as ILikeSetMsg;
			if(this.state.viewDiv === 'content') {
				this.state.likeSet.on  = lmsg.on;
				this.state.likeSet.id  = lmsg.id;
			}
			this.state.likeSoundOff = false;
			break;
		case $SocketType.LIKE_SOUND_OFF:
			this.state.likeSoundOff = true;
			break;
		case $SocketType.LIKE_SOUND_ON:
			this.state.likeSoundOff = false;
			break;
		default:
			break;
		}
	}
	public uploaded = (url: string) => {
		//
	}
	public notify = (type: string) => {
		//
	}
	public notifyRecorded = (url: string) => {
		//
	}
	public notifyVideoRecord = (url: string) => {
		//
	}
	public abstract setData(data: any): void;
}