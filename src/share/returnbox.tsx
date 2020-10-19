import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { observable, action } from 'mobx';
import { observer, Observer } from 'mobx-react';

import * as _ from 'lodash';

import { ToggleBtn } from '@common/component/button';

import { LikeView, LikeBtn } from './like';

import { App } from '../App';
import * as felsocket from '../felsocket';

const SwiperComponent = require('react-id-swiper').default;

export interface IReturn extends IStudent {
	rtype: 'video'|'image';
	url: string;
	idx: number;
}

export interface IPopupItemProps {
	id: string;
	url: string;
	view: boolean;
	on: boolean;
	onPlayChange: (isPlay: boolean) => void;
}

export interface IListItemProps extends IReturn {
	idx: number;
	onClick: (item: IReturn) => void;
}

interface IReturnPop extends IReturn {
	view: boolean;
	likeOn: boolean;
	ItemComponent: React.ComponentClass<IPopupItemProps>;
	refLikeView: (likeView: LikeView|null) => void;
	onClose: () => void;
}
@observer
class ReturnPopup extends React.Component<IReturnPop> {
	@observable private m_on = false;
	@observable private m_isPlay = false;

	@observable private m_dmode: '1'|'2' = '1';

	private _transEnd = (evt: React.TransitionEvent) => {
		if(!this.props.view) {
			this.m_on = false;
			this.m_isPlay = false;
		}
	}
	private _onPlayChange = (isPlay: boolean) => {
		this.m_isPlay = isPlay;
	}
	private _clickStudent = () => {
		this.m_dmode = this.m_dmode === '2' ? '1' : '2';
	}

	public componentDidMount() {
		this.m_dmode = this.props.displayMode;
	}
	public componentDidUpdate(prev: IReturnPop) {
		if(this.props.view && !prev.view) {
			this.m_on = true;
		} else if(!this.props.view && prev.view) {
			this.m_isPlay = false;
			this.m_dmode = this.props.displayMode;
		}

		if(this.props.id !== prev.id) {
			this.m_dmode = this.props.displayMode;
		}
	}
	public render() {
		return (
			<div 
				className={'return-popup' + (this.props.view ? ' on' : '')} 
				style={{visibility: this.m_on ? 'unset' : 'hidden'}}
				onTransitionEnd={this._transEnd}
			>
				<div className="student" onClick={this._clickStudent}>
					<img src={this.m_dmode === '2' ? this.props.avatar : this.props.thumb} />
					<div>{this.m_dmode === '2' ? this.props.nickname : this.props.name}</div>
				</div>
				<this.props.ItemComponent 
					url={this.props.url} 
					id={this.props.id} 
					view={this.props.view} 
					on={this.props.view}
					onPlayChange={this._onPlayChange}
				/>	
				<LikeView
					className="like-view"
					view={this.props.view && this.props.likeOn && this.m_on} 
					ref={this.props.refLikeView}
					student={this.props.id}
					soundOff={this.m_isPlay}
				/>
				<ToggleBtn className="btn_x" onClick={this.props.onClose}/>			
			</div>
		);

	}
}

interface IReturnBox {
	view: boolean;
	returns: IReturn[];
	totalCnt: number;
	ListItem: React.ComponentClass<IListItemProps>;
	PopupItem: React.ComponentClass<IPopupItemProps>;
	onCloseClick: () => void;
	setNaviView: (view: boolean) => void;
	setNavi: (enableLeft: boolean, enableRight: boolean) => void;
	setNaviFnc: (naviLeft: (() => void) | null, naviRight: (() => void) | null) => void;
	refLikeView: (likeView: LikeView|null) => void;
}

@observer
export class ReturnBox extends React.Component<IReturnBox> {
	@observable private m_on = false;
	@observable private m_like = true;
	private m_swiper!: Swiper;

	@observable private m_popup: IReturn = {
		rtype: 'video',
		url: '',
		id: '',
		name: '',
		thumb: '',
		avatar: '',
		nickname: '',
		inited: false,
		idx: -1,
		displayMode: '1',
	};
	@observable private m_popupView = false;

