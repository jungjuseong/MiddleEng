import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { Observer, observer } from 'mobx-react';

import * as _ from 'lodash';

import { IStateCtx, IActionsCtx, SENDPROG, BTN_DISABLE } from './t_store';
import { ResponsiveText } from '../../share/ResponsiveText';
import { App } from '../../App';
import { ToggleBtn } from '@common/component/button';

import * as butil from '@common/component/butil';
import * as common from '../common';
import { observable } from 'mobx';
import { CoverPopup } from '../../share/CoverPopup';
import SendUI from '../../share/sendui_new';

import * as kutil from '@common/util/kutil';
import * as style from '../../share/style';
import * as felsocket from '../../felsocket';
import { MPlayer, MConfig, MPRState, IMedia } from '@common/mplayer/mplayer';
import WrapTextNew from '@common/component/WrapTextNew';
import { BtnAudio } from '../../share/BtnAudio';

const SwiperComponent = require('react-id-swiper').default;

interface IImgPopup {
	url: string;
	view: boolean;
	onClosed: () => void;
}
@observer
class ImgPopup extends React.Component<IImgPopup> {
	@observable private m_view = false;

	private _onClose = () => {
		App.pub_playBtnTab();
		this.m_view = false;
	}
	public componentDidUpdate(prev: IImgPopup) {
		if(this.props.view && !prev.view) {
			this.m_view = true;
		} else if(!this.props.view && prev.view) {
			this.m_view = false;
		}
	}

	public render() {
		return (
			<CoverPopup className="img_popup" view={this.m_view} onClosed={this.props.onClosed}>
				<div>
					<img src={this.props.url} />
					<ToggleBtn className="btn_zoom" onClick={this._onClose}/>
				</div>
			</CoverPopup>
		);
	}
}

function _getJSX(text: string) {
    const els = butil.sentence2jsx(text, 'block', undefined, true, 'word');
    return (
        <>{els.map((el, idx) => {
            if(idx === els.length - 1) return el;
            else return <React.Fragment key={idx}>{el}<br/></React.Fragment>;
        })}</>
    );
}

function _getBlockJSX(text: string, tmpStr?: string) {
	const els = sentence2jsx(text, 'block', undefined, true, 'word', tmpStr);
	return (
		<>{els.map((el, idx) => {
			if(idx === els.length - 1) return el;
			else return <React.Fragment key={idx}>{el}<br/></React.Fragment>;
		})}</>
	);
}

function sentence2jsx(
    sentence: string,
    blockClass: string|null = 'block',
    blockStr?: string,
    isBlockWorkWrap?: boolean,
    splitClass?: string,
    tmpStr?: string
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
                    
                    if(tmpStr) arr.push((<span key={keyObj.key++} className={blockClass} data-correct={sTmp}>{tmpStr}</span>));
                    else arr.push((<span key={keyObj.key++} className={blockClass} data-correct={sTmp}>{jsx}</span>));

                    lastIdx = pattern.lastIndex;
                    result = pattern.exec(line);
                }
                if(lastIdx < line.length) {
                    sTmp = line.substring(lastIdx);
                    if(sTmp === '.') arr.push(_splitSpace(sTmp, keyObj));
                    else arr.push(_splitSpace(sTmp, keyObj, splitClass));
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

interface ITletstalk {
	view: boolean;
	onClosed: () => void;
	data: common.ILetstalk;
}
@observer
class Tletstalk extends React.Component<ITletstalk> {
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
	
	public constructor(props: ITletstalk) {
        super(props);
        
        this._jsx_sentence = _getJSX(props.data.sentence);
        this._jsx_sample = _getBlockJSX(props.data.sample, 'aaaaaaaaaa');
        this._jsx_hint = _getBlockJSX(props.data.hint);

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

 	public componentDidUpdate(prev: ITletstalk) {
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
                                        {data.sentence.length > 170 ? (
                                            <WrapTextNew lineHeight={120} maxLineNum={3} minSize={26}  maxSize={34} className={'text'} view={true} textAlign="left"     viewWhenInit={true}>
                                                {this._jsx_sentence}
                                            </WrapTextNew>
                                        ) : (
                                          <>{this._jsx_sentence}</>
                                        )}
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
					
    			</div>
			</CoverPopup>
			<ImgPopup url={this._zoomImgUrl} view={this._zoom} onClosed={this._closedZoom}/> 
			</>
		);
	}
}


interface ISummaryBox {
	seq: number;
	summary: common.ISummarizing;
	scripts: common.IScriptSummarizing[];
	curScritSeq: number;
	playOn: boolean;
	prog: SENDPROG;
	len: number;
	onZoom: (url: string) => void;
	onSound: (summary_seq: number) => void;
	onScriptSound: (script_seq: number) => void;
}

class SummaryBox extends React.Component<ISummaryBox> {
	private _jsx: JSX.Element;
    private _scripts: common.IScriptSummarizing[] = [];

    @observable private _curScritSeq = 0;

	constructor(props: ISummaryBox) {
		super(props);
		
		const nodes = this._getSentenceJsx();
		this._jsx = (<>{nodes.map((node, idx) => node)}</>);

		this._curScritSeq = props.curScritSeq;
	}
	private _parseBlock(arr: React.ReactNode[], idx: number, script_seq: number, txt: string, className: string, newStr?: string) {
        const pattern = new RegExp(/\{(.*?)\}/g);
        let result = pattern.exec(txt);
        let lastIdx = 0;
        let key = 0;
        let sTmp = '';
        let script_arr;
        let sarr: React.ReactNode[];

        while (result) {
            if(result.index > lastIdx) {
                sTmp = txt.substring(lastIdx, result.index);
                script_arr = sTmp.split('<br>');
                sarr = [];
                script_arr.forEach((line, lidx) => { 
                    if(lidx >= script_arr.length - 1) sarr.push(<span key={'l1_' + lidx}>{line}</span>);
                    else sarr.push(<span key={'l1_' + lidx}>{line}<br/></span>);
                });
                if(className === 'playing') {
                    arr.push((<span key={'sub_' + idx + (key++)} className={className} onClick={this.onScriptClick.bind(this, script_seq)}>{sarr.map((node) => node)}</span>));
                } else {
                    arr.push((<span key={'sub_' + idx + (key++)} onClick={this.onScriptClick.bind(this, script_seq)}>{sarr.map((node) => node)}</span>));
                }
            }
            sTmp = result[1];
            let str = newStr;
            if(!str) str = sTmp;
            
            script_arr = str.split('<br>');
            sarr = [];
            script_arr.forEach((line, lidx) => { 
                if(lidx >= script_arr.length - 1) sarr.push(<span key={lidx}>{line}</span>);
                else sarr.push(<span key={lidx}>{line}<br/></span>);
            });
            arr.push((<span key={'sub_' + idx + (key++)} className={className} data-correct={sTmp} onClick={this.onScriptClick.bind(this, script_seq)}>{sarr.map((node) => node)}</span>));

            lastIdx = pattern.lastIndex;
            result = pattern.exec(txt);
        }
        if(lastIdx < txt.length) {
            sTmp = txt.substring(lastIdx);
            script_arr = sTmp.split('<br>');
            sarr = [];
            script_arr.forEach((line, lidx) => { 
                if(lidx >= script_arr.length - 1) sarr.push(<span key={'l3_' + lidx}>{line}</span>);
                else sarr.push(<span key={'l3_' + lidx}>{line}<br/></span>);
            });
            if(className === 'playing') {
                arr.push((<span key={'sub_' + idx + (key++)} className={className} onClick={this.onScriptClick.bind(this, script_seq)}>{sarr.map((node) => node)}</span>));
            } else {
                arr.push((<span key={'sub_' + idx + (key++)} onClick={this.onScriptClick.bind(this, script_seq)}>{sarr.map((node) => node)}</span>));
            }
        }
	}
	private _getSentenceJsx() {
		let i = 0;
		let arr: React.ReactNode[] = [];
		let correct = '';
		if(this.props.summary.answer === 2) correct = this.props.summary.choice_2;
		else if(this.props.summary.answer === 3) correct = this.props.summary.choice_3;
		else correct = this.props.summary.choice_1;
		this.props.scripts.forEach((script, idx) => {
			if(script.summary_seq === this.props.seq ) {
				if(this._curScritSeq > 0 && this._curScritSeq === script.seq) {
                    this._parseBlock(arr, idx, script.seq, script.dms_eng, 'playing', correct);
                    arr.push(' ');	
                } else {
                    this._parseBlock(arr, idx, script.seq, script.dms_eng, 'block', correct);
                    arr.push(' ');
                }
			}
		});
		return arr;
	}
	private _clickZoom = () => {
        App.pub_playBtnTab();   // 소리가 없어서 추가
        this.props.onZoom(App.data_url + this.props.summary.image);
	}
	
	private onScriptClick = (seq: number) => {
		if(this.props.prog !== SENDPROG.COMPLETE) return;
		this.props.onScriptSound(seq);
	}
	private _onClick = () => {
		this.props.onSound(this.props.seq);
	}

	public render() {
		const {summary, prog, curScritSeq} = this.props;

		if(this._curScritSeq !== curScritSeq) {
			this._curScritSeq = curScritSeq;
			const nodes = this._getSentenceJsx();
			this._jsx = (<>{nodes.map((node, idx) => node)}</>);
		}

		return (
		<>
			<div className="quiz_box">
				<div className="img-box">
					<div>
						<img src={App.data_url + summary.image} />
						<ToggleBtn className="btn_zoom" onClick={this._clickZoom}/>
					</div>
				</div>
				<div className={prog >= SENDPROG.COMPLETE ? 'view-correct' : 'view-summary'}>
					<ToggleBtn className="btn_summary_audio" draggable={false} onClick={this._onClick}/>
					<WrapTextNew lineHeight={160} maxLineNum={4} minSize={26}  maxSize={26} className={'text'} view={true} textAlign="left" viewWhenInit={true}>
						{this._jsx}
					</WrapTextNew>
				</div>
			</div>
			<div className="btn_arrow_down" style={{display: this.props.len === summary.seq ? 'none' : ''}}/>
		</>
		);
	}
}

interface ISummary {
	view: boolean;
	inview: boolean;
	videoPopup: boolean;
	viewStoryBook: boolean;
	data: common.IData;
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
	@observable private _letstalk = false;
	@observable private _onhint = false;
	private _data: common.IData;
	private _img_url: string = '';
	private _returns: string[] = [];

	private _player: MPlayer = new MPlayer(new MConfig(true));
	@observable private _curSummarySeq = 0;
	@observable private _curScritSeq = 0;
	private _scripts: common.IScriptSummarizing[][] = [];

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
				if(seq >= 0 && seq !== this._curScritSeq) {
					this._curScritSeq = seq;	
					// this._transAt(seq);
				}
			}
		});

		this._player.addOnPlayEndTemp(() => {
			this._curSummarySeq = 0;
			this._curScritSeq = 0;
		});

		this._player.addOnPlayEnd(() => {
			this._curSummarySeq = 0;
			this._curScritSeq = 0;
		});
	}
	
	private _clickReturn = () => {
		App.pub_playBtnTab();
		felsocket.startStudentReportProcess($ReportType.JOIN, this._returns);		
	}
	private _clickAnswer = () => {
		if(!this.props.inview) return;
		else if(this._prog !== SENDPROG.SENDED) return;
		App.pub_playBtnTab();
		this.props.onStudy('');
		const msg: common.IMsg = {msgtype: 'summary_end',};
		felsocket.sendPAD($SocketType.MSGTOPAD, msg);
		this.props.actions.setSummaryFnc(null);
		this._prog = SENDPROG.COMPLETE;
		this.props.actions.setNavi(true, true);
	}
	private _onSend = () => {
		if(!this.props.inview) return;
		else if(this._prog !== SENDPROG.READY) return;

		this._prog = SENDPROG.SENDING;
		this._retCnt = 0;
		this.props.onStudy('ex_video');
		while(this._returns.length > 0) this._returns.pop();
		App.pub_playToPad();
		const msg: common.IMsg = {msgtype: 'summary_send',};
		felsocket.sendPAD($SocketType.MSGTOPAD, msg);


		this.props.actions.setSummaryFnc(this._onReturn);
		App.pub_reloadStudents(async () => {
			if(!this.props.inview) return;
			else if(this._prog !== SENDPROG.SENDING) return;

			this._retCnt = 0;
			this._numOfStudent = App.students.length;

			await kutil.wait(600);
			if(!this.props.inview) return;
			else if(this._prog !== SENDPROG.SENDING) return;
			this._prog = SENDPROG.SENDED;
			this.props.actions.setNavi(false, false);
		});
	}
	private _onReturn = (msg: common.IQuizReturnMsg) => {
		if(!this.props.inview) return;
		else if(this._prog !== SENDPROG.SENDED) return;

		if(this._returns.indexOf(msg.id) >= 0) return;
		const student = _.find(App.students, {id: msg.id});
		if(!student) return;
		this._returns.push(msg.id);
		felsocket.addStudentForStudentReportType6(msg.id);
		this._retCnt = this._returns.length;
	}
	private _setNavi() {
		this.props.actions.setNaviView(true);
		if(this._prog === SENDPROG.SENDING || this._prog === SENDPROG.SENDED) this.props.actions.setNavi(false, false);
		else this.props.actions.setNavi(true, true);

		this.props.actions.setNaviFnc(
			() => {
				this.props.onSetNavi('VISUALIZING','GraphicOrganizer');
			},
			() => {
				this.props.actions.gotoNextBook();
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
		this._curScritSeq = 0;
		this.props.actions.setSummaryFnc(null);
		felsocket.sendPAD($SocketType.PAD_ONSCREEN, null);
	}
	public componentDidUpdate(prev: ISummary) {
		if(this.props.videoPopup && !prev.videoPopup) {
			if(this.props.state.isVideoStudied) this.props.state.isVideoStudied = false;
		} else if (!this.props.videoPopup && prev.videoPopup) {
			if(this.props.state.isVideoStudied && this._prog < SENDPROG.COMPLETE) this._init();
		}
		if(this.props.inview && !prev.inview) {
			this._init();
			this._setNavi();
		} else if(!this.props.inview && prev.inview) {
			this._zoom = false;
			this._letstalk = false;
			this._onhint = false;
			this._curSummarySeq = 0;
			this._curScritSeq = 0;
			if(this._player.bPlay) this._player.pause();
        }
        
		if(this.props.inview && prev.inview) {
			if (!this.props.videoPopup && prev.videoPopup) this._setNavi();
			else if(!this.props.viewStoryBook && prev.viewStoryBook) this._setNavi();
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
			this._curScritSeq = 0;
		}
		App.pub_playBtnTab();
		this._letstalk = true;
		this.props.actions.setNaviView(false);
	}
	private _letstalkClosed = () => {
		this._letstalk = false;
		this.props.actions.setNaviView(true);
	}

	private _onScriptSound = (script_seq: number) => {
		let Played = false;
		if(this._player.bPlay) {
			this._player.pause();
			if(this._curSummarySeq > 0) this._curSummarySeq = 0;
			if(this._curScritSeq === script_seq) {
				this._curScritSeq = 0;
				Played = true;
				// this.forceUpdate();
		   }
		} 
		
		if(!Played) {
			let start: number = -1;
			let end: number = -1;
			const summaryscripts = this._data.summarizing_scripts;
			for(let i = 0; i < summaryscripts.length; i++) {
				if(script_seq === summaryscripts[i].seq) {
					this._curScritSeq = summaryscripts[i].seq;
					start = summaryscripts[i].audio_start;
					end = summaryscripts[i].audio_end;
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
			if(this._curScritSeq > 0) this._curScritSeq = 0;
			if(this._curSummarySeq === summary_seq) {
				this._curSummarySeq = 0;
				Played = true;
				// this.forceUpdate();
		   }
		} 

		if(!Played) {
			let start: number = -1;
			let end: number = -1;
			const summaryscripts = this._data.summarizing_scripts;
			for(let i = 0; i < summaryscripts.length; i++) {
				if(summary_seq === summaryscripts[i].summary_seq) {
					this._curSummarySeq = summaryscripts[i].summary_seq;

					if(start === -1) start = summaryscripts[i].audio_start;
					else if(start > summaryscripts[i].audio_start) start = summaryscripts[i].audio_start;

					if(end === -1)  end = summaryscripts[i].audio_end;
					else if(end < summaryscripts[i].audio_end) end = summaryscripts[i].audio_end;
				}
			}

			if(start >= 0 && end > start) {
				this._player.gotoAndPlay(start * 1000, end * 1000, 1);
			}
		}
	}
	
	public render() {
        const {view, inview, data, actions} = this.props;
        
        const letstalk = data.letstalk;
        const viewLetstalk = !(letstalk.sentence === '' || letstalk.audio === '' || letstalk.img1 === '' || letstalk.sample === '' || letstalk.hint === '');
        
        return (
            <div className="summary" style={inview ? undefined : style.NONE}>
                <ToggleBtn className="btn_lets_talk" view={viewLetstalk} on={this._letstalk} onClick={this._onLetsTalk} />
            
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
                                    curScritSeq={this._curScritSeq}
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
                    view={inview && this._prog < SENDPROG.SENDED && !this.props.state.videoPopup}
                    type={'teacher'}
                    sended={false}
                    originY={0}
                    onSend={this._onSend}
                />
                <ImgPopup url={this._img_url} view={this._zoom} onClosed={this._popupClosed}/> 
                <Tletstalk 
                    view={this._letstalk} 
                    data={this._data.letstalk} 
                    onClosed={this._letstalkClosed}
                />
                
            </div>
        );
	}
}

export default Summary;


