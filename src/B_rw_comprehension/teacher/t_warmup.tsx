import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { Observer, observer } from 'mobx-react';
import * as _ from 'lodash';
import { TeacherContext, useTeacher, IStateCtx, IActionsCtx, SENDPROG, BTN_DISABLE } from './t_store';
import { VIEWDIV } from '../../share/tcontext';
import { ResponsiveText } from '../../share/ResponsiveText';
import { App } from '../../App';
import { ToggleBtn } from '@common/component/button';
import WrapTextNew from '@common/component/WrapTextNew';
import NItem from '@common/component/NItem';
import * as common from '../common';
import { observable } from 'mobx';
import { CoverPopup } from '../../share/CoverPopup';
import SendUI from '../../share/sendui_new';
import * as kutil from '@common/util/kutil';
import * as felsocket from '../../felsocket';
import * as style from '../../share/style';
import ReactResizeDetector from 'react-resize-detector';

import { MPlayer, MConfig, IMedia, MPRState } from '@common/mplayer/mplayer';
import LeftVideo from './wormup_video';

const SwiperComponent = require('react-id-swiper').default;

@observer
class WARMUPMSG extends React.Component<common.IWarmupReturn> {
	@observable private _on = false;
	@observable private _displayMode: '1'|'2' = '1';
	private _bndW = 0;
	private _bndH = 0;
	private _bndW_p = 0;
	private _bndH_p = 0;
	private _canvas?: HTMLCanvasElement;
	private _ctx?: CanvasRenderingContext2D;
	private _refCanvas = (el: HTMLCanvasElement|null) => {
		if(this._canvas || !el) return;
		this._canvas = el;
		this._ctx = this._canvas.getContext('2d') as CanvasRenderingContext2D;

		
	}
	public componentDidMount() {
		_.delay(() => {
			this._on = true;
			this._draw();
		},500);
		this._displayMode = this.props.displayMode;
	}
	public componentDidUpdate() {
		if(!this._on) { 
			_.delay(() => {
				this._on = true;
				this._draw();
			},500);
		}
	}

	private _onResize = (w: number, h: number) => {
		// console.log('this._onResize', w, h);
		this._bndW = w;
		this._bndH = h;
		this._draw();
	}
	private _draw() {
		if(this._bndW <= 0 || this._bndH <= 0) return;
		else if(this._bndW === this._bndW_p && this._bndH === this._bndH_p) return;
		else if(!this._canvas) return;
		else if(!this._ctx) return;

		this._ctx.clearRect(0, 0, this._canvas.width, this._canvas.height);

		this._canvas.width = this._bndW;
		this._canvas.height = this._bndH;
		common.drawBalloon(
			this._ctx, 
			15, 					// x
			5, 					// y
			this._bndW - 20, 	// w
			this._bndH - 10, 	// h
			5,     // px
			35, 				// py		
			10,					// round
			this.props.color,
		);

		this._bndW_p = this._bndW;
		this._bndH_p = this._bndH;
	}
	private _toggle = () => {
		this._displayMode = this._displayMode === '1' ? '2' : '1'; 
	}
	public render() {
		const {color, thumb, avatar, displayMode, msg} = this.props;
		return (
			<div className={'msg-item ' + color + (this._on ? ' on' : '')}>
				<img src={this._displayMode === '2' ? avatar : thumb} onClick={this._toggle}/>
				<div className="text">
					<canvas ref={this._refCanvas}/>
					<div className="s_text">
						{msg}
					</div>
					<ReactResizeDetector handleWidth={false} handleHeight={true} onResize={this._onResize} />
				</div>

			</div>
		);
	}
}

