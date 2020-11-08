import * as React from 'react';
import { observer } from 'mobx-react';

import * as _ from 'lodash';

import { IStateCtx, IActionsCtx, SENDPROG, BTN_DISABLE } from '../t_store';

import { App } from '../../../App';
import { ToggleBtn } from '@common/component/button';

import { IMsg, IData,IScriptSummarizing,IQuizReturnMsg } from '../../common';
import { observable } from 'mobx';
import SendUI from '../../../share/sendui_new';

import * as kutil from '@common/util/kutil';
import * as style from '../../../share/style';
import * as felsocket from '../../../felsocket';
import { MPlayer, MConfig, IMedia } from '@common/mplayer/mplayer';

import ImgPopup from './_img_popup';
import LetsTalk from './_lets_talk';
import SummaryBox from './_summary_box';

const SwiperComponent = require('react-id-swiper').default;

interface ISummary {
	view: boolean;
	inview: boolean;
	videoPopup: boolean;
	viewStoryBook: boolean;
	data: IData;
	state: IStateCtx;
	actions: IActionsCtx;
	onStudy: (studying: BTN_DISABLE) => void;
	onSetNavi: (title: 'VISUALIZING', tab: 'GraphicOrganizer') => void;
}

@observer
class Summary extends React.Component<ISummary> {
	@observable private _prog = SENDPROG.READY;
	@observable private _retCnt = 0;
	@observable private _numOfStudent = 0;

	@observable private _zoom = false;
	@observable private _letsTalk = false;

	private _data: IData;
	private _img_url: string = '';
	private _returns: string[] = [];

	private _player: MPlayer = new MPlayer(new MConfig(true));
	@observable private _curSummarySeq = 0;
	@observable private _curScriptSeq = 0;
	private _scripts: IScriptSummarizing[][] = [];

	public constructor(props: ISummary) {
		super(props);
		this._data = props.actions.getData();

		const summarywts = this._data.summarizing_scripts;
		for(let i = 0; i < summarywts.length; i++) {
			this._scripts[i] = [];
		}
		const summaryscripts = this._data.summarizing_scripts;
		let curseq = 0;
		for(let i = 0; i < summaryscripts.length; i++) {
			if(curseq + 1 !== summaryscripts[i].summary_seq) {
				curseq++;
			}
			const script = summaryscripts[i]; 
			this._scripts[curseq].push(script);
		}
	}

	private _soption: SwiperOptions = {
		direction: 'vertical',
		observer: true,
		slidesPerView: 'auto',
		freeMode: true,
		mousewheel: true,			
		noSwiping: false,
		followFinger: true,
		scrollbar: {el: '.swiper-scrollbar',draggable: false, hide: false},		
	};

	private _swiper!: Swiper;

	private _refSwiper = (el: SwiperComponent) => {
		if(this._swiper || !el) return;
		this._swiper = el.swiper;
	}

	private _refAudio = (audio: HTMLAudioElement|null) => {
		if(this._player.media || !audio) return;
		this._player.mediaInited(audio as IMedia);

		this._player.load(App.data_url + this._data.summary_audio);

		this._player.addOnTime((time: number) => {
			if( this._curSummarySeq > 0 ) {
				const scrs = this._scripts[this._curSummarySeq - 1];
				time = time / 1000;
				let seq = -1;
				const len = scrs.length;
				for(let i = 0; i < len; i++) {
					let script = scrs[i];
					if(time >= script.audio_start && time <= script.audio_end) {
						seq = script.seq;
						break;
					}
				}
				if(seq >= 0 && seq !== this._curScriptSeq) {
					this._curScriptSeq = seq;	
					// this._transAt(seq);
				}
			}
		});

		this._player.addOnPlayEndTemp(() => {
			this._curSummarySeq = 0;
			this._curScriptSeq = 0;
		});

		this._player.addOnPlayEnd(() => {
			this._curSummarySeq = 0;
			this._curScriptSeq = 0;
		});
	}
	
	private _clickReturn = () => {
		App.pub_playBtnTab();
		felsocket.startStudentReportProcess($ReportType.JOIN, this._returns);		
	}
	private _clickAnswer = () => {
		const { inview, actions,onStudy } = this.props;

		if(!inview) return;
		else if(this._prog !== SENDPROG.SENDED) return;
		App.pub_playBtnTab();
		onStudy('');
		const msg: IMsg = {msgtype: 'summary_end',};
		felsocket.sendPAD($SocketType.MSGTOPAD, msg);
		actions.setSummaryFnc(null);
		this._prog = SENDPROG.COMPLETE;
		actions.setNavi(true, true);
	}

