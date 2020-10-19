import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { observable } from 'mobx';
import { observer } from 'mobx-react';

import * as _ from 'lodash';
import ReactResizeDetector from 'react-resize-detector';

interface IWrapText {
	className?: string;
	view: boolean;
	maxSize?: number;
	minSize?: number;
	lineHeight?: number;
	maxLineNum?: number;      					// minSize로 바꿀 최대 라인 수
	textAlign?: 'left'|'center'|'right';
	rcalcNum?: number;
	viewWhenInit?: boolean;
	onRef?: (el: HTMLElement) => void;
	onClick?: (evt?: React.MouseEvent<HTMLElement>) => void;
}

@observer
class WrapTextNew extends React.Component<IWrapText> {
	private _div: HTMLDivElement|null = null;
	private _bndW = 0;

	@observable private _width = 0;
	@observable private _fontSize = 0;
	private _myW = 0;
	private _numOfLine = 0;

	constructor(props: IWrapText) {
		super(props);
		this._fontSize = this.props.maxSize ? this.props.maxSize : 0;
	}
	public _ref = (div: HTMLDivElement) => {
		if(this._div || !div) return;
		this._div = div;
		if(this.props.onRef) this.props.onRef(div);
	}

	private _canCalc() {
		if(!this.props.view) return false;
		else if(this._myW <= 0) return false;
		else if(!this._div) return false;
		else if(this._width > 0) return false;
		else return true;	
	}
	private _aniFrame = (f: number) => {
		if(!this._canCalc()) return;

		this._calc();
		window.requestAnimationFrame(this._aniFrame);
	}

	private _calc() {
		if(!this._canCalc()) return;
		else if(!this._div) return;

		const brect = this._div.getBoundingClientRect();

		const gap = (this._myW - brect.width);


		// console.log('calc gap', this._myW, brect);

		if(gap < -1 || gap > 1) {
			return;
		}


		const childs = this._div.childNodes;

		const len = childs.length;
		if(len === 0) return;
		
		let numLine = 0;

		let middle = -100;
		let left = Number.MAX_SAFE_INTEGER;
		let right = Number.MIN_SAFE_INTEGER;
		let cntIdx = 0;

		childs.forEach((node, idx) => {
			let marginR = 0;
			let marginL = 0;
			if(node instanceof HTMLElement) {
				const el = node as HTMLElement;
				const s = window.getComputedStyle(el);
				
				if(s.position === 'absolute') {
					//
				} else if(s.display === 'inline') {
					let mr = s.marginRight ? parseInt(s.marginRight, 10) : 0;
					let ml = s.marginLeft ? parseInt(s.marginLeft, 10) : 0;
					if(isNaN(mr)) mr = 0;
					if(isNaN(ml)) ml = 0;

					const rects = el.getClientRects();

					for(let i = 0; i < rects.length; i++) {
						const rect = rects.item(i);
						if(!rect) continue;
						const rtop = rect.top;
						const rbottom = rect.bottom;
						const rleft = rect.left - ml;
						const rright = rect.right + mr;
		
					
						if(cntIdx === 0) {
							middle = (rtop + rbottom) / 2;
							numLine = 1;
						} else {
							if(middle < rtop || middle > rbottom) {
								middle = (rtop + rbottom) / 2;
								numLine++;					
							}
						}
					
						left = Math.min(left, rleft);
						right = Math.max(right, rright);

						cntIdx++;
					}
				
				} else {
					let rect = el.getBoundingClientRect();

					let mr = s.marginRight ? parseInt(s.marginRight, 10) : 0;
					let ml = s.marginLeft ? parseInt(s.marginLeft, 10) : 0;
					if(isNaN(mr)) mr = 0;
					if(isNaN(ml)) ml = 0;
					marginR = mr;
					marginL = ml;

					const rtop = rect.top;
					const rbottom = rect.bottom;
					const rleft = rect.left - marginL;
					const rright = rect.right + marginR;
	
					if(rbottom - rtop > 0) {
						if(cntIdx === 0) {
							middle = (rtop + rbottom) / 2;
							numLine = 1;
						} else {
							if(middle < rtop || middle > rbottom) {
								middle = (rtop + rbottom) / 2;
								numLine++;					
							}
						}
		
						left = Math.min(left, rleft);
						right = Math.max(right, rright);

						cntIdx++;
					}
				}

			} else {
				const range = document.createRange();
				range.selectNodeContents(node);
				const rects = range.getClientRects();

				for(let i = 0; i < rects.length; i++) {
					const rect = rects.item(i);
					if(!rect) continue;
					const rtop = rect.top;
					const rbottom = rect.bottom;
					const rleft = rect.left;
					const rright = rect.right;
	
				
					if(cntIdx === 0) {
						middle = (rtop + rbottom) / 2;
						numLine = 1;
					} else {
						if(middle < rtop || middle > rbottom) {
							middle = (rtop + rbottom) / 2;
							numLine++;					
						}
					}
	
					left = Math.min(left, rleft);
					right = Math.max(right, rright);

					cntIdx++;
				}
			}
	
		});
		this._numOfLine = numLine;

		// console.log(this.props.maxLineNum, this.props.maxLineNum < 1); 
		let maxLineNum = this.props.maxLineNum ? this.props.maxLineNum : 1;
		if(maxLineNum < 1) maxLineNum = 1;

		// console.log(' canc, numLine', this._fontSize, numLine);
		if(numLine > maxLineNum) {
			const minSize = this.props.minSize ? this.props.minSize : 0;
			if(this._fontSize > 0 && minSize > 0 && this._fontSize > minSize) {
				this._fontSize--;
			} else this._width = Math.ceil(right - left + 2);
		} else if(cntIdx > 0) {
			this._width = Math.ceil(right - left + 2);
		}

	}