	private _transEnd = (evt: React.TransitionEvent) => {
		if(!this.props.view) {
			this.m_swiper.slideTo(0, 0);
			this.m_on = false;
		}
	}
	
	private _refSwiper = (el: SwiperComponent|null) => {
		if(this.m_swiper || !el) return;
		this.m_swiper = el.swiper;
	}

	private _onPopupClose = () => {
		this.m_popupView = false;
		this.props.setNaviView(false);

		this.props.setNaviFnc(null, null);

		const msg: ILikeSetMsg = {on: false, id: ''}; 
		felsocket.sendPAD($SocketType.LIKE_SET, msg);
	}

	private _setPopupItem(item: IReturn) {
		this.m_popup.rtype = item.rtype;
		// console.log('_setPopupItem', item.url);
		this.m_popup.url = item.url;
		this.m_popup.id = item.id;
		this.m_popup.name = item.name;
		this.m_popup.thumb = item.thumb;
		this.m_popup.avatar = item.avatar;
		this.m_popup.nickname = item.nickname;
		this.m_popup.displayMode = item.displayMode;
		this.m_popup.inited = item.inited;
		this.m_popup.idx = item.idx;
		this.m_popupView = true;

		const len = this.props.returns.length;

		this.props.setNavi(item.idx > 0, item.idx < len - 1);

		const msg: ILikeSetMsg = {on: this.m_like, id: item.id}; 
		felsocket.sendPAD($SocketType.LIKE_SET, msg);
	}

	private _onClickItem = (item: IReturn) => {
		this.props.setNaviView(true);
		this._setPopupItem(item);
		
		this.props.setNaviFnc(
			() => {
				const idx = this.m_popup.idx;
				const returns = this.props.returns;
				if(idx > 0 ) {
					this._setPopupItem(returns[idx - 1]);
				}
			}, 
			() => {
				const idx = this.m_popup.idx;
				const returns = this.props.returns;
				if(idx < returns.length - 1 ) {
					this._setPopupItem(returns[idx + 1]);
				}
			},
		);
	}
	private _likeChange = () => {
		this.m_like = !this.m_like;
	}


	public componentDidUpdate(prev: IReturnBox) {
		if(this.props.view ) {
			if(!prev.view) {
				this.m_on = true;
				this.m_swiper.slideTo(0, 0);
				_.delay(() => {
				
					this.m_swiper.params.freeMode = true;
					this.m_swiper.params.slidesPerView = 'auto';
					this.m_swiper.updateAutoHeight();
					this.m_swiper.update();
					this.forceUpdate();
				}, 500);
			}
		} else if(!this.props.view && prev.view) {
			this.m_popupView = false;
		}
	}

	public render() {
		const {view, returns} = this.props;
		const arr: string[] = ['return-box'];

		if(view) arr.push('on');
		if(this.m_popupView) arr.push('popup');

		return (
			<>
			<div 
				className={arr.join(' ')} 
				style={{visibility: this.m_on ? 'unset' : 'hidden'}}
				onTransitionEnd={this._transEnd}
			>
				<div className="count">
					<span>{this.props.returns.length}</span>
					<span>{this.props.totalCnt}</span>
				</div>
				<LikeBtn className="like-btn" on={this.m_like} onChange={this._likeChange}/>

				<SwiperComponent 
					ref={this._refSwiper}
					direction="vertical"
					observer={true}
					slidesPerView="auto"
					freeMode={true}
					scrollbar={{el: '.swiper-scrollbar',draggable: true, hide: false}}
				>
					<div className="return-list">
						{returns.map((item) => {
							return <this.props.ListItem key={item.id} {...item} onClick={this._onClickItem}/>;
						})}
					</div>
					<div className="return-temp"/>
				</SwiperComponent>

				<ToggleBtn
					className="common_back"
					onClick={this.props.onCloseClick}
				/>
			</div>
			<ReturnPopup 
				{...this.m_popup} 
				view={this.m_popupView} 
				likeOn={this.m_like}
				ItemComponent={this.props.PopupItem}
				refLikeView={this.props.refLikeView}
				onClose={this._onPopupClose}
			/>
			</>
		);
	}
}

