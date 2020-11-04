import * as React from 'react';
import { observer } from 'mobx-react';
import * as _ from 'lodash';

import { IStateCtx, IActionsCtx, SENDPROG } from '../t_store';
import { VIEWDIV } from '../../../share/tcontext';
import { App } from '../../../App';
import { ToggleBtn } from '@common/component/button';
import WrapTextNew from '@common/component/WrapTextNew';
import * as common from '../../common';
import { observable } from 'mobx';
import SendUI from '../../../share/sendui_new';
import * as kutil from '@common/util/kutil';
import * as felsocket from '../../../felsocket';
import ReactResizeDetector from 'react-resize-detector';

import WarmupMsg from './_warmup_msg';

const SwiperComponent = require('react-id-swiper').default;

interface IWarmupItem {
	idx: number;
	view: boolean;
	viewDiv: VIEWDIV;
	warmupType: common.WarmupType;
	data: common.IWarmup;
	state: IStateCtx;
	actions: IActionsCtx;
	returns: common.IWarmupReturn[];
	videoZoom: boolean;
}

@observer
class WarmupItem extends React.Component<IWarmupItem> {
	// private _returns: common.IWarmupReturn[] = [];
	private _jsxs: JSX.Element[] = [];
	@observable private _zoom = false;
	@observable private _retCnt = 0;
	@observable private _numOfStudent = 0;
	@observable private _prog: SENDPROG = SENDPROG.READY;
	@observable private _speaker = false;
	@observable private _opt = true;
	@observable private _rcalNum: number = 0;
	
	private _bAudioPlay = false;

	private _swiper: Swiper|null = null;
	constructor(props: IWarmupItem) {
		super(props);
		this._jsxs.push(<div className="swiper-no-swiping no-swiping-bg"/>);
	}
	private _clickZoom = () => {
		App.pub_playBtnTab();
		if(!this._zoom) this.resetSwiper();
		this._zoom = !this._zoom;
		this.props.actions.setNavi(!this._zoom, !this._zoom);
	}
	private _onSound = () => {
		if(!this.props.view) return;
		if(!this._speaker) {
			this._bAudioPlay = true;
			App.pub_play(App.data_url + this.props.data.audio, this._onSoundComplete);
		}
	}
	private _onSoundComplete = () => {
		this._bAudioPlay = false;
		App.pub_stop();
	}

	private _refSwiper = (el: SwiperComponent) => {
		if(this._swiper || !el) return;
		this._swiper = el.swiper;
	}

	private _onWarmup = async (msg: common.IWarmupReturnMsg) => {
		if(!this.props.view || this._prog < SENDPROG.SENDING) return;

		let wret: common.IWarmupReturn|null = null;
		for(let i = 0; i < App.students.length; i++) {
			if(App.students[i].id === msg.id) {
				wret = {
					thumb: App.students[i].thumb,
					avatar: App.students[i].avatar,
					displayMode: App.students[i].displayMode,

					id: msg.id,
					color: msg.color,
					msg: msg.msg,
				};
				break;
			}
		}
		if(!wret) return;

		if(this.props.returns.length === 0) {
			while(this._jsxs.length > 0) this._jsxs.pop();
		} else {
			for(let i = 0; i < this.props.returns.length; i++) {
				if(this.props.returns[i].id === msg.id) return;
			}
		}
		this._jsxs.push((<WarmupMsg {...wret}/>));
		this.props.returns.push(wret);
		felsocket.addStudentForStudentReportType6(msg.id);
		this._retCnt = this.props.returns.length;
		await kutil.wait(100);
		if(this._swiper) {
			const _slide = this._swiper.wrapperEl.scrollHeight;
			if(_slide <= this._swiper.height) this._opt = true;
			else this._opt = false;

			this._swiper.update();
			this._swiper.slideTo(this._retCnt - 1);
		}
	}

	private _onSend = () => {
		if(!this.props.view || this._prog > SENDPROG.READY) return;

		App.pub_playToPad();

		this._retCnt = 0;
		this._numOfStudent = 0;
		this._prog = SENDPROG.SENDING;
		const wmsg: common.IMsgForIdx = {
			msgtype: 'warmup_send',
			idx: this.props.idx,
		};
		// this.props.onStudy(true);   // TO CHECK
		felsocket.sendPAD($SocketType.MSGTOPAD, wmsg);

		App.pub_reloadStudents(async () => {
			if(!this.props.view || this._prog !== SENDPROG.SENDING) return;
			this._numOfStudent = App.students.length;

			this.props.actions.setWarmupFnc(this._onWarmup);
			await kutil.wait(500);
			if(!this.props.view || this._prog !== SENDPROG.SENDING) return;
			this._prog = SENDPROG.SENDED;
		});
	}

