import * as React from 'react';
import * as _ from 'lodash';
import { observer } from 'mobx-react';

import { IStateCtx, IActionsCtx, SENDPROG, BTN_DISABLE } from '../t_store';
import { App } from '../../../App';
import * as felsocket from '../../../felsocket';
import { ToggleBtn } from '@common/component/button';
import NItem from '@common/component/NItem';
import * as kutil from '@common/util/kutil';
import * as common from '../../common';
import { observable } from 'mobx';
import SendUI from '../../../share/sendui_new';
import * as style from '../../../share/style';
import { MPlayer, MConfig, IMedia, MPRState } from '@common/mplayer/mplayer';
import { CountDown2, TimerState } from '../../../share/Timer';
import Yourturn from '../../../share/yourturn';

import TransPopup from './TransPopup';
import PassagePopup from './PassagePopup';
import ImgPassage from './ImgPassage';
import ScriptItem from './ScriptItem';

const SwiperComponent = require('react-id-swiper').default;

interface IInfo {
	passage: common.IPassage;
	scripts: common.IScript[];
	qnaRets: common.IQnaReturn[];
}

interface IPassage {
	view: boolean;
    videoPopup: boolean;
    viewStoryBook: boolean;
	studying: boolean;
	inview: boolean;
	data: common.IData;
	state: IStateCtx;
	actions: IActionsCtx;
	onStudy: (studying: BTN_DISABLE) => void;
	onSetNavi: (title: 'COMPREHENSION', tab: 'WARMUP'|'QUESTION') => void;
}

@observer
class Passage extends React.Component<IPassage> {
	private _player = new MPlayer(new MConfig(false));
	private _swiper: Swiper|null = null;
	@observable private _curIdx = 0;
	@observable private _curSeq = -1;
	@observable private _zoom = false;
	@observable private _pass_pop: 'off'|'READALOUD'|'SHADOWING'|'QNA' = 'off';
	@observable private _studyDiv: 'off'|'READALOUD'|'SHADOWING'|'QNA' = 'off';

	@observable private _trans = false;

	@observable private _prog = SENDPROG.READY;
	@observable private _studyProg = SENDPROG.READY;
	@observable private _retCnt = 0;
	@observable private _numOfStudent = 0;
	@observable private _audioOn = false;

	private _countdown = new TimerState(3);
	@observable private _viewCountDown = false;
	@observable private _yourturn = -1;
	@observable private _ytNext = -1;

	private _infos: IInfo[] = [];
	private _retUsers: string[] = [];

	@observable private _opt = true;