	private _resized = (w: number, h: number) => {
		this._myW = w;
		window.requestAnimationFrame(this._aniFrame);
	}

	public componentDidUpdate(prev: IWrapText) {
		if(this.props.view && !prev.view) {
			this._fontSize = this.props.maxSize ? this.props.maxSize : 0;
			this._width = 0;
			window.requestAnimationFrame(this._aniFrame);
		} else if(!this.props.view && prev.view) {
			this._width = 0;
		}
		if(this.props.view && this.props.rcalcNum && this.props.rcalcNum !== prev.rcalcNum) {
			this._fontSize = this.props.maxSize ? this.props.maxSize : 0;
			this._width = 0;
			window.requestAnimationFrame(this._aniFrame);
		}

		if(this._fontSize === 0 && this.props.maxSize) {
			this._fontSize = this.props.maxSize;
		}

	}

	public render() {
		const {className} = this.props; 
		const style: React.CSSProperties = {
			whiteSpace: 'normal',
		};
		// console.log('render', this._fontSize);
		if(this._fontSize > 0) style.fontSize = this._fontSize + 'px';
		if(this.props.lineHeight) style.lineHeight = this.props.lineHeight + '%';

		// console.log(' render', this._fontSize);

		let textAlign: 'left'|'center'|'right';
		if(this._width > 0) {
			style.width = this._width + 'px';
			style.display = 'inline-block';

			
			if(this.props.textAlign) textAlign = this.props.textAlign;
			else if(this._numOfLine <= 1) textAlign = 'center';
			else textAlign = 'left';

			style.textAlign = textAlign;
		} else {
			style.width = '100%';
			style.display = 'inline-block';
			if(!this.props.viewWhenInit) style.opacity = 0.01;

			if(this.props.textAlign) textAlign = this.props.textAlign;
			else if(this._numOfLine <= 1) textAlign = 'center';
			else textAlign = 'left';

			style.textAlign = textAlign;
		}
		return (
			<>
				<div ref={this._ref} className={className} style={style} onClick={this.props.onClick}>
					{this.props.children}
					<ReactResizeDetector handleWidth={true} handleHeight={true} onResize={this._resized}/>
				</div>
			</>
		);

	}

}

export default WrapTextNew;