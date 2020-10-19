import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { observable } from 'mobx';
import { observer } from 'mobx-react';

import ReactResizeDetector from 'react-resize-detector';

import { DraggableCore, DraggableData, DraggableEvent } from 'react-draggable';
import './KScroll.scss';
import { matr_invert } from '@common/util/geom';
import { isUndefined } from 'util';

function _getSelectPosition(div: HTMLElement) {
	const ret = {start: 0, end: 0};
	const selection = window.getSelection();
	if (selection && selection.getRangeAt && selection.rangeCount) {
		const range_o = selection.getRangeAt(0);

		if(range_o.startContainer === div && range_o.endContainer === div) {
			ret.end = range_o.endOffset;
			ret.start =  range_o.startOffset;
		} else {
			const lenSelected = range_o.toString().length;
			const range = range_o.cloneRange();
			range.selectNodeContents(div);
			range.setEnd(range_o.endContainer, range_o.endOffset);

			ret.end = range.toString().length;
			ret.start = ret.end - lenSelected;
			range.detach();
		}
	}
	return ret;
}

interface IKScroll {
	className?: string;
	disableDrag?: boolean;
	onDragStart?: () => void;
	onDrag?: () => void;
	onDragEnd?: () => void;
}
@observer
export class KVScroll extends React.Component<IKScroll> {
	private _container?: HTMLDivElement;
	private _wrapper?: HTMLDivElement;

	private _evt_s = 0;
	private _top_s = 0;

	private _containerTop = 0;
	private _containerH = 0;
	private _wrapperH = 0;

	private _pid = -1;
	@observable private _top = 0;

	@observable private _bar = {
		view: false,
		top: 0,
		height: 100,
	};

	constructor(props: IKScroll) {
		super(props);
	}

	public scrollToCaret(el: HTMLElement) {
		if(!this._container || !this._wrapper || this._pid >= 0) return;
		if(this._containerH === 0) {
			const r = this._container.getBoundingClientRect();
			this._containerTop = r.top;
			this._containerH = r.bottom - r.top;
		}
		const cT = this._containerTop;
		const cH = this._containerH;
		const cB = cT + cH;
		
		let rect = el.getBoundingClientRect();
		if(rect.bottom - rect.top > cH) {
			const sel = _getSelectPosition(el);

			const range = document.createRange();
			sel.start = sel.start - 1;
			if(sel.start < 0) {
				sel.start = 0;
				sel.end = sel.end + 1;

				const text = el.textContent;
				if(!text) return;
				if(sel.end > text.length) sel.end = text.length;
			}
	
			range.setStart(el, sel.start);
			range.setEnd(el, sel.end);
			rect = range.getBoundingClientRect();
			range.detach();
		}
		if(rect.top < cT || rect.bottom > cB ) {
			if(rect.top < cT) this._top = this._top - (rect.top - cT);
			else if(rect.bottom > cB) this._top = this._top - (rect.bottom - cB);

			const gapH = this._wrapperH - this._containerH;
			if(this._top >= 0) this._top = 0;
			else if(this._top < -gapH) this._top = -gapH;

			this._updateBar();
		}

	}
	public update() {
		if(!this._container || !this._wrapper) return;

		const rect = this._container.getBoundingClientRect();

		this._containerTop = rect.top;
		this._containerH = rect.bottom - rect.top;
		this._wrapperH = this._wrapper.offsetHeight;

		this._bar.view = this._wrapperH > this._containerH;
		if(this._bar.view) {
			const gapH = this._wrapperH - this._containerH;
			if(this._pid < 0) {
				if(this._top >= 0) this._top = 0;
				else if(this._top < -gapH) this._top = -gapH;

				this._updateBar();
			}
		} else {
			if(this._pid < 0) {
				this._top = 0;
				this._bar.top = 0;
				this._bar.height = 100;
				this._updateBar();
			}
		} 
	}
	private _updateBar() {
		if(!this._bar.view) return;

		let top = -100 * this._top / this._wrapperH;
		if(top < 0) top = 0;

		let bottom = 100 * (-this._top + this._containerH) / this._wrapperH;
		if(bottom > 100) bottom = 100;

		this._bar.top = top;
		this._bar.height = bottom - top;
	}

	private _onResize = (w: number, h: number) => {
		console.log('_onResize', w, h);
		this.update();
		if(w <= 0 || h <= 0) this._releasePID();
	}

	private _refContainer = (div: HTMLDivElement|null) => {
		if(this._container || !div) return;
		this._container = div;
	}
	private _refWrapper = (el: HTMLDivElement|null) => {
		if(this._wrapper || !el) return;
		this._wrapper = el;

		const cancelFnc = (evt: PointerEvent) => {
			if(this.props.disableDrag) return;
			const gapH = this._wrapperH - this._containerH;
			if(this._top >= 0) this._top = 0;
			else if(this._top < -gapH) this._top = -gapH;
			this._updateBar();

			this._releasePID();
	
			if(this.props.onDragEnd) this.props.onDragEnd();
		};

		const scrollFnc = (evt: PointerEvent) => {
			if(this.props.disableDrag || !this._container || this._pid < 0) return;
			this._top = this._top_s - (this._evt_s - evt.clientY);
	
			this._updateBar();
			if(this.props.onDrag) this.props.onDrag();

		};

		el.addEventListener('pointerdown', (evt: PointerEvent) => {
			if(this.props.disableDrag || !this._container || !this._wrapper || this._pid >= 0) return;

			this._containerH = this._container.offsetHeight;
			this._wrapperH = this._wrapper.offsetHeight;
			
			if(this._wrapperH < this._containerH) return;
			
			this._evt_s = evt.clientY;
			this._top_s = this._top;
			this._pid = evt.pointerId;
			try {this._wrapper.setPointerCapture(this._pid);} catch(e) {}
			if(this.props.onDragStart) this.props.onDragStart();
			
			
			// scrollFnc(evt);
		});
		el.addEventListener('pointercancel', cancelFnc);
		el.addEventListener('pointerup', cancelFnc);
		el.addEventListener('pointerleave', cancelFnc);

		el.addEventListener('pointermove', scrollFnc);
	}
	private _releasePID() {
		if(this._pid >= 0 && this._wrapper) {
			try { this._wrapper.releasePointerCapture(this._pid); } catch {}
			this._pid = -1;
		}
	}

	public componentDidUpdate(prev: IKScroll) {
		if(this.props.disableDrag !== prev.disableDrag) {
			this._releasePID();
		}
	}


	public render() {
		const wrapStyle: React.CSSProperties = {transform: `translateY(${this._top}px)`};

		const dragStyle: React.CSSProperties = {
			top: `${this._bar.top}%`,
			height: `${this._bar.height}%`,
		};
		if(this._pid < 0) {
			wrapStyle.transition = 'transform 0.3s';
		}
		return (
			<div ref={this._refContainer} className={'kscroll-container vertical'}>

				<div ref={this._refWrapper} className={'kscroll-wrapper vertical'} style={wrapStyle}>
					{this.props.children}
					<ReactResizeDetector handleWidth={false} handleHeight={true} onResize={this._onResize}/>
				</div>

				<div className="kscroll-bar vertical" style={{display: this._bar.view ? undefined : 'none'}}>
					<div className="kscroll-drag" style={dragStyle}/>
				</div>
				<ReactResizeDetector handleWidth={false} handleHeight={true} onResize={this._onResize}/>
			</div>
		);
	}
}