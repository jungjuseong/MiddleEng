import * as React from 'react';
import { observe, observable, computed } from 'mobx';

const enum ScaleMode {
	STRETCH		= 'stretch',
	LETTERBOX 	= 'letterbox',
}
const enum Preload {
	NONE = 'none',
	METADATA = 'metadata',
	AUTO = 'auto',
}
const enum ScriptLang {
	ORGIN = 'origin',
	TRANS = 'trans',
	ALL = 'all',
	NONE = 'none',
}
const enum MPRState {
	UNINITIALIZED,
	LOADING,
	PLAYBACK_ERROR,
	READY,
	STANDBY,
	BUFFERING,
	PAUSED,
	PLAYING,
}
const enum Direction {
	UNSET = -1,
	CAN_NOT_ALL_DIR = 1,
	CAN_NOT_NEXT_DIR = 2,
	CAN_ALL_DIR = 10,
}
const enum ReadyState {
	HAVE_NOTHING,
	HAVE_METADATA,
	HAVE_CURRENT_DATA,
	HAVE_FUTURE_DATA,
	HAVE_ENOUGH_DATA,
}
const enum NetworkState {
	NETWORK_EMPTY,
	NETWORK_IDLE,
	NETWORK_LOADING,
	NETWORK_NO_SOURCE,
}

interface IMedia {
	currentTime: number;
	src: string;
	preload: 'none'|'metadata'|'auto';
	muted: boolean;
	readonly paused: boolean;
	readonly duration: number;
	readonly readyState: ReadyState;
	readonly networkState: NetworkState;

	onabort: (e: any) => void;
	oncanplay: (e: any) => any;
	oncanplaythrough: (e: any) => any;
	ondurationchange: (e: any) => any;
	onemptied: (e: any) => any;
	onloadeddata: (e: any) => any;
	onloadedmetadata: (e: any) => any;

	onerror: (e: any) => any;

	onended: (e: any) => any;
	onpause: (e: any) => any;
	onplaying: (e: any) => any;
	onseeking: (e: any) => any;
	onseeked: (e: any) => any;

	ontimeupdate: (e: any) => any;

	load(): void;
	play(): Promise<void>;
	pause(): void;
}

type TypeOnState = (newState: MPRState, oldState: MPRState) => void;
type TypeOnTime = (time: number) => void;
type TypeEmpty = () => void;

class SectionPoint {
	private m_start: number;
	private m_end: number;

	public get start(): number {return this.m_start; }
	public get end(): number {return this.m_end; }

	constructor(start: number, end: number) {
		this.m_start = start;
		this.m_end = end;
	}
}
function parseSectionPoint(str: string, sections: SectionPoint[]|null): void {
	if (!sections) return;
	while ( sections.length > 0) { sections.pop(); }
	try {
		const arr: any[] = JSON.parse(str) as any[];
		if (!arr) { return; }
		for (let i = 0; i < arr.length; i++) {
			const arrSub = arr[i] as any[];
			if (arrSub && arrSub.length === 2) {
				const start: number = arrSub[0] as number;
				const end: number = arrSub[0] as number;

				if (!isNaN(start) && !isNaN(end) && start >= 0 && end > start) {
					sections.push(new SectionPoint(start, end));
				}
			}
		}
	} catch (e) {
		// BLANK
	}
}

class MConfig {
	/*
	public progressFontSize: number = 24;
	public progressBarGap: number = 8;
	public progressBarHeight: number = 16;
	public progressBarColors: number[] = [0x00a7f6, 0x7ad1fa];
	public progressBarAlphas: number[] = [1, 1];
	public progressBarRatios: number[] = [0, 255];
	public progressBarColors_bg: number[] = [0, 0x959595];
	public progressBarAlphas_bg: number[] = [0.7, 0.7];
	public progressBarRatios_bg: number[] = [0, 255];
	*/
	public isVideo: boolean;
	public autoPlay: boolean;
	public controlBox: boolean;
	public typeOfPosByMouse: Direction;
	// public canScrollByMouse:Boolean;
	// public canRightScrollByMouse:Boolean;
	public loop: number;

