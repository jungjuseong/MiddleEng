import * as React from 'react';
import * as _ from 'lodash';

import { observable } from 'mobx';
import { observer } from 'mobx-react';

import { ToggleBtn } from '@common/component/button';
import { App } from '../../App';

interface IOptionBox {
	text: string;
	className: string;
	onClick: (value: string) => void;
}

class OptionBox extends React.Component<IOptionBox> {
	private _onClick = () => {
		this.props.onClick(this.props.text);
		App.pub_playBtnTab();
	}
	public render() {
		const { className, text, onClick } = this.props;
		return <div className={className} onClick={this._onClick}>{text}</div>;
	}
}

let OPT_Z_IDX = 2;
let _zIndex = observable([0]);

interface ISelectBox {
	text: string;
	correct: string;
	options: string[];
	boxPositon: 'top' | 'bottom';
	onChange: (value: string) => void;
	idx?: number;
	className: string;
	totalStncNum: number;
	sentncNum: number;
	isStudent?: boolean;
}

@observer
class SelectBox extends React.Component<ISelectBox> {
	@observable private _value = '';
	@observable private _on = false;

	private _disableSelect = false;
	@observable private _viewResult = false;
	@observable private _viewCorrect = false;

	private _box?: HTMLDivElement;
	private _zidx = 2;
	private _boxPositon: 'top' | 'bottom';

	constructor(props: ISelectBox) {
		super(props);
		this._boxPositon = props.boxPositon;
	}

	private _onSelect = (value: string) => {
		if (!this._on) return;
		this._on = false;

		if (!this._disableSelect) {
			this._value = value;
			this.props.onChange(value);
		}
	}
	private _toggle = () => {
		App.pub_playBtnTab();
		if (this._box) {
			const optBox = this._box.querySelector('.options-box') as HTMLElement;
			const drop = this._box.querySelector('.options-box.on') as HTMLElement;

			if (optBox) {
				/*select-box의 방향 조정*/
				const selectBox = this._box.getBoundingClientRect();
				let par = this._box!.parentElement;
				const borderClass = this.props.className.startsWith('type_6') ? 'swiper-container' : 'table-item';

				while (par && !par.className.startsWith(borderClass)) {
					par = par.parentElement;
				}
				const selectBoxBottom = selectBox.bottom;
				const tableItmBottom = par!.getBoundingClientRect().bottom;
				const optH = optBox.offsetHeight;
				const gapB = tableItmBottom - selectBoxBottom;

				this._boxPositon = optH < gapB ? 'bottom' : 'top';

				/*result page가 아닌 경우 아래의 swiper 예외처리 필요 없음*/
				if (!this.props.className.includes('zoom-in')) {
					/*optionsBox를 위로 올렸을 때, swiper에 의해 위쪽이 잘려나가면 아래 방향으로 바꾼다*/
					const swiperPar = this.props.isStudent ? document.querySelector('.s_graphic_result') : document.querySelector('.GraphicOrganizer');
					const topOfSwiper = swiperPar!.querySelector('.top')!.getBoundingClientRect().top;
					const selectBoxTop = selectBox.top;
					if (optH > selectBoxTop - topOfSwiper) {
						this._boxPositon = 'bottom';
					}
				}

			} else this._boxPositon = this.props.boxPositon;


			if (this._on && drop) {
				this._zidx = 2;
				this._on = false;
			} else {
				// if (this.props.className.indexOf('zoom-in') < 0) {
				const allSelect = document.querySelectorAll('.select-box');
				if (allSelect) {
					for (let i = 0; i < allSelect.length; i++) {
						const btn = allSelect[i].querySelector('.btn-drop') as HTMLElement;
						const box = allSelect[i].querySelector('.options-box') as HTMLElement;
						if (btn) btn.classList.remove('on');
						if (box) box.classList.remove('on');
					}
				}

				if (this._on) {
					this._on = false;
					_.delay(() => {
						this._zidx = OPT_Z_IDX++;
						this._on = true;
					}, 10);
				} else {
					this._zidx = OPT_Z_IDX++;
					this._on = true;
				}
			}

			if (this.props.idx && this.props.idx >= 0) {
				_zIndex[0] = this.props.idx;
			}
		}
	}
	public off() {
		App.pub_playBtnTab();
		this._on = false;
	}
	public clear() {
		this._zidx = 2;
		this._value = '';
		this._disableSelect = false;
		this._viewResult = false;
		this._viewCorrect = false;
		this._on = false;
	}
	public setValue(val?: string) {
		let chk = '';
		for (let i = 0; i < this.props.options.length; i++) {
			if (this.props.options[i] === val) {
				chk = val;
				break;
			}
		}
		this._value = chk;
	}
	public setDisableSelect(val: boolean) {
		this._disableSelect = val;
	}
	public setViewResult(val: boolean) {
		this._viewResult = val;
		if (val) this._on = false;
	}
	public setViewCorrect(val: boolean) {
		if (val) this._value = this.props.correct;
		this._viewCorrect = val;
		this._on = false;
	}
	private _refBox = (box: HTMLDivElement) => {
		if (this._box || !box) return;
		this._box = box;
	}
	private _boxDown = (evt: React.MouseEvent) => {
		if (!evt) return;

		this._mouseDown(evt.nativeEvent);
	}

	private _mouseDown = (evt: Event) => {
		if (!evt) return;
		evt.preventDefault();
		evt.stopPropagation();
		evt.stopImmediatePropagation();
		this._toggle();
	}

	public render() {
		const { text, correct, options, boxPositon } = this.props;

		let value = this._value;
		let textClass = '';
		if (this._viewCorrect) {
			value = correct;
		} else if (this._viewResult) {
			if (this._value === correct) textClass = 'correct';
			else textClass = 'wrong';
			value = correct;
		}

		return (
			<div className="select-box" ref={this._refBox} >
				<div className={'text-box ' + textClass} onPointerDown={this._boxDown} >
					<div className="size-box">{options.map((str, idx) => <div key={idx}>{str}</div>)}</div>
					{value}
				</div>
				<ToggleBtn className="btn-drop" on={this._on} onMouseDown={this._mouseDown} />
				<div className={'options-box ' + this._boxPositon + (this._on ? ' on' : '')} style={{ zIndex: this._zidx }}>{options.map((str, idx) => {
					let optClass = '';
					if (this._viewResult) {
						if (str === correct) optClass = 'correct';
						else if (str === this._value) optClass = 'on';
						else optClass = 'wrong';

					} else if (str === this._value) optClass = 'on';

					return <OptionBox key={idx} className={optClass} text={str} onClick={this._onSelect} />;
				})}</div>
			</div>
		);
	}
}

export default SelectBox;