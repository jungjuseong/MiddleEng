import * as React from 'react';
import * as ReactDOM from 'react-dom';

import * as _ from 'lodash';
import { hot } from 'react-hot-loader';

import { Observer, observer } from 'mobx-react';
import { observable } from 'mobx';


import { ToggleBtn } from '@common/component/button';
import * as butil from '@common/component/butil';
import * as kutil from '@common/util/kutil';
import { App, IMain } from '../../App';
import { TeacherContext, useTeacher, IStateCtx, IActionsCtx } from './t_store';
import * as common from '../common';
import { CoverPopup } from '../../share/CoverPopup';
import VocaDetail from './t_voca_detail';
import { POPUPTYPE } from './t_voca_detail';
import { ResponsiveText } from '../../share/ResponsiveText';
import { BtnAudio } from '../../share/BtnAudio';
import SendUINew from '../../share/sendui_new';
import { MPlayer, MConfig, IMedia } from '@common/mplayer/mplayer';
import * as felsocket from '../../felsocket';


const SwiperComponent = require('react-id-swiper').default;
const SwiperObj =  require('swiper').default;

import Watch from './t_watch';
import Speak from './t_speak';
import WrapTextNew from '@common/component/WrapTextNew';

class NItem extends React.Component<{idx: number, on: boolean, onClick: (idx: number) => void}> {
	private _click = () => {
		this.props.onClick(this.props.idx);
	}
	public render() {
		const {idx, on} = this.props;
		return <span className={on ? 'on' : ''} onClick={this._click}>{idx + 1}</span>;
	}
}

interface ILectureItem {
	type: POPUPTYPE;
	view: boolean; 
	word: common.IWordData|null;
	onClosed: () => void;
}
@observer
class LecturePopup extends React.Component<ILectureItem> {
	@observable private m_view = false;
	private _player: MPlayer = new MPlayer(new MConfig(true));

	private _onClose = () => {
		this.m_view = false;
		App.pub_playBtnTab();
		App.pub_stop();
		this._player.pause();
		this._player.unload();
	}
	private _refVideo = (el: HTMLVideoElement|null) => {
		if(this._player.media || !el) return;
		this._player.mediaInited(el as IMedia);
	}	

	private _onPause = () => {
		if(this._player.bPlay) this._player.pause();
		else if(!this._player.bPlay) this._player.play(); // p.26 수정
	}
	private _onPlay = () => {
		if(!this._player.bPlay) this._player.play();
	}
	public componentDidUpdate(prev: ILectureItem) {
		if(this.props.view && !prev.view) {
			this.m_view = true;
			const {word, type} = this.props;
			if(word) {
				let url = '';
				let start = -1;
				let end = -1;
				if(type === 'sound') {
					url = word.video;
					start = word.sound_start;
					end = word.sound_end;
				} else if(type === 'meaning') {
					url = word.video;
					start = word.meaning_start;
					end = word.meaning_end;
				} else if(type === 'usage') {
					url = word.video;
					start = word.sentence_start;
					end = word.sentence_end;
				} else if(type === 'main video') {
					url = word.usage_video;
					start = word.usage_start;
					end = word.usage_end;
				}
				
				if(start >= 0) {
					this._player.setStartEndTime(start * 1000, end * 1000);
					this._player.load(App.data_url + url);
					this._player.play();
				}
				// this._player.play();
			}
		} else if(!this.props.view && prev.view) {
			this._player.unload();
			this.m_view = false;
		}
	}
	public render() {
		const { type, view, onClosed, word } = this.props;
		const entry = word ? word.entry : '';
		const usage_script = word ? word.usage_script : '';
		return (
			<CoverPopup className="lecture_popup"  view={view && this.m_view} onClosed={this.props.onClosed} >
				<div className="nav">
					<span className="type">{type.toUpperCase()}</span>
					<div className="entry">{entry}</div>
					<ToggleBtn className="btn_close" onClick={this._onClose}/>
				</div>
				<div className={'video ' + type}>
					<video ref={this._refVideo} onClick={this._onPause}/>
					<ToggleBtn className={'btn_play' + (this._player.bPlay ? ' play' : '')}  onClick={this._onPlay}/>
					<ResponsiveText className={'USAGE_script ' + type} maxSize={32} minSize={32} lineHeight={120} length={entry.length}>
						<span>{usage_script}</span>
					</ResponsiveText>
				</div>
			</CoverPopup>
		);
	}
}

