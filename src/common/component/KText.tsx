import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { observable } from 'mobx';
import { observer } from 'mobx-react';
import ReactResizeDetector from 'react-resize-detector';
import * as _ from 'lodash';
import * as StrUtil from '../util/StrUtil';


interface IKText {
	refresh: number;
	fixedFontSize: boolean;
	hAlign: 'left'|'center';
	vAlign: 'top'|'middle'|'bottom';
	wordBreak: 'keep-all'|'normal';
	onClick?: (evt: React.MouseEvent<HTMLElement>) => void;
	children: React.ReactNode;
}

@observer
export class KText extends React.Component<IKText> {
	private m_i!: HTMLDivElement;
	private m_o!: HTMLDivElement;
	private m_ow = -1;
	private m_oh = -1;
	private m_iw = -1;
	private m_ih = -1;
	private m_lineH = -1;
	private m_fontSize = -1;

	@observable private m_view = false;
	@observable private m_sFontSize = 'unset';
	private m_lineCnt = 1;
	private f_calc: () => void;
	constructor(props: IKText) {
		super(props);
		// this._onResizeI = this._onResizeI.bind(this);
		this._onResizeO = this._onResizeO.bind(this);

		this._refI = this._refI.bind(this);

		this.f_calc = _.debounce(() => {
			if(this.m_view) return;
			if(this.m_lineH <= 0 || this.m_fontSize < 2 || this.m_ow <= 0 || this.m_oh <= 0) return;
	
			// const rect = this.m_i.getBoundingClientRect();
			this.m_iw = this.m_i.offsetWidth;
			this.m_ih = this.m_i.offsetHeight;

			if(this.m_iw <= 0 || this.m_ih <= 0) return;

			// console.log('this.m_iw * this.m_ih', this.m_iw, this.m_ih);
			// console.log('this.m_ow * this.m_oh', this.m_ow, this.m_oh);

			// console.log('this.m_lineH * this.m_fontSize', this.m_lineH, this.m_fontSize);
			// console.log();

			if(this.m_ih <= this.m_oh) {
				this.m_lineCnt = Math.round(this.m_ih / (this.m_lineH * this.m_fontSize));
				this.m_view = true;
			} else {
				this.m_fontSize--;
				this.m_sFontSize = this.m_fontSize + 'px';
			}

			// console.log(this.props.children, this.m_iw + ' * ' + this.m_ih, this.m_view, this.m_lineCnt, this.m_lineH * this.m_fontSize);

		}, 10);
	}
	
	private _refI(el: HTMLDivElement|null) {
		if(this.m_i || !el) return;
		this.m_i = el;
		const style = window.getComputedStyle(el);
		const s = StrUtil.nteString(style.lineHeight, '');

		this.m_fontSize = StrUtil.nteUInt(style.fontSize, 12);
		this.m_lineH = StrUtil.nteUInt(style.lineHeight, 120) / 100;
		this.f_calc();
	}
	private _onResizeO(w: number, h: number) {
		this.m_ow = w;
		this.m_oh = h;
		this.f_calc();
	}

	public componentDidUpdate(prev: IKText) {
		if(this.props.children !== prev.children || this.props.refresh !== prev.refresh) {
			this.m_view = false;
			this.f_calc();
		}
	}


	public render() {
		const outer: React.CSSProperties = {
			position: 'relative',
			width: '100%',
			height: '100%',
			overflow: 'hidden',
		};

		const inner: React.CSSProperties = {
			display: 'inline',
			wordBreak: this.props.wordBreak,
			opacity: 0,
			height: 'auto',
		};
		const tfs: string[] = [];

		inner.fontSize = this.m_sFontSize;
		if(this.m_view) {
			inner.opacity = 1;
			inner.position = 'relative';
			inner.display = 'inline-block';
			if(this.m_lineCnt > 1 && this.props.hAlign === 'center') {
				outer.textAlign = 'center';
				
				inner.textAlign = 'left';
				inner.width = (this.m_iw + 0.5) + 'px';
			} else {
				inner.width = '100%';
				inner.textAlign = this.props.hAlign;
			}
		
			if(this.props.vAlign === 'top') {
				inner.top = '0px';
			} else if(this.props.vAlign === 'bottom') {
				inner.bottom = '0px';
			} else {
				inner.top = '50%';
				tfs.push('translateY(-50%)');
			}

			inner.transform = tfs.join(' ');

		}

		



		return (
			<div style={outer} onClick={this.props.onClick}>
				<div style={inner} ref={this._refI}>{this.props.children}</div>
				<ReactResizeDetector handleWidth={true} handleHeight={true} onResize={this._onResizeO}/>
			</div>

		);
	}
}