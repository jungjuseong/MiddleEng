import * as React from 'react';
import * as ReactDOM from 'react-dom';

import { observable, action } from 'mobx';
import { Observer, observer } from 'mobx-react';

import * as _ from 'lodash';

import { ToggleBtn } from '@common/component/button';

import * as StrUtil from '@common/util/StrUtil';
import * as kutil from '@common/util/kutil';

import * as common from '../common';
import SendUINew from '../../share/sendui_new';

import { App } from '../../App';
import { MPlayer, MConfig, MPRState, IMedia } from '@common/mplayer/mplayer';
import * as butil from '@common/component/butil';
import * as felsocket from '../../felsocket';
import { IActionsCtx, useStudent, StudentContext } from './s_store';
import { ResponsiveText } from '../../share/ResponsiveText';
import { hot } from 'react-hot-loader';
import WrapTextNew from '@common/component/WrapTextNew';
const notifyStartVoice = 'notifyStartVoice';
const notifyStartCamera = 'notifyStartCamera';
const notifyStopCamera = 'notifyStopCamera';
const notifySwitchCamera = 'notifySwitchCamera';

const notifyStartVideoRecord = 'notifyStartVideoRecord';
const notifyVideoRecordCanceled = 'notifyVideoRecordCanceled';
const notifyStopVideoRecord = 'notifyStopVideoRecord';

const MAX_TIME = 30;
const MAX_TIME_STR = '00:30';

function _toStr(n: number) {
	n = Math.ceil(n / 1000);
	const m = Math.floor(n / 60);
	const s = n % 60;
	return (m < 10 ? '0' + m : '' + m) + ':' + (s < 10 ? '0' + s : '' + s);
}


const enum MYSTATE {
	VIEW,
	READY,
	WAIT_START,
	RECORDING,
	WAIT_END,
	RECORDED,
	SENDING,
	SENDED,
}

interface ISpeakRecord {
	view: boolean;
	word: common.IWordData;
	mediaType: 'audio'|'video';
	bRecordSend: boolean;
	recorded: string;
	uploaded: string;
	notice: string;
	likeOn: boolean;
	actions: IActionsCtx;

}
@observer
class Comp extends React.Component<ISpeakRecord> {
	private _video = new MPlayer(new MConfig(true));
	private _audio = new MPlayer(new MConfig(true));

	private get _player() {
		return this.props.mediaType === 'video' ? this._video : this._audio;
	}

	@observable private _state = MYSTATE.VIEW;
	@observable private _time = 0;
	@observable private _hideContents = false;
	@observable private _playCnt = 0;
	
	@observable private _recorded = '';

	@observable private _loaded = false;
	private _mediaType: 'audio'|'video' = 'audio';

	private _jsx: JSX.Element;

	private _stime = 0;

	constructor(props: ISpeakRecord) {
		super(props);

		this._jsx = this._getJSX(props.word.sentence);
	}

	private _getJSX(text: string) {
		const nodes = butil.parseBlock(text, 'block');
		return (
			<>
				{nodes.map((node) => node)}
			</>
		);

	}

	@action private _countDown = (t: number) => {
		if(!this.props.view) return;
		else if(this._state !== MYSTATE.RECORDING) return;

		this._time = (Date.now() - this._stime) / 1000;
		if(this._time > MAX_TIME) {
			this._time = MAX_TIME;
			this._onStopRecord();
			return;
		}
		window.requestAnimationFrame(this._countDown);
	}

	private _onStartRecord = () => {
		if(!this.props.view) return;
		else if(this._state !== MYSTATE.READY && this._state !== MYSTATE.RECORDED) return;
		this._video.pause();
		this._audio.pause();
		
		this._time = 0;
		this._state = MYSTATE.WAIT_START;
		this.props.actions.onStartRecord();
		if(!App.isDvlp) {
			if(this.props.mediaType === 'video') felsocket.startVideoRecord();
			else felsocket.startVoiceRecord();
		}
	}
	private _onStopRecord = () => {
		if(!this.props.view) return;
		else if(this._state !== MYSTATE.RECORDING && this._state !== MYSTATE.WAIT_START) return;
		else if(this._time >= 0 && this._time <= 2.0) return;
		
		if(this._state === MYSTATE.RECORDING) {
			this._state = MYSTATE.WAIT_END;
			this.props.actions.onStopRecord();
		} else {
			if(this._recorded && this._recorded !== '') this._state = MYSTATE.RECORDED;
			else this._state = MYSTATE.READY;
		}
		
		if(!App.isDvlp) {
			if(this.props.mediaType === 'video') felsocket.stopVideoRecord();
			else felsocket.stopVoiceRecord();
		}
	}
	private _onSend = () => {
		if(!this.props.view) return;
		else if(this._state !== MYSTATE.RECORDED) return;

		this._state = MYSTATE.SENDING;
		this.props.actions.onUploadMedia(this.props.recorded);
		this.props.actions.setLoading(true);
		App.pub_playToPad();
		if(!App.isDvlp) {
			felsocket.uploadFileToServer(this.props.recorded);
		}
	}
	/*
	private _onContents = () => {
		if(!this.props.view) return;
		else if(this._state < MYSTATE.SENDED) return;

		this._hideContents = !this._hideContents;
	}
	private _onQuestion = () => {
		if(!this.props.view) return;
		else if(this._state < MYSTATE.SENDED) return;

		this._viewQ = !this._viewQ;
	}
	*/
	private _onPlayStop = () => {
		if(!this.props.view) return;
		else if(this._state < MYSTATE.RECORDED) return;

		this._playCnt++;
		if(this._player.bPlay) this._player.pause();
		else this._player.play();
	}
	@action private _startedRecord = () => {
		if(!this.props.view) return;
		if(this._state !== MYSTATE.WAIT_START) return;

		this._stime = Date.now();
		this._time = 0;
		this._state = MYSTATE.RECORDING;

		window.requestAnimationFrame(this._countDown);
	}
	@action private _stopedRecord = () => {
		if(!this.props.view) return;
		else if(this._state !== MYSTATE.WAIT_END) return;

		if(this._recorded && this._recorded !== '') this._state = MYSTATE.RECORDED;
		else this._state = MYSTATE.READY;
	}

	private _refVideo = (video: HTMLVideoElement|null) => {
		if(this._video.media || !video) return;
		this._video.mediaInited(video as IMedia);

		this._video.addOnState((newState, oldState) => {
			// console.log(newState, oldState, this._video.bPlay);
			if(newState === MPRState.READY) {
				this._loaded = true;
				this._video.gotoAndPause(0);
			}
		});
	}
	private _refAudio = (audio: HTMLAudioElement|null) => {
		if(this._audio.media || !audio) return;
		this._audio.mediaInited(audio as IMedia);
	}
	private _onContents = () => {
		if(!this.props.view) return;
		else if(this._state < MYSTATE.SENDED) return;

		this._hideContents = !this._hideContents;
	}
	private _onEntry = () => {
		if(!this.props.view) return;
	}
	private _onSentence = () => {
		if(!this.props.view) return;
	}
	public componentWillReceiveProps(next: ISpeakRecord) {
		if(next.word !== this.props.word) {
			this._jsx = this._getJSX(next.word.sentence);
		}
	}
	public componentDidUpdate(prev: ISpeakRecord) {
		

		if(this.props.view) {
			if(this.props.notice !== prev.notice) {
				// console.log(this.props.notice, this.props.mediaType, this._state === MYSTATE.WAIT_START);
				switch(this.props.notice) {
				case notifyStartVoice:
					if(this.props.mediaType === 'audio' && this._state === MYSTATE.WAIT_START) {
						this._startedRecord();
					}						
					break;
				/*
				case notifyStartCamera:
					if(this.props.mediaType === 'video' && this._state === MYSTATE.WAIT_START) {
						felsocket.startVideoRecord();
					}
					break;
				*/
				case notifyStartVideoRecord:
					if(this.props.mediaType === 'video' && this._state === MYSTATE.WAIT_START) {
						this._startedRecord();
					}
					break;
				case notifyStopCamera:
					break;
				case notifyVideoRecordCanceled:
				case notifyStopVideoRecord:
					_.delay(this._stopedRecord, 300);
					break;
				default:
					break;
				}
					
			}

			if(this.props.recorded !== prev.recorded) {
				if(this._state === MYSTATE.WAIT_END) {
					if(this.props.recorded !== '') {
						this._loaded = false;
						this._player.unload();
						this._playCnt = 0;
						this._recorded = this.props.recorded;
						this._player.load(this._recorded);
					}
					if(this._recorded && this._recorded !== '') this._state = MYSTATE.RECORDED;
					else this._state = MYSTATE.READY;
				}
			}

			if(this.props.uploaded !== prev.uploaded) {
				if(this.props.uploaded && this.props.uploaded !== '' && this._state === MYSTATE.SENDING) {
					this.props.actions.startGoodJob();
					this._state = MYSTATE.SENDED;
					this.props.actions.setLoading(false);

					if(App.student) {
						const msg: common.IRecordedMsg = {
							msgtype: 'recorded_return',
							id: App.student.id,
							url: this.props.uploaded,
							stime: this._stime,
							etime: this._stime + (this._time * 1000),
							word_idx: this.props.word.idx,
						};
						if(this.props.mediaType === 'video') {
							felsocket.uploadStudentReport($ReportType.VIDEO, this.props.uploaded, '');
						} else {
							felsocket.uploadStudentReport($ReportType.AUDIO, this.props.uploaded, '');
						}
						felsocket.sendTeacher($SocketType.MSGTOTEACHER, msg);
					}
					App.pub_playGoodjob();
					this.props.actions.startGoodJob();
					// this.props.actions.setProg(SProg.COMPLETE);
				}
			}

			if(!prev.view) {
				this._state = MYSTATE.READY;
				if(this.props.mediaType === 'video') {
					felsocket.startCamera();
					const wrap = document.getElementById('wrap');
					if(wrap) {
						wrap.style.backgroundImage = 'unset';
						wrap.style.backgroundColor = 'transparent';
					}
				}
			}
		} else if(!this.props.view && prev.view) {
			const mediaType = prev.mediaType;
			if(this._state === MYSTATE.RECORDING || this._state === MYSTATE.WAIT_START) {
				if(mediaType === 'video') felsocket.stopVideoRecord();
				else felsocket.stopVoiceRecord();
			}

			this._video.unload();
			this._audio.unload();
			this._loaded = false;

			this._state = MYSTATE.VIEW;
			this._time = 0;
			this._recorded = '';
			this._playCnt = 0;
			this._hideContents = false;

			const wrap = document.getElementById('wrap');
			if(wrap) {
				wrap.style.backgroundImage = '';
				wrap.style.backgroundColor = '';
			}

			_.delay(() => {
				if(!this.props.view && mediaType === 'video') felsocket.stopCamera();
			}, 300);
		}

		
	}
	public render() {
		const {view, mediaType, notice, recorded, uploaded, likeOn, word} = this.props;
		
		let subClass = ' ' + mediaType as string;
		if(this._state === MYSTATE.SENDED && likeOn) subClass = subClass + ' like-on';
		if(this._hideContents) subClass = subClass + ' hide-contents';
		if(!view) subClass = subClass + ' hide';

		let timeStr = '';
		if(this._state >= MYSTATE.WAIT_START && this._state <= MYSTATE.WAIT_END) {
			timeStr = _toStr(Math.floor(this._time) * 1000) + ' / ' + MAX_TIME_STR;
		} else if(this._state >= MYSTATE.RECORDED) {
			let duration = this._player.duration / 1000;
			if(duration > MAX_TIME) duration = MAX_TIME;

			if(this._playCnt > 0) {
				let viewTime = this._player.viewTime / 1000;
				if(viewTime > MAX_TIME) viewTime = MAX_TIME;

				timeStr = _toStr(Math.floor(viewTime) * 1000) + ' / ' + _toStr(Math.floor(duration) * 1000);
			} else timeStr = _toStr(Math.floor(duration) * 1000);
		}

		let fontSize = '100px';
		if(word.entry.length > 14) fontSize = '80px';
		else if(word.entry.length > 10) fontSize = '90px';

		return (
			<div className={'s-speak-record' + subClass}>
				<div hidden={true}>{notice + ',' + recorded + ',' + uploaded}</div>
				<img 
					className="word-image" 
					src={view ? App.data_url + word.image_pad : ''} 
					draggable={false}
					style={{display:  (mediaType === 'video' && this._state >= MYSTATE.WAIT_START ? 'none' : '')}}
				/>
				<div className="media-box" >
					<div className="s-menu">
						<video controls={false} style={{opacity: (this._loaded ? 1 : 0)}} autoPlay={false} ref={this._refVideo} hidden={mediaType !== 'video' || this._state < MYSTATE.RECORDED} poster={_project_ + 'student/images/allalpha.png'}/>
						<audio controls={false} autoPlay={false} ref={this._refAudio} hidden={mediaType !== 'audio'}/>
						<div className="btn-box"  >

							<div className="left_box" hidden={this._state < MYSTATE.SENDED}>
								<ToggleBtn className="btn_script" view={mediaType === 'video'} on={this._hideContents} onClick={this._onContents}/>
							</div>
							
							<div className="center-box">
								<ToggleBtn 
									view={this._state === MYSTATE.READY || this._state === MYSTATE.RECORDED}
									className={'btn_record ' + mediaType} 
									onClick={this._onStartRecord}
								/>
								<ToggleBtn 
									view={this._state > MYSTATE.READY && this._state < MYSTATE.RECORDED}
									className={'btn_record_stop' + (this._time >= 0 && this._time <= 2.0 ? ' noactive' : '')}
									onClick={this._onStopRecord}
								/>
								<ToggleBtn 
									view={this._state >= MYSTATE.RECORDED}
									className={'btn_play_pause' + (this._player.bPlay ? ' play' : '')} 
									onClick={this._onPlayStop}
								/>
							</div>
							<span className="time-box" hidden={this._state <= MYSTATE.READY}>
								<img 
									draggable={false} 
									hidden={this._state < MYSTATE.WAIT_START || this._state > MYSTATE.WAIT_END} 
									src={_project_ + 'student/images/icon_recording.png'}
								/>
								{timeStr}
							</span>

						</div>
					</div>

					<SendUINew 
						type="pad"
						view={this.props.view && this.props.bRecordSend && this._state >= MYSTATE.RECORDED}
						sended={this._state === MYSTATE.SENDED}
						originY={0}
						onSend={this._onSend}
					/>
				</div>
				
				<div className={'content-box' + (mediaType === 'video' && this._state >= MYSTATE.WAIT_START ? ' hide-bg' : '')} >			
					<div className="entry_box" style={{opacity: (this._hideContents ? 0 : 1)}} onClick={this._onEntry}>
						<div className="speak_entry">{/*<div className="speak_entry" style={{fontSize}}>*/}
							<WrapTextNew maxSize={100} minSize={60} view={view}>{word.entry}</WrapTextNew>
						</div>
					</div>
					<div className="sentence_box" style={{opacity: (this._hideContents ? 0 : 1)}} onClick={this._onSentence}>
						<div className="speak_sentence">
							<WrapTextNew maxSize={55} minSize={52} view={view}>{this._jsx}</WrapTextNew>
						</div>
					</div>	
		
				</div>
			</div>
		);
	}
}
/*
	view: boolean;
	mediaType: 'audio'|'video';
	recorded: string;
	uploaded: string;
	notice: string;
	likeOn: boolean;
	actions: IActionsCtx;
*/
const SSpeakRecord = useStudent((store: StudentContext) => (
	<Observer>{() => {
		const view = store.state.viewDiv === 'content' && 
					( 	store.state.prog === 'record' );
		
		const word = store.actions.getWord();
		return (
			<Comp 
				view={view}
				word={word}
				mediaType={store.state.mediaType}
				bRecordSend={store.state.bRecordSend}
				recorded={store.state.recorded}
				uploaded={store.state.uploaded}
				notice={store.state.notice}
				likeOn={store.state.likeSet.on}
				actions={store.actions}
			/>
		);
	}}</Observer>
));
export default SSpeakRecord;
