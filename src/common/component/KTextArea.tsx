import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { observable } from 'mobx';
import { observer } from 'mobx-react';

import * as _ from 'lodash';

import ReactResizeDetector from 'react-resize-detector';

import { DraggableCore, DraggableData } from 'react-draggable';

import * as keyboard from './Keyboard';
import * as kutil from '../util/kutil';
import * as StrUtil from '../util/StrUtil';
import './KTextArea.scss';

interface IKTextArea {
	view: boolean;
	on: boolean;
	autoResize?: boolean;
	skipEnter?: boolean;
	maxLength?: number;
	maxLineNum?: number;
	rows?: number;
	
	className?: string;
	preventScrollByBar?: boolean;
	limitByCode?: boolean;
	chkLineHeight?: boolean;
	onChange?: (text: string) => void;
	onDone?: (text: string) => void;
	onLimit?: () => void;
}
@observer
export class KTextArea extends React.Component<IKTextArea> {

	private m_wrap?: HTMLDivElement;
	private m_textarea?: HTMLTextAreaElement;
	private m_bar?: HTMLDivElement;

	@observable private m_top: number = 0;
	@observable private m_cntH: number = 0;
	private m_bndH: number = 0;

	@observable private m_sTop: number = 0;    // scroll bar top
	@observable private m_sH: number = 0;		// scroll bar height

	private m_pid = -1;

	private _text = '';
	private _selStart = 0;
	private _selEnd = 0;

	private _lineHeight = 0;
    private _paddingVer = 0;
    private _isSamsungDevice = false; 


	private _calc: () => void;

	public get value() {return this.m_textarea ? this.m_textarea.value : '';}
	constructor(props: IKTextArea) {
		super(props);
		this._calc = _.throttle(() => {
			if(!this.m_textarea || this.m_bndH <= 0) return;

			if(!this._checkLimit()) {
				this._calc();
				return;
			}

			if(this.props.autoResize) {
				this.m_textarea.scrollTop = 0;
				this.m_sTop = 0;
				this.m_sH = 0;
				this.m_top = 0;

				this.m_textarea.style.height = 'auto';
				const sH = this.m_textarea.scrollHeight;
				this.m_textarea.style.height = sH + 'px';
				this.m_cntH = sH;
            } else {
				let top = this.m_textarea.scrollTop;
				if(this.props.chkLineHeight && this._lineHeight > 0) {
					let gap = Math.round(top / this._lineHeight);
					top = gap * this._lineHeight;

					this.m_textarea.scrollTop = top;
					// console.log('dddd', top, gap, this.m_LH, this.m_textarea.scrollHeight);
				}
				top = -1 * top;
				const cntH = this.m_textarea.scrollHeight;	

				if(cntH > this.m_bndH ) {
					const barH = this.m_bndH * 0.98;
					this.m_sTop = -1 * top * barH / cntH;
					this.m_sH = this.m_bndH * barH / cntH;
				} else {
					this.m_sH = 0;
				}
				this.m_top = top;
				this.m_cntH = cntH;
			}
		}, this.props.autoResize ? 20 : 10);
	}
	private async _focusArea() {
		await kutil.wait(100);
		if(!this.m_textarea || !this.props.on) return;
		this.m_textarea.focus();
	}

	private _checkLimit = () => {
		if(!this.m_textarea) return false;

		let text = this.m_textarea.value;
		
		let isOk = true;
		if(this.props.skipEnter) isOk = text.indexOf('/r') < 0 && text.indexOf('/n') < 0;
		
		if(this.props.maxLength && this.props.maxLength > 0) if(text.length > this.props.maxLength) isOk = false;
		
		if(this.props.maxLineNum && this.props.maxLineNum > 0 && this._lineHeight > 0) {
			const sH = this.m_textarea.scrollHeight;
			const lineNum = Math.round((sH - this._paddingVer) / this._lineHeight);
			if(lineNum > this.props.maxLineNum) isOk = false;
		}

		if(isOk) {
			this._text = text;
			this._selStart = this.m_textarea.selectionStart;
			this._selEnd = this.m_textarea.selectionEnd;
		} else {
			this.m_textarea.value = this._text;
			
			this.m_textarea.setSelectionRange(this._selStart, this._selEnd);
			if(this.props.onLimit) this.props.onLimit();
		}
		return isOk;
	}

	private _onScroll = () => {
		this._calc();
	}
	private _onChange = () => {
        if(!this.m_textarea) return;
        this._checkLimit();
        this._calc();
        if(this.props.onChange) this.props.onChange(this.m_textarea.value);
	}
	private _onDone = () => {
		if(!this.m_textarea) return;
		if(this.props.onDone) this.props.onDone(this.m_textarea.value);
	}
	private _onResize = (w: number, h: number) => {
		this.m_bndH = h;
		this._calc();
	}
	private _onSelect = () => {
		if(!this.m_textarea) return;

		this._selStart = this.m_textarea.selectionStart;
		this._selEnd = this.m_textarea.selectionEnd;
	}
	private _detectLineHeight = () => {
        if(!this.m_textarea) return;
        const style = window.getComputedStyle(this.m_textarea);

        const fontSize = StrUtil.nteUInt(style.fontSize, 0);
        const lineHeight = style.lineHeight;
        const nHeight = StrUtil.nteUInt(lineHeight, 0);

        this._paddingVer = StrUtil.nteUInt(style.paddingTop, 0) + StrUtil.nteUInt(style.paddingBottom, 0);

        if(lineHeight && lineHeight.endsWith('%')) this._lineHeight = fontSize * nHeight / 100;
        else if(lineHeight && lineHeight.endsWith('px')) this._lineHeight = nHeight;
        else if(nHeight > 0) this._lineHeight = fontSize * nHeight;
        else this._lineHeight = fontSize * 1.2;

        // console.log('this._lineHeight', this._lineHeight, 'fontSize', fontSize, 'lineHeight', lineHeight, 'nHeight', nHeight);
        if(this._lineHeight === 101) this._isSamsungDevice = true;
	}
	private _refArea = (el: HTMLTextAreaElement|null) => {
		if(this.m_textarea || !el) return;
		this.m_textarea = el;

		this._detectLineHeight();
		if(this.props.on) {
			keyboard.setInputs(this.m_textarea);
			keyboard.setCallback(this._onChange, null, null, this._onDone);
		}
        // el.addEventListener('')
	}