	public preload: Preload;
	public scaleMode: ScaleMode;
	public bgColor: number;

	public initTime: number;
	public startTime: number;
	public endTime: number;
	public chkTime: number;


	public playBtn: boolean;
	public closeBtn: boolean;
	public popupBtn: boolean;
	public fullscreenBtn: boolean;
	public volumeBtn: boolean;

	public centerPlayBtn: boolean;
	public centerLoading: boolean;
	public mousePlayPause: boolean;
	public bDoFullscreen: boolean;
	public volumeBox: boolean;

	public speedBtn: boolean;		// 추가--
	public scroller: boolean;		// 추가--
	public togglePlayBtn: boolean;	// 추가--
	public autoBtn: boolean;
	public langBtn: boolean;

	public menuOverlap: boolean;
	public haveScript: boolean;
	public viewScriptBox: boolean;
	public bScriptBtn: boolean;

	public scriptViewLang: ScriptLang;

	public defaultVolume: number = 100;

	public etcData: string;
	public lenOfFvlToFile: number = 24 * 1024 * 1024;

	public sections: SectionPoint[] = [];
	public get isMobile(): boolean {return false; }
	public get iskdmPC(): boolean {return false; }

	constructor(isVideo: boolean) {
		this.isVideo = isVideo;
		this.autoPlay = false;
		this.controlBox = true;
		this.typeOfPosByMouse = Direction.CAN_ALL_DIR;

		this.loop = 1;

		this.preload = Preload.AUTO;
		this.scaleMode = ScaleMode.STRETCH;
		this.bgColor = -1;

		this.initTime = 0;
		this.startTime = 0;
		this.endTime = 0;
		this.chkTime = 250;

		this.playBtn = true;
		this.closeBtn = false;
		this.popupBtn = false;
		this.fullscreenBtn = true;
		this.volumeBtn = true;

		this.centerPlayBtn = true;
		this.centerLoading = true;
		this.mousePlayPause = true;
		this.bDoFullscreen = true;
		this.volumeBox = true;

		this.speedBtn = false;		// 추가--
		this.scroller = true;		// 추가--
		this.togglePlayBtn = true;	// 추가--
		this.autoBtn = false;
		this.langBtn = false;

		this.menuOverlap = true;
		this.haveScript = false;

		this.viewScriptBox = false;
		this.bScriptBtn = false;
		this.scriptViewLang = ScriptLang.NONE;

		/*
		this.progressFontSize = DEFAULT_FONTSIZE;
		this.progressBarGap = 0;
		this.progressBarHeight = 8;
		this.progressBarColors = [0x66e7fd, 0x368fae];
		this.progressBarAlphas = [1, 1];
		this.progressBarRatios = [0,255];
		this.progressBarColors_bg = [0, 0x333333];
		this.progressBarAlphas_bg = [0.7, 0.7];
		this.progressBarRatios_bg = [0,255];
		*/
		this.etcData = '';
	}
  	public isLoadControls(isVideo: boolean): boolean {
		return this.controlBox || (isVideo && (this.centerPlayBtn || this.centerLoading || this.viewScriptBox));
	}
	public pcGetURL(url: string): string {return url; }
	/* TO DO
	public pcGetRequest(url: string): URLRequest {return new URLRequest(url); }
	public lengthOfKDM(url: string): number {return 0; }
	public loadKDM(url: string): ByteArray {return null; }
	public kdmTempFile(url: string): any {return null; }
	public showCursor(): void {}
	public hideCursor(): void {}
	*/

