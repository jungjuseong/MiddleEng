import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { observable, action, computed } from 'mobx';
import { observer } from 'mobx-react';

import * as _ from 'lodash';
import { isUndefined } from 'util';

import { App } from '../App';
import { ToggleBtn, AudioBtn } from '@common/component/button';

import * as StrUtil from '@common/util/StrUtil';
import ReactResizeDetector from 'react-resize-detector';

export class SelectorState {
	private m_min!: number;
	private m_step!: number;
	private m_defIdx: number;
	@observable private m_maxIdx!: number;
	private m_dir: -1|0|1 = 0;

	@observable private m_isSecond = false;

	@observable private m_idx: number;


	@computed get value() {return this.m_min + this.m_idx * this.m_step;}
	@computed get maxIdx() {return this.m_maxIdx;}
	@computed get idx() {return this.m_idx;}
	

	get min() {return this.m_min;}
	get step() {return this.m_step;}
	get isSecond() {return this.m_isSecond;}

	private f_add: ((v: number) => boolean) & _.Cancelable;
	private f_run: ((f: number) => void) & _.Cancelable;
	constructor(min: number, max: number, step?: number, def?: number, isSecond?: boolean) {
		if(isUndefined(step)) step = 1;
		if(isUndefined(isSecond)) isSecond = false;
		
		this.setMinMaxStep(min, max, step, isSecond);
		if(isUndefined(def)) this.m_defIdx = 0;
		else this.m_defIdx = Math.round((def - min) / step);
		this.m_idx = this.m_defIdx;
		

		this.f_add = _.throttle(this._add, 100);
		this.f_run = _.debounce(this._run, 500);
		// this._run = this._run.bind(this);
	}
	@action public setMinMaxStep(min: number, max: number, step: number, isSecond: boolean, bMax?: boolean, def?: number) {
		this.m_min = min;
		this.m_step = step;
		this.m_isSecond = isSecond;
		this.m_maxIdx = Math.round((max - min) / step);
		
		if(bMax) this.m_idx = this.m_maxIdx;
		else if(!isUndefined(def)) this.m_idx = Math.round((def - min) / step);

		// console.log('setMinMaxStep', this.m_idx, this.m_maxIdx);
	}

	@action private _add = (v: number) => {
		let idx = this.m_idx + v;
		let ret = true;
		if(idx < 0) {
			idx = 0;
			ret = false;
			this.m_dir = 0;
		} else if(idx > this.m_maxIdx) {
			idx = this.m_maxIdx;
			ret = false;
			this.m_dir = 0;
		}
		if(ret) App.pub_playBtnTab();
		this.m_idx = idx;

		// console.log('_add', this.m_idx, v);
		return ret;
	}

	@action public reset() {
		this.m_dir = 0;
		this.m_idx = this.m_defIdx;

		// console.log('reset', this.m_idx, this.m_defIdx);
	}

	public setDir(dir: -1|0|1) {
		const prev = this.m_dir;
		this.m_dir = dir;

		if(dir !== 0) {
			this._add(this.m_dir);
			this.f_run(0);
		}
	}
	private _run = (f: number) => {
		if(this.m_dir !== 0) {
			// console.log('_run', this.m_dir);
			this.f_add(this.m_dir);
			window.requestAnimationFrame(this._run);
		}
	}
}


interface ISelectorProp {
	state: SelectorState;
	unlimit: boolean;
	disabled?: boolean;
	isSmall?: boolean;
	unit?: string;
}

@observer
export class Selector extends React.Component<ISelectorProp> {
	private m_itemH: number = 0;
	// private _sidx = -1; 

	constructor(props: ISelectorProp) {
		super(props);
	}

	private _minusDown = (evt: Event) => {
		if(this.props.unlimit || this.props.disabled) return;
		App.pub_playBtnTab();
		this.props.state.setDir(-1);
	}
	private _minusUp = (evt: Event) => {
		this.props.state.setDir(0);
	}

	private _plusDown = (evt: Event) => {
		if(this.props.unlimit || this.props.disabled) return;
		App.pub_playBtnTab();
		this.props.state.setDir(1);
	}
	private _plusUp = (evt: Event) => {
		this.props.state.setDir(0);
	}

	private _refItem = (el: HTMLDivElement|null) => {
		if(!el) return;
		const style = window.getComputedStyle(el);
		const h = StrUtil.nteUInt(style.height, 0);
		if(h > this.m_itemH) this.m_itemH = h;
		// console.log(el, this.m_itemH);
	}
	private _onResize = (w: number, h: number) => {
		if(h > this.m_itemH) this.m_itemH = h;
	}
	public componentDidUpdate(prev: ISelectorProp) {
		const state = this.props.state;
		if(this.props.disabled !== prev.disabled) {
			state.setDir(0);
		}

		/*
		if(this._sidx !== state.idx) {
			if(state.idx <= 0 || state.idx >= state.maxIdx) {
				// console.log('aaaaaaaaaaaaa');
				state.setDir(0);
			}
			this._sidx = state.idx;
		}
		*/
	}

	public render() {
		const state = this.props.state;

		const arr = Array(state.maxIdx + 1).fill(0);
		let itemY = -state.idx * this.m_itemH;
		const style = {
			transform: `translateY(${itemY}px)`,
		};

		// console.log('state.idx=', state.idx, this.props.disabled);

		let unit = this.props.unit;		
		if(!unit) unit = state.isSecond ? 'Sec(s)' : 'Min(s)' ;
		return (
			<div className={(this.props.isSmall ? 'selector_L' : 'selector') + (this.props.disabled ? ' disabled' : '')}>
				<span style={{display: 'none'}}>{state.maxIdx}</span>
				<div className="mask1" hidden={this.props.unlimit}><div style={style}>
						<div ref={this._refItem}>
							<ReactResizeDetector handleHeight={true} handleWidth={true} onResize={this._onResize}/>
						</div>
					{arr.map((val, idx) => {
						const max = state.min + (arr.length - 1) * state.step;
						val = state.min + idx * state.step;
						return < div key={'m1' + idx} > {(val < 10 && max > 10) ? '0' + val : val}</div>;
					})}
				</div></div>
				<div className="up" />
				<div className="middle">
					<div className="mask2" hidden={this.props.unlimit}><div style={style}>
						{arr.map((val, idx) => {
						const max = state.min + (arr.length - 1) * state.step;
						val = state.min + idx * state.step;
						return < div key={'m1' + idx} > {(val < 10 && max > 10) ? '0' + val : val}</div>;
						})}
					</div></div>
					<div className="unlimit" hidden={!this.props.unlimit}>무제한</div>
					<div className="bg" />
				</div>
				<div className="down"/>
				<div className="btnbox" hidden={this.props.unlimit}>
					<ToggleBtn 
						className="btn_up"
						onMouseDown={this._minusDown} 
						onMouseUp={this._minusUp}  
						disabled={state.idx <= 0 || this.props.disabled}
					/>
					<div className="mins">{unit}</div>
					<ToggleBtn 
						onMouseDown={this._plusDown} 
						onMouseUp={this._plusUp} 
						className="btn_down" 
						disabled={state.idx >= state.maxIdx || this.props.disabled}
					/>
				</div>
			</div>
		);
	}
}