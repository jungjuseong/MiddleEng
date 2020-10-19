import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { observable } from 'mobx';
import { observer } from 'mobx-react';

import * as _ from 'lodash';

interface IWrapText {
	className?: string;
	text: JSX.Element;
	minSize?: number;
	maxSize?: number;
	lineHeight?: number;
	view: boolean;
	rcalcNum?: number;

	disabled?: boolean;
	textAlign?: 'left'|'center'|'right';
	onRef?: (el: HTMLElement) => void;

	onClick?: () => void;
}

@observer
class WrapText extends React.Component<IWrapText> {
	private _div: HTMLDivElement|null = null;
	private _bndW = 0;

	@observable private _width = 0;
	@observable private _recalc = false;
	private _numOfLine = 0;
	private _fontSize = 0;
	private _lineH = 0;
	private _textAlign: 'left'|'center'|'right' = 'center';

	constructor(props: IWrapText) {
		super(props);
		if(props.maxSize && props.minSize)  this._fontSize = props.maxSize;
		if(props.lineHeight)  this._lineH = props.lineHeight;
	}
	public _ref = (div: HTMLDivElement) => {
		if(this._div || !div) return;
		this._div = div;
		if(this.props.onRef) this.props.onRef(div);
	}
	private _calc = () => {
		if(!this._div || !this.props.view || this.props.disabled) return;
		// const rects = this._div.getClientRects();
		const childs = this._div.childNodes;

		const len = childs.length;
		if(len === 0) {
			window.requestAnimationFrame((f) => {
				this._calc();
			});
			return;
		}
		let numLine = 0;

		let middle = -100;
		let left = Number.MAX_SAFE_INTEGER;
		let right = Number.MIN_SAFE_INTEGER;
		let cntIdx = 0;

		// console.log('ssssssssssssssssssssss===>', left, right);

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
		if(numLine > 1 || this._recalc) {
			if(this.props.maxSize && this.props.minSize) {
				if(this._fontSize !== this.props.minSize) {
					this._fontSize = this.props.minSize;
					this._recalc = true;
					
					window.requestAnimationFrame((f) => {
						this._calc();
						return;
					});					
				} else {
					this._recalc = false;
					this._width = Math.ceil(right - left + 2);
				}
			} else this._width = Math.ceil(right - left + 2);
		} else if(cntIdx > 0) {
			this._width = Math.ceil(right - left + 2);
		}
	}

	private _onClick = () => {
		//
		if(this.props.onClick) this.props.onClick();
	}

	public componentWillReceiveProps(next: IWrapText) {
		let bCalc = false;
		if(next.view !== this.props.view) bCalc = next.view;
		// if(next.text !== this.props.text) bCalc = next.view;

		if(next.rcalcNum !== this.props.rcalcNum) bCalc = next.view;

		if(next.maxSize !== this.props.maxSize) bCalc = next.view;
		if(next.minSize !== this.props.minSize) bCalc = next.view;

		if(bCalc) {
			this._recalc = false;
			if(next.maxSize && next.minSize)  this._fontSize = next.maxSize;
			if(next.lineHeight)  this._lineH = next.lineHeight;
		}
	}

	public componentDidUpdate(prev: IWrapText) {
		if(!this._div) return;
		let maxCnt = -1;

		if(this.props.view && !this.props.disabled) {		
			if(this.props.view !== prev.view) maxCnt = 5;
			// if(this.props.text !== prev.text) bCalc = this.props.view;
			if(this.props.rcalcNum !== prev.rcalcNum) maxCnt = 1;

			if(prev.maxSize !== this.props.maxSize) maxCnt = 5;
			if(prev.minSize !== this.props.minSize) maxCnt = 5;
		}

		if( !this.props.disabled && (maxCnt >= 0 || (!this._recalc && this._width === 0))) {
			if(maxCnt >= 0) this._recalc = false;
			else maxCnt = 5;

			this._width = 0;
			let cnt  = 0;
			let ff = (f: number) => {
				if(!this._recalc && this._width === 0) {
					if(cnt < maxCnt ) {
						if(maxCnt === 1) {
							this._calc();
							this._width = 0;
						}
						window.requestAnimationFrame(ff);
					} else {


						this._calc();
					}
					cnt++;
				}
			};
			ff(-1);
		}
	}
	public componentDidMount() {
		if(!this.props.disabled && !this._recalc && this._width === 0) {
			let cnt  = 0;
			let ff = (f: number) => {
				if(!this._recalc && this._width === 0) {
					if(cnt < 10 ) {
						window.requestAnimationFrame(ff);
					} else {
						this._calc();
					}
				}
				cnt++;
			};
			ff(-1);
		}		
	}

	public render() {
		const {className, text} = this.props; 
		const style: React.CSSProperties = {
			whiteSpace: 'normal',
			textAlign: this._textAlign,
		};

		if(this._fontSize > 0) style.fontSize = this._fontSize + 'px';
		if(this._lineH > 0) style.lineHeight = this._lineH + '%';

		if(this.props.disabled) {
			style.width = '100%';
			style.display = 'inline-block';
			if(this.props.textAlign) {
				this._textAlign = this.props.textAlign;
				style.textAlign = this.props.textAlign;			

				if(this._numOfLine <= 1) this._textAlign = 'center';
				else this._textAlign = 'left';

				style.textAlign = this._textAlign;
			}
		} else if(!this._recalc && this._width > 0) {
			style.width = this._width + 'px';
			style.display = 'inline-block';

			if(this._numOfLine <= 1) this._textAlign = 'center';
			else this._textAlign = 'left';

			style.textAlign = this._textAlign;
		} else if(!this._recalc && this._width < 0) {
			style.width = '100%';
			style.display = 'inline-block';
			style.textAlign = 'center';
			this._textAlign = 'center';
		} else {
			style.width = '100%';
			style.display = 'inline-block';
			// style.color = 'rgba(0, 0, 0, 0.01)';

			if(this._numOfLine <= 1) this._textAlign = 'center';
			else this._textAlign = 'left';

			style.textAlign = this._textAlign;
		}
		// console.log(style, this._textAlign, this._numOfLine);

		return (
			<>
				<div ref={this._ref} className={className} style={style} onClick={this._onClick}>
					{text}
				</div>
			</>
		);

	}

}

export default WrapText;