	private _onSend = () => {
		const { inview, actions,onStudy } = this.props;

		if(!inview) return;
		else if(this._prog !== SENDPROG.READY) return;

		this._prog = SENDPROG.SENDING;
		this._retCnt = 0;
		onStudy('ex_video');
		while(this._returns.length > 0) this._returns.pop();
		App.pub_playToPad();
		const msg: IMsg = {msgtype: 'summary_send',};
		felsocket.sendPAD($SocketType.MSGTOPAD, msg);

		actions.setSummaryFnc(this._onReturn);
		App.pub_reloadStudents(async () => {
			if(!inview) return;
			else if(this._prog !== SENDPROG.SENDING) return;

			this._retCnt = 0;
			this._numOfStudent = App.students.length;

			await kutil.wait(600);
			if(!inview) return;
			else if(this._prog !== SENDPROG.SENDING) return;
			this._prog = SENDPROG.SENDED;
			actions.setNavi(false, false);
		});
	}
	private _onReturn = (msg: IQuizReturnMsg) => {
		const { inview } = this.props;

		if(!inview) return;
		else if(this._prog !== SENDPROG.SENDED) return;

		if(this._returns.indexOf(msg.id) >= 0) return;
		const student = _.find(App.students, {id: msg.id});
		if(!student) return;
		this._returns.push(msg.id);
		felsocket.addStudentForStudentReportType6(msg.id);
		this._retCnt = this._returns.length;
	}

	private _setNavi() {
		const { actions,onSetNavi } = this.props;

		actions.setNaviView(true);
		if(this._prog === SENDPROG.SENDING || this._prog === SENDPROG.SENDED) actions.setNavi(false, false);
		else actions.setNavi(true, true);

		actions.setNaviFnc(
			() => {
				onSetNavi('VISUALIZING','GraphicOrganizer');
			},
			() => {
				actions.gotoNextBook();
			}
		);
	}

	private _init() {
		if(this._swiper) {
			this._swiper.slideTo(0, 0);
			_.delay(() => {
				if(this._swiper) {
					this._swiper.update();
					if(this._swiper.scrollbar) this._swiper.scrollbar.updateSize();
				}
			}, 100);
		}

		if(this._prog !== SENDPROG.COMPLETE) {
			this._prog = SENDPROG.READY;
			this._retCnt = 0;
			this._numOfStudent = 0;
		}
		this._curSummarySeq = 0;
		this._curScriptSeq = 0;
		this.props.actions.setSummaryFnc(null);
		felsocket.sendPAD($SocketType.PAD_ONSCREEN, null);
	}

	public componentDidUpdate(prev: ISummary) {
		const { videoPopup,state,inview,viewStoryBook } = this.props;

		if(videoPopup && !prev.videoPopup) {
			if(state.isVideoStudied) state.isVideoStudied = false;
		} else if (!videoPopup && prev.videoPopup) {
			if(state.isVideoStudied && this._prog < SENDPROG.COMPLETE) this._init();
		}
		if(inview && !prev.inview) {
			this._init();
			this._setNavi();
		} else if(!inview && prev.inview) {
			this._zoom = false;
			this._letsTalk = false;
			this._curSummarySeq = 0;
			this._curScriptSeq = 0;
			if(this._player.bPlay) this._player.pause();
        }
        
		if(inview && prev.inview) {
			if (!videoPopup && prev.videoPopup) this._setNavi();
			else if(!viewStoryBook && prev.viewStoryBook) this._setNavi();
		}
	}

	private _clickZoom = (url: string) => {
		if(!this.props.inview) return;
		else if(this._zoom) return;
		this._img_url = url;
		this._zoom = true;
	}
	private _popupClosed = () => {
		this._zoom = false;
	}
	
	private _onLetsTalk = () => {
		if(this._player.bPlay) {
			this._player.pause();
			this._curSummarySeq = 0;
			this._curScriptSeq = 0;
		}
		App.pub_playBtnTab();
		this._letsTalk = true;
		this.props.actions.setNaviView(false);
	}

	private _letsTalkClosed = () => {
		this._letsTalk = false;
		this.props.actions.setNaviView(true);
	}