	constructor(props: IPassage) {
		super(props);
		const passages = props.data.passage;
		const scripts = props.data.scripts;
		/* this._infos 초기화 */
		for(let i = 0; i < passages.length; i++) {
			const passage = passages[i];
			const info: IInfo = {
				passage,
				scripts: [],
				qnaRets: [],			
			};

			for(let j = 0; j < scripts.length; j++) {
				if(scripts[j].passage_page === passage.page) {
					info.scripts.push(scripts[j]);
					info.qnaRets.push({num: 0, users: []});
				}
			}
			this._infos.push(info);
		}
	}
	private _refAudio = (audio: HTMLAudioElement|null) => {
		if(!audio || this._player.media) return;
		this._player.mediaInited(audio as IMedia);

		this._player.load(App.data_url + this.props.data.audio);

		this._player.addOnTime((time: number) => {
			// console.log(time);
			if(this._studyDiv === 'READALOUD') {
				const scrs = this._infos[this._curIdx].scripts;
				time = time / 1000;
				let seq = -1;
				const len = scrs.length;
				for(let i = 0; i < len; i++) {
					const script = scrs[i];
					if(time >= script.audio_start && time <= script.audio_end) {
						seq = script.seq;
						break;
					}
				}
				if(seq >= 0 && seq !== this._curSeq) {
					this._curSeq = seq;
					const msg: common.IMsgForIdx = {msgtype: 'focusidx',idx: seq,};
					felsocket.sendPAD($SocketType.MSGTOPAD, msg);
					this._transAt(seq);
				}
			} else if((this._studyDiv === 'off' || this._studyDiv === 'QNA') && this._audioOn) {
				const scrs = this.props.data.scripts;
				time = time / 1000;
				let seq = -1;
				let page = -1;
				const len = scrs.length;
				for(let i = 0; i < len; i++) {
					const script = scrs[i];
					if(time >= script.audio_start && time <= script.audio_end) {
						seq = script.seq;
						page = script.passage_page;
						break;
					}
				}
				if(seq >= 0 && seq !== this._curSeq) {
					if(page >= 0 && page > (this._curIdx + 1)) {
						// this._initAll();
						this._curIdx = page - 1;
						// await kutil.wait(300);
						if(this._swiper) {
							this._swiper.update();
							if(this._swiper.scrollbar) this._swiper.scrollbar.updateSize();
						}
					}
					this._curSeq = seq;	
					const msg: common.IMsgForIdx = {msgtype: 'focusidx',idx: seq,};
					felsocket.sendPAD($SocketType.MSGTOPAD, msg);
					this._transAt(seq);
				}
			} 
		});

		this._player.addOnPlayEnd(() => {
			if(this._studyDiv === 'READALOUD') {
				// this.props.onStudy('');
				const msg: common.IMsg = {msgtype: 'dialogue_end'};
				felsocket.sendPAD($SocketType.MSGTOPAD, msg);	
			} else if(this._studyDiv === 'SHADOWING') {
				if(this._handleYourTurn(true)) return;
			}
			
			this._audioOn = false;
			this._curSeq = -1;
			// this._studyDiv = 'off';
		});

		this._player.addOnPlayEndTemp(() => {
			if(this._studyDiv === 'READALOUD') {
				this._curSeq = -1;
				// this._studyDiv = 'off';	
				// this.props.onStudy('');
				const msg: common.IMsg = {msgtype: 'dialogue_end'};
				felsocket.sendPAD($SocketType.MSGTOPAD, msg);		
			} else if(this._studyDiv === 'SHADOWING') {
				if(this._curSeq < 0) return;
				this._handleYourTurn(false);
			} else {
				if(this._audioOn) this._audioOn = false;
				this._curSeq = -1;
			}

		});
		this._player.addOnState((newState: MPRState, oldState: MPRState) => {
			if(this._studyDiv !== 'SHADOWING' && this._studyDiv !== 'READALOUD') return;
			let msgtype: 'playing'|'paused';
			if(this._studyDiv === 'SHADOWING' && this._yourturn >= 0) msgtype = 'playing';
			else if(newState !== MPRState.PAUSED && this._player.bPlay) msgtype = 'playing';
			else msgtype = 'paused';
			const msg: common.IMsg = {
				msgtype,
			};
			felsocket.sendPAD($SocketType.MSGTOPAD, msg);
		});
	}
	private _handleYourTurn(forceEnd: boolean) {
		if(this._curSeq < 0) return false;
		const scrs = this._infos[this._curIdx].scripts;
		let idx = -1;
		for(let i = 0; i < scrs.length; i++) {
			if(scrs[i].seq === this._curSeq) {
				idx = i;
				break;
			}
		}
		if(idx < 0) return false;
		const cur = scrs[idx];
		const next = (idx < scrs.length - 1) ? scrs[idx + 1] : null;
		const delay = (cur.audio_end - cur.audio_start) * 1900;

		const ymsg: common.IMsgForIdx = {msgtype: 'view_yourturn', idx: cur.seq};
		felsocket.sendPAD($SocketType.MSGTOPAD, ymsg);
		
		this._yourturn = _.delay(() => {
			
			this._yourturn = -1;
			if(this._studyDiv !== 'SHADOWING') return;

			_.delay(() => {
				if(this._studyDiv !== 'SHADOWING') return;

				if(!next || forceEnd) {
					this._curSeq = -1;
					// this._studyDiv = 'off';
					// this.props.onStudy('');
					const dmsg: common.IMsg = {msgtype: 'dialogue_end'};
					felsocket.sendPAD($SocketType.MSGTOPAD, dmsg);
					
					return;
				}
				this._curSeq = next.seq;

				if(this._curSeq >= 0) this._transAt(this._curSeq);
				const fmsg: common.IMsgForIdx = {msgtype: 'focusidx',idx: next.seq,};
				felsocket.sendPAD($SocketType.MSGTOPAD, fmsg);
				this._player.gotoAndPlay(next.audio_start * 1000, next.audio_end * 1000, 1);
			}, 300);
		}, delay);

		const msg: common.IMsg = {
			msgtype: 'playing',
		};
		felsocket.sendPAD($SocketType.MSGTOPAD, msg);	
		return true;	
	}