	public clone(): MConfig {
		const config = new MConfig(this.isVideo);
		config.copy(this);
		return config;
	}
	public copy(config: MConfig): void {
		this.autoPlay = config.autoPlay;
		this.controlBox = config.controlBox;
		this.typeOfPosByMouse = config.typeOfPosByMouse;

		this.loop = config.loop;

		this.preload = config.preload;
		this.scaleMode = config.scaleMode;
		this.bgColor = config.bgColor;

		this.initTime = config.initTime;
		this.startTime = config.startTime;
		this.endTime = config.endTime;
		this.chkTime = config.chkTime;

		this.playBtn = config.playBtn;
		this.closeBtn = config.closeBtn;
		this.popupBtn = config.popupBtn;
		this.fullscreenBtn = config.fullscreenBtn;
		this.volumeBtn = config.volumeBtn;

		this.centerPlayBtn = config.centerPlayBtn;
		this.centerLoading = config.centerLoading;

		this.mousePlayPause = config.mousePlayPause;

		this.volumeBox = config.volumeBox;

		this.speedBtn = config.speedBtn;			// 추가--
		this.scroller = config.scroller;			// 추가--
		this.togglePlayBtn = config.togglePlayBtn;	// 추가--
		this.autoBtn = config.autoBtn;
		this.langBtn = config.langBtn;

		this.menuOverlap = config.menuOverlap;
		this.haveScript = config.haveScript;

		this.viewScriptBox = config.viewScriptBox;
		this.bScriptBtn = config.bScriptBtn;
		this.scriptViewLang = config.scriptViewLang;
		this.defaultVolume = config.defaultVolume;
		/*
		this.progressFontSize = config.progressFontSize;
		this.progressBarGap = config.progressBarGap;
		this.progressBarHeight = config.progressBarHeight;
		this.progressBarColors = config.progressBarColors;
		this.progressBarAlphas = config.progressBarAlphas;
		this.progressBarRatios = config.progressBarRatios;
		this.progressBarColors_bg = config.progressBarColors_bg;
		this.progressBarAlphas_bg = config.progressBarAlphas_bg;
		this.progressBarRatios_bg = config.progressBarRatios_bg;
		*/
		this.etcData = config.etcData;
	}
}



class MPlayer {
	private m_media: IMedia|null = null;
	

	private m_config: MConfig;
	private m_url: string|null = null;
	private m_startTime = 0;
	private m_endTime = 0;
	private m_maxTime = 0;
	private m_seekTime = -1;
	private m_onTimer = -1;
	private m_playEnded = false;

	private m_standBy = false;
	private m_bPlay_temp = false;
	private m_startTime_temp = -1;
	private m_endTime_temp = -1;
	private m_loop_temp = -1;
	private m_loopCnt_temp = -1;

	private m_onstates: TypeOnState[] = [];
	private m_ontimes: TypeOnTime[] = [];
	private m_onends: TypeEmpty[] = [];
	private m_onendtemps: TypeEmpty[] = [];

	@observable private m_bPlay = false;
	@observable private m_myState = MPRState.UNINITIALIZED;
	@observable private m_duration = 0;
	
	private m_currentTime = 0;

	@observable private m_viewTime = 0;

	@observable public fullscreen: boolean = false;
	@observable private m_muted: boolean = false;

	@computed get bPlay() {return this.m_bPlay; }
	@computed get myState() {return this.m_myState; }
	@computed get duration() {return this.m_duration; }
	@computed get muted() {return this.m_muted; }
	@computed get viewTime() {return this.m_viewTime; }
	
	get media() {return this.m_media;}
	get config() {return this.m_config; }
	get currentTime() {return this.m_currentTime; }
	

	
	constructor(config: MConfig) {
		this.m_config = config;
		this.m_bPlay = config.autoPlay;

		this.m_startTime = config.startTime;
		this.m_endTime = config.endTime; 

		this.mediaInited = this.mediaInited.bind(this);
		this._onTime = this._onTime.bind(this);
	}
	public setStartEndTime(startTime: number, endTime: number) {
		this.m_startTime = startTime;
		this.m_endTime = endTime;
	}

	public setMuted(val: boolean) {
		this.m_muted = val;
		if(this.m_media) {
			this.m_media.muted = val;
		}
	}
	public setMutedTemp(val: boolean) {
		if(this.m_media) {
			this.m_media.muted = val;
		}
	}


