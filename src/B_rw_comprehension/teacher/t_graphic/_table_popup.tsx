import * as React from 'react';
import * as _ from 'lodash';
import { observable } from 'mobx';
import { observer } from 'mobx-react';

import { SENDPROG } from '../t_store';
import { App } from '../../../App';

import * as common from '../../common';

import { CoverPopup } from '../../../share/CoverPopup';
import TableItem from '../../table-item';

const SwiperComponent = require('react-id-swiper').default;

const m_soption: SwiperOptions = {
	direction: 'vertical',
	observer: true,
	slidesPerView: 'auto',
	freeMode: true,
	mousewheel: true,
	noSwiping: true,
	noSwipingClass: 'swiper-no-swiping',
	followFinger: true,
	scrollbar: { el: '.swiper-scrollbar', draggable: true, hide: false },
};

interface ITablePopup {
	className: string;
	headerColor?: string | null;
	prog: SENDPROG;
	graphic: common.IGraphicOrganizer;
	renderCnt: number;
	onChange: (value: string, idx: number) => void;
	onClosed: () => void;
}


@observer
class TablePopup extends React.Component<ITablePopup> {
	@observable private m_view = false;

	private m_swiper?: Swiper;
	private _onClose = () => {
		App.pub_playBtnTab();
		this.m_view = false;
	}
	private _refSwiper = (el: SwiperComponent) => {
		if (this.m_swiper || !el) return;
		this.m_swiper = el.swiper;
	}

	public componentDidUpdate(prev: ITablePopup) {
		if (this.props.className !== '' && prev.className === '') {
			this.m_view = true;

			if (this.m_swiper) {
				this.m_swiper.slideTo(0, 0);
				_.delay(() => {
					if (this.m_swiper) {
						this.m_swiper.update();
						if (this.m_swiper.scrollbar) this.m_swiper.scrollbar.updateSize();

						const _el = this.m_swiper.wrapperEl;
						const _h = _el.children[0].clientHeight;
						const _parent = _el.clientHeight;

						if (_h > _parent) {
							_el.classList.remove('swiper-no-swiping');
							this.m_swiper.$wrapperEl[0].querySelector('.swiper-slide').classList.remove('swiper-no-swiping');
						} else {
							_el.classList.add('swiper-no-swiping');
							this.m_swiper.$wrapperEl[0].querySelector('.swiper-slide').classList.add('swiper-no-swiping');
						}
					}
				}, 100);
			}

		} else if (this.props.className === '' && prev.className !== '') {
			this.m_view = false;
		}
	}
	public render() {
		const { className, prog, graphic, renderCnt } = this.props;
		return (
			<CoverPopup className="table_popup" view={this.m_view} onClosed={this.props.onClosed}>
				<SwiperComponent {...m_soption} ref={this._refSwiper}>
					<div>

						<TableItem
							viewCorrect={prog === SENDPROG.COMPLETE}
							disableSelect={prog === SENDPROG.COMPLETE}
							inview={this.props.className !== ''}
							graphic={graphic}
							className={this.props.className + ' zoom-in'}
							headerColor={this.props.headerColor}
							maxWidth={1030}
							optionBoxPosition="bottom"
							viewBtn={true}
							renderCnt={renderCnt}
							onClickBtn={this._onClose}
							onChange={this.props.onChange}
						/>
					</div>
				</SwiperComponent>
			</CoverPopup>
		);
	}
}

export default TablePopup;