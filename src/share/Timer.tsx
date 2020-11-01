import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { observable, action, autorun, computed } from 'mobx';
import { observer } from 'mobx-react';
import * as _ from 'lodash';

import { App } from '../App';

const enum RunState {
     INIT,
     RUNNING,
     PAUSE,
}

export class TimerState {
     @observable private m_runState = RunState.INIT;
	 @computed get runState() {return this.m_runState;}
	 
	 public get isRunning() {return this.m_runState === RunState.RUNNING;}

	 @observable private m_max = 60;                  // 최대 시간(초)
	 @computed get max() {return this.m_max;}
		private m_playSound = true;
		get playSound() {return this.m_playSound;}
		public setPlaySound(v: boolean) {this.m_playSound = v;}


		constructor(max: number) {
			this.m_max = max;

			// this.m_max = 3;
		}
		public setMax(max: number) {
			this.m_max = max;
			// this.m_max = 13;
		}
     @action public start = () => {
         this.m_runState = RunState.RUNNING;
     }
     @action public reset = () => {

         this.m_runState = RunState.INIT;
     }
     @action public pause = () => {
         this.m_runState = RunState.PAUSE;
     }
}
interface ITimer {
     state: TimerState;
     view: boolean;
     onComplete: () => void;
     onStart?: () => void;
}

function _pToC(cX: number, cY: number, r: number, deg: number) {
     let rad = (deg - 90) * Math.PI / 180.0;
     return {
         x: cX + (r * Math.cos(rad)),
         y: cY + (r * Math.sin(rad))
     };
}

function _dArc(cX: number, cY: number, r: number, sdeg: number, edeg: number) {

	let d;
	if(edeg - sdeg >= 360) {
		d = [
			'M', cX, cY,
			'm', -r, 0,
			'a', r, r, 0, '1', 0, r * 2, 0,
			'a', r, r, 0, '1', 0, -r * 2, 0
		].join(' ');
	} else {
		let largeFlag = edeg - sdeg <= 180 ? '0' : '1';
		let sPt = _pToC(cX, cY, r, edeg);
		let ePt = _pToC(cX, cY, r, sdeg);
		d = [
		'M', sPt.x, sPt.y,
		'A', r, r, 0, largeFlag, 0, ePt.x, ePt.y,
		'L', cX, cY,
		'L', sPt.x, sPt.y,
		].join(' ');
	}
	return d;
}

const _arcR = 32;
const _arcC = _arcR;
const _arcWH = 2 * _arcC;


@observer
export class Timer extends React.Component<ITimer> {
     private m_runState = RunState.INIT;
     private m_sec = 0;
     private m_stime = 0;
     @observable private m_text = '';
     @observable private m_d = '';

     private _drawArc: _.DebouncedFunc<(time: number) => void>;
     constructor(props: ITimer) {
         super(props);
         this.m_text = this._getTime(this.props.state.max);
         this.m_d = '';

         autorun(() => {
			if(!this.props) return;
			const state = this.props.state;
			const max = state.max;
			if(state.runState === RunState.RUNNING && this.m_runState !== RunState.RUNNING) {
				this.m_runState = RunState.RUNNING;
				this._start();
			} else if(state.runState === RunState.INIT) {
				this.m_text = this._getTime(max);
				this.m_d = '';
			}
			this.m_runState = state.runState;
         });


         this._drawArc = _.throttle((time: number) => {
			if(!this.props || this.m_runState !== RunState.RUNNING) return;

			const max = this.props.state.max * 1000;
			let angle = 0;
			if( this.m_sec <= 5 ) {
				const d = time % 1000;
				if( time === 0 ) angle = 0;
				else if( d === 0) angle = 1;
				else angle = d / 1000;
			} else {
				angle = time / max;
			}
			angle = angle * 360;
			
			this.m_d = _dArc(_arcC, _arcC, _arcR, 0, angle);
         }, 50, {trailing: true});
     }

     private _start = () => {
         // this.m_cnt = this.props.state.max;
         this.m_sec = this.props.state.max;
         this.m_text = this._getTime(this.m_sec);
         this.m_d = '';
         this.m_stime = Date.now();
         this._run(0);

         if(this.props.onStart) this.props.onStart();
     }