interface IDrillItem {
	type: POPUPTYPE;
	view: boolean; 
	word: common.IWordData|null;
	state: IStateCtx;
	actions: IActionsCtx;
	onClosed: () => void;
}
@observer
class DrillPopup extends React.Component<IDrillItem> {
	@observable private m_view = false;
	@observable private m_sended = false;

	
	@observable private _nPlay = -1;

	private _getJSX(text: string) {
		const nodes = butil.parseBlock(text, 'block');
		return (
			<>
				{nodes.map((node, idx) => node)}
			</>
		);
	}

	private _onClose = () => {
		App.pub_playBtnTab();
		/*
		const msg: common.IMsg = {
			type: 'drillclose',
		};
		felsocket.sendPAD($SocketType.MSGTOPAD, msg);
		*/
		felsocket.sendPAD($SocketType.PAD_ONSCREEN, null);
		this.m_view = false;
	}
	
	private _onSend = () => {
		if(!this.props.word || !this.props.view || !this.m_view || this.props.type !== 'spelling') return;
		App.pub_reloadStudents(() => {
			if(!this.props.word || !this.props.view || !this.m_view) return;
			const msg: common.IDrillMsg = {
				msgtype: this.props.type as 'spelling',
				word_idx: this.props.word.idx,
			};
			felsocket.sendPAD($SocketType.MSGTOPAD, msg);
			while(this.props.state.returnUsers.length > 0) this.props.state.returnUsers.pop();
			this.props.actions.setRetCnt(0);
			this.props.actions.setNumOfStudent(App.students.length);
		});
		this.m_sended = true;
		App.pub_playToPad();
	}

	public componentDidUpdate(prev: IDrillItem) {
		if(this.props.view && !prev.view) {
			this.m_view = true;
			this.m_sended = false;

			this.props.actions.setNumOfStudent(App.students.length);

		} else if(!this.props.view && prev.view) {
			this.m_view = false;
			this.m_sended = false;


			this.props.state.speaking_audio = false;
			this.props.state.speaking_video = false;
		}
	}

	private _onVideo = () => {
		if(!this.props.view || !this.props.word || this.props.state.speaking_audio) return;
		App.pub_playBtnTab();

		const word = this.props.word;
		
		this.props.state.speaking_video = !this.props.state.speaking_video;
		this.props.state.speaking_audio = false;
		if(this.props.state.speaking_video) {
			felsocket.startStudentReportProcess($ReportType.VIDEO, null, 'C');

			App.pub_reloadStudents(() => {
				const msg: common.IDrillMsg = {
					msgtype: 'speaking_video',
					word_idx: word.idx,
				};
				felsocket.sendPAD($SocketType.MSGTOPAD, msg);
				this.props.actions.setRetCnt(0);
				this.props.actions.setNumOfStudent(App.students.length);
			});
		} else {
			felsocket.sendPAD($SocketType.PAD_ONSCREEN, null);
		}
	}
	private _onAudio = () => {
		if(!this.props.view || !this.props.word || this.props.state.speaking_video) return;
		App.pub_playBtnTab();
		
		const word = this.props.word;
		

		this.props.state.speaking_audio = !this.props.state.speaking_audio;
		this.props.state.speaking_video = false;
		if(this.props.state.speaking_audio) {
			felsocket.startStudentReportProcess($ReportType.AUDIO, null, 'C');
			App.pub_reloadStudents(() => {
				const msg: common.IDrillMsg = {
					msgtype: 'speaking_audio',
					word_idx: word.idx,
				};
				felsocket.sendPAD($SocketType.MSGTOPAD, msg);
				
				this.props.actions.setRetCnt(0);
				this.props.actions.setNumOfStudent(App.students.length);
			});
		} else {
			felsocket.sendPAD($SocketType.PAD_ONSCREEN, null);
			
		}
	}
	private _onReturn = () => {
        App.pub_playBtnTab();
        if(this.props.type === 'spelling') {
            const users: string[] = [];
            for(let i = 0; i < this.props.state.returnUsers.length; i++) {
                users[i] = this.props.state.returnUsers[i];
            }
            felsocket.startStudentReportProcess($ReportType.JOIN, users);
        } else if(this.props.type === 'speak') {
            felsocket.showStudentReportListPage();
        }
	}

	private _onSound = () => {
		this._nPlay = 1;
	}
	private _onStop = () => {
		this._nPlay = -1;
	}
	private _onSentenceSound = () => {
		const {  word } = this.props;
		if(!word) return;
		let audio = word.sentence_audio;

		App.pub_play(App.data_url + audio, (isEnded: boolean) => {
			//
		});

	}


	public render() {
		const { type, view, onClosed, word, state, actions } = this.props;
		const entry = word ? word.entry : '';
		const audio = word ? word.audio : '';
		const sentence = word ? this._getJSX(word.sentence) : <></>;		// 19-02-11 190208 검수사항 수정

		return (
			<CoverPopup className="drill_popup" view={view && this.m_view} onClosed={this.props.onClosed}>
				<div className="nav">
					<span className="type">{type.toUpperCase()}</span>
					<ToggleBtn className="btn_close" onClick={this._onClose}/>
				</div>
				<div className={'content ' + type}>
					<BtnAudio className="btn_audio" url={App.data_url + audio} onStop={this._onStop} nPlay={this._nPlay}/> 
					
					<div className="p_btns">
						<div className="return_cnt_box white" onClick={this._onReturn} hidden={(type === 'spelling') ? !this.m_sended : !state.speaking_video && !state.speaking_audio}>
							<div>{state.retCnt}/{state.numOfStudent}</div>
						</div>					
						<ToggleBtn className="btn_p_video"  on={state.speaking_video} disabled={state.speaking_audio} onClick={this._onVideo} view={type !== 'spelling'}/>
						<ToggleBtn className="btn_p_voice"  on={state.speaking_audio} disabled={state.speaking_video} onClick={this._onAudio} view={type !== 'spelling'}/>
					</div>

					<div className="entry_spell" onClick={this._onSound}>
						<WrapTextNew maxSize={80} minSize={70} view={type === 'spelling' || type === 'speak' && view && this.m_view}>
							{entry}
						</WrapTextNew>
					</div>
					<span className="line" hidden={type === 'spelling'}/>
					<div className="meaning_eng" hidden={type === 'spelling'}>
						<WrapTextNew maxSize={43} minSize={38} view={type === 'speak' && view && this.m_view} onClick={this._onSentenceSound}>
							{sentence}
						</WrapTextNew>
					</div>
					<SendUINew 
						type="teacher"
						view={this.m_view && type === 'spelling'}
						sended={this.m_sended}
						originY={0}
						onSend={this._onSend}
					/>
				</div>
			</CoverPopup>
		);
	}
}
const _soption: SwiperOptions = {
	direction: 'horizontal',
	observer: true,
	noSwiping: true,
	followFinger: false,
	effect: 'cube',
	cubeEffect: {
        shadow: true,
        slideShadows: true,
        shadowOffset: 40,
        shadowScale: 0.94,
      },
};
interface IComp {
	study: ''|'watch'|'learn'|'speak';
	idx: number;
	state: IStateCtx;
	actions: IActionsCtx;
	words: common.IWordData[];
	onClosed: () => void;
}
@observer
class StudyPopup extends React.Component<IComp> {
	@observable private m_view = false;
	@observable private _curIdx = -1;
	@observable private _curIdx_tgt = -1;
	@observable private _popup: POPUPTYPE = '';

	@observable private _speak_complete = false;
	@observable private _speak_auto = false;


	private _word: common.IWordData|null = null;

	private _loaded = false;

	private _swiper: Swiper|null = null;
	// private _container: HTMLElement|null = null;

	private _refSwiper = (el: SwiperComponent|null) => {
		if(this._swiper || !el) return;

		const swiper = el.swiper;
		this._swiper = swiper;
		this._swiperEvent(swiper);
	}
	private _swiperEvent(swiper: Swiper) {
		swiper.on('transitionStart', () => {
			/* 19-02-11 검수사항 빠르게 지나가도 모두 활성화 되게 하기 추가 수정  */
			if(this.props.study !== '' && this._curIdx >= 0 ) {
				const words = this.props.words;
				const idx = swiper.activeIndex;
				if(this._loaded && idx >= 0 && idx < words.length) {
					words[idx].app_studied = true;
				}
			}
			/* 19-02-11 검수사항 빠르게 지나가도 모두 활성화 되게 하기 추가 수정 End */
			if(this.props.study === 'speak') this._curIdx = -1;
			App.pub_stop();
		});
		swiper.on('transitionEnd', () => {
			const state = this.props.state;
			state.speak_audio = false;
			state.speak_video = false;
			this._speak_complete = false;
			if(this.props.study !== '') {
				this._curIdx = swiper.activeIndex;
				this._curIdx_tgt = this._curIdx;

				this.props.actions.setNavi(this._curIdx > 0, this._curIdx < this.props.words.length - 1);
			}
		});
	}


	private _onClose = () => {
		this.m_view = false;
		App.pub_stop();
		App.pub_playBtnTab();

		if(this.props.state.speak_audio || this.props.state.speak_video) {
			felsocket.sendPAD($SocketType.PAD_ONSCREEN, null);
		}	
	}
	private _onPage = (idx: number) => {
		if(!this._swiper || this._speak_auto || this.props.state.speak_audio || this.props.state.speak_video) return;

		App.pub_playBtnPage();
		this._swiper.slideTo(idx);
		this._curIdx_tgt = idx;
	}
	private _onDetailPopup = (word: common.IWordData, type: POPUPTYPE) => {
		App.pub_stop();
		App.pub_playPopup();
		this._word = word;
		this._popup = type;
		this.props.actions.setNaviView(false);
		// console.log('_onDetailPopup', type, word);
	}
	private _onPopupClosed = () => {
		App.pub_stop();
		// App.pub_playBtnTab(); // 효과음 추가 2018-12-26
		this._popup = '';
		this.props.actions.setNaviView(true);
		//
	}
	private _speakComplete = () => {
		if(this.props.study !== 'speak' || this._curIdx < 0) return;
		this._speak_complete = true;
		if(this._speak_auto && this._swiper) {
			if(this._swiper.activeIndex >= this.props.words.length - 1) {
				this._speak_auto = false;
			} else {
				_.delay(() => {
					if(this._swiper && this.props.study === 'speak') {
						this._swiper.slideNext();
					}
				}, 1000);
			}
		}
	}
	private _onVideo = () => {
		if(this.props.study !== 'speak') return;
		App.pub_playBtnTab();
		const words = this.props.words;
		if(this._curIdx < 0 || this._curIdx >= words.length) return;

		this.props.state.speak_video = !this.props.state.speak_video;
		this.props.state.speak_audio = false;
		if(this.props.state.speak_video) {
			// this.props.actions.setNaviView(false);
			felsocket.startStudentReportProcess($ReportType.VIDEO, null, 'C');
			App.pub_reloadStudents(() => {
				const msg: common.IDrillMsg = {
					msgtype: 'speak_video',
					word_idx: words[this._curIdx].idx,
				};
				felsocket.sendPAD($SocketType.MSGTOPAD, msg);
				this.props.actions.setRetCnt(0);
				this.props.actions.setNumOfStudent(App.students.length);
			});
		} else {
			// this.props.actions.setNaviView(true);
			felsocket.sendPAD($SocketType.PAD_ONSCREEN, null);
		}
	}
	private _onAudio = () => {
		if(this.props.study !== 'speak') return;
		App.pub_playBtnTab();
		const words = this.props.words;
		if(this._curIdx < 0 || this._curIdx >= words.length) return;

		this.props.state.speak_audio = !this.props.state.speak_audio;
		this.props.state.speak_video = false;
		if(this.props.state.speak_audio) {
			// this.props.actions.setNaviView(false);
			felsocket.startStudentReportProcess($ReportType.AUDIO, null, 'C');
			App.pub_reloadStudents(() => {
				const msg: common.IDrillMsg = {
					msgtype: 'speak_audio',
					word_idx: words[this._curIdx].idx,
				};
				felsocket.sendPAD($SocketType.MSGTOPAD, msg);
				
				this.props.actions.setRetCnt(0);
				this.props.actions.setNumOfStudent(App.students.length);
			});
		} else {
			// this.props.actions.setNaviView(true);
			felsocket.sendPAD($SocketType.PAD_ONSCREEN, null);
			
		}
	}
	private _onReturn = () => {
		App.pub_playBtnTab();
		if(this.props.state.speak_audio || this.props.state.speak_video) {
			felsocket.showStudentReportListPage();
		}
		this._setNavi();
	}
	private _onAuto = () => {
		if(this.props.study !== 'speak' || this._curIdx < 0) return;
		
		App.pub_playBtnTab();
		this._speak_auto = !this._speak_auto;

		if(this._speak_auto && this._swiper) {
			this.props.actions.setNaviView(false);
			this._speak_complete = false;
			if(this._swiper.activeIndex === 0) {
				this._curIdx = -1;
				const aidx = this._swiper.activeIndex;
				_.delay(() => {
					if(this.props.study !== 'speak' || !this._speak_auto) return;
					if(this._swiper && this._swiper.activeIndex === aidx) {
						this._curIdx = 0;
					}
				}, 300);
			} else {
				this._swiper.slideTo(0);
			}
		} else {
			this.props.actions.setNaviView(true);
		}
	}

	private _setNavi() {
		this.props.actions.setNaviView(true);
		this.props.actions.setNavi(this._curIdx_tgt > 0, this._curIdx_tgt < this.props.words.length - 1);
		this.props.actions.setNaviFnc(
			() => {
				if(this._speak_auto) return;
				if(this.props.state.speak_audio || this.props.state.speak_video) {
					felsocket.sendPAD($SocketType.PAD_ONSCREEN, null);
				}
				if(this._swiper) this._swiper.slidePrev();
			},
			() => {
				if(this._speak_auto) return;
				if(this.props.state.speak_audio || this.props.state.speak_video) {
					felsocket.sendPAD($SocketType.PAD_ONSCREEN, null);
				}
				if(this._swiper) this._swiper.slideNext();
			}
		);
	}

	public componentWillUpdate(next: IComp) {
		const { study, state, actions } = next;
		const nextView = study !== '';
		const view = this.props.study !== '';

		if(!view && nextView) {
			const effect = (study === 'watch') ? 'cube' : 'slide';
			if(this._swiper && _soption.effect !== effect) {
				const con = this._swiper.$el;
				this._swiper.detachEvents();
				this._swiper.destroy(true, true);
				this._swiper = null;
				_soption.effect = effect;
				this._swiper = new SwiperObj(con, _soption);
				this._swiperEvent(this._swiper as Swiper);
			}
		}
	}
	public componentDidUpdate(prev: IComp) {
		const { study, state, actions, idx } = this.props;

		const view = study !== '';
		const prevView = prev.study !== '';
		if(view && !prevView) {
			if(this._swiper) {
				const swiper = this._swiper;
				(async () => {
					if(idx >= 0) {
						swiper.update();
						swiper.slideTo(idx, 0);
					}
					await kutil.wait(400);
					swiper.update();
					if(swiper.scrollbar) swiper.scrollbar.updateSize();
					await kutil.wait(400);
					swiper.update();
					this.forceUpdate();
					await kutil.wait(200);
					if(idx >= 0) {
						swiper.slideTo(idx, 0);
						this._curIdx = idx;
					} else {
						swiper.slideTo(0, 0);
						this._curIdx = 0;
					}
					this._loaded = true;
				})();

				// const effect = (study === 'watch') ? 'cube' : 'slide';
				// this._swiper.params.effect = effect;
				// _soption.effect = effect;
				
			}
			this.m_view = true;
			if(study === 'speak') {
				this._curIdx = -1;
				this._speak_auto = true;
			} else if(idx >= 0) this._curIdx = idx;
			else this._curIdx = 0;

			this._curIdx_tgt = (idx >= 0) ? idx : 0;

			this._setNavi();
		} else if(!view && prevView) {
			this._loaded = false;

			this._speak_auto = false;
			this._speak_complete = false;
			state.speak_audio = false;
			state.speak_video = false;
			this.m_view = false;
			
			this._word = null;
			this._popup = '';
			this._curIdx = -1;
			this._curIdx_tgt = -1;

			_.delay(() => {
				if(this._swiper) this._swiper.slideTo(0, 0);
			}, 300);
			
			App.pub_stop();			
		}
	}
	 // 영상 자동재생 추가 2018-12-06 수정
	private _watchEnd = (idx: number) => {
		if(this._curIdx === idx && this._swiper)  this._swiper.slideNext();
	}
	public render() {
		const { study, state, actions, words } = this.props;
		const view = study !== '';

		const curIdx = this._curIdx;
		const curIdx_tgt = this._curIdx_tgt;
		const isRecording = state.speak_video || state.speak_audio;
		
		const arr: string[] = ['t_study_popup', study];

		if(isRecording) arr.push('recording');
		if(this._speak_auto) arr.push('auto');
		if(words.length < 2) arr.push('hide-navi');
		
		// console.log('---->', words.length);
		return (
			<CoverPopup className={arr.join(' ')}  view={view && this.m_view} onClosed={this.props.onClosed} >
				<div className="btn_page_box">	
					{words.map((word, idx) => {
						if(idx > 9){return <NItem key={idx} on={idx === curIdx_tgt} idx={idx} onClick={this._onPage}/>	
					}else{
							return
						}
					})}	
				</div>
				<div className="t_btns">
						<div className="return_cnt_box white" onClick={this._onReturn}>
							<div>{state.retCnt}/{state.numOfStudent}</div>
						</div>					
					<ToggleBtn className="btn_t_video"  disabled={!this._speak_complete || this._speak_auto || state.speak_audio} on={state.speak_video} onClick={this._onVideo}/>
					<ToggleBtn className="btn_t_voice"  disabled={!this._speak_complete || this._speak_auto || state.speak_video} on={state.speak_audio} onClick={this._onAudio}/>
					<ToggleBtn className="btn_t_auto"  on={this._speak_auto} disabled={isRecording} onClick={this._onAuto}/>
				</div>		
				<SwiperComponent 
					ref={this._refSwiper}
					{..._soption}
				>
					{words.map((word, idx) => {
						if(study === 'learn') return <div key={word.idx + '_learn'} className="t_voca_detail"><VocaDetail  view={this.m_view} word={word} idx={idx} current={curIdx} hasPreview={state.hasPreview} onPopup={this._onDetailPopup}/></div>;
						else if(study === 'watch') return <div key={word.idx + '_watch'} className="t_watch"><Watch view={this.m_view} word={word} idx={idx} current={curIdx} onPlayEnd={this._watchEnd}/></div>;
						else if(study === 'speak') return <div key={word.idx + '_speak'} className="t_speak"><Speak view={this.m_view} word={word} idx={idx} current={curIdx} onComplete={this._speakComplete} state={state} isAuto={this._speak_auto}/></div>;
						else return <React.Fragment key={idx} />;
					})}
				</SwiperComponent>
				<LecturePopup 
					type={this._popup} 
					view={this._popup === 'sound' || this._popup === 'meaning' || this._popup === 'usage' || this._popup === 'main video'} 
					word={this._word} 
					onClosed={this._onPopupClosed}
				/>
				<DrillPopup 
					type={this._popup} 
					view={this._popup === 'spelling' || this._popup === 'speak'} 
					word={this._word}
					actions={actions}
					onClosed={this._onPopupClosed}
					state={state}
				/>
				<ToggleBtn className="btn_back" onClick={this._onClose}/>
			</CoverPopup>
		);
	}
}
export default  StudyPopup;