	private _transAt(seq: number) {
		if(!this._swiper || !this._swiper.wrapperEl)  return;

		const gap = 82;
		const s_box = document.getElementById('script_box');
		const s_bnd = document.getElementById('script-bnd');
		const s_el = document.getElementById('script_' + seq);
		
		if(!s_box || !s_el || !s_bnd) return;
		const boxRect = s_box.getBoundingClientRect();
		const bndRect = s_bnd.getBoundingClientRect();

		const diff = (boxRect.bottom - boxRect.top) - (bndRect.bottom - bndRect.top);
		if( diff >= 0) return;
		const sRect = s_el.getBoundingClientRect();

		if(sRect.top < boxRect.top + gap ) {
			const cur = this._swiper.translate;
			let trans = cur + (boxRect.top + gap - sRect.top);
			if(trans > 0) trans = 0;
			this._swiper.wrapperEl.style.transitionDuration = '300ms';
			this._swiper.setTranslate(trans);
		} else if(sRect.bottom > boxRect.bottom - gap) {
			const cur = this._swiper.translate;
			let trans = cur - (sRect.bottom - (boxRect.bottom - gap));
			if(trans < diff) trans = diff;
			this._swiper.wrapperEl.style.transitionDuration = '300ms';
			this._swiper.setTranslate(trans);
		}		
	}
	private _initAll() {
		this._pass_pop = 'off';
		this._prog = SENDPROG.READY;
		this._initStudy();
		felsocket.sendPAD($SocketType.PAD_ONSCREEN, null);
	}
	private _initStudy() {
		this._zoom = false;
		this._studyDiv = 'off';
		this._trans = false;
		this._studyProg = SENDPROG.READY;
		this._retCnt = 0;
		while(this._retUsers.length > 0) this._retUsers.pop();

		this._audioOn = false;
		this._curSeq = -1;

		this._countdown.pause();
		this._countdown.reset();
		this._viewCountDown = false;
		if(	this._yourturn >= 0) {
			clearTimeout(this._yourturn);
			this._yourturn = -1;
		}
		if(this._player.bPlay) this._player.pause();
		if(this._swiper) this._swiper.slideTo(0);
		
		this.props.onStudy('');
		this.props.actions.setQNAFnc(null);
	}
	private _onPage = async (idx: number) => {
		if(this.props.studying) return;
		if(idx !== this._curIdx && idx >= 0 && idx < this._infos.length) {
			App.pub_playBtnPage();
			// const info = this._infos[idx];

			this._initAll();
			this._curIdx = idx;
			await kutil.wait(300);
			if(this._swiper) {
				this._swiper.update();
				if(this._swiper.scrollbar) this._swiper.scrollbar.updateSize();
			} 
			if(this._swiper) {
				const _slide = this._swiper.wrapperEl.scrollHeight;
				if(_slide <= this._swiper.height) this._opt = true;
				else this._opt = false;
			}
			// if(this._prog === SENDPROG.SENDED)
		}
	}
	
	private _clickReturn = () => {
		App.pub_playBtnTab();
		felsocket.startStudentReportProcess($ReportType.JOIN, this._retUsers);		
	}
	private _refSwiper = (el: SwiperComponent) => {
		if(this._swiper || !el) return;
		this._swiper = el.swiper;
	}
	private _onSend = () => {
		if(!this.props.view || !this.props.inview) return;
		else if(this._prog !== SENDPROG.READY) return;

		this._prog = SENDPROG.SENDING;
		App.pub_playToPad();



		this._retCnt = 0;
		while(this._retUsers.length > 0) this._retUsers.pop();
		const msg: common.IMsgForIdx = {msgtype: 'passage_send', idx: this._curIdx};
		felsocket.sendPAD($SocketType.MSGTOPAD, msg);
		App.pub_reloadStudents(async () => {
			if(!this.props.view || !this.props.inview) return;
			else if(this._prog !== SENDPROG.SENDING) return;

			this._numOfStudent = App.students.length;
			await kutil.wait(600);

			if(!this.props.view || !this.props.inview) return;
			else if(this._prog !== SENDPROG.SENDING) return;

			this._prog = SENDPROG.SENDED;
		});
	}
	private _clickTrans = () => {
		App.pub_playBtnTab();
		this._trans = !this._trans;
		const msg: common.IMsgForIdx = {msgtype: 'view_trans', idx: this._trans ? 1 : 0};
		felsocket.sendPAD($SocketType.MSGTOPAD, msg);		
	}
	private _offTrans = () => {
		this._trans = false;
		const msg: common.IMsgForIdx = {msgtype: 'view_trans', idx: this._trans ? 1 : 0};
		felsocket.sendPAD($SocketType.MSGTOPAD, msg);		
	}
	private _clickZoom = () => {
		App.pub_playBtnTab();
		this._zoom = !this._zoom;
		this.props.actions.setNaviView(false);
	}
	private _offZoom = () => {
		this._zoom = false;
		this._setNavi();
	}