	private _initTemp() {
		this.m_standBy = false;
		this.m_bPlay_temp = false;
		this.m_startTime_temp = -1;
		this.m_endTime_temp = -1;
		this.m_loop_temp = -1;
		this.m_loopCnt_temp = 0;
	}
	public play(): void {
		this.m_bPlay = true;
		this._initTemp();

		if (this.m_playEnded && this.m_media && this.m_myState >= MPRState.READY) {
			this.m_media.currentTime = this.m_startTime / 1000;
		}
		this.m_playEnded = false;
		this._playOrPause();

		// console.log('play');

		// this._onTime(0);
		// TO DO
	}
	public pause(): void {
		this.m_bPlay = false;
		// console.log('pause');
		this._initTemp();
		this._playOrPause();
	}
	public start() {
		// console.log('start');
		this.seek(0);
		this.play();
	}
	public seek(time: number): void {
		if (!this.m_media || this.m_myState < MPRState.READY) {
			// console.log('seek', time);
			this.m_seekTime = time;
			return;
		}
		this._initTemp();
		this.m_seekTime = -1;
		if (isNaN(time) || time < 0) time = 0;
		else if (time >= this.m_duration - 100) {
			time = this.m_duration;
			this._playEnded();
			return;
		}
		this.m_playEnded = false;
		this.m_media.currentTime = (this.m_startTime + time) / 1000;
		this._onTimeUpdate();
		this.m_viewTime = this.m_currentTime;
	}