     private _run = (f: number) => {
         if(!this.props || this.m_runState !== RunState.RUNNING) return;

         const max = this.props.state.max;

         const time = Date.now() - this.m_stime;
         const sec = max - Math.floor(time / 1000);
         if(this.m_sec !== sec) {
             this.m_text = this._getTime(sec);
             if(sec === 0) {
                 if(this.props.state.playSound) App.pub_playDingend();
             } else if( sec < 5 ) {
                 if(this.props.state.playSound) App.pub_playDing();
             } else if( sec >= 5 &&  sec <= 10) {
                 if(this.props.state.playSound) App.pub_playClock();
             }
         }
         this.m_sec = sec;

         if(sec > 0) {
             this._drawArc(time);
             window.requestAnimationFrame(this._run);
         } else {
			this._drawArc.cancel();
			this.m_d = _dArc(_arcC, _arcC, _arcR, 0, 360);
			this.props.onComplete();
         }
     }
     private _getTime(t: number) {
         const m = Math.floor(t / 60);
         const s = t % 60;

         let ret = '';
         if(m < 10) ret = '0' + m;
         else ret = '' + m;
         if(s < 10) ret = ret + ':0' + s;
         else ret = ret + ':' + s;
         return ret;
     }
     public render() {
         let stroke = (this.m_sec <= 5) ? '#f00' : '#ff0';
         return (
             <div className="q_timer" hidden={!this.props.view}>
                 <svg  width={_arcWH} height={_arcWH} viewBox={'0 0 ' + _arcWH + ' ' + _arcWH}>
                     <path fill={stroke} d={this.m_d}/>
                 </svg>
                 <div className="m_text">{this.m_text}</div>
             </div>
         );
     }
}




const _START = -0.5 * Math.PI;

@observer
export class CountDown2 extends React.Component<ITimer> {
	private m_runState = RunState.INIT;
	@observable private m_sec = 0;
	private m_stime = 0;

	private m_canvas!: HTMLCanvasElement;
	private m_ctx!: CanvasRenderingContext2D;
	private m_r: number = 0;
	private _drawArc: _.DebouncedFunc<(time: number) => void>;

	@observable private m_view = false;

	constructor(props: ITimer) {
		super(props);
		this.m_sec =  this.props.state.max;
		this.m_view = props.view;
		autorun(() => {
			if(!this.props) return;
			const state = this.props.state;
			if(state.runState === RunState.RUNNING && this.m_runState !== RunState.RUNNING) {
				this.m_runState = RunState.RUNNING;
				this._start();
			} else if(state.runState === RunState.INIT && this.m_runState !== RunState.INIT) {
				this.m_sec = state.max;
				if(this.m_ctx) {
					const r = this.m_r;
					this.m_ctx.clearRect(0, 0, 2 * r, 2 * r);
				}
			}
			this.m_runState = state.runState;
			// console.log('Timer ' + this.props.state.isRun);
		});
		this._drawArc = _.throttle((time: number) => {
			if(!this.m_canvas || !this.props || this.m_runState !== RunState.RUNNING) return;

			const angle = 2 * Math.PI * time / 1000;
			const r = this.m_r;

			this.m_ctx.clearRect(0, 0, 2 * r, 2 * r);
			this.m_ctx.beginPath();
			this.m_ctx.fillStyle = '#5538EB';
			this.m_ctx.moveTo(r, r);
			this.m_ctx.arc(r, r, r, _START, angle + _START);
			this.m_ctx.fill();
		}, 50);
		
	}
	private _start = () => {
		// this.m_cnt = this.props.state.max;
		this.m_sec = this.props.state.max;
		this.m_stime = Date.now();
		this._run(0);

		if(this.props.onStart) this.props.onStart();
	}

	private _run = (f: number) => {
		if(!this.props || this.m_runState !== RunState.RUNNING) return;

		const time = Date.now() - this.m_stime;
		const sec = this.props.state.max - Math.floor(time / 1000);
		if(this.m_sec !== sec) {
			this.m_sec = sec;
			if(sec === 0) {
				if(this.props.state.playSound) App.pub_playDingend();

				this.props.onComplete();
			} else if( sec <= 5 ) {
				if(this.props.state.playSound) App.pub_playDing();
			}
		}
		if(sec > 0) {
			this._drawArc(time % 1000);
			window.requestAnimationFrame(this._run);
		} else {
			this._drawArc(1000);
		}
	}
	private _refCanvas = (el: HTMLCanvasElement|null) => {
		if(this.m_canvas || !el) return;
		this.m_canvas = el;
		this.m_r = el.width / 2;
		this.m_ctx = el.getContext('2d') as CanvasRenderingContext2D;
	}
	public componentDidUpdate(prev: ITimer) {
		if(prev.view !== this.props.view) {
			if(this.props.view) {
				this.m_view = true;
			} else {
				// this.m_view = false;
			}
		}
	}
	private _onTransEnd = () => {
		if(!this.props.view) this.m_view = false;
	}
	public render() {
		return (
			<div className={'countdown2 ' + (this.m_view ? '' : 'hide')}>
				<div className={'countdown ' + (this.props.view ? 'view' : 'hide')} onTransitionEnd={this._onTransEnd}>
					<canvas width="206px" height="206px" ref={this._refCanvas}/>
					<div><div>{this.m_sec}</div></div>
				</div>
			</div>
		);
	}
}

