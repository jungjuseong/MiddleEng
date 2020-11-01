import * as React from 'react';
import * as _ from 'lodash';
import { observer } from 'mobx-react';
import { observable } from 'mobx';

import { ToggleBtn } from '@common/component/button';

import { App } from '../../../App';

import { CoverPopup } from '../../../share/CoverPopup';
import * as common from '../../common';

import { BtnAudio } from '../../../share/BtnAudio';
import ImgPopup from './ImgPopup';

const SwiperComponent = require('react-id-swiper').default;

function _sentence2jsx(
	sentence: string,
	blockClass: string|null = 'block',
	blockStr?: string,
	isBlockWorkWrap?: boolean,
	splitClass?: string,
	) {
		const pattern = new RegExp(/\{(.*?)\}/g);
		let keyObj = {key: 0};

		const ret: JSX.Element[] = [];
		const arrLine = sentence.replace(/\s\s+/ig, ' ').replace(/<\s*br\s*\/*\s*>/ig, '<br>').split('<br>');

		let jsx;
		arrLine.forEach((line, idx) => {
			if(blockClass) {
				let result = pattern.exec(line);
				let lastIdx = 0;
				let sTmp = '';
				let arr: React.ReactNode[] = [];

				while (result) {
					if(result.index > lastIdx) {
						sTmp = line.substring(lastIdx, result.index);
						arr.push(_splitSpace(sTmp, keyObj, splitClass));
					}
					sTmp = result[1];
					let str = blockStr;
					if(!str) str = sTmp;
					
					if(isBlockWorkWrap) jsx = _splitSpace(str, keyObj, splitClass);
					else jsx = str;

					arr.push((<span key={keyObj.key++} className={blockClass} data-correct={sTmp}>aaaaaaaaaa</span>));
			
					lastIdx = pattern.lastIndex;
					result = pattern.exec(line);
				}
				if(lastIdx < line.length) {
					sTmp = line.substring(lastIdx);
					arr.push(_splitSpace(sTmp, keyObj, splitClass));
				}
				ret[idx] = <React.Fragment key={keyObj.key++}>{arr}</React.Fragment>;
			} else {
				ret[idx] = <React.Fragment key={keyObj.key++}>{_splitSpace(line, keyObj, splitClass)}</React.Fragment>;
			}
			
		});
		return ret;
}

function _splitSpace(sentence: string, keyObj: {key: number}, splitClass?: string) {
	const arrS = sentence.split(/\s/g);
	const pattern = new RegExp(/[\.\!\?\s]/g);

	let ret: JSX.Element[] = [];
	for(let i = 0; i < arrS.length; i++ ) {
		const txt = arrS[i];
		if(txt === '') continue;

		let arr: React.ReactNode[] = [];

		let result = pattern.exec(txt);
		let lastIdx = 0;
		let sTmp = '';
		
		while (result) {
			if(result.index > lastIdx) {
				sTmp = txt.substring(lastIdx, result.index);
				arr.push(<span key={keyObj.key++}>{sTmp}</span>);
			}
			sTmp = result[0];

			arr.push(sTmp);
	
			lastIdx = pattern.lastIndex;
			result = pattern.exec(txt);
		}
		if(lastIdx < txt.length) {
			sTmp = txt.substring(lastIdx);
			arr.push(<span key={keyObj.key++}>{sTmp}</span>);
		}

		ret.push(<span key={keyObj.key++} className={splitClass}>{arr.map((node) => node)}</span>);
	}
	return ret;
}

function _getJSX(text: string) {
	const els = _sentence2jsx(text, 'block', undefined, true, 'word');
	return (
		<>{els.map((el, idx) => {
			if(idx === els.length - 1) return el;
			else return <React.Fragment key={idx}>{el}<br/></React.Fragment>;
		})}</>
	);
}

function _getBlockJSX(text: string) {
	const els = _sentence2jsx(text, 'block', undefined, true, 'word');
	return (
		<>{els.map((el, idx) => {
			if(idx === els.length - 1) return el;
			else return <React.Fragment key={idx}>{el}<br/></React.Fragment>;
		})}</>
	);
}

interface ILetsTalk {
	view: boolean;
	onClosed: () => void;
	data: common.ILetstalk;
}

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

	private _onClosepop = () => {
		App.pub_playBtnTab();
		this._view = false;
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

	private _closedZoom = () => {
		this._zoom = false;
		this._zoomImgUrl = '';
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
		const { view, onClosed, data, } = this.props;

		const img2 = (data.img2 && data.img2 !== '') ? <img  src={App.data_url + data.img2} draggable={false}/> : undefined;
		const zoomImg = App.data_url + data.img1;

		return (
			<>
			<CoverPopup className="lets_talk" view={this._view} onClosed={onClosed} >

				<div className="pop_bg">
					<ToggleBtn className="btn_letstalk_close" onClick={this._onClosepop}/>
					<ToggleBtn className="btn_hint" on={this._hint} onClick={this._viewHint}/>

						<div className="popbox">

							<div className="image_box">
								<img  src={App.data_url + data.img1} draggable={false}/>
								{img2}
								<ToggleBtn className={'btn_zoom1' + (img2 !== undefined ? ' notonly' : '')} onClick={this._clickZoom1} />
								<ToggleBtn className="btn_zoom2" onClick={this._clickZoom2} view={img2 !== undefined} />
							</div>
							<div className="sentence_box">
								<div>
									<BtnAudio className="btn_audio" url={App.data_url + data.audio} ref={this._refAudio} />
									<div className="question_box" onClick={this._onClick}>
										{this._jsx_sentence}
									</div>
								</div>
							</div>
							<div className="speechbubble_box" >
								<div>
									<div className="char_box">
										<img src={this._character} draggable={false}/> 
									</div>
									<div className={'balloon' + (this._hint ? ' view-hint' : '')}>
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
			</CoverPopup>
			<ImgPopup url={this._zoomImgUrl} view={this._zoom} onClosed={this._closedZoom}/> 
			</>
		);
	}
}

export default LetsTalk;