	private _onScriptSound = (script_seq: number) => {
		let Played = false;
		if(this._player.bPlay) {
			this._player.pause();
			if(this._curSummarySeq > 0) this._curSummarySeq = 0;
			if(this._curScriptSeq === script_seq) {
				this._curScriptSeq = 0;
				Played = true;
				// this.forceUpdate();
		   }
		}		
		if(!Played) {
			let start: number = -1;
			let end: number = -1;
			const summaryScripts = this._data.summarizing_scripts;
			for(let i = 0; i < summaryScripts.length; i++) {
				if(script_seq === summaryScripts[i].seq) {
					this._curScriptSeq = summaryScripts[i].seq;
					start = summaryScripts[i].audio_start;
					end = summaryScripts[i].audio_end;
					break;
				}
			}

			if(start >= 0 && end > start) {
				this._player.gotoAndPlay(start * 1000, end * 1000, 1);
			}
		}
	}
	private _onAudioSound = (summary_seq: number) => {
		let Played = false;
		if(this._player.bPlay) {
			this._player.pause();
			if(this._curScriptSeq > 0) this._curScriptSeq = 0;
			if(this._curSummarySeq === summary_seq) {
				this._curSummarySeq = 0;
				Played = true;
				// this.forceUpdate();
		   }
		} 

		if(!Played) {
			let start: number = -1;
			let end: number = -1;
			const summaryScripts = this._data.summarizing_scripts;
			for(let i = 0; i < summaryScripts.length; i++) {
				if(summary_seq === summaryScripts[i].summary_seq) {
					this._curSummarySeq = summaryScripts[i].summary_seq;

					if(start === -1) start = summaryScripts[i].audio_start;
					else if(start > summaryScripts[i].audio_start) start = summaryScripts[i].audio_start;

					if(end === -1) end = summaryScripts[i].audio_end;
					else if(end < summaryScripts[i].audio_end) end = summaryScripts[i].audio_end;
				}
			}

			if(start >= 0 && end > start) {
				this._player.gotoAndPlay(start * 1000, end * 1000, 1);
			}
		}
	}
	
	public render() {
        const { inview, data,state } = this.props;
        
        const talk = data.letstalk;
        const viewLetstalk = !(talk.sentence === '' || talk.audio === '' || talk.img1 === '' || talk.sample === '' || talk.hint === '');
        
        return (
            <div className="summary" style={inview ? undefined : style.NONE}>
                <ToggleBtn className="btn_lets_talk" view={viewLetstalk} on={this._letsTalk} onClick={this._onLetsTalk} />
            
                <div className="right" style={this._prog >= SENDPROG.SENDED ? undefined : style.NONE}>
                    <div className="return_cnt_box white" onClick={this._clickReturn}>
                        <div>{this._retCnt}/{this._numOfStudent}</div>
                    </div>
                    <ToggleBtn className="btn_answer" on={this._prog >= SENDPROG.COMPLETE} onClick={this._clickAnswer}/>
                </div>
                <audio controls={false} autoPlay={false} ref={this._refAudio}/>
                <SwiperComponent {...this._soption} ref={this._refSwiper}>
                    {data.summarizing.map((summarizing, num) => {
                        return (
                            <div key={num} className="summary_box">
                                <SummaryBox 
                                    seq={num + 1}
                                    summary={summarizing} 
                                    scripts={data.summarizing_scripts} 
                                    curScritSeq={this._curScriptSeq}
                                    playOn={num + 1 === this._curSummarySeq}
                                    len={data.summarizing.length} 
                                    prog={this._prog} 
                                    onZoom={this._clickZoom}
                                    onSound={this._onAudioSound}
                                    onScriptSound={this._onScriptSound}
                                />
                            </div>
                        );
                    })}
                </SwiperComponent>

                <SendUI
                    view={inview && this._prog < SENDPROG.SENDED && !state.videoPopup}
                    type={'teacher'}
                    sended={false}
                    originY={0}
                    onSend={this._onSend}
                />
                <ImgPopup url={this._img_url} view={this._zoom} onClosed={this._popupClosed}/> 
                <LetsTalk 
                    view={this._letsTalk} 
                    data={this._data.letstalk} 
                    onClosed={this._letsTalkClosed}
                />
                
            </div>
        );
	}
}

export default Summary;


