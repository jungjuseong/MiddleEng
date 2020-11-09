import * as React from 'react';
import * as _ from 'lodash';
import { observer } from 'mobx-react';
import { observable } from 'mobx';

import { ToggleBtn } from '@common/component/button';
import { App } from '../../../App';

import * as common from '../../common';
import { BtnAudio } from '../../../share/BtnAudio';

import { _getJSX, _getBlockJSX } from '../../../get_jsx';

const SwiperComponent = require('react-id-swiper').default;

interface ILetsTalk {
	view: boolean;
	onClosed: () => void;
	data: common.ILetstalk;
}
/*
2020 10 09 작업
_lets_talk.tsx 참고
이동윤
*/
@observer
class LetsTalk extends React.Component<ILetsTalk> {
	@observable private _view = false;
	@observable private _hint = false;
	@observable private _zoom = false;
	@observable private _zoomImgUrl = '';
	
	private _swiper?: Swiper;

	private _soption: SwiperOptions = {
		direction: 'vertical',
		observer: true,
		slidesPerView: 'auto',
		freeMode: true,
		mousewheel: true,			
		noSwiping: false,
		followFinger: true,
		scrollbar: {el: '.swiper-scrollbar',draggable: true, hide: false},	
	};

	private _jsx_sentence: JSX.Element;
	private _jsx_sample: JSX.Element;
	private _jsx_hint: JSX.Element;
	private _character: string;

	private _btnAudio?: BtnAudio;
	
	public constructor(props: ILetsTalk) {
		super(props);
		
		this._jsx_sentence = _getJSX(props.data.sentence);
		this._jsx_sample = _getBlockJSX(props.data.sample);
		this._jsx_hint = _getJSX(props.data.hint);

		const rnd = Math.floor(Math.random() * 3);
		if(rnd === 0) this._character = _project_ + 'teacher/images/letstalk_bear.png';
		else if(rnd === 1) this._character = _project_ + 'teacher/images/letstalk_boy.png';
		else this._character = _project_ + 'teacher/images/letstalk_girl.png';
	}

	private _viewHint = () => {
		App.pub_playBtnTab();
		this._hint = !this._hint;

		if(this._swiper) {
			this._swiper.slideTo(0, 0);
			this._swiper.update();
			if(this._swiper.scrollbar) this._swiper.scrollbar.updateSize();
		}
		_.delay(() => {
			if(this._swiper) {
				this._swiper.slideTo(0, 0);
				this._swiper.update();
				if(this._swiper.scrollbar) this._swiper.scrollbar.updateSize();
			}				
		}, 300);
	}

	private _refSwiper = (el: SwiperComponent) => {
		if(this._swiper || !el) return;
		this._swiper = el.swiper;
	}

	private _refAudio = (btn: BtnAudio) => {
		if(this._btnAudio || !btn) return;
		this._btnAudio = btn;
	}

	private _onClick = () => {
		if(this._btnAudio) this._btnAudio.toggle();
	}

	private _clickZoom1 = () => {
		if(!this._view) return;
		App.pub_playBtnTab();
		this._zoomImgUrl = App.data_url + this.props.data.img1;
		this._zoom = true;
	}

	private _clickZoom2 = () => {
		if(!this._view) return;
		App.pub_playBtnTab();
		this._zoomImgUrl = App.data_url + this.props.data.img2;
		this._zoom = true;
	}

 	public componentDidUpdate(prev: ILetsTalk) {
		if(this.props.view && !prev.view) {
			this._view = true;
			this._hint = false;
			this._zoom = false;
			this._zoomImgUrl = '';
			if(this._swiper) {
				this._swiper.slideTo(0, 0);
				this._swiper.update();
				if(this._swiper.scrollbar) this._swiper.scrollbar.updateSize();
			}
			_.delay(() => {
				if(this._swiper) {
					this._swiper.slideTo(0, 0);
					this._swiper.update();
					if(this._swiper.scrollbar) this._swiper.scrollbar.updateSize();
				}				
			}, 300);

		} else if(!this.props.view && prev.view) {
			this._view = false;	
			this._zoom = false;
			this._zoomImgUrl = '';
			App.pub_stop();
		}
	}
	
	public render() {
		const { view, data, } = this.props;

		const img2 = (data.img2 && data.img2 !== '') ? <img  src={App.data_url + data.img2} draggable={false}/> : undefined;

		return (
			<>
			<div className="question_bg" style={{ display: this._view ? '' : 'none' }}>
				<ToggleBtn className="btn_hint" on={this._hint} onClick={this._viewHint}/>

					<div className="popbox">
						<div className="image_box">
							<img  src={App.data_url + data.img1} draggable={false}/>
							{img2}
							<ToggleBtn className={'btn_zoom1' + (img2 !== undefined ? ' notonly' : '')} onClick={this._clickZoom1} />
							<ToggleBtn className="btn_zoom2" onClick={this._clickZoom2} view={img2 !== undefined} />
						</div>
						
						<div className="speechbubble_box" >
							<div>
								<div className={'balloon' + (this._hint ? ' view-hint' : '')}>
									<div className="sentence_box">
										<div>
											<BtnAudio className="btn_audio" url={App.data_url + data.audio} ref={this._refAudio} />
											<div className="question_box" onClick={this._onClick}>
												{this._jsx_sentence}
											</div>
										</div>
									</div>
									<SwiperComponent {...this._soption} ref={this._refSwiper}>
										<div>
											<div className={'sample' + (this._hint ? ' hide' : '')}>{this._jsx_sample}</div>
											<div className={'hint' + (this._hint ? '' : ' hide')}>{this._jsx_hint}</div>
										</div>
									</SwiperComponent>
								</div>
							</div>
						</div>
					</div>
				{/* </SwiperComponent> */}
			</div>
			{/* <ImgPopup url={this._zoomImgUrl} view={this._zoom} onClosed={this._closedZoom}/>  */}
			</>
		);
	}
}

export default LetsTalk;