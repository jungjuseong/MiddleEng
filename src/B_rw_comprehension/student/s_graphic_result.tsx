import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { Observer, observer } from 'mobx-react';
import * as _ from 'lodash';

import * as common from '../common';

import TableItem from '../table-item';
import { SENDPROG, IStateCtx, IActionsCtx } from './s_store';

const SwiperComponent = require('react-id-swiper').default;
const SOPTION: SwiperOptions = {
	direction: 'vertical',
	observer: true,
	slidesPerView: 'auto',
	freeMode: true,
	mousewheel: true,
	noSwiping: true,
	followFinger: true,
	noSwipingClass: 'swiper-no-swiping',
	scrollbar: { el: '.swiper-scrollbar', draggable: true, hide: false },
};

interface ISGraphicResult {
	view: boolean;
	on: boolean;
	graphics: common.IGraphicOrganizer[];
	state: IStateCtx;
	actions: IActionsCtx;
}

@observer
class SGraphicResult extends React.Component<ISGraphicResult> {

	private m_swiper!: Swiper;
	private _cont!: JSX.Element;

	private _refSwiper = (el: SwiperComponent) => {
		if (this.m_swiper || !el) return;
		this.m_swiper = el.swiper;

		const _el = this.m_swiper.wrapperEl;
		const _h = _el.children[0].clientHeight;
		const _parent = _el.clientHeight;

		if (_h >= _parent) {
			_el.classList.remove('swiper-no-swiping');
			this.m_swiper.$wrapperEl[0].querySelector('.swiper-slide').classList.remove('swiper-no-swiping');
		} else {
			_el.classList.add('swiper-no-swiping');
			this.m_swiper.$wrapperEl[0].querySelector('.swiper-slide').classList.add('swiper-no-swiping');
		}
	}
	public componentDidUpdate(prev: ISGraphicResult) {

		if (this.m_swiper) {
			this.m_swiper.slideTo(0, 0);
			_.delay(() => {
				this.m_swiper.update();
				if (this.m_swiper.scrollbar) this.m_swiper.scrollbar.updateSize();

				const _el = this.m_swiper.wrapperEl;
				const _h = _el.children[0].clientHeight;
				const _parent = _el.clientHeight;

				if (_h >= _parent) {
					_el.classList.remove('swiper-no-swiping');
					this.m_swiper.$wrapperEl[0].querySelector('.swiper-slide').classList.remove('swiper-no-swiping');
				} else {
					_el.classList.add('swiper-no-swiping');
					this.m_swiper.$wrapperEl[0].querySelector('.swiper-slide').classList.add('swiper-no-swiping');
				}
			}, 100);
		}
	}