	public gotoAndPlay(start: number, end: number, loop: number): void {
		// console.log('gotoAndPlay');
		this.m_standBy = false;
		if(!this.m_media || this.m_duration <= 0) {
			this._load();
			this.m_bPlay_temp = true;
			this.m_startTime_temp = start;
			this.m_endTime_temp = end;
			this.m_loop_temp = loop;
			return;
		}
		// console.log('gotoAndPlay');
		this.m_playEnded = false;
		this.m_bPlay_temp = false;
		this.m_startTime_temp = start;
		this.m_endTime_temp = end;

		start = (start >= 0 ) ? start : this.currentTime;
		end = (end >= 0 && end < this.m_duration) ? end : this.m_duration;
		
		this.m_bPlay = true;
		if(start >= end || loop <= 0) {
			this.m_startTime_temp = -1;
			this.m_endTime_temp = -1;
			this.m_loop_temp = -1;
			this.m_loopCnt_temp = 0;
		} else {
			if(this.m_endTime_temp >= this.m_duration) this.m_endTime_temp = -1;
			this.m_loop_temp = loop;
			this.m_loopCnt_temp = 0;
			if(this.m_startTime_temp >= 0 ) {
				this.m_media.currentTime = (start + this.m_startTime) / 1000;
				this._onTimeUpdate();
				this.m_viewTime = this.m_currentTime;
			}
		}
		this._playOrPause();
	}
	public gotoAndPause(time: number): void {
		this.m_bPlay = false;
		// console.log('gotoAndPause');
		this._initTemp();
		if(!this.m_media) return;

		time = (time >= 0 && time < this.m_duration) ? time : this.currentTime;
		this.m_media.currentTime = (time + this.m_startTime) / 1000;
		this._onTimeUpdate();
		this.m_viewTime = this.m_currentTime;
		this._playOrPause();
		// TO DO
	}
	public connect(): void {
		if(this.m_media) {
			const video = this.m_media as HTMLVideoElement;
			if(
				this.m_url &&
				this.m_myState >= MPRState.LOADING && 
				this.m_media.networkState === NetworkState.NETWORK_NO_SOURCE &&
				this.m_media.readyState === ReadyState.HAVE_NOTHING
			) {
				this.m_media.src = this.m_url;
				this.m_media.load();				
			}
		}
		// console.log( 'connect', this.m_media );
	}
	public unconnect() {
		if(this.m_media) {
			if(!this.m_media.paused) this.m_media.pause();

			if(this.m_myState >= MPRState.LOADING) {
				if(this.m_myState >= MPRState.READY) {
					this.m_seekTime = this.m_media.currentTime * 1000 - this.m_startTime;

				}
				this.m_media.src = '';
				this.m_media.load();
			}
		}
		
	}
	private _load() {
		if (this.m_media && this.m_url && this.m_myState < MPRState.LOADING) {
			this._setState(MPRState.LOADING);
			this.m_media.src = this.m_url;
			this.m_media.load();
		}
	}
	public load(url: string): void {
		this.m_url = url;
		this._load();
	}
	public unload(): void {

		if(this.m_media) {
			if(!this.m_media.paused) this.m_media.pause();

			if(this.m_myState >= MPRState.LOADING) {
				this.m_media.src = '';
				this.m_media.load();
			}
		}
		this.m_url = null;
		this.m_bPlay = false;
		this.m_bPlay_temp = false;

		this.m_startTime = 0;
		this.m_endTime = 0;
		this.m_maxTime = 0;
		this.m_seekTime = -1;
		this.m_onTimer = -1;
		this.m_playEnded = false;
	
		this.m_standBy = false;
		this.m_bPlay_temp = false;
		this.m_startTime_temp = -1;
		this.m_endTime_temp = -1;
		this.m_loop_temp = -1;
		this.m_loopCnt_temp = -1;
	
		this.m_duration = 0;
		this.m_currentTime = 0;
		this.m_viewTime = 0;
		this.fullscreen = false;
		this.m_muted = false;
			
		this._setState(MPRState.UNINITIALIZED);
	}
	private _setState(newState: MPRState) {
		if (this.m_myState === newState) return;
		if (newState === MPRState.PLAYING) {
			if (this.m_onTimer < 0 ) {
				this.m_onTimer = window.requestAnimationFrame(this._onTime);
			}
		} else if (newState === MPRState.PAUSED) {
			if (this.m_onTimer >= 0 ) {
				window.cancelAnimationFrame(this.m_onTimer);
				this.m_onTimer = -1;
			}
		}
		const prevState = this.m_myState;
		this.m_myState = newState;

		for(let i = 0, len = this.m_onstates.length; i < len; i++) {
			this.m_onstates[i](newState, prevState);
		}
		
	}
	private _playOrPause() {
		if (!this.m_media || this.m_myState < MPRState.READY) return;
		if (this.m_bPlay) {
			this._setState(MPRState.PLAYING);
			if (this.m_media.paused) {
				const playPromise = this.m_media.play();
				if (playPromise) {
					playPromise.then((_) => {
						if (this.m_media && !this.m_bPlay && !this.m_media.paused) this.m_media.pause();
					})
					.catch((error) => {
						if (this.m_media && !this.m_bPlay && !this.m_media.paused) this.m_media.pause();
					});
				}
			}
		} else {
			this._setState(MPRState.PAUSED);
			if (!this.m_media.paused) this.m_media.pause();
		}
	}
	private _onTimeUpdate(): void {
		if (!this.m_media) return;

		let currentTime = this.m_media.currentTime * 1000;

		if(this.m_loop_temp > 0 && this.m_bPlay) {
			if (currentTime < this.m_startTime) currentTime = this.m_startTime;
			else if (this.m_endTime_temp > 0 && currentTime >= this.m_endTime_temp + this.m_startTime) {
				this.m_currentTime = this.m_endTime_temp;
				this.m_viewTime = this.m_currentTime;
				for(let i = 0, len = this.m_ontimes.length; i < len; i++) this.m_ontimes[i](this.m_currentTime);
				this._playEnded();
			} else {
				this.m_currentTime = currentTime - this.m_startTime;
				for(let i = 0, len = this.m_ontimes.length; i < len; i++) this.m_ontimes[i](this.m_currentTime);				
			}
		} else {
			if (currentTime < this.m_startTime) currentTime = this.m_startTime;
			else if (this.m_endTime > 0 && currentTime >= this.m_endTime) {
				this.m_currentTime = this.m_endTime - this.m_startTime;
				this.m_viewTime = this.m_currentTime;
				for(let i = 0, len = this.m_ontimes.length; i < len; i++) this.m_ontimes[i](this.m_currentTime);
				this._playEnded();
				return;
			} else {
				this.m_currentTime = currentTime - this.m_startTime;
				for(let i = 0, len = this.m_ontimes.length; i < len; i++) this.m_ontimes[i](this.m_currentTime);
			}
		}
	}