	public resetSwiper = () => {
		if(this._swiper) {
			this._swiper.update();
			this._swiper.slideTo(0);
		}
		_.delay(() => {
			if(this._swiper) {
				this._swiper.update();
				if(this._swiper.scrollbar) this._swiper.scrollbar.updateSize();
			}
		}, 300);
	}

	public componentDidUpdate(prev: IWarmupItem) {
		if(
			(this.props.view && !prev.view) ||
			(this.props.viewDiv === 'content' && prev.viewDiv !== 'content')
		) {
			this._zoom = false;
			this._rcalNum++;
			if(this._swiper) {
				this._swiper.update();
				this._swiper.slideTo(0);
			}
			_.delay(() => {
				if(this._swiper) {
					this._swiper.update();
					if(this._swiper.scrollbar) this._swiper.scrollbar.updateSize();
				}
			}, 300);
			
			if(this.props.returns.length === 0) {
                this._prog = SENDPROG.READY;
                this._retCnt = 0;
                this._numOfStudent = 0;
            }
		} else if(!this.props.view && prev.view) {
			this._zoom = false;
			this._rcalNum--;
			if(this._swiper) {
				this._swiper.update();
				this._swiper.slideTo(0);
			}
			_.delay(() => {
				if(this._swiper) {
					this._swiper.update();
					if(this._swiper.scrollbar) this._swiper.scrollbar.updateSize();
				}
			}, 300);
			if(this._bAudioPlay) {
				this._bAudioPlay = false;
				App.pub_stop();
			}
		}

		if(this.props.videoZoom && !prev.videoZoom) {
			this.resetSwiper();
		}
	}
	private _clickReturn = () => {
		App.pub_playBtnTab();

		const students: string[] = [];
		for(let i = 0; i < this.props.returns.length; i++) {
			students.push(this.props.returns[i].id);
		}
		felsocket.startStudentReportProcess($ReportType.JOIN, students);		
		// TO DO
	}

	public render() {
		const {idx, view, data, state, warmupType, returns} = this.props;

		let imgBox;
		let className;
		if(warmupType === common.WarmupType.IMAGE) {
			imgBox = (
				<div className={'img-box' + (this._zoom ? ' zoom' : '')}>
					<div><div><div>
						<img src={App.data_url + data.image} draggable={false}/>
						<ToggleBtn className="btn_zoom" onClick={this._clickZoom}/>
					</div></div></div>
					
				</div>
			);
			className = 'image';
		} else className = 'video';

		return (
			<div className={'warmup ' + className} style={{ display: view ? '' : 'none' }}>
				<div className="return_cnt_box white" onClick={this._clickReturn} style={{display: this._prog >= SENDPROG.SENDED ? '' : 'none'}}>
					<div>{this._retCnt}/{this._numOfStudent}</div>
				</div>
				<div className="speakerbox">
					<div className="speaker">
						{/* <img className="thumb" src={App.data_url + data.speaker} draggable={false}/>
						<img src={_project_ + 'teacher/images/bubble_t.png'} draggable={false}/> */}
						<div>
							<img src={_project_ + 'teacher/images/speaker_icon.png'} draggable={false} onClick={this._onSound}/>
							<div className="audio">
								<WrapTextNew minSize={28} maxSize={33} maxLineNum={2} rcalcNum={this._rcalNum} view={view} onClick={this._onSound} textAlign="left">
									{data.question}
								</WrapTextNew>
							</div>
						</div>
					</div>
				</div>			

				{imgBox}
				<div className="line" />
				<div className={'conversation' + (returns.length === 0 ? ' swiper-no-swiping' : '')}>
					<SwiperComponent
						ref={this._refSwiper}
						direction="vertical"
						scrollbar={{ el: '.swiper-scrollbar', draggable: true,}}
						observer={true}
						slidesPerView="auto"
						freeMode={true}				
						noSwiping={this._opt}
						followFinger={true}
						noSwipingClass={'swiper-no-swiping'}
					>
						{this._jsxs.map((jsx, jidx) => <div key={jidx}>{jsx}</div>)}
					</SwiperComponent>
				</div>
				<SendUI
					view={view && this._prog < SENDPROG.SENDED && !state.videoPopup && this.props.returns.length === 0}
					type={'teacher'}
					sended={false}
					originY={0}
					onSend={this._onSend}
				/>
			</div>
		);
	}
}

export default WarmupItem;