interface IWARMUPITEM {
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
class WARMUPITEM extends React.Component<IWARMUPITEM> {
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
	constructor(props: IWARMUPITEM) {
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
		this._jsxs.push((<WARMUPMSG {...wret}/>));
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

	public componentDidUpdate(prev: IWARMUPITEM) {
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
			// this.props.actions.setWarmupFnc(null);
			// while(this.props.returns.length > 0) this.props.returns.pop();
			// while(this._jsxs.length > 0) this._jsxs.pop();
			// this._jsxs.push(<div className="swiper-no-swiping"/>);
			// this._prog = SENDPROG.READY;
			// this._retCnt = 0;
			// this._numOfStudent = 0;

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




interface IWARMUP {
	view: boolean;
	inview: boolean;
    videoPopup: boolean;
    viewStoryBook: boolean;
	data: common.IData;
	state: IStateCtx;
	actions: IActionsCtx;
	onStudy: (studying: BTN_DISABLE) => void;
	onSetNavi: (title: 'COMPREHENSION', tab: 'Passage') => void;
}

@observer
class WARMUP extends React.Component<IWARMUP> {
	private m_player = new MPlayer(new MConfig(true));
	@observable private _curIdx_tgt = 0;
	@observable private _video_zoom = false;

	private _onPage = (idx: number) => {
		if(this._curIdx_tgt !== idx) {
			App.pub_playBtnPage();
			this._curIdx_tgt = idx;
			this.props.actions.setWarmupFnc(null);
			felsocket.sendPAD($SocketType.PAD_ONSCREEN, null);
			this.props.onStudy('');
		}
	}

	private _onVideoZoomed = () => {
		this._video_zoom = true;
	}

	private _setNavi() {
		this.props.actions.setNaviView(true);
		this.props.actions.setNavi(true, true);

		this.props.actions.setNaviFnc(
			() => {
				if(this._curIdx_tgt === 0) {
					this.props.actions.gotoDirection();
				} else {
					App.pub_stop();
					App.pub_playBtnPage();
					this._curIdx_tgt = this._curIdx_tgt - 1;
					this.props.actions.setWarmupFnc(null);
					felsocket.sendPAD($SocketType.PAD_ONSCREEN, null);
					this.props.onStudy('');
				}
			},
			() => {
				if(this._curIdx_tgt >= this.props.data.warmup.length - 1) {
					this.props.onSetNavi('COMPREHENSION','Passage');
				} else {
					App.pub_stop();
					App.pub_playBtnPage();
					this._curIdx_tgt = this._curIdx_tgt + 1;
					this.props.actions.setWarmupFnc(null);
					felsocket.sendPAD($SocketType.PAD_ONSCREEN, null);
					this.props.onStudy('');
				}
			}
		);
	}


	public componentDidUpdate(prev: IWARMUP) {
		if(this.props.view && !prev.view) {
			// this._curIdx_tgt = 0;
			this._setNavi();
		} else if(!this.props.view && prev.view) {
			// this.props.actions.setWarmupFnc(null);
		}

		if(this.props.inview && !prev.inview) {
			this._curIdx_tgt = 0;
			felsocket.sendPAD($SocketType.PAD_ONSCREEN, null);
			this.props.onStudy('');
			this._setNavi();
			if(this.props.state.isNaviBack) {
				this._curIdx_tgt = this.props.data.warmup.length - 1;
				this.props.state.isNaviBack = false;
			}
		} else if(!this.props.inview && prev.inview) {
			this.props.actions.setWarmupFnc(null);
		}

		if(this._video_zoom) this._video_zoom = false;

		if(this.props.videoPopup && !prev.videoPopup) {
			if(this.m_player.bPlay) this.m_player.pause();
			this._video_zoom = false;
		} else if(!this.props.videoPopup && prev.videoPopup) {
			this._video_zoom = true;
		}
		 
		if(this.props.inview && prev.inview) {
			if (!this.props.videoPopup && prev.videoPopup) this._setNavi();
			else if(!this.props.viewStoryBook && prev.viewStoryBook) this._setNavi();
		}
	}
	public render() {
		const curIdx_tgt = this._curIdx_tgt;
		const {view, inview, data, state, actions} = this.props;

		let video_jsx;
		let className;
		if(data.warmup_type === common.WarmupType.VIDEO) {
			className = ' video';
			video_jsx = (
				<div className="video_container">
					<LeftVideo 
						view={view && inview}
						player={this.m_player} 
						data={data}
						onZoomed={this._onVideoZoomed}
					/>
				</div>
			);
		} else className = ' image';

		const returns = state.warmup_returns;

		return (
			<>
			<div className={'WARMUP' + className} style={inview ? undefined : style.NONE}>
				<div className="nav">
					{data.warmup.length > 1 && 
					<div className="btn_page_box">
						{data.warmup.length > 1 && data.warmup.map((page, idx) => {
							return <NItem key={idx} on={idx === curIdx_tgt} idx={idx} onClick={this._onPage} />;
						})}
					</div>}{/*p1 수정 사항 2020_06_19 */} 
				</div>

				{data.warmup.map((warmup, idx) => {
					return (
						<WARMUPITEM 
							key={idx} 
							idx={idx} 
							warmupType={data.warmup_type}
							viewDiv={state.viewDiv} 
							view={inview && curIdx_tgt === idx}
							data={warmup}
							state={state}
							actions={actions}
							returns={returns[idx]}
							videoZoom={this._video_zoom}
						/>
					);
				})}

				{video_jsx}


			</div>
			</>
		);
	}
}
export default WARMUP;


