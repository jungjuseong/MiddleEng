import * as React from 'react';

import * as _ from 'lodash';
import { hot } from 'react-hot-loader';

import { observer } from 'mobx-react';
import { observable } from 'mobx';

import { ToggleBtn } from '@common/component/button';
import * as kutil from '@common/util/kutil';
import { App } from '../../../App';
import { IStateCtx, IActionsCtx } from '../t_store';
import { IWordData,IDrillMsg } from '../../common';
import { CoverPopup } from '../../../share/CoverPopup';
import VocaDetail from '../t_voca_detail';
import { POPUPTYPE } from '../t_voca_detail';

import * as felsocket from '../../../felsocket';

const SwiperComponent = require('react-id-swiper').default;
const SwiperObj =  require('swiper').default;

import Watch from '../t_watch';
import Speak from '../t_speak';

import LecturePopup from './_lecture_popup';
import DrillPopup from './_drill_popup';

class NItem extends React.Component<{idx: number, on: boolean, onClick: (idx: number) => void}> {
	private _click = () => {
		this.props.onClick(this.props.idx);
	}
	public render() {
		const {idx, on} = this.props;
		return <span className={on ? 'on' : ''} onClick={this._click}>{idx + 1}</span>;
	}
}

class NItemNavL extends React.Component<{curidx: number, on: boolean , onClick: (start: number) => void}> {
	private _click = () => {
		const {curidx} = this.props;
		if(curidx > 0) {
			this.props.onClick((curidx - 1) * 10);
		}
	}
	public render() {
		const {curidx, on} = this.props;
		return <span className={on ? 'on' : ''} onClick={this._click}>{'<'}</span>;
	}
}

class NItemNavR extends React.Component<{maxidx: number , curidx: number, on: boolean , onClick: (start: number) => void}> {
	private _click = () => {
		const {maxidx, curidx} = this.props;
		if(curidx < maxidx) {
			this.props.onClick((curidx + 1) * 10);
		}	
	}
	public render() {
		const { on } = this.props;
		return <span className={on ? 'on' : ''} onClick={this._click}>{'>'}</span>;
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

interface IStudyPopup {
	study: ''|'watch'|'learn'|'speak';
	idx: number;
	state: IStateCtx;
	actions: IActionsCtx;
	words: IWordData[];
	onClosed: () => void;
}
@observer
class StudyPopup extends React.Component<IStudyPopup> {
	@observable private m_view = false;
	@observable private _curIdx = -1;
	@observable private _curIdx_tgt = -1;
	@observable private _popup: POPUPTYPE = '';

	@observable private _speak_complete = false;
	@observable private _speak_auto = false;

	private _word: IWordData|null = null;

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
	private _onDetailPopup = (word: IWordData, type: POPUPTYPE) => {
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
				const msg: IDrillMsg = {
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
		const { study, state, actions } = this.props;

		if(study !== 'speak') return;
		App.pub_playBtnTab();
		const words = this.props.words;
		if(this._curIdx < 0 || this._curIdx >= words.length) return;

		state.speak_audio = !state.speak_audio;
		state.speak_video = false;
		if(state.speak_audio) {
			// this.props.actions.setNaviView(false);
			felsocket.startStudentReportProcess($ReportType.AUDIO, null, 'C');
			App.pub_reloadStudents(() => {
				const drillMsg: IDrillMsg = {
					msgtype: 'speak_audio',
					word_idx: words[this._curIdx].idx,
				};
				felsocket.sendPAD($SocketType.MSGTOPAD, drillMsg);
				
				actions.setRetCnt(0);
				actions.setNumOfStudent(App.students.length);
			});
		} else {
			felsocket.sendPAD($SocketType.PAD_ONSCREEN, null);			
		}
	}
	private _onReturn = () => {
		const { state } = this.props;
		App.pub_playBtnTab();
		if(state.speak_audio || state.speak_video) {
			felsocket.showStudentReportListPage();
		}
		this._setNavi();
	}
	private _onAuto = () => {
		const { study,actions } = this.props;

		if(study !== 'speak' || this._curIdx < 0) return;
		
		App.pub_playBtnTab();
		this._speak_auto = !this._speak_auto;

		if(this._speak_auto && this._swiper) {
			actions.setNaviView(false);
			this._speak_complete = false;
			if(this._swiper.activeIndex === 0) {
				this._curIdx = -1;
				const aidx = this._swiper.activeIndex;
				_.delay(() => {
					if(study !== 'speak' || !this._speak_auto) return;
					if(this._swiper && this._swiper.activeIndex === aidx) {
						this._curIdx = 0;
					}
				}, 300);
			} else {
				this._swiper.slideTo(0);
			}
		} else {
			actions.setNaviView(true);
		}
	}

	private _setNavi() {
		const { words,state,actions } = this.props;
		actions.setNaviView(true);
		actions.setNavi(this._curIdx_tgt > 0, this._curIdx_tgt < words.length - 1);
		actions.setNaviFnc(
			() => {
				if(this._speak_auto) return;
				if(state.speak_audio || state.speak_video) {
					felsocket.sendPAD($SocketType.PAD_ONSCREEN, null);
				}
				if(this._swiper) this._swiper.slidePrev();
			},
			() => {
				if(this._speak_auto) return;
				if(state.speak_audio || state.speak_video) {
					felsocket.sendPAD($SocketType.PAD_ONSCREEN, null);
				}
				if(this._swiper) this._swiper.slideNext();
			}
		);
	}

	public componentWillUpdate(next: IStudyPopup) {
		const { study } = next;
		const nextView = study !== '';
		const view = study !== '';

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

	public componentDidUpdate(prev: IStudyPopup) {
		const { study, state, idx } = this.props;

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

		const navcur = Math.trunc(curIdx_tgt / 10);
		const maxnav = Math.trunc(words.length / 10); // parseInt((words.length / 10).toString());
		// console.log('---->', words.length);
		return (
			<CoverPopup className={arr.join(' ')}  view={view && this.m_view} onClosed={this.props.onClosed} >
				<div className="btn_page_box">
					<NItemNavL curidx={navcur} on={false} onClick={this._onPage}/>
					{words.map((word, idx) => {
						if(idx >= (navcur * 10) && idx < (navcur * 10) + 10) { 
							return (<NItem key={idx} on={idx === curIdx_tgt} idx={idx} onClick={this._onPage}/>);
						} else {
							return;
						}
					})}
					<NItemNavR maxidx={maxnav} curidx={navcur} on={false} onClick={this._onPage}/>	
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
						if(study === 'learn') { 
							return (
							<div key={word.idx + '_learn'} className="t_voca_detail">
								<VocaDetail  view={this.m_view} word={word} idx={idx} current={curIdx} hasPreview={state.hasPreview} onPopup={this._onDetailPopup}/>
							</div>);
						}
						if(study === 'watch') { 
							return (
							<div key={word.idx + '_watch'} className="t_watch">
								<Watch view={this.m_view} word={word} idx={idx} current={curIdx} onPlayEnd={this._watchEnd}/>
							</div>);
						}
						if(study === 'speak') {
							return (
								<div key={word.idx + '_speak'} className="t_speak">
									<Speak view={this.m_view} word={word} idx={idx} current={curIdx} onComplete={this._speakComplete} state={state} isAuto={this._speak_auto}/>
								</div>);
						}
						return <React.Fragment key={idx} />;
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