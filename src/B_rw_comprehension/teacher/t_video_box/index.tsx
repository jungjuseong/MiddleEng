import * as React from 'react';
import * as _ from 'lodash';
import { observer } from 'mobx-react';
import { observable, _allowStateChangesInsideComputed } from 'mobx';

import { IStateCtx, IActionsCtx } from '../t_store';
import { MPlayer, MConfig, IMedia, MPRState } from '@common/mplayer/mplayer';

import { ToggleBtn } from '@common/component/button';

import { App } from '../../../App';
import * as felsocket from '../../../felsocket';
import { CoverPopup } from '../../../share/CoverPopup';
import { Loading } from '../../../share/loading';

import { IScript,IData,IMsgForIdx,IMsg } from '../../common';
import * as kutil from '@common/util/kutil';

import { CountDown2, TimerState } from '../../../share/Timer';
import { _getJSX, _getBlockJSX,_sentence2jsx } from '../../../get_jsx';

import ControlBox from './_control_box';
import CaptionBox from './_caption_box';
import Script from './_script';
import VPopup from './_v_popup';

const SwiperComponent = require('react-id-swiper').default;

function _getCurrentIdx(scripts: IScript[], time: number) {
    let timeRound = Math.round(time / 0.01) * 0.01;
    for (let i = 0, len = scripts.length; i < len; i++) {
        const s = scripts[i];
        if (timeRound >= s.dms_start && timeRound <= s.dms_end) {
            return i;
        } else if (timeRound < s.dms_start) {
            break;
        }
    }
    return -1;
}

type POPUPTYPE = 'off'|'READALOUD' | 'SHADOWING' | 'CHECKUP' | 'CHECKUPSET';

interface IVideoBox {
	view: boolean;
	state: IStateCtx;
	actions: IActionsCtx;
	data: IData;
	onClosed: () => void;
}

@observer
class VideoPopup extends React.Component<IVideoBox> {
	private _box!: HTMLElement;
	private _swiper: Swiper|null = null;
    private _player = new MPlayer(new MConfig(true));
    private _player_inittime = 0; // 비디오 시작시간 
	private _countdown = new TimerState(3);

	@observable private _view = false;
	@observable private _viewCaption = false;
	@observable private _curIdx: number = -1;
	@observable private _viewCountDown = false;
	@observable private _play = false;

	@observable private _vpop: POPUPTYPE = 'off';
	@observable private _study: POPUPTYPE = 'off';

	@observable private _yourturn = -1;

	private _checkupIdx = -1;
	private _curCheckup = -1;

	
	private _ytNext = -1;
	private _checkups: IScript[] = [];

	constructor(props: IVideoBox) {
        super(props);
        const scripts = props.data.scripts;
        const checkups = props.data.checkup;

        for(let i = 0; i < checkups.length; i++) {
            const checkup = checkups[i];
            for(let j = 0; j < scripts.length; j++) {
                const script = scripts[j];
                if(checkup.seq === script.checkup_num) {
                    this._checkups.push(script);
                }
            }
        }
        
        this._player_inittime = props.data.video_start;
	}

	private _onClose = () => {
		console.log('VideoBox close');
		this._view = false;
		this._player.gotoAndPause(this._player_inittime * 1000);
	}

	private _refBox = (el: HTMLElement | null) => {
		if (this._box || !el) return;
		this._box = el;
	}
	private _refSwiper = (el: SwiperComponent) => {
		if(this._swiper || !el) return;
		this._swiper = el.swiper;
	}

	private _refVideo = (el: HTMLMediaElement | null) => {
		if (!el) return;
		if (this._player.media) return;
		this._player.mediaInited(el as IMedia);

		// player.load(App.data_url + this.props.data.video);
		const scripts = this.props.data.scripts;
		this._player.addOnTime((time: number) => {
			time = time / 1000;
			const curIdx = _getCurrentIdx(scripts, time);
			if(this._curIdx !== curIdx) {
				if(this._study === 'SHADOWING') {
					if(this._yourturn < 0) {
						if(this._curIdx >= 0 && this._player.bPlay) {
							const msg: IMsgForIdx = {msgtype: 'view_yourturn',idx: this._curIdx,};
							felsocket.sendPAD($SocketType.MSGTOPAD, msg);
							this._ytNext = curIdx;
							
							const script = scripts[this._curIdx];
							const delay = (script.dms_end - script.dms_start) * 2000;

							this._yourturn = _.delay(() => {
								if(this._yourturn >= 0) {
									this._player.play();
									this._curIdx = this._ytNext;
									this._yourturn = -1;

									const fmsg: IMsgForIdx = {msgtype: 'focusidx',idx: this._curIdx,};
									felsocket.sendPAD($SocketType.MSGTOPAD, fmsg);
									if(this._curIdx >= 0 && this._swiper) this._swiper.slideTo(this._curIdx === 0 ? 0 : this._curIdx - 1);
								}
							}, delay); 

							this._player.pause();

							return;
						} else if(this._player.bPlay) {
							const msg: IMsgForIdx = {msgtype: 'focusidx',idx: curIdx,};
							felsocket.sendPAD($SocketType.MSGTOPAD, msg);
						} else return;
					} else return;
				} else if(this._study === 'READALOUD') {
					const msg: IMsgForIdx = {msgtype: 'focusidx',idx: curIdx,};
					felsocket.sendPAD($SocketType.MSGTOPAD, msg);					
				}
				this._curIdx = curIdx;

				if(this._curIdx >= 0 && this._swiper) this._swiper.slideTo(this._curIdx === 0 ? 0 : this._curIdx - 1);
				// this.props.onChangeScript(curIdx);
			}
			if(this._study === 'CHECKUP' && this._player.bPlay) {
				let curCheckup = _getCurrentIdx(this._checkups, time);

				if(this._curCheckup !== curCheckup) {
					if(this._curCheckup >= 0) {
						this._player.pause();
						this._checkupIdx = this._curCheckup;
						this._vpop = 'CHECKUP';
					}
					this._curCheckup = curCheckup;
				}
			}			
		});

		this._player.addOnState((newState: MPRState, oldState: MPRState) => {
			if(this._study !== 'SHADOWING' && this._study !== 'READALOUD') return;

			let msgtype: 'playing'|'paused';
			if(this._study === 'SHADOWING' && this._yourturn >= 0) msgtype = 'playing';
			else if(this._viewCountDown) msgtype = 'playing';
			else if(newState !== MPRState.PAUSED && this._player.bPlay) msgtype = 'playing';
			else msgtype = 'paused';
			const msg: IMsg = {
				msgtype,
			};
			felsocket.sendPAD($SocketType.MSGTOPAD, msg);
		});
	}
	private _playClick = () => {
		this._play = !this._play;
		if(this._viewCountDown || this._study === 'SHADOWING') return;
		App.pub_playBtnTab();
		if(this._play) this._player.play();
		else if(!this._play) this._player.pause();
	}
	private _clickVideo = () => {
		if(this._viewCountDown || this._study === 'SHADOWING') return;
		if (this._player.bPlay) {
			App.pub_playBtnTab();
			this._player.pause();
		} else {
            App.pub_playBtnTab();
            if(this._player.currentTime >= this._player.duration || this._player.currentTime < this._player_inittime) this._player.seek(this._player_inittime * 1000);
            this._player.play();			
		}
	}
	private _toggleFullscreen = () => {
		App.pub_playBtnTab();
		if (document['fullscreenElement'] === this._box || document['webkitFullscreenElement'] === this._box) { 	// tslint:disable-line
			if (document.exitFullscreen) document.exitFullscreen();
			else if (document['webkitExitFullscreen']) document['webkitExitFullscreen'](); 	// tslint:disable-line
		} else {
			if (this._box.requestFullscreen) this._box.requestFullscreen();
			else if (this._box['webkitRequestFullscreen']) this._box['webkitRequestFullscreen'](); 	// tslint:disable-line
		}
	}
	private _prevClick = () => {
		if(this._viewCountDown) return;
		App.pub_playBtnTab();

		const yourturn = this._yourturn;
		if(this._yourturn >= 0) {
			clearTimeout(this._yourturn);
			this._yourturn = -1;
		}
		const scripts = this.props.data.scripts;
		const time = this._player.currentTime / 1000;

		let curIdx = -1;
		let bPlay = false;
		if(	this._study === 'SHADOWING' && yourturn >= 0) {	
			if( this._curIdx >= 0) curIdx = this._curIdx;

			bPlay = true;
		} else curIdx = _getCurrentIdx(scripts, time);


		this._curIdx = -1;
		this._curCheckup = -1;

		if(bPlay && !this._player.bPlay) this._player.play();
		if (curIdx >= 0) {
			if (curIdx > 0) {
                const script = scripts[curIdx - 1];
                if(this._player_inittime > script.dms_start) this._player.seek(this._player_inittime * 1000);
				else this._player.seek(script.dms_start * 1000);
			} else this._player.seek(this._player_inittime * 1000);
		} else {
			for (let len = scripts.length, i = len - 1; i >= 0; i--) {
				if (time > scripts[i].dms_start) {
                    if(this._player_inittime > scripts[i].dms_start) this._player.seek(this._player_inittime * 1000);
                    else this._player.seek(scripts[i].dms_start * 1000);
                    break;
				} else if (i === 0) {
					this._player.seek(this._player_inittime * 1000);
				}
			}
		}
	}
	private _nextClick = () => {
		if(this._viewCountDown) return;
		App.pub_playBtnTab();
		const yourturn = this._yourturn;
		if(this._yourturn >= 0) {
			clearTimeout(this._yourturn);
			this._yourturn = -1;
		}
		const scripts = this.props.data.scripts;
		const time = this._player.currentTime / 1000;

		let curIdx = -1;
		let bPlay = false;
		if(	this._study === 'SHADOWING' && yourturn >= 0) {	
			
			if(this._ytNext >= 0 ) curIdx = this._ytNext - 1;
			else if( this._curIdx >= 0) curIdx = this._curIdx;
			bPlay = true;
		} else curIdx = _getCurrentIdx(scripts, time);

		this._curIdx = -1;
		this._curCheckup = -1;

		if(bPlay && !this._player.bPlay) this._player.play();

		if (curIdx >= 0) {
			if (curIdx < scripts.length - 1) {
				const script = scripts[curIdx + 1];
				this._player.seek(script.dms_start * 1000);
			} else {
				this._player.seek(this._player.duration);
			}
		} else {
			for (let i = 0, len = scripts.length; i < len; i++) {
				if (time < scripts[i].dms_start) {
					this._player.seek(scripts[i].dms_start * 1000);
					break;
				} else if (i === len - 1) {
					this._player.seek(this._player.duration);
				}
			}
		}
    }
	private _toggleMute = () => {
		// if(this.props.roll !== '' || this.props.shadowing) return;
		App.pub_playBtnTab();
		this._player.setMuted(!this._player.muted);
	}
	private _togglePlay = () => {
		if(this._viewCountDown) return;
		App.pub_playBtnTab();

		const yourturn = this._yourturn;
		if(	this._yourturn >= 0) {
			clearTimeout(this._yourturn);
			this._yourturn = -1;
		} 
		if(this._study === 'SHADOWING') {
			if(yourturn >= 0) {
				if(this._player.bPlay) this._player.pause();
				return;
			} else {
				if(this._ytNext >= 0 ) this._curIdx = this._ytNext;
				this._ytNext = -1;
				const msg: IMsgForIdx = {msgtype: 'focusidx',idx: this._curIdx,};
				felsocket.sendPAD($SocketType.MSGTOPAD, msg);				
			}
		}


		if (this._player.bPlay) this._player.pause();
		else {
            // if(this._study === 'SHADOWING') this._curIdx = this._ytNext;
            if(this._player.currentTime >= this._player.duration || this._player.currentTime < this._player_inittime) this._player.seek(this._player_inittime * 1000);
            this._player.play();
            if(this._curIdx >= 0 && this._swiper) this._swiper.slideTo(this._curIdx === 0 ? 0 : this._curIdx - 1);
		}
	}
	private _clearStudy() {
		this._curIdx = -1;
		this._checkupIdx = -1;
		this._curCheckup = -1;

		if(this._study === 'off') return;
		if(	this._yourturn >= 0) {
			clearTimeout(this._yourturn);
			this._yourturn = -1;
		}
		this._viewCaption = false;
		this._countdown.pause();
		this._countdown.reset();
		this._viewCountDown = false;
		this._study = 'off';

		const msg: IMsg = {msgtype: 'v_dialogue_end',};
		felsocket.sendPAD($SocketType.MSGTOPAD, msg);
	
	}

	private _stopClick = () => {
        App.pub_playBtnTab();
        this._player.gotoAndPause(this._player_inittime * 1000);
        
        this._curIdx = -1;
        this._checkupIdx = -1;
        this._curCheckup = -1;

        if(this._study === 'off') return;
        if(	this._yourturn >= 0) {
            clearTimeout(this._yourturn);
            this._yourturn = -1;
        }
        // this._viewCaption = false;
        this._countdown.pause();
        this._countdown.reset();
        this._viewCountDown = false;
	}

	private _toggleCaption = () => {
		App.pub_playBtnTab();

		const sidx = (this._swiper) ? this._swiper.activeIndex : -1;

		this._viewCaption = !this._viewCaption;

		if(this._study === 'READALOUD' || this._study === 'SHADOWING') {
			/*
			if( sidx >= 0 && this._swiper) {
				this._swiper.update();
				if(this._swiper.scrollbar) this._swiper.scrollbar.updateSize();
				this._swiper.slideTo(sidx);

				_.delay(() => {
					if(this._swiper && this._player) {
						this._swiper.update();
						if(this._swiper.scrollbar) this._swiper.scrollbar.updateSize();
						this._swiper.slideTo(sidx);
					}
				}, 50);

			}
			*/
		}
	}

	private _countStart = () => {
		// console.log('_countStart');
	}
	private _countZero = async () => {
		this._viewCountDown = false;

		if(!this.props.view) return;

		await kutil.wait(300);
		if(!this.props.view) return;

		if(this._study === 'READALOUD' || this._study === 'SHADOWING') {
            if(this._player.currentTime !== this._player_inittime 
                || this._player.currentTime < this._player_inittime) this._player.seek(this._player_inittime * 1000);
            this._player.play();
            if(this._swiper) {
                this._swiper.update();
                if(this._swiper.scrollbar) this._swiper.scrollbar.updateSize();
            }
		}
		
	}
	public componentDidUpdate(prev: IVideoBox) {
		if (this.props.view && !prev.view) {
            this._view = true;

            if(this._player.myState <= MPRState.LOADING) {
                this._player.load(App.data_url + this.props.data.video);
            }
            this._player.setMuted(false);
            this._player.setMutedTemp(false);

            this._viewCaption = false;
            this._curIdx = -1;
            
            this._countdown.pause();
            this._countdown.reset();
            this._viewCountDown = false;

            this._vpop = 'off';
            this._yourturn = -1;
            this._ytNext = -1;

            this._study = 'off';

            this._checkupIdx = -1;
            this._curCheckup = -1;

            // felsocket.sendPAD($SocketType.PAD_ONSCREEN, null);
            if(this._player.currentTime < this._player_inittime) this._player.seek(this._player_inittime * 1000);
            this._player.play();
			
		} else if (!this.props.view && prev.view) {
			if(this._study !== 'off') {
				felsocket.sendPAD($SocketType.PAD_ONSCREEN, null);
			}
			this._view = false;
			this._player.gotoAndPause(this._player_inittime * 1000);

			this._vpop = 'off';
			this._viewCaption = false;
			this._curIdx = -1;
			
			this._countdown.pause();
			this._countdown.reset();
			this._viewCountDown = false;
			if(	this._yourturn >= 0) {
				clearTimeout(this._yourturn);
				this._yourturn = -1;
			}
			this._ytNext = -1;

			// 
			if(this._player.bPlay) {
				this._player.pause();
			}
		}

	}

	private _readaloudClick = () => {
		if(this._study === 'READALOUD') {
			App.pub_playBtnTab();
			this._clearStudy();
			this._player.pause();
		} else if(this._study === 'off' ) {
			App.pub_playBtnTab();
			this._vpop = 'READALOUD';
			this._player.pause();
			this.props.state.isVideoStudied = true;
		}
	}
	private _shadowingClick = () => {
		if(this._study === 'SHADOWING') {
			App.pub_playBtnTab();
			this._clearStudy();
			this._player.pause();
		} else if(this._study === 'off' ) {
			App.pub_playBtnTab();
			this._vpop = 'SHADOWING';
			this._player.pause();
			this.props.state.isVideoStudied = true;
		}
	}
	private _checkupClick = () => {
		// if(this._study === 'CHECKUP') {
		// 	App.pub_playBtnTab();
		// 	this._clearStudy();
		// 	this._player.pause();
		// } else if(this._study === 'off' ) {
		// 	App.pub_playBtnTab();
		// 	this._study = 'CHECKUP';
		// 	this._player.seek(0);
		// 	if(!this._player.bPlay) this._player.play();
		// 	felsocket.sendPAD($SocketType.PAD_ONSCREEN, null);
		// 	this.props.state.isVideoStudied = true;
        // }
        if(this._study === 'CHECKUP') {
			App.pub_playBtnTab();
			this._clearStudy();
			this._player.pause();
		} else if(this._study === 'CHECKUPSET') {
            App.pub_playBtnTab();
            this.props.state.isVideoStudied = false;
		} else if(this._study === 'off' ) {
            App.pub_playBtnTab();
            this._vpop = 'CHECKUPSET';
            this._player.pause();
            this.props.state.isVideoStudied = true;
        }
	}
	private _offVideo = () => {
        if(this._vpop === 'CHECKUP') {
        	const msg: IMsg = {msgtype: 'v_dialogue_end',};
        	felsocket.sendPAD($SocketType.MSGTOPAD, msg);			
        	this._player.play();
        }
        this._vpop = 'off';
	}
	private _onSend = async (type: POPUPTYPE) => {
        if(!this.props.view) return;
        else if(this._vpop !== type ) return;
        else if(this._vpop === 'off' ) return;

        if(this._vpop === 'CHECKUPSET') {
            App.pub_playBtnTab();
            await kutil.wait(300);
            this._study = 'CHECKUP';
            this._vpop = 'CHECKUP';
            this._player.seek(this._player_inittime * 1000);
            if(!this._player.bPlay) this._player.play();
            felsocket.sendPAD($SocketType.PAD_ONSCREEN, null);
        } else if(this._vpop === 'CHECKUP') {
            //
        } else {
            this._study = type;
            this._viewCaption = false;
            this._countdown.pause();
            this._countdown.reset();
            this._viewCountDown = true;
            this._viewCaption = true;
            this._countdown.start();
            this._player.seek(this._player_inittime * 1000);
            this._curIdx = -1;
            if(this._swiper) this._swiper.slideTo(0, 0);

            const msg: IMsg = {
                msgtype: 'playing',
            };
            felsocket.sendPAD($SocketType.MSGTOPAD, msg);			
        }
	}

	public render() {
		const {view, data, actions} = this.props;
		const scripts = data.scripts;
		let script;
		if(this._viewCaption && this._curIdx >= 0) script = scripts[this._curIdx];
		// const isOnRoll = roll === 'A' || roll === 'B';
		const viewLoading = this._study === 'off' && (this._player.myState === MPRState.BUFFERING || this._player.myState === MPRState.LOADING); // !isOnRoll && 제외
		const viewBtnPlay = this._study === 'off' && !this._player.bPlay;	// !isOnRoll && 제외
		const isPlay = ((this._study === 'SHADOWING' && this._yourturn >= 0) || this._player.bPlay); 	// || (shadowing && this.props.isShadowPlay)

		
		const isRAOrSD = (this._study === 'READALOUD' || this._study === 'SHADOWING');
		const isStudentTurn = (this._study === 'READALOUD' || (this._study === 'SHADOWING' && this._yourturn >= 0));

		return (
			<CoverPopup 
				className="video_popup" 
				view={this.props.view && this._view} 
				onClosed={this.props.onClosed} 
			>
				<div className="wrapper" ref={this._refBox}>
					<div className="video_box">
						<div className={'video ' + this._study}>
							<video controls={false} ref={this._refVideo} onClick={this._clickVideo} />
							
							<SwiperComponent
								ref={this._refSwiper}
								direction="vertical"
								scrollbar={{ el: '.swiper-scrollbar', draggable: true,}}
								observer={true}
								slidesPerView="auto"
								freeMode={true}						
							>
								{scripts.map((scr, idx) => {
									return (
										<div key={idx} className={'script' + (isPlay ? ' swiper-no-swiping' : '')}>
											<Script 
												key={idx}
												idx={idx}
												on={isRAOrSD && this._curIdx === idx}
												studentturn={isStudentTurn}
												script={scr}
												viewScript={isRAOrSD && this._viewCaption}
											/>
										</div>
									);
								})}
							</SwiperComponent>

							<Loading view={viewLoading} />
							{/*
								<ToggleBtn className="playbtn" view={viewBtnPlay} onClick={this._playClick} />
							*/}
							<CaptionBox 
								view={view}
								inview={!isRAOrSD && this._viewCaption} 
								script={script} 
							/>
							
							<CountDown2 state={this._countdown} view={this._viewCountDown} onStart={this._countStart}  onComplete={this._countZero}/>
						</div>
						<ControlBox
							player={this._player}
							disable={this._viewCountDown || this._study === 'SHADOWING'}
							vpop={this._vpop}
							study={this._study}
							isPlay={isPlay}
							checkups={this._checkups}
							toggleFullscreen={this._toggleFullscreen}
							togglePlay={this._togglePlay}
							stopClick={this._stopClick}
							prevClick={this._prevClick}
							nextClick={this._nextClick}
							viewCaption={this._viewCaption}
							toggleCaption={this._toggleCaption}
							toggleMute={this._toggleMute}
							readaloudClick={this._readaloudClick}
							shadowingClick={this._shadowingClick}
							checkupClick={this._checkupClick}
						/>
					</div>
					<VPopup 
						type={this._vpop} 
						data={data}
						checkupIdx={this._checkupIdx}
						actions={actions}
						onSend={this._onSend}
						onClosed={this._offVideo} 
					/>							
				
				</div>
				<ToggleBtn className="btn_back" onClick={this._onClose}/>
			</CoverPopup>
		);
	}
}
export default VideoPopup;
