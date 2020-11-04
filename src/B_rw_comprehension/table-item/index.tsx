import * as React from 'react';
import { observable } from 'mobx';
import { observer, inject } from 'mobx-react';
import * as _ from 'lodash';

import { ToggleBtn } from '@common/component/button';

import * as common from '../common';
import SelectBox from './_select_box';

const SwiperComponent = require('react-id-swiper').default;

let _zIndex = observable([0]);

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
		const answerList = [answer, answer2, answer3, answer4];
		for (let i = 0; i < answerList.length; i++) {
			if (answerList[i] === undefined || answerList[i] === 0) return;
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

					// case1. 문장 안에 select_box 있음.
					while (result) {
						if (result.index > lastIdx) {
							sTmp = str.substring(lastIdx, result.index);
							sTmpElmnt = <span key={this.SELECT_KEY++} dangerouslySetInnerHTML={{ __html: sTmp }} />;
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

					// case2. 문장 안에 select_box 없음.
					let strAdd = ''; // Total예외
					if (lastIdx < str.length) {
						sTmp = str.substring(lastIdx);

						if (sTmp.indexOf('_add_') >= 0) {
							strAdd = 'add';
							sTmpElmnt = <span key={this.SELECT_KEY++} dangerouslySetInnerHTML={{ __html: sTmp.split('_add_')[1] }} />;
						} else {
							sTmpElmnt = <span key={this.SELECT_KEY++} dangerouslySetInnerHTML={{ __html: sTmp }} />;
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