	private _playEnded() {
		if(!this.m_media || this.m_playEnded) return;

		// console.log('_playEnded', this.m_loop_temp, this.m_bPlay, this.m_config.loop);
		if (this.m_loop_temp > 0 && this.m_bPlay) {
			this.m_loopCnt_temp++;
			if(this.m_endTime_temp <= 0) {
				this.m_bPlay = false;
				for(let i = 0, len = this.m_onends.length; i < len; i++) this.m_onends[i]();
			}
			if(this.m_loopCnt_temp < this.m_loop_temp) {
				const start = (this.m_startTime_temp >= 0 && this.m_startTime_temp < this.m_duration) ? this.m_startTime_temp : 0;
				this.m_media.currentTime = (start + this.m_startTime) / 1000;
				if(this.m_media.paused) this.m_media.play();
			} else {
				if(!this.m_media.paused) this.m_media.pause();
				this.m_bPlay = false;
				for(let i = 0, len = this.m_onendtemps.length; i < len; i++) this.m_onendtemps[i]();
			}
		} else {
			for(let i = 0, len = this.m_onends.length; i < len; i++) this.m_onends[i]();

			if(this.m_config.loop === 0 && this.m_bPlay) {
				this.m_media.currentTime = this.m_startTime / 1000;
				if(this.m_media.paused) this.m_media.play();
			} else {
				this.m_playEnded = true;
				this.m_bPlay = false;
				if (!this.m_media.paused) this.m_media.pause();

				if(this.m_media.currentTime * 1000 < this.m_maxTime - 100) {
					this.m_media.currentTime = this.m_maxTime / 1000;
				}
				this.m_currentTime = this.m_maxTime - this.m_startTime;
				this.m_viewTime = this.m_currentTime;
				this._setState(MPRState.PAUSED);
				// console.log('aaaaaaaaaaaaaaaaaaaaaaaa');
			}
		}
	}
	public reset() {
		// TO DO
	}
	private _onTime(t: number): void {
		if (this.m_onTimer >= 0) {
			this._onTimeUpdate();
			this.m_onTimer = window.requestAnimationFrame(this._onTime);
		}
	}