	public render() {
		const { view, on, graphics, state, actions, } = this.props;
		const data = actions.getData();

		const viewResult = state.graphicProg >= SENDPROG.COMPLETE;
		let tableClass;
		let jsx;
		if (data.visualizing_type === common.VisualType.TYPE_1) {
			tableClass = 'type_1';
			jsx = (
				<>
					<div className="top">
						<TableItem
							inview={on}
							graphic={graphics[0]}
							disableSelect={true}
							maxWidth={1188}
							className="type_1"
							headerColor={common.TYPE_COM_HEADERS[0]}
							optionBoxPosition="bottom"
							viewResult={viewResult}
							isStudent={true}
							idx={1}
						/>
					</div>
					<div className="link_line" />
					<div className="middle">
						<div>
							<TableItem
								inview={on}
								graphic={graphics[1]}
								disableSelect={true}
								maxWidth={583}
								className="type_1"
								headerColor={common.TYPE_COM_HEADERS[1]}
								optionBoxPosition="bottom"
								viewResult={viewResult}
								isStudent={true}
								idx={2}
							/></div>
						<div>
							<TableItem
								inview={on}
								graphic={graphics[2]}
								disableSelect={true}
								maxWidth={583}
								className="type_1"
								headerColor={common.TYPE_COM_HEADERS[1]}
								optionBoxPosition="bottom"
								viewResult={viewResult}
								isStudent={true}
								idx={3}
							/></div>
					</div>
					<div className="link_line_down" />
					<div className="bottom">
						<TableItem
							inview={on}
							graphic={graphics[3]}
							disableSelect={true}
							maxWidth={1188}
							className="type_1"
							headerColor={common.TYPE_COM_HEADERS[2]}
							optionBoxPosition="top"
							viewResult={viewResult}
							isStudent={true}
							idx={4}
						/>
					</div>
				</>
			);
		} else if (data.visualizing_type === common.VisualType.TYPE_2) {
			tableClass = 'type_2';
			jsx = (
				<>
					<div className="top">
						<div>
							<TableItem
								inview={on}
								graphic={graphics[0]}
								disableSelect={true}
								className="type_2"
								headerColor={common.TYPE_COM_HEADERS[0]}
								maxWidth={550}
								optionBoxPosition="bottom"
								viewResult={viewResult}
								isStudent={true}
								idx={1}
							/>
						</div>
						<span className="icon_arrow" />
						<div>
							<TableItem
								inview={on}
								graphic={graphics[1]}
								disableSelect={true}
								className="type_2"
								headerColor={common.TYPE_COM_HEADERS[1]}
								maxWidth={550}
								optionBoxPosition="bottom"
								viewResult={viewResult}
								isStudent={true}
								idx={2}
							/>
						</div>
					</div>
					<div className="link_line" />
					<div className="middle">
						<div>
							<TableItem
								inview={on}
								graphic={graphics[2]}
								disableSelect={true}
								className="type_2"
								headerColor={common.TYPE_COM_HEADERS[2]}
								maxWidth={770}
								optionBoxPosition="top"
								viewResult={viewResult}
								isStudent={true}
								idx={3}
							/>
						</div>
					</div>
				</>

			);
		} else if (data.visualizing_type === common.VisualType.TYPE_3) {
			tableClass = 'type_3';
			jsx = (
				<>
					<div className="top">
						<div>
							<TableItem
								inview={on}
								graphic={graphics[0]}
								disableSelect={true}
								className="type_3"
								headerColor={common.TYPE_COM_HEADERS[0]}
								maxWidth={397.1}
								optionBoxPosition="bottom"
								viewResult={viewResult}
								isStudent={true}
								idx={1}
							/>
						</div>
						<div>
							<TableItem
								inview={on}
								graphic={graphics[1]}
								disableSelect={true}
								className="type_3"
								headerColor={common.TYPE_COM_HEADERS[1]}
								maxWidth={397.1}
								optionBoxPosition="bottom"
								viewResult={viewResult}
								isStudent={true}
								idx={2}
							/>
						</div>
						<div>
							<TableItem
								inview={on}
								graphic={graphics[2]}
								disableSelect={true}
								className="type_3"
								headerColor={common.TYPE_COM_HEADERS[2]}
								maxWidth={397.1}
								optionBoxPosition="top"
								viewResult={viewResult}
								isStudent={true}
								idx={3}
							/>
						</div>
					</div>
				</>

			);
		} else if (data.visualizing_type === common.VisualType.TYPE_4) {
			tableClass = 'type_4';
			jsx = (
				<>
					<div className="top">
						<TableItem
							inview={on}
							graphic={graphics[0]}
							disableSelect={true}
							className="type_4"
							headerColor={common.TYPE_COM_HEADERS[0]}
							maxWidth={1219.9}
							optionBoxPosition="bottom"
							viewResult={viewResult}
							isStudent={true}
							idx={1}
						/>
						<TableItem
							inview={on}
							graphic={graphics[1]}
							disableSelect={true}
							className="type_4"
							headerColor={common.TYPE_COM_HEADERS[1]}
							maxWidth={1219.9}
							optionBoxPosition="bottom"
							viewResult={viewResult}
							isStudent={true}
							idx={2}
						/>
					</div>
				</>

			);
		} else if (data.visualizing_type === common.VisualType.TYPE_5) {
			tableClass = 'type_5';
			jsx = (
				<>
					<div className="top">
						<TableItem
							inview={on}
							graphic={graphics[0]}
							disableSelect={true}
							className="type_5"
							headerColor={common.TYPE_COM_HEADERS[0]}
							maxWidth={1219.9}
							optionBoxPosition="bottom"
							viewResult={viewResult}
							isStudent={true}
							idx={1}
						/>
						<TableItem
							inview={on}
							graphic={graphics[1]}
							disableSelect={true}
							className="type_5"
							headerColor={common.TYPE_COM_HEADERS[1]}
							maxWidth={1219.9}
							optionBoxPosition="bottom"
							viewResult={viewResult}
							isStudent={true}
							idx={2}
						/>
						<TableItem
							inview={on}
							graphic={graphics[2]}
							disableSelect={true}
							className="type_5"
							headerColor={common.TYPE_COM_HEADERS[2]}
							maxWidth={1219.9}
							optionBoxPosition="bottom"
							viewResult={viewResult}
							isStudent={true}
							idx={3}
						/>
					</div>
				</>

			);
		} else if (data.visualizing_type === common.VisualType.TYPE_6) {
			tableClass = 'type_6';
			jsx = (
				<>
					<div className="top">
						<div>
							<TableItem
								inview={on}
								graphic={graphics[0]}
								disableSelect={true}
								className="type_6"
								maxWidth={352}
								optionBoxPosition="bottom"
								viewResult={viewResult}
								isStudent={true}
								idx={1}
							/>
						</div>
						<div>
							<TableItem
								inview={on}
								graphic={graphics[1]}
								disableSelect={true}
								className="type_6"
								maxWidth={352}
								optionBoxPosition="bottom"
								viewResult={viewResult}
								isStudent={true}
								idx={2}
							/>
						</div>
						<div>
							<TableItem
								inview={on}
								graphic={graphics[2]}
								disableSelect={true}
								className="type_6"
								maxWidth={352}
								optionBoxPosition="bottom"
								viewResult={viewResult}
								isStudent={true}
								idx={3}
							/>
						</div>
					</div>
				</>

			);
		} else if (data.visualizing_type === common.VisualType.TYPE_7) {
			tableClass = 'type_7';
			jsx = (
				<>
					<div className="top">
						<div>
							<TableItem
								inview={on}
								graphic={graphics[0]}
								disableSelect={true}
								className="type_3"
								headerColor={common.TYPE_COM_HEADERS[0]}
								maxWidth={517}
								optionBoxPosition="bottom"
								viewResult={viewResult}
								isStudent={true}
								idx={1}
							/>
						</div>
						<div>
							<TableItem
								inview={on}
								graphic={graphics[1]}
								disableSelect={true}
								className="type_3"
								headerColor={common.TYPE_COM_HEADERS[1]}
								maxWidth={517}
								optionBoxPosition="bottom"
								viewResult={viewResult}
								isStudent={true}
								idx={2}
							/>
						</div>
					</div>
				</>
			);
		}

		let graphicTitle = data.app_graphic_title;
		let isTitle = <div className="title">{graphicTitle}</div>;
		if (!graphicTitle.trim()) isTitle = <></>;

		if (tableClass === 'type_3' || tableClass === 'type_6' || tableClass === 'type_7') {
			this._cont = (
				<div className={'table_box ' + tableClass}>
					{isTitle}
					{jsx}
				</div>
			);

		} else {
			this._cont = (
				<SwiperComponent {...SOPTION} ref={this._refSwiper}>
					<div className={'table_box ' + tableClass}>
						{isTitle}
						{jsx}
					</div>
				</SwiperComponent>
			);
		}

		return (
			<>
				{this._cont}
			</>
		);
	}
}

export default SGraphicResult;


