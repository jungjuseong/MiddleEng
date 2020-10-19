import * as React from 'react';
import * as ReactDOM from 'react-dom';
import * as _ from 'lodash';
import { observable } from 'mobx';
import { observer, inject } from 'mobx-react';


import { ToggleBtn } from '@common/component/button';

import * as common from './common';
import { App } from '../App';
import { CoverPopup } from '../share/CoverPopup';

const SwiperComponent = require('react-id-swiper').default;

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
					const swiperPar = this.props.isStudent ? document.querySelector('.s_graphic_result') : document.querySelector('.GRAPHICORANIZER');
					const topOfSwiper = swiperPar!.querySelector('.top')!.getBoundingClientRect().top;
					const selectBoxTop = selectBox.top;
					if (optH > selectBoxTop - topOfSwiper) {
						this._boxPositon = 'bottom'
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

interface ITableItem {
	inview: boolean;
	graphic: common.IGraphicOrganizer;
	maxWidth: number;
	className: string;
	headerColor?: string | null;
	optionBoxPosition: 'top' | 'bottom';
	disableSelect?: boolean;
	viewResult?: boolean;
	isStudent?: boolean;
	viewCorrect?: boolean;
	onChange?: (value: string, idx: number) => void;
	viewBtn?: boolean;
	onClickBtn?: () => void;
	renderCnt?: number;
	idx?: number;
}
@inject()
@observer
class TableItem extends React.Component<ITableItem> {

	@observable private m_view = false;

	private _drop = false;
	private _jsx!: JSX.Element;
	private _jsx2!: JSX.Element;
	private SELECT_KEY = 0;
	private _cont!: JSX.Element;
	private _sbox: SelectBox[] = [];
	private _totalNumOfSentnc: number = 0;

	@observable private _opt = true;

	constructor(props: ITableItem) {
		super(props);
		const { answer, answer2, answer3, answer4 } = props.graphic;
		const answerList = [answer, answer2, answer3, answer4]
		for (let i = 0; i < answerList.length; i++) {
			if (answerList[i] == undefined || answerList[i] == 0) return;
			this._totalNumOfSentnc++;
		}
	}
	private _refSelect = (sbox: SelectBox, idx: number) => {
		if (this._sbox[idx] || !sbox || idx < 0) return;
		this._sbox[idx] = sbox;
		this._initSBox();
	}


	private _onSelect = (value: string, idx: number) => {
		const drops = this.props.graphic.app_drops;
		if (idx < drops.length && drops[idx]) {
			drops[idx].inputed = value;
		}
		if (this.props.onChange) this.props.onChange(value, idx);
	}

	private _parseBlock = (
		graphic: common.IGraphicOrganizer,
		onRef: (sbox: SelectBox, idx: number) => void,
		onChange: (value: string, idx: number) => void,
		boxPositon: 'top' | 'bottom' = 'bottom'
	) => {
		const question = graphic.question;
		const arrLine = question.split('<br>');

		let boxIdx = 0;

		const ret = (
			<>
				{arrLine.map((str, idx) => {
					const pattern = new RegExp(/\{(.*?)\}/g);
					let result = pattern.exec(str);
					let lastIdx = 0;
					let sTmp = '';
					let sTmpElmnt: React.ReactFragment;
					const sarr: React.ReactNode[] = [];

					//case1. 문장 안에 select_box 있음.
					while (result) {
						if (result.index > lastIdx) {
							sTmp = str.substring(lastIdx, result.index);
							sTmpElmnt = <span key={this.SELECT_KEY++} dangerouslySetInnerHTML={{ __html: sTmp }} />
							sarr.push(sTmpElmnt);
						}
						sTmp = result[1];
						if (boxIdx < graphic.app_drops.length) {
							sarr.push(((bIdx: number) =>
								<SelectBox
									key={this.SELECT_KEY++}
									ref={(sbox: SelectBox) => onRef(sbox, bIdx)}
									text={sTmp}
									correct={graphic.app_drops[bIdx].correct}
									options={graphic.app_drops[bIdx].choices}
									boxPositon={boxPositon}
									onChange={(value: string) => onChange(value, bIdx)}
									idx={this.props.idx}
									className={this.props.className}
									totalStncNum={this._totalNumOfSentnc}
									sentncNum={bIdx}
									isStudent={this.props.isStudent}
								/>
							)(boxIdx));
							boxIdx++;
						} else {
							sarr.push(sTmp);
						}

						lastIdx = pattern.lastIndex;
						result = pattern.exec(str);
					}

					//case2. 문장 안에 select_box 없음.
					let strAdd = ''; // Total예외
					if (lastIdx < str.length) {
						sTmp = str.substring(lastIdx);

						if (sTmp.indexOf('_add_') >= 0) {
							strAdd = 'add';
							sTmpElmnt = <span key={this.SELECT_KEY++} dangerouslySetInnerHTML={{ __html: sTmp.split('_add_')[1] }} />
						} else {
							sTmpElmnt = <span key={this.SELECT_KEY++} dangerouslySetInnerHTML={{ __html: sTmp }} />
						}
						sarr.push(sTmpElmnt);
					}

					return <li key={idx} className={strAdd}><div>{sarr}</div></li>;

				})}
			</>
		);
		return ret;
	}

	private _parseBlock2 = (
		graphic: common.IGraphicOrganizer
	) => {
		const title = graphic.title;
		const arrLine = title.split('<br>');

		let boxIdx = 0;

		const ret = (
			<>
				{arrLine.map((str, idx) => {
					const pattern = new RegExp(/\{(.*?)\}/g);
					let result = pattern.exec(str);
					let lastIdx = 0;
					let sTmp = '';
					const sarr: React.ReactNode[] = [];

					while (result) {
						if (result.index > lastIdx) {
							sTmp = str.substring(lastIdx, result.index);
							sarr.push(sTmp);
						}
						sTmp = result[1];
						if (boxIdx < graphic.app_drops.length) {
							boxIdx++;
						} else {
							sarr.push(sTmp);
						}

						lastIdx = pattern.lastIndex;
						result = pattern.exec(str);
					}

					let strAdd = ''; // Total예외
					if (lastIdx < str.length) {
						sTmp = str.substring(lastIdx);

						if (sTmp.indexOf('_add_') >= 0) {
							strAdd = 'add';
							sarr.push(sTmp.split('_add_'));
						} else {
							sarr.push(sTmp);
						}
					}

					return <em key={idx}>{sarr}</em>;

				})}
			</>
		);
		return ret;
	}

	public componentDidMount() {
		while (this._sbox.length > 0) this._sbox.pop();
		this._jsx = this._parseBlock(
			this.props.graphic,
			this._refSelect,
			this._onSelect,
			this.props.optionBoxPosition
		);
		this._jsx2 = this._parseBlock2(this.props.graphic);
	}
	public componentWillReceiveProps(next: ITableItem) {
		if (next.graphic !== this.props.graphic) {
			while (this._sbox.length > 0) this._sbox.pop();
			this._jsx = this._parseBlock(
				next.graphic,
				this._refSelect,
				this._onSelect,
				this.props.optionBoxPosition
			);
			this._jsx2 = this._parseBlock2(next.graphic);
		}
	}

	private _initSBox() {
		const drops = this.props.graphic.app_drops;
		this._sbox.forEach((sbox, idx) => {
			if (sbox) {
				sbox.clear();
				if (idx < drops.length && drops[idx]) {
					sbox.setValue(drops[idx].inputed);
				}
				sbox.setDisableSelect(this.props.disableSelect === true);
				sbox.setViewResult(this.props.viewResult === true);
				sbox.setViewCorrect(this.props.viewCorrect === true);
			}
		});
	}

	private m_swiper?: Swiper;

	private _refSwiper = (el: SwiperComponent) => {
		if (this.m_swiper || !el) return;
		this.m_swiper = el.swiper;
	}

	public componentDidUpdate(prev: ITableItem) {

		if (this.props.inview && !prev.inview) {
			if (this.m_swiper) {
				this.m_swiper.slideTo(0, 0);
				_.delay(() => {
					if (this.m_swiper) {
						this.m_swiper.update();
						if (this.m_swiper.scrollbar) this.m_swiper.scrollbar.updateSize();

						const _slide = this.m_swiper.wrapperEl.children[0].clientHeight;
						if (_slide <= this.m_swiper.height) this._opt = true;
						else this._opt = false;
					}
				}, 100);
			}
		}


		if (this.props.inview && !prev.inview) {
			this._initSBox();
		}

		if (this.props.renderCnt !== prev.renderCnt) {
			this._initSBox();
		}

		if (this.props.disableSelect !== prev.disableSelect) {
			this._sbox.forEach((sbox, idx) => {
				if (sbox) {
					sbox.setDisableSelect(this.props.disableSelect === true);
				}
			});
		}
		/* TO DO
		if(this.props.value !== prev.value) {
			if(this._sbox) {
				this._sbox.setValue(this.props.value);
			}
		}
		*/
		if (this.props.viewResult !== prev.viewResult) {
			this._sbox.forEach((sbox, idx) => {
				if (sbox) {
					sbox.setViewResult(this.props.viewResult === true);
				}
			});
		}
		if (this.props.viewCorrect !== prev.viewCorrect) {
			this._sbox.forEach((sbox, idx) => {
				if (sbox) {
					sbox.setViewCorrect(this.props.viewCorrect === true);
				}
			});
		}
	}


	public render() {
		let headStyle: React.CSSProperties = {};
		if (this.props.headerColor) {
			headStyle.backgroundColor = this.props.headerColor;
		}

		if (
			((this.props.className.startsWith('type_3') || this.props.className.startsWith('type_7')) && this.props.className.indexOf('zoom-in') < 0) ||
			this.props.className.startsWith('type_6')
		) {
			console.log(this.props.className.indexOf('zoom-in'));
			this._cont = (
				<SwiperComponent
					id="table-container"
					ref={this._refSwiper}
					direction="vertical"
					scrollbar={{ el: '.swiper-scrollbar', draggable: true, }}
					observer={true}
					slidesPerView="auto"
					freeMode={true}
					noSwiping={this._opt}
					followFinger={true}
					noSwipingClass={'swiper-no-swiping'}
				>
					<div className="content-box">
						<div>
							<ul className="content">{this._jsx}</ul>
						</div>
					</div>
				</SwiperComponent>
			);
		} else {
			this._cont = (
				<div className="content-box">
					<div>
						<ul className="content">{this._jsx}</ul>
					</div>
				</div>
			);
		}

		return (
			<div className={'table-item ' + this.props.className} style={{ maxWidth: this.props.maxWidth + 'px', zIndex: (_zIndex[0] === this.props.idx ? 100 : 0) }}>
				<div className="head" style={headStyle}><span>{this._jsx2}</span></div>
				{this._cont}
				<ToggleBtn className="table-item-btn" view={this.props.viewBtn === true} onClick={this.props.onClickBtn} />
			</div>
		);
	}
}

export default TableItem;