	private _onFocus = (evt: React.FocusEvent) => {
		if(this.m_textarea && !this.props.on) {
			this.m_textarea.blur();
		}
	} 	
	private _onBlur = (evt: React.FocusEvent) => {
		if(!this.m_textarea || !this.props.on) return;

		if(this.m_pid < 0) this._focusArea();
	} 
	private _refWrap = (el: HTMLDivElement|null) => {
		if(this.m_wrap || !el) return;
		this.m_wrap = el;
	}
	private _refBar = (el: HTMLDivElement|null) => {
		if(this.m_bar || !el) return;
		this.m_bar = el;

		const cancelFnc = (evt: PointerEvent) => {
			this._releasePID();
		};

		const scrollFnc = (evt: PointerEvent) => {
            if(this.props.preventScrollByBar) return;
            else if(!this.m_textarea || !this.m_bar) return;
            else if(evt.pointerId !== this.m_pid) return;

            const cntH = this.m_textarea.scrollHeight;	
            const max = cntH - this.m_bndH;

            // let top = -max * evt.layerY / this.m_bndH;
            let top = -max * evt.clientY / this.m_bndH;
            const barH = this.m_bndH * 0.98;
            if(top > 0) top = 0;
            else if(top < -max) top = -max;


            this.m_sTop = -1 * top * barH / cntH;
            this.m_sH = this.m_bndH * barH / cntH;

            this.m_textarea.scrollTop = -top;
            this.m_top = top;
            this.m_cntH = cntH;
		};

		el.addEventListener('pointerdown', (evt: PointerEvent) => {
			if(this.props.preventScrollByBar || this.props.autoResize ) return;
			else if(!this.m_textarea || !this.m_bar || this.m_pid >= 0) return;
			this.m_pid = evt.pointerId;
			try {this.m_bar.setPointerCapture(this.m_pid);} catch(e) {}
			scrollFnc(evt);
		});
		el.addEventListener('pointercancel', cancelFnc);
		el.addEventListener('pointerup', cancelFnc);
		el.addEventListener('pointerleave', cancelFnc);

		el.addEventListener('pointermove', scrollFnc);
	}
	private _releasePID() {
		if(this.m_pid >= 0 && this.m_bar) {
			try { this.m_bar.releasePointerCapture(this.m_pid); } catch {}
			this.m_pid = -1;
		}
	}

	public componentDidUpdate(prev: IKTextArea) {
		if(this.props.on && !prev.on) {
			if(this.m_textarea) {
				keyboard.setInputs(this.m_textarea);
				keyboard.setCallback(this._onChange, null, null, this._onDone);
				this._focusArea();
				this._detectLineHeight();
			}
		} else if(!this.props.on && prev.on) {
			this._releasePID();
		}
		if(!this.props.view && prev.view) {
			this._releasePID();
			if(this.m_textarea) this.m_textarea.value = '';
			this._text = '';
			this._selStart = 0;
			this._selEnd = 0;
		} else if(this.props.view && !prev.view) {
			this._detectLineHeight();
		}
	}

	public render() {
        const {view, autoResize, className} = this.props;

        const maxLength = (this.props.limitByCode) ? undefined : this.props.maxLength;
        
        let tStyle;
        if(this._isSamsungDevice) tStyle = {lineHeight: '84px'};

        return (
                <div 
                    ref={this._refWrap} 
                    className={'k-tarea' + (className ? ' ' + className : '') + (autoResize ? ' auto-resize' : '')}
                >
                    <div 
                        className="k-tarea-bg" 
                        style={{top: this.m_top + 'px',height: this.m_cntH + 'px'}}
                    />
                    <textarea 
                        ref={this._refArea}
                        disabled={!this.props.on} 
                        onSelect={this._onSelect}
                        onScroll={this._onScroll}
                        onChange={this._onChange}
                        onFocus={this._onFocus}
                        onBlur={this._onBlur}
                        autoFocus={false}
                        autoCapitalize="off"
                        autoComplete="off"
                        autoCorrect="off"
                        rows={this.props.rows}
                        spellCheck={false}
                        maxLength={maxLength}
                        style={tStyle}
                    >
                        {this.props.children}
                    </textarea>
                    <div touch-action="none"  className="k-tarea-bar" hidden={this.m_sH <= 0} ref={this._refBar}>
                        <div className="k-tarea-drag" style={{top: this.m_sTop + 'px', height: this.m_sH + 'px', pointerEvents: 'none'}}/>
                    </div>
                    <ReactResizeDetector handleWidth={false} handleHeight={true} onResize={this._onResize}/>
                </div>
            
        );
    }

}