import { observable, action } from 'mobx';
import { App, IMain } from '../App';
import * as felsocket from '../felsocket';

export type VIEWDIV = 'direction'|'content';

export interface IStateBase {
	viewDiv: VIEWDIV;
	directionON: boolean;
	navi: {
		view: boolean,
		enableLeft: boolean,
		enableRight: boolean,		
	};
	svg_bg: {
		view: boolean,
		bPlay: boolean,
		viewCharactor: boolean,
	};
	retCnt: number;
	numOfStudent: number;
}
export interface IActionsBase {
	onDirectionEndStart: () => void;
	onDirectionEnded: () => void;
	setNaviView: (view: boolean) => void;
	setNavi: (enableLeft: boolean, enableRight: boolean) => void;
	setNaviFnc: (naviLeft: (() => void) | null, naviRight: (() => void) | null) => void;
	naviLeft: () => void;
	naviRight: () => void;

	setRetCnt: (cnt: number) => void;
	setNumOfStudent: (num: number) => void;
}

export abstract class TeacherContextBase implements IMain {
	private _naviLeftFnc: (() => void)|null = null;
	private _naviRightFnc: (() => void)|null = null;

	@observable public state: IStateBase = {
		viewDiv: 'direction',
		directionON: false,
		navi: {
			view: false,
			enableLeft: false,
			enableRight: false,		
		},
		svg_bg: {
			view: true,
			bPlay: false,
			viewCharactor: true,
		},
		retCnt: 0,
		numOfStudent: 0,
	};

	public actions: IActionsBase = {
		/* Direction animatiton 완료후 호출됨 */
		onDirectionEndStart: () => {
			if(this.state.viewDiv === 'direction') {
				felsocket.sendPAD($SocketType.PAD_END_DIRECTION, null);
			}
		},
		onDirectionEnded: () => {
			if(this.state.viewDiv === 'direction') {
				this._setViewDiv('content');
			}

			App.isStarted = true;
		},

		setNaviView: (view: boolean) => {
			this.state.navi.view = view;
		},
		setNavi: (enableLeft: boolean, enableRight: boolean) => {
			this.state.navi.enableLeft = enableLeft;
			this.state.navi.enableRight = enableRight;	
		},
		setNaviFnc: (naviLeft: (() => void) | null, naviRight: (() => void) | null) => {
			this._naviLeftFnc = naviLeft;
			this._naviRightFnc = naviRight;
		},

		/* Navigation 좌 버튼 클릭시 */
		naviLeft: () => {
			if(this.state.viewDiv === 'direction') {
				felsocket.sendLauncher($SocketType.GOTO_PREV_BOOK, null);
			} else {
				App.pub_playBtnPage();

				if(this._naviLeftFnc) this._naviLeftFnc();
				else this._setViewDiv('direction');
			}
		},
		/* Navigation 우 버튼 클릭시 */
		naviRight: () => {
			if(this.state.viewDiv === 'direction') {
				App.pub_playBtnPage();
				this.state.directionON = false;
			} else {
				App.pub_playBtnPage();
				if(this._naviRightFnc) this._naviRightFnc();
				else felsocket.sendLauncher($SocketType.GOTO_NEXT_BOOK, null);
			}
		},
		setRetCnt: (cnt: number) => {
			if(cnt > this.state.numOfStudent) cnt = this.state.numOfStudent;
			this.state.retCnt = cnt;
		},
		setNumOfStudent: (num: number) => {this.state.numOfStudent = num;},
	};

	@action protected _setViewDiv(viewDiv: VIEWDIV) {
		if(this.state.viewDiv !== viewDiv) {
			App.pub_stop();
			if(viewDiv === 'direction') {
				this.state.directionON = true;
				this.state.svg_bg.bPlay = true;
				this.state.svg_bg.viewCharactor = true;


				felsocket.sendLauncher($SocketType.TOP_TITLE_HIDE, null);
				felsocket.sendPAD($SocketType.PAD_START_DIRECTION, null);
				this.state.navi.view = true;
				this.state.navi.enableLeft = App.prevBook;
				this.state.navi.enableRight = true;
				this._naviLeftFnc = null;
				this._naviRightFnc = null;

			} else {
				this.state.directionON = false;
				this.state.svg_bg.bPlay = false;
				this.state.svg_bg.viewCharactor = false;

				felsocket.sendLauncher($SocketType.TOP_TITLE_VIEW, null);
				felsocket.sendPAD($SocketType.PAD_ONSCREEN, null);
			}
			this._naviLeftFnc = null;
			this._naviRightFnc = null;
			this.state.numOfStudent = 0;
			this.state.retCnt = 0;
			this.state.viewDiv = viewDiv;
			// this.setState({viewDiv, directionON, btnView, svg_bg});
		}
	}

	/* ../index.tsx  한 번만 실행 */
	@action public start() {
		if(this.state.viewDiv === 'direction') {
			this.state.directionON = true;
			this.state.navi.view = true;
			this.state.navi.enableLeft = App.prevBook;
			this.state.navi.enableRight = true;

			this.state.svg_bg.bPlay = true;
			felsocket.sendLauncher($SocketType.TOP_TITLE_HIDE, null);
			felsocket.sendPAD($SocketType.PAD_START_DIRECTION, null);
			// console.log('tcontext start App.isStarted', App.isStarted);
		}
	}
	public receive(data: ISocketData) {
		// console.log('Base Receive', data);
		//
	}

	public uploaded(url: string) {
		//
	}
	public notify(type: string) {
		//
	}
	public notifyRecorded(url: string) {
		//
	}
	public notifyVideoRecord(url: string) {
		//
	}
	public abstract setData(data: any): void;
}