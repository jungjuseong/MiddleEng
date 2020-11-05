import * as React from 'react';

import { observable } from 'mobx';
import { observer } from 'mobx-react';

import { ToggleBtn } from '@common/component/button';
import * as kutil from '@common/util/kutil';

import PzTgt from './_pz_tgt';
import { IPzSrc } from '../common';

@observer
class PzSrc extends React.Component<IPzSrc> {
	private _el: HTMLElement|null = null;
	public get el() {return this._el;}
	public tgt: PzTgt|null = null;

	private _bRapid = false;
	@observable private _moving = false;
	@observable private _left = 0;
	@observable private _top = 0;

	public get moving() {return this._moving;}
	public reset() {
		this.tgt = null;
		this._bRapid = true;
		this._left = 0;
		this._top = 0;
		this._moving = false;
	}
	public componentWillMount() {
		this.props.onMountSrc(this, this.props.idx);
	}

	private _onRef = (el: HTMLElement) => {
		if(this._el) return;
		this._el = el;
	}
	private _onDown = () => {
		if(!this._el || this.props.disabled) return;
		this.props.onDown(this);

	}

	public async setTgt(tgt: PzTgt|null, bRapid: boolean) {
		const srcEL = this._el;
		this._bRapid = bRapid;
		if(!srcEL) return;

		if(tgt) {
			const tgtEL = tgt.el;
			if(!tgtEL) return;

			tgt.src = this;
			this.tgt = tgt;

			const tgtR = tgtEL.getBoundingClientRect();
			const srcR = srcEL.getBoundingClientRect();

			this._moving = !bRapid;
			this._left = (tgtR.left + tgtR.right) / 2 - (srcR.left + srcR.right) / 2;
			this._top = (tgtR.top + tgtR.bottom) / 2 - (srcR.top + srcR.bottom) / 2;
		} else {
			if(this.tgt) this.tgt.reset();
			this.tgt = null;
			this._moving = !bRapid;
			this._left = 0;
			this._top = 0;
		}

		if(this._moving) {
			await kutil.wait(500);
			this._moving = false;
		}
	}

	public render() {
		const {idx, char, disabled, quizProg, isTeacher} = this.props;
		const style: React.CSSProperties = {
			left: this._left + 'px', 
			top: this._top + 'px',
			zIndex: this._moving ? 2 : 0,
			transition: this._bRapid ? 'unset' : 'left 0.3s ease-in, top 0.3s ease-in',
		};

		if(!isTeacher && quizProg === 'result') {
			if(!this.tgt) {
				style.opacity = 0;
				style.pointerEvents = 'none';
			} else if(this.tgt && this.props.char !== this.tgt.props.char) {
				style.color = 'rgba(238, 26, 47, 0.8)';
				style.background = 'transparent';
				style.top = '-60px';
			}
		}

		return (
			<ToggleBtn 
				className="pz-src" 
				style={style}
				disabled={disabled} 
				onRef={this._onRef} 
				onMouseDown={this._onDown}
			>
				{char}
			</ToggleBtn>
		);	
	}
}

export default PzSrc;