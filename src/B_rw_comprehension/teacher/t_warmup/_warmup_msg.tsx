import * as React from 'react';
import { observer } from 'mobx-react';
import * as _ from 'lodash';

import * as common from '../../common';
import { observable } from 'mobx';

import ReactResizeDetector from 'react-resize-detector';

@observer
class WarmupMsg extends React.Component<common.IWarmupReturn> {
	@observable private _on = false;
	@observable private _displayMode: '1'|'2' = '1';
	private _bndW = 0;
	private _bndH = 0;
	private _bndW_p = 0;
	private _bndH_p = 0;
	private _canvas?: HTMLCanvasElement;
	private _ctx?: CanvasRenderingContext2D;
	private _refCanvas = (el: HTMLCanvasElement|null) => {
		if(this._canvas || !el) return;
		this._canvas = el;
		this._ctx = this._canvas.getContext('2d') as CanvasRenderingContext2D;		
	}
	public componentDidMount() {
		_.delay(() => {
			this._on = true;
			this._draw();
		},500);
		this._displayMode = this.props.displayMode;
	}
	public componentDidUpdate() {
		if(!this._on) { 
			_.delay(() => {
				this._on = true;
				this._draw();
			},500);
		}
	}
	private _onResize = (w: number, h: number) => {
		// console.log('this._onResize', w, h);
		this._bndW = w;
		this._bndH = h;
		this._draw();
	}
	private _draw() {
		if(this._bndW <= 0 || this._bndH <= 0) return;
		else if(this._bndW === this._bndW_p && this._bndH === this._bndH_p) return;
		else if(!this._canvas) return;
		else if(!this._ctx) return;

		this._ctx.clearRect(0, 0, this._canvas.width, this._canvas.height);

		this._canvas.width = this._bndW;
		this._canvas.height = this._bndH;
		common.drawBalloon(
			this._ctx, 
			15, 					// x
			5, 					// y
			this._bndW - 20, 	// w
			this._bndH - 10, 	// h
			5,     // px
			35, 				// py		
			10,					// round
			this.props.color,
		);

		this._bndW_p = this._bndW;
		this._bndH_p = this._bndH;
	}
	private _toggle = () => {
		this._displayMode = this._displayMode === '1' ? '2' : '1'; 
	}
	public render() {
		const {color, thumb, avatar, displayMode, msg} = this.props;
		return (
			<div className={'msg-item ' + color + (this._on ? ' on' : '')}>
				<img src={this._displayMode === '2' ? avatar : thumb} onClick={this._toggle}/>
				<div className="text">
					<canvas ref={this._refCanvas}/>
					<div className="s_text">
						{msg}
					</div>
					<ReactResizeDetector handleWidth={false} handleHeight={true} onResize={this._onResize} />
				</div>

			</div>
		);
	}
}

export default WarmupMsg;