	private _onPopupClosed = () => {
		this._pass_pop = 'off';
		if(this._studyDiv === 'off') this.props.actions.setNaviView(true);
	}
	private _onReadClick = () => {
		if(!this.props.view || !this.props.inview) return;
		else if(this._prog !== SENDPROG.SENDED) return;

		if(this._studyDiv === 'READALOUD') {
			App.pub_playBtnTab();
			this._initStudy();
			this._studyDiv = 'off';
			const msg: common.IMsg = {msgtype: 'dialogue_end'};
			felsocket.sendPAD($SocketType.MSGTOPAD, msg);
			this.props.actions.setNaviView(true);
		} else if(this._pass_pop === 'off') {
			App.pub_playBtnTab();
			this._initStudy();
			this._pass_pop = 'READALOUD';
			this.props.actions.setNaviView(false);
		}
	}
	private _onShadowClick = () => {
		if(!this.props.view || !this.props.inview) return;
		else if(this._prog !== SENDPROG.SENDED) return;

		if(this._studyDiv === 'SHADOWING') {
			App.pub_playBtnTab();
			this._initStudy();
			this._studyDiv = 'off';
			const msg: common.IMsg = {msgtype: 'dialogue_end'};
			felsocket.sendPAD($SocketType.MSGTOPAD, msg);
			this.props.actions.setNaviView(true);
		} else if(this._pass_pop === 'off') {
			App.pub_playBtnTab();
			this._initStudy();
			this._pass_pop = 'SHADOWING';
			this.props.actions.setNaviView(false);
		}
	}
	private _onQAClick = () => {
		if(!this.props.view || !this.props.inview) return;
		else if(this._prog !== SENDPROG.SENDED) return;

		if(this._studyDiv === 'QNA') {
			App.pub_playBtnTab();
			this._initStudy();
			this._studyDiv = 'off';
			const msg: common.IMsg = {msgtype: 'dialogue_end'};
			felsocket.sendPAD($SocketType.MSGTOPAD, msg);
			this.props.actions.setNaviView(true);
		} else if(this._pass_pop === 'off') {
			App.pub_playBtnTab();
			this._initStudy();
			this._pass_pop = 'QNA';
			this.props.actions.setNaviView(false);
		}
	}

	private _setNavi() {
		if(this._studyDiv !== 'off') this.props.actions.setNaviView(false);
		else this.props.actions.setNaviView(true);
		this.props.actions.setNavi(true, true);

		this.props.actions.setNaviFnc(
			async () => {
				if(this._curIdx === 0) {
					this.props.state.isNaviBack = true;
					this.props.onSetNavi('COMPREHENSION','WARMUP');
				} else {
					App.pub_playBtnPage();
					// const info = this._infos[this._curIdx + 1];
					this._initAll();
					this._curIdx = this._curIdx - 1;

					await kutil.wait(300);
					if(this._swiper) {
						this._swiper.update();
						if(this._swiper.scrollbar) this._swiper.scrollbar.updateSize();
						
						const _slide = this._swiper.wrapperEl.scrollHeight;
						if(_slide <= this._swiper.height) this._opt = true;
						else this._opt = false;
					}
				}
			},
			async () => {
				if(this._curIdx >= this._infos.length - 1) {
					this.props.onSetNavi('COMPREHENSION','QUESTION');
				} else {
					App.pub_playBtnPage();
					// const info = this._infos[this._curIdx + 1];
					this._initAll();
					this._curIdx = this._curIdx + 1;

					await kutil.wait(300);
					if(this._swiper) {
						this._swiper.update();
						if(this._swiper.scrollbar) this._swiper.scrollbar.updateSize();

						const _slide = this._swiper.wrapperEl.scrollHeight;
						if(_slide <= this._swiper.height) this._opt = true;
						else this._opt = false;
					}
				}
			}
		);
	}

	public componentDidUpdate(prev: IPassage) {
		if(this.props.view && !prev.view) {
			this._initAll();
			this._curIdx = 0;
		} else if(!this.props.view && prev.view) {
			if(this._player.bPlay) this._player.pause();
			if(this._audioOn) this._audioOn = false;
		}
		if(this.props.videoPopup && !prev.videoPopup) {
			if(this.props.state.isVideoStudied) this.props.state.isVideoStudied = false;
			this._player.pause();
			this._audioOn = false;
			this._curSeq = -1;
		} else if (!this.props.videoPopup && prev.videoPopup) {
			if(this.props.state.isVideoStudied) {
				this._initAll();
				this._curIdx = 0;
				_.delay( () => {
					if(this._swiper) {
						this._swiper.update();
						if(this._swiper.scrollbar) this._swiper.scrollbar.updateSize();
						
					}
				}, 300);
			} 
		}
		if(this.props.inview && !prev.inview) {
			this._initAll();
			this._setNavi();
			if(this.props.state.isNaviBack) {
				this._curIdx = this._infos.length - 1;
				this.props.state.isNaviBack = false;
			}
			_.delay( () => {
				if(this._swiper) {
					this._swiper.update();
					if(this._swiper.scrollbar) this._swiper.scrollbar.updateSize();

					if(this._swiper) {
						const _slide = this._swiper.wrapperEl.scrollHeight;
						if(_slide <= this._swiper.height) this._opt = true;
						else this._opt = false;
					}
				}
			}, 300);

			// if(!this._player.media) {
			// 	this._player.mediaInited(new Audio() as IMedia);
			// 	this._player.load(App.data_url + this.props.data.audio);
			// }
		} else if (!this.props.inview && prev.inview) {
			if(this._player.bPlay) this._player.pause();
			if(this._audioOn) this._audioOn = false;
        }
		
		if(this.props.inview && prev.inview) {
			if (!this.props.videoPopup && prev.videoPopup) this._setNavi();
			else if(!this.props.viewStoryBook && prev.viewStoryBook) this._setNavi();
		}
	}
	private _onAudio = () => {
		if(this._studyDiv === 'READALOUD' || this._studyDiv === 'SHADOWING') return;

		App.pub_playBtnTab();
		this._audioOn = !this._audioOn;

		if(this._player.bPlay) this._player.pause();

		if(this._audioOn) {
			this._curSeq = -1;
			const passage = this._infos[this._curIdx].passage;
			this._player.gotoAndPlay(passage.start * 1000, passage.end * 1000, 1);
			if(this._swiper) {
				this._swiper.update();
				if(this._swiper.scrollbar) this._swiper.scrollbar.updateSize();
			}
		} else {
			this._curSeq = -1;
			// this._curIdx = 0;
			if(this._swiper) {
				this._swiper.update();
				if(this._swiper.scrollbar) this._swiper.scrollbar.updateSize();
			}
		}
		// const audio = this.props.data.audio;
		// if(this._audioOn === true) App.pub_play(App.data_url + audio, App.pub_stop);
		// else if(this._audioOn === false) App.pub_stop();
	}

	private _onChoose = (script: common.IScript) => {
		if(this._studyDiv === 'READALOUD' || this._studyDiv === 'SHADOWING') return;

		if(this._audioOn) this._audioOn = false;

		const prevSeq = this._curSeq;
		this._curSeq = script.seq;
		this._transAt(this._curSeq);
		App.pub_playBtnTab();

		if(this._curSeq === prevSeq) {
			if(this._player.bPlay) {
				this._player.pause();
				this._curSeq = -1;
			} else this._player.gotoAndPlay(script.audio_start * 1000, script.audio_end * 1000, 1);
		} else {
			this._player.gotoAndPlay(script.audio_start * 1000, script.audio_end * 1000, 1);
		}
	}
	private _studySend = async () => {
		if(!this.props.view || !this.props.inview) return;
		else if(this._prog !== SENDPROG.SENDED) return;
		else if(this._studyDiv !== 'off') return;
		else if(this._studyProg !== SENDPROG.READY) return;	
		App.pub_playToPad();

		let msgtype: 'readaloud_send'|'shadowing_send'|'qna_send';
		if(this._pass_pop === 'READALOUD') msgtype = 'readaloud_send';
		else if(this._pass_pop === 'SHADOWING') msgtype = 'shadowing_send';
		else if(this._pass_pop === 'QNA') { 
			msgtype = 'qna_send';
			const rets = this._infos[this._curIdx].qnaRets;
			for(let i = 0; i < rets.length; i++) {
				const ret = rets[i];
				while(ret.users.length > 0) ret.users.pop();
				ret.num = 0;
			}
		}	else return;
		this._retCnt = 0;
		while(this._retUsers.length > 0) this._retUsers.pop();
		this._studyProg = SENDPROG.SENDING;
		this._studyDiv = this._pass_pop;

		this.props.onStudy(this._pass_pop === 'QNA' ? 'ex_video' : 'all');
		// const msg: common.IMsg = {msgtype};
		const msg: common.IMsgForIdx = {msgtype, idx: this._curIdx};
		felsocket.sendPAD($SocketType.MSGTOPAD, msg);

		await kutil.wait(500);
		if(!this.props.view || !this.props.inview) return;
		else if(this._prog !== SENDPROG.SENDED) return;
		else if(this._studyProg !== SENDPROG.SENDING) return;
		
		this._studyProg = SENDPROG.SENDED;
		this._pass_pop = 'off';
		this._numOfStudent = App.students.length;
		if(this._studyDiv === 'READALOUD' || this._studyDiv === 'SHADOWING') {
			this._viewCountDown = true;
			this._countdown.reset();
			await kutil.wait(300);
			if(!this.props.view || !this.props.inview) return;
			else if(this._prog !== SENDPROG.SENDED) return;
			if(this._studyDiv === 'READALOUD' || this._studyDiv === 'SHADOWING') {
				this._countdown.start();
			}
		} else if(this._studyDiv === 'QNA') {
			this.props.actions.setQNAFnc(this._onQNA);
		}
	}
	private _onQNA = (qmsg: common.IQNAMsg) => {
		if(this._studyDiv !== 'QNA') return;
		let sidx = -1;
		for(let i = 0; i < App.students.length; i++) {
			if(App.students[i].id === qmsg.id) {
				sidx = i;
				break;
			}
		}
		if(sidx < 0) return;

		if(this._retUsers.indexOf(qmsg.id) >= 0) return;

		const rets = this._infos[this._curIdx].qnaRets;
		
		for(let i = 0; i < qmsg.returns.length; i++) {  // 문제별 
			const scriptIdx = qmsg.returns[i];
			if(scriptIdx < rets.length) {
				const users = rets[scriptIdx].users;
				if(users.indexOf(qmsg.id) < 0) users.push(qmsg.id);
				rets[scriptIdx].num = users.length;
			}
		}
		
		this._retUsers.push(qmsg.id);
		felsocket.addStudentForStudentReportType6(qmsg.id);
		this._retCnt = this._retUsers.length;
	}
	private _countStart = () => {
		// console.log('_countStart');
	}
	private _countZero = async () => {
		this._viewCountDown = false;
		if(!this.props.view || !this.props.inview) return;
		else if(this._prog !== SENDPROG.SENDED) return;

		await kutil.wait(300);
		if(!this.props.view || !this.props.inview) return;
		else if(this._prog !== SENDPROG.SENDED) return;

		if(this._studyDiv === 'READALOUD') {
			this._curSeq = -1;
			const passage = this._infos[this._curIdx].passage;
			this._player.gotoAndPlay(passage.start * 1000, passage.end * 1000, 1);
		} else if(this._studyDiv === 'SHADOWING') {
			const script = this._infos[this._curIdx].scripts[0];
			this._curSeq = script.seq;

			if(this._curSeq >= 0) this._transAt(this._curSeq);
			const fmsg: common.IMsgForIdx = {msgtype: 'focusidx',idx: script.seq,};
			felsocket.sendPAD($SocketType.MSGTOPAD, fmsg);
			this._player.gotoAndPlay(script.audio_start * 1000, script.audio_end * 1000, 1);
		}
	}


	public render() {
		const {inview} = this.props;
		const curIdx = this._curIdx;
		const info = this._infos[curIdx];

		const scripts = info.scripts;
		const qnaRets = info.qnaRets;

		return (
			<div className="Passage" style={inview ? undefined : style.NONE}>
				<div className="nav">
					<div className="btn_page_box">
						{this._infos.map((item, idx) => {
							return <NItem key={idx} on={idx === curIdx} idx={idx} onClick={this._onPage} />;
						})}
					</div>
					<div className="right">
						<div 
							className="return_cnt_box white"
							style={(this._studyDiv === 'QNA' && this._studyProg >= SENDPROG.SENDED) ? undefined : style.NONE}
							onClick={this._clickReturn}
						>
							<div>{this._retCnt}/{this._numOfStudent}</div>
						</div>
						{/* <ToggleBtn disabled={this._prog < SENDPROG.SENDED || this._studyDiv === 'READALOUD' || this._studyDiv === 'SHADOWING'} className="btn_trans" onClick={this._clickTrans}/> */}
						<ToggleBtn disabled={this._studyDiv === 'READALOUD' || this._studyDiv === 'SHADOWING'} className="btn_img" onClick={this._clickZoom}/>
						<ToggleBtn disabled={this._studyDiv === 'READALOUD' || this._studyDiv === 'SHADOWING'} className="btn_audio_drop" on={this._audioOn} onClick={this._onAudio}/>
						{/*
							<ToggleBtn disabled={!this._audioOn} on={this._allOrChoose === 'choose'} className="btn_choose" onClick={this._onChoose}/>
							<ToggleBtn disabled={!this._audioOn} on={this._allOrChoose === 'all'} className="btn_all" onClick={this._onAll}/>
						*/}
					</div>
				</div>
				<audio controls={false} autoPlay={false} ref={this._refAudio}/>
				<div id="script_box" className="script_box">
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
						<div id="script-bnd" className="script-bnd">
							{scripts.map((script, idx) => {
								return (
									<ScriptItem 
										key={script.seq} 
										curSeq={this._curSeq} 
										script={script}
										retCnt={this._retCnt}
										qnaRet={qnaRets[idx]}
										viewReturn={this._studyDiv === 'QNA'}
										onChoose={this._onChoose}
									/>
								);
							})}
						</div>
					</SwiperComponent>
					<CountDown2 
						state={this._countdown} 
						view={this._viewCountDown} 
						onStart={this._countStart}  
						onComplete={this._countZero}
					/>
					<Yourturn 
						className="yourturn" 
						view={this._yourturn >= 0}
						start={this._yourturn >= 0}
					/>
				</div>
				<div className="popup_btns">
					<ToggleBtn 
						className="btn_listen_repeat" 
						disabled={this._prog < SENDPROG.SENDED || this._studyDiv === 'READALOUD' || this._studyDiv === 'QNA'} 
						on={this._pass_pop === 'SHADOWING' || this._studyDiv === 'SHADOWING'} 
						onClick={this._onShadowClick}
					/>
					<ToggleBtn 
						className="btn_readalong"
						disabled={this._prog < SENDPROG.SENDED || this._studyDiv === 'SHADOWING' || this._studyDiv === 'QNA'} 
						on={this._pass_pop === 'READALOUD' || this._studyDiv === 'READALOUD'} 
						onClick={this._onReadClick}
					/>
					<ToggleBtn 
						className="btn_qna"
						disabled={this._prog < SENDPROG.SENDED || this._studyDiv === 'SHADOWING' || this._studyDiv === 'READALOUD'} 
						on={this._pass_pop === 'QNA' || this._studyDiv === 'QNA'} 
						onClick={this._onQAClick}
					/>
				</div>
					<SendUI
						view={inview && this._prog <= SENDPROG.SENDING && !this.props.state.videoPopup}
						type={'teacher'}
						sended={false}
						originY={0}
						onSend={this._onSend}
					/>
					<ImgPassage view={this._zoom === true} passage={info.passage} onClosed={this._offZoom}/>
					<PassagePopup 
						type={this._pass_pop}
						view={this._pass_pop !== 'off'} 
						onClosed={this._onPopupClosed}
						onSend={this._studySend}
					/>
					<TransPopup 
						view={this._trans === true} 
						scripts={scripts} 
						onClosed={this._offTrans}
					/>
				</div>
		);
	}
}

export default Passage;