	public mediaInited(el: IMedia) {
		if (this.m_media || !el) return;

		this.m_media = el;
		const loadedFnc = (e: Event) => {
			if (!this.m_media) return;

			const config = this.m_config;
			
			if (el.duration > 0) {

				if(this.m_maxTime <= 0) {
					this.m_maxTime = el.duration * 1000;

					if (this.m_endTime >= this.m_maxTime) this.m_endTime = 0;
					else if (this.m_endTime > 0) this.m_maxTime = this.m_endTime;

					if (this.m_startTime < 0 || this.m_startTime >= this.m_maxTime) this.m_startTime = 0;

					this.m_duration = this.m_maxTime - this.m_startTime;
					if(this.m_bPlay_temp) {
						this._setState(MPRState.READY);
						this.gotoAndPlay(this.m_startTime_temp, this.m_endTime_temp, this.m_loop_temp);
					} else if(this.m_seekTime > 0 && this.m_seekTime < this.m_duration) {
						this._setState(MPRState.READY);
						this.m_media.currentTime = (this.m_seekTime + this.m_startTime) / 1000;
					} else if (this.m_startTime === 0)	{
						this._setState(MPRState.READY);
						this._playOrPause();
					} else this.m_media.currentTime = this.m_startTime / 1000;
					this.m_seekTime = -1;
				} else if(this.m_seekTime >= 0) {
					if(this.m_seekTime < this.m_duration) {
						this.m_media.currentTime = (this.m_seekTime + this.m_startTime) / 1000;
					}
					this.m_seekTime = -1;
				}
			} 
		};

		el.onabort = (e) => {console.log('onabort'); };

		el.oncanplay = loadedFnc;
		el.oncanplaythrough = loadedFnc;
		el.ondurationchange = loadedFnc;
		// el.onemptied = loadedFnc;
		el.onloadeddata = loadedFnc;
		el.onloadedmetadata = loadedFnc;

		el.onerror = (e) => {
			if (this.m_myState === MPRState.LOADING) {
				this._setState(MPRState.PLAYBACK_ERROR);
			}
		};


		el.onended = (e) => {
			if (!this.m_media) return;
			else if (this.m_maxTime <= 0 || this.m_myState < MPRState.READY) return;

			this._playEnded();
		};
		el.onpause = (e) => {
			if (!this.m_media) return;
			else if (this.m_maxTime <= 0 || this.m_myState < MPRState.READY) return;
			this._setState(MPRState.PAUSED);
			
		};
		el.onplaying = (e) => {
			if (!this.m_media) return;
			else if (this.m_maxTime <= 0 || this.m_myState < MPRState.READY || !this.m_bPlay) {
				if (!this.m_media.paused) this.m_media.pause();
				return;
			}
			this._setState(MPRState.PLAYING);
		};

		el.onseeking =  (e: Event) => {
			if (!this.m_media || this.m_maxTime <= 0) return;

			if (this.m_myState >= MPRState.READY ) {
				this._setState(MPRState.BUFFERING);
			}
		};

		el.onseeked =  (e: Event) => {
			if (!this.m_media || this.m_maxTime <= 0) return;

			if (this.m_myState >= MPRState.READY ) {
				this._playOrPause();
			} else if (this.m_myState < MPRState.READY && this.m_startTime > 0) {
				const gap = Math.abs(this.m_startTime - this.m_media.currentTime * 1000);
				if (gap < 100) {
					this._setState(MPRState.READY);
					this._playOrPause();
				} else {
					this.m_media.currentTime = this.m_startTime / 1000;
				}
			}
		};
		 
		el.ontimeupdate = (e: Event) => {
			if (this.m_myState <= MPRState.PLAYBACK_ERROR) return;
			this._onTimeUpdate();
			this.m_viewTime = this.m_currentTime;
		};


		// el.onvolumechange = fnc;
		// el.onwaiting = fnc;
		this._load();
	}

	public addOnState(handler: TypeOnState): void {
		const idx = this.m_onstates.indexOf(handler);
		if(idx >= 0 ) return;
		this.m_onstates.push(handler);
	}
	public removeOnState(handler: TypeOnState): void {
		const idx = this.m_onstates.indexOf(handler);
		if(idx < 0 ) return;
		this.m_onstates.splice(idx, 1);
	}

	public addOnTime(handler: TypeOnTime): void {
		const idx = this.m_ontimes.indexOf(handler);
		if(idx >= 0 ) return;
		this.m_ontimes.push(handler);
	}
	public removeOnTime(handler: TypeOnTime): void {
		const idx = this.m_ontimes.indexOf(handler);
		if(idx < 0 ) return;
		this.m_ontimes.splice(idx, 1);
	}

	public addOnPlayEnd(handler: TypeEmpty): void {
		const idx = this.m_onends.indexOf(handler);
		if(idx >= 0 ) return;
		this.m_onends.push(handler);
	}
	public removeOnPlayEnd(handler: TypeEmpty): void {
		const idx = this.m_onends.indexOf(handler);
		if(idx < 0 ) return;
		this.m_onends.splice(idx, 1);
	}

	public addOnPlayEndTemp(handler: TypeEmpty): void {
		const idx = this.m_onendtemps.indexOf(handler);
		if(idx >= 0 ) return;
		this.m_onendtemps.push(handler);
	}
	public removeOnPlayEndTemp(handler: TypeEmpty): void {
		const idx = this.m_onendtemps.indexOf(handler);
		if(idx < 0 ) return;
		this.m_onendtemps.splice(idx, 1);
	}
}
export { MPlayer, MConfig, IMedia, MPRState, };