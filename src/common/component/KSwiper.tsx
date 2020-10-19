import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { observable } from 'mobx';
import { observer } from 'mobx-react';

import { ToggleBtn } from './button';

const SwiperComponent = require('react-id-swiper').default;

import './kswiper.scss';

interface ISwiperOptions extends SwiperOptions {
	prevBtn?: string;
	nextBtn?: string;
	onEffectSound?: () => void;
}

@observer
class KSwiper extends React.Component<ISwiperOptions> {
	public static defaultProps: ISwiperOptions = {
		prevBtn: 'ks_btn_prev',
		nextBtn: 'ks_btn_next',
	};

	private m_comp!: SwiperComponent;
	// private m_prev!: ToggleBtn;
	// private m_next!: ToggleBtn;

	@observable private m_nextDisable = true;
	@observable private m_prevDisable = true;
	@observable private m_btnView = true;
	get swiper() {return this.m_comp.swiper;}

	constructor(props: ISwiperOptions) {
		super(props);
		this._refSwiper = this._refSwiper.bind(this);
		this._refPrev = this._refPrev.bind(this);
		this._refNext = this._refNext.bind(this);
		this._clickPrev = this._clickPrev.bind(this);
		this._clickNext = this._clickNext.bind(this);
	}

	private _refSwiper(el: SwiperComponent|null) {
		if(this.m_comp || !el) return;
		this.m_comp = el;
		const swiper = el.swiper;

		swiper.on('transitionEnd', () => {
			// console.log('transitionEnd, swiper.slides.length', swiper.slides.length);

			this.m_btnView = swiper.slides.length > 1;
			this.m_prevDisable = swiper.isBeginning ? true : false;
			this.m_nextDisable = swiper.isEnd ? true : false;
		});
	}
	private _refPrev(el: ToggleBtn<{}>|null) {
		// if(this.m_prev || !el) return;
		// this.m_prev = el;		
	}
	private _refNext(el: ToggleBtn<{}>|null) {
		// if(this.m_next || !el) return;
		// this.m_next = el;		
	}
	private _clickPrev(el: React.MouseEvent<HTMLElement>) {
		const swiper = this.m_comp.swiper;
		const idx = swiper.activeIndex;

		if(idx <= 0) {
			this.m_prevDisable = true;
		} else {
			if(idx === 1) this.m_prevDisable = true;
			if(this.props.onEffectSound) this.props.onEffectSound();
			swiper.slidePrev();
		}
	}
	private _clickNext(el: React.MouseEvent<HTMLElement>) {
		const swiper = this.m_comp.swiper;
		const len = swiper.slides.length;
		const idx = swiper.activeIndex;
		const gap = len - idx;

		if(gap <= 1) {
			this.m_nextDisable = true;
		} else {
			if(gap === 2) this.m_nextDisable = true;
			if(this.props.onEffectSound) this.props.onEffectSound();
			swiper.slideNext();
		}
	}
	/*
	componentDidUpdate(prevProps: ISwiperOptions) {
		// this.m_prevDisable = this.m_comp.swiper.isBeginning;
		// this.m_nextDisable = this.m_comp.swiper.isEnd;
		// console.log('KSwiper.componentDidUpdate', prevProps);
	}
	*/
	public render() {
		// console.log('render', this.m_prevDisable, this.m_nextDisable);
		const btnClass = (this.props.direction === 'vertical') ? 'v' : 'h';

		if(this.props.children) {
			//
		}
		return (
			<>
			<SwiperComponent ref={this._refSwiper} {...this.props}>
				{this.props.children}
			</SwiperComponent>
			<ToggleBtn 
				ref={this._refPrev} 
				onClick={this._clickPrev} 
				disabled={this.m_prevDisable}
				view={this.m_btnView}
				className={this.props.prevBtn + '_' + btnClass} 
			/>
			<ToggleBtn 
				ref={this._refNext} 
				onClick={this._clickNext} 
				disabled={this.m_nextDisable}
				view={this.m_btnView}
				className={this.props.nextBtn + '_' + btnClass}
			/>
			</>
		);
	}
}
export default KSwiper;