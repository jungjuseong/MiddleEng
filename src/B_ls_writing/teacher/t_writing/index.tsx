import * as React from 'react';
import * as _ from 'lodash';
import { observer } from 'mobx-react';
import { observable } from 'mobx';

import { MPlayer, MConfig, MPRState } from '@common/mplayer/mplayer';
import { ToggleBtn } from '@common/component/button';

import { App } from '../../../App';
import * as felsocket from '../../../felsocket';

import { SENDPROG, IStateCtx, IActionsCtx } from '../t_store';

import SendUINew from '../../../share/sendui_new';

import { IMsg,IData,IRollMsg,IFocusMsg } from '../../common';

import ScriptContainer from '../../script_container';
import { TimerState } from '../../../share/Timer';

import LetsTalk from './_lets_talk';
import QuizBox from './_quiz_box';
import ComprePopup from './_compre_popup';
import { SSL_OP_TLS_BLOCK_PADDING_BUG } from 'constants';

/* 페이지 관련 class */
class NItem_w extends React.Component<{ idx: number, on: boolean, tab: 'INTRODUCTION'|'CONFIRM'|'ADDITIONAL'|'DICTATION'|'SCRIPT', onClick: (idx: number) => void }> {
	private _click = () => {
		this.props.onClick(this.props.idx);
	}
	public render() {
        const { idx, on, tab } = this.props;
        if(tab === 'INTRODUCTION' || tab === 'SCRIPT'){
            return <span className={on ? 'on' : ''} onClick={this._click}>{idx + 1}</span>;
        }else if(tab === 'CONFIRM' || tab === 'ADDITIONAL' || tab === 'DICTATION'){
            var pagetxt = ''
            if(idx === 0){
                pagetxt = '보충'
            }else if (idx === 1){
                pagetxt = '기본'
            }else if (idx === 2){
                pagetxt = '심화'
            }
            return <span className={on ? 'on' : ''} onClick={this._click}>{pagetxt}</span>;
        }else{
            return <span className={on ? 'on' : ''} onClick={this._click}>{idx + 1}</span>;
        }
	}
}

interface IWriting {
	view: boolean;
	state: IStateCtx;
	actions: IActionsCtx;
}

@observer
class Writing extends React.Component<IWriting> {
    private m_player = new MPlayer(new MConfig(true));
    private m_player_inittime = 0; // 비디오 시작시간 
	private m_swiper: SwiperComponent|null = null;
	private m_data: IData;
	
	@observable private c_popup: 'off'|'Q&A' |'ROLE PLAY'|'SHADOWING' = 'off';
	@observable private _title: 'COMPREHENSION'|'DIALOGUE' = 'COMPREHENSION';
	@observable private _tab: 'INTRODUCTION'|'CONFIRM'|'ADDITIONAL'|'DICTATION'|'SCRIPT' = 'INTRODUCTION';

	private _tab_save: 'INTRODUCTION'|'CONFIRM'|'ADDITIONAL'|'DICTATION'|'SCRIPT' = 'INTRODUCTION';
	@observable private _hint = false;

	@observable private _view = false;
	@observable private _curQidx = 0;
	@observable private _viewClue = false;
	@observable private _viewTrans = false;
	@observable private _viewScript = true;
	@observable private _letstalk = false;
	@observable private _viewQuiz = true;

	@observable private _roll: ''|'A'|'B' = '';
	@observable private _shadowing = false;
	@observable private _focusIdx = -1;
	@observable private _isShadowPlay = false;

	@observable private _qselected: number[] = [];

	private _selected: number[] = [];
	private _lastFocusIdx = -1;
	private _countdown = new TimerState(3);

	// private _rollProg: SENDPROG = SENDPROG.READY;
	private _scontainer?: ScriptContainer;
	
	public constructor(props: IWriting) {
        super(props);
        this.m_data = props.actions.getData();
        this.m_player_inittime = this.m_data.video_start;

        const quizs = this.m_data.quizs;
        for(let i = 0; i < quizs.length; i++) {
            this._qselected[i] = -1;
        }

        this.m_player.addOnPlayEnd(() => {
            this._lastFocusIdx = -1;
            this._focusIdx = -1;
            this.m_player.setMutedTemp(false);
            this._sendDialogueEnd();
            if (this._title === 'DIALOGUE') {
                if (this._roll === '' && !this._shadowing) this.props.actions.setNavi(true, true);
                else if(this._title === 'DIALOGUE' && this._shadowing) this._isShadowPlay = false;
            }
        });
        this.m_player.addOnState((newState, oldState) => {
            let msgtype: 'playing'|'paused';
            if(this._shadowing) msgtype = this._isShadowPlay ? 'playing' : 'paused';
            else msgtype = newState !== MPRState.PAUSED && this.m_player.bPlay ? 'playing' : 'paused';
            const msg: IMsg = {
                msgtype,
            };
            felsocket.sendPAD($SocketType.MSGTOPAD, msg);
        });
    }
    
	public componentDidMount() {
		this.m_data = this.props.actions.getData();
		const quizs = this.m_data.quizs;
		for(let i = 0; i < quizs.length; i++) {
			this._qselected[i] = -1;
		}
    }
    
	// private onSend = () => {
    //     const { actions, state } = this.props;

    //     if(	this._title === 'COMPREHENSION' ) {
    //         if(this._tab === 'QUESTION' && state.questionProg !==  SENDPROG.READY) return;
    //         if(this._tab === 'SCRIPT' && state.scriptProg !==  SENDPROG.READY) return;
    //     } else {
    //         if(state.dialogueProg !== SENDPROG.READY) return;
    //     }

    //     if(	this._title === 'COMPREHENSION' ) {
    //         if(this._tab === 'QUESTION') state.questionProg = SENDPROG.SENDING;
    //         else state.scriptProg = SENDPROG.SENDING;
    //     } else state.dialogueProg = SENDPROG.SENDING;

    //     App.pub_playToPad();
    //     App.pub_reloadStudents(() => {
    //         let msg: IMsg;
    //         if(	this._title === 'COMPREHENSION' ) {
    //             actions.clearReturnUsers();
    //             actions.setRetCnt(0);
    //             actions.setNumOfStudent(App.students.length);
                
    //             if(this._tab === 'QUESTION') {
    //                 if(state.questionProg !==  SENDPROG.SENDING) return;
    //                 state.questionProg = SENDPROG.SENDED;
    //                 msg = {msgtype: 'quiz_send',};
    //             } else {
    //                 if(state.scriptProg !==  SENDPROG.SENDING) return;
    //                 state.scriptProg = SENDPROG.SENDED;
    //                 msg = {msgtype: 'script_send',};
    //                 if(this._viewClue) {
    //                     felsocket.sendPAD($SocketType.MSGTOPAD, msg);
    //                     msg = {msgtype: 'view_clue',};
    //                 }
    //             } 
    //         } else {
    //             if(state.dialogueProg !== SENDPROG.SENDING) return;
    //             state.dialogueProg = SENDPROG.SENDED;
    //             msg = {msgtype: 'dialogue_send',};
    //         }
    //         felsocket.sendPAD($SocketType.MSGTOPAD, msg);
    //         this._setNavi();
    //     });
	// }

	private _onPopupSend = (roll: ''|'A'|'B') => {
        const {state, actions} = this.props;
        if(this.c_popup === 'Q&A') {
            if(this._title !== 'COMPREHENSION') return;
            else if(state.qnaProg > SENDPROG.READY) return;

            state.qnaProg = SENDPROG.SENDING;
            App.pub_playToPad();

            let msg: IMsg = {msgtype: 'qna_send',};
            felsocket.sendPAD($SocketType.MSGTOPAD, msg);

            // this._viewClue = false;
            _.delay(() => {
                if(	this._title !== 'COMPREHENSION' ) return;
                else if(state.qnaProg !== SENDPROG.SENDING) return;

                state.qnaProg = SENDPROG.SENDED;
            }, 300);            
            
        } else if(this.c_popup === 'ROLE PLAY') {
            if (this._title !== 'DIALOGUE') return;
            if(state.dialogueProg !== SENDPROG.SENDED) return;
            if(this._roll !== '' || roll === '') return;

            if(this.m_player.currentTime !== this.m_player_inittime
                || this.m_player.currentTime < this.m_player_inittime) this.m_player.gotoAndPause(this.m_player_inittime * 1000);
            App.pub_playToPad();

            this._lastFocusIdx = 0;
            this._focusIdx = -1;
            this.m_player.setMuted(false);
            this.m_player.setMutedTemp(false);

            let msg: IRollMsg = {msgtype: 'roll_send', roll};
            felsocket.sendPAD($SocketType.MSGTOPAD, msg);
            _.delay(() => {
                if(this._title !== 'DIALOGUE') return;
                else if(state.dialogueProg !== SENDPROG.SENDED) return;
                this._roll = roll;
            }, 300);

        } else if(this.c_popup === 'SHADOWING') {
            if(this._title !== 'DIALOGUE') return;
            else if(state.dialogueProg !== SENDPROG.SENDED) return;
            else if(this._shadowing) return;

            if(this.m_player.currentTime !== this.m_player_inittime
                || this.m_player.currentTime < this.m_player_inittime) this.m_player.gotoAndPause(this.m_player_inittime * 1000);
            App.pub_playToPad();

            this._lastFocusIdx = 0;
            this._focusIdx = -1;
            this.m_player.setMuted(false);
            this.m_player.setMutedTemp(false);

            let msg: IMsg = {msgtype: 'shadowing_send'};
            felsocket.sendPAD($SocketType.MSGTOPAD, msg);
            _.delay(() => {
                if(this._title !== 'DIALOGUE') return;
                else if(state.dialogueProg !== SENDPROG.SENDED) return;
                this._shadowing = true;
            }, 300);
        }
        this.props.actions.setNavi(false, false);
    }
    // 인트로 페이지로 이동
	private _goToIntro = () => {
        alert('go to Intro page');
        this.props.actions.gotoDirection();
        // this._testQuiz = true;
        return;
    }

    /* Hint Bubble */
	private _clickTranslate = () => {
        if (this._title !== 'COMPREHENSION' || this._tab !== 'SCRIPT') return;        
        App.pub_playBtnTab();        
        this._viewTrans = !this._viewTrans;	
    }
    
	/* Hint Bubble */
	private _clickClue = () => {
        if (this._title !== 'COMPREHENSION' || this._tab !== 'SCRIPT') return;		
        
        App.pub_playBtnTab();
        
        const clueMsg: IMsg = { msgtype: (this._viewClue) ? 'view_clue' : 'hide_clue'};
        felsocket.sendPAD($SocketType.MSGTOPAD, clueMsg);
        this._viewClue = !this._viewClue;			
	}

	private _onPage = (idx: number) => {
        const { actions } = this.props;

        App.pub_stop();
        App.pub_playBtnTab();

        if (this._title !== 'COMPREHENSION') return;
        
        this._curQidx = idx;
        actions.setNavi((this._tab !== 'INTRODUCTION' || this._curQidx !== 0), true);
        // if(this._tab === 'QUESTION' && this._curQidx === 0) actions.setNavi(false, true);
        // else actions.setNavi(true, true);
        
        this._hint = (this._tab === 'SCRIPT');
    }
    
	private _clearAll() {
        const { actions } = this.props;
        App.pub_stop();
        this._title = 'COMPREHENSION';
        this._tab = 'INTRODUCTION';

        const quizs = this.m_data.quizs;
        for(let i = 0; i < quizs.length; i++) {
            this._qselected[i] = -1;
        }
        this._curQidx = 0;
        this._hint = false;
        this.c_popup = 'off';
        this._viewClue = false;
        this._viewTrans = false;
        this._viewScript = true;
        this._roll = '';
        this._isShadowPlay = false;
        this._shadowing = false;

        this._lastFocusIdx = -1;
        this._focusIdx = -1;

        actions.setNavi(true, true);
        this.m_player.setMutedTemp(false);
        if(this.m_player.currentTime !== this.m_player_inittime || this.m_player.currentTime < this.m_player_inittime) this.m_player.gotoAndPause(this.m_player_inittime * 1000);
                    
        actions.init();
        felsocket.sendPAD($SocketType.PAD_ONSCREEN, null);
	}

	/* 화면전환 */
	private _clickCompre = (ev: React.MouseEvent<HTMLElement>) => {
        const { actions } = this.props;

        if(this._title === 'COMPREHENSION') return;
        if(this._roll === 'A' || this._roll === 'B' || this._shadowing) return;

        App.pub_stop(); 
        App.pub_playBtnTab();
        
        if (this.m_player.bPlay) this.m_player.pause();
        
        this._clearAll();
        this._tab = 'INTRODUCTION';
        this._title = 'COMPREHENSION';
        
        if(this._tab === 'INTRODUCTION' && this._curQidx === 0) actions.setNavi(false, true);
    }
    
	// private _clickDial = (ev: React.MouseEvent<HTMLElement>) => {
    //     const {questionProg,qnaProg} = this.props.state;

    //     if(this._title === 'DIALOGUE') return;
    //     if(questionProg === SENDPROG.SENDED || questionProg === SENDPROG.SENDING || qnaProg >= SENDPROG.SENDING) return;
		
    //     App.pub_playBtnTab();
    //     if(this.m_player.bPlay) this.m_player.pause();
    //     this._clearAll();
    //     this._title = 'DIALOGUE';
    //     this._tab_save = this._tab;
    //     this._tab = 'SCRIPT';
    //     this._viewScript = false;
    // }
    
	private _clickIntroduction = (ev: React.MouseEvent<HTMLElement>) => {
        const { actions,state } = this.props;
        const { questionProg,qnaProg} = state;

        if(this._title !== 'COMPREHENSION') return;
        if(this._tab === 'INTRODUCTION') return;
        if(questionProg === SENDPROG.SENDED || questionProg === SENDPROG.SENDING || qnaProg >= SENDPROG.SENDING) return;
        
        App.pub_playBtnTab();
        this._hint = false;
        this._tab = 'INTRODUCTION';
        if(state.scriptProg > SENDPROG.READY) {
            state.scriptProg = SENDPROG.READY;
            felsocket.sendPAD($SocketType.PAD_ONSCREEN, null);
            actions.clearQnaReturns();
        }
        if(this._curQidx === 0) actions.setNavi(false, true);
    }
    
	private _clickConfirm = (ev: React.MouseEvent<HTMLElement>) => {
        const { actions } = this.props;
        const { questionProg,qnaProg } = this.props.state;

        if (this._title !== 'COMPREHENSION' || this._tab === 'CONFIRM') return;
        if (questionProg === SENDPROG.SENDED ||	questionProg === SENDPROG.SENDING || qnaProg >= SENDPROG.SENDING) return;

        App.pub_stop();
        App.pub_playBtnTab();
        this._hint = false;
        this._tab = 'CONFIRM';
        actions.setNavi(true, true);
    }
    private _clickAdditional = (ev: React.MouseEvent<HTMLElement>) => {
        const { actions } = this.props;
        const { questionProg,qnaProg } = this.props.state;

        if (this._title !== 'COMPREHENSION' || this._tab === 'ADDITIONAL') return;
        if (questionProg === SENDPROG.SENDED ||	questionProg === SENDPROG.SENDING || qnaProg >= SENDPROG.SENDING) return;

        App.pub_stop();
        App.pub_playBtnTab();
        this._hint = false;
        this._tab = 'ADDITIONAL';
        actions.setNavi(true, true);
    }
    private _clickDictation = (ev: React.MouseEvent<HTMLElement>) => {
        const { actions } = this.props;
        const { questionProg,qnaProg } = this.props.state;

        if (this._title !== 'COMPREHENSION' || this._tab === 'DICTATION') return;
        if (questionProg === SENDPROG.SENDED ||	questionProg === SENDPROG.SENDING || qnaProg >= SENDPROG.SENDING) return;

        App.pub_stop();
        App.pub_playBtnTab();
        this._hint = false;
        this._tab = 'DICTATION';
        actions.setNavi(true, true);
    }
    private _clickScript = (ev: React.MouseEvent<HTMLElement>) => {
        const { actions } = this.props;
        const { questionProg,qnaProg } = this.props.state;

        if (this._title !== 'COMPREHENSION' || this._tab === 'SCRIPT') return;
        if (questionProg === SENDPROG.SENDED ||	questionProg === SENDPROG.SENDING || qnaProg >= SENDPROG.SENDING) return;

        App.pub_stop();
        App.pub_playBtnTab();
        this._hint = false;
        this._tab = 'SCRIPT';
        actions.setNavi(true, true);
    }
    
	private _clickReturn = () => {
        const { actions } = this.props;

        App.pub_playBtnTab();

        const isCompQ = (this._title === 'COMPREHENSION' && this._tab === 'INTRODUCTION');

        if(isCompQ) felsocket.startStudentReportProcess($ReportType.JOIN, actions.getReturnUsersForQuiz());
        else felsocket.startStudentReportProcess($ReportType.JOIN, actions.getReturnUsers());
	}

	/* 누른 학생만 보이게 하는 런쳐결과  수정안됨*/
	private _clickPerson = (idx: number) => {
		App.pub_playBtnTab();
		const quizResults = this.props.actions.getResult();
		const quizResult = quizResults[this._curQidx];
		if(!quizResult) return;

		if(idx === 1) felsocket.startStudentReportProcess($ReportType.JOIN, quizResult.u1);
		else if(idx === 2) felsocket.startStudentReportProcess($ReportType.JOIN, quizResult.u2);
		else if(idx === 3) felsocket.startStudentReportProcess($ReportType.JOIN, quizResult.u3);
	}

	private _clickAnswer = () => {
        const {state, actions} = this.props;
        const quizProg = state.questionProg;

        if(	this._title !== 'COMPREHENSION' || 
            this._tab !== 'INTRODUCTION' || 
            quizProg !== SENDPROG.SENDED
        ) return;

        App.pub_playBtnTab();
        const msg: IMsg = {
            msgtype: 'quiz_end',
        };
        felsocket.sendPAD($SocketType.MSGTOPAD, msg);

        actions.quizComplete();
        this.props.actions.setNavi(true, true);
	}	
	/* Popup화면 */
	private _onPopupClosed = () => {
        const { state,actions} = this.props;
        if(this._title === 'COMPREHENSION' && this._tab === 'SCRIPT' && state.qnaProg === SENDPROG.READY) actions.setNavi(true, true);
        else if (this._title === 'DIALOGUE' && this._roll === '' && !this._shadowing) actions.setNavi(true, true);
        this.c_popup = 'off';
    }

	private _sendFocusIdx(idx: number) {
		const msg: IFocusMsg = {
			msgtype: 'focusidx',
			idx,
		};
		felsocket.sendPAD($SocketType.MSGTOPAD, msg);
	}
	private _sendDialogueEnd() {
		const msg: IMsg = {
			msgtype: 'dialogue_end',
		};
		felsocket.sendPAD($SocketType.MSGTOPAD, msg);
	}

	private _letstalkClosed = () => {
		this._letstalk = false;
		this.props.actions.setNaviView(true);
	}
	private _setNavi() {
        const { state,actions } = this.props;
        const { questionProg,qnaProg } = state;

        actions.setNaviView(true);
        if(this._curQidx === 0 && this._tab === 'INTRODUCTION') actions.setNavi(false, true);
        else if(questionProg === SENDPROG.SENDED) actions.setNavi(this._curQidx === 0 ? false : true, this._curQidx === this.m_data.quizs.length - 1 ? false : true);
		else actions.setNavi(true, true);
		
        actions.setNaviFnc(
            () => {
                if(this._title === 'COMPREHENSION') {
                    if(this._tab === 'INTRODUCTION') {
                        if(this._curQidx === 0) {
                            actions.gotoDirection();
                        } else {
                            this._hint = false;
                            this._curQidx = this._curQidx - 1;
                            this._setNavi();
                        }
                    } else if(this._tab === 'CONFIRM'){
                        // if(questionProg === SENDPROG.SENDED || questionProg === SENDPROG.SENDING || qnaProg >= SENDPROG.SENDING) return;
                        if(this._curQidx === 0) {
                            this._hint = false;
                            this._tab = 'INTRODUCTION';
                            this._curQidx = this.m_data.quizs.length - 1;
                        } else {
                            this._hint = false;
                            this._curQidx = this._curQidx - 1;
                            this._setNavi();
                        }
                        // if(state.scriptProg > SENDPROG.READY) {
                        //     state.scriptProg = SENDPROG.READY;
                        //     felsocket.sendPAD($SocketType.PAD_ONSCREEN, null);
                        //     actions.clearQnaReturns();
                        // }
                    }else if(this._tab === 'ADDITIONAL'){
                        if(this._curQidx === 0) {
                            this._hint = false;
                            this._tab = 'CONFIRM';
                            this._curQidx = this.m_data.quizs.length - 1;
                        } else {
                            this._hint = false;
                            this._curQidx = this._curQidx - 1;
                            this._setNavi();
                        }
                    }else if(this._tab === 'DICTATION'){
                        if(this._curQidx === 0) {
                            this._hint = false;
                            this._tab = 'ADDITIONAL';
                            this._curQidx = this.m_data.quizs.length - 1;
                        } else {
                            this._hint = false;
                            this._curQidx = this._curQidx - 1;
                            this._setNavi();
                        }
                    }else if(this._tab === 'SCRIPT'){
                        if(this._curQidx === 0) {
                            this._hint = false;
                            this._tab = 'DICTATION';
                            this._curQidx = this.m_data.quizs.length - 1;
                        } else {
                            this._hint = false;
                            this._curQidx = this._curQidx - 1;
                            this._setNavi();
                        }
                    }
                } else {
                    if(this._roll === 'A' || this._roll === 'B' || this._shadowing) return;
                    if(this.m_player.bPlay) this.m_player.pause();
                    this._clearAll();
                    this._title = 'COMPREHENSION';
                    this._tab = 'SCRIPT';
                    this._curQidx = 0;
                }
            },
            () => {
                if(this._title === 'COMPREHENSION') {
                    if(this._tab === 'INTRODUCTION') {
                        if(this._curQidx === this.m_data.quizs.length - 1) {
                            if(questionProg === SENDPROG.SENDED || questionProg === SENDPROG.SENDING || qnaProg >= SENDPROG.SENDING) return;
                            this._hint = false;
                            this._tab = 'CONFIRM';
                            this._curQidx = 0;
                        } else {
                            this._hint = false;
                            this._curQidx = this._curQidx + 1;
                            this._setNavi();
                        }
                    }else if(this._tab === 'CONFIRM') {
                        if(this._curQidx === this.m_data.quizs.length - 1) {
                            if(questionProg === SENDPROG.SENDED || questionProg === SENDPROG.SENDING || qnaProg >= SENDPROG.SENDING) return;
                            this._hint = false;
                            this._tab = 'ADDITIONAL';
                            this._curQidx = 0;
                        } else {
                            this._hint = false;
                            this._curQidx = this._curQidx + 1;
                            this._setNavi();
                        }
                    }else if(this._tab === 'ADDITIONAL') {
                        if(this._curQidx === this.m_data.quizs.length - 1) {
                            if(questionProg === SENDPROG.SENDED || questionProg === SENDPROG.SENDING || qnaProg >= SENDPROG.SENDING) return;
                            this._hint = false;
                            this._tab = 'DICTATION';
                            this._curQidx = 0;
                        } else {
                            this._hint = false;
                            this._curQidx = this._curQidx + 1;
                            this._setNavi();
                        }
                    }else if(this._tab === 'DICTATION') {
                        if(this._curQidx === this.m_data.quizs.length - 1) {
                            if(questionProg === SENDPROG.SENDED || questionProg === SENDPROG.SENDING || qnaProg >= SENDPROG.SENDING) return;
                            this._hint = false;
                            this._tab = 'SCRIPT';
                            this._curQidx = 0;
                        } else {
                            this._hint = false;
                            this._curQidx = this._curQidx + 1;
                            this._setNavi();
                        }
                    }else if(this._tab === 'SCRIPT'){
                        if(this._curQidx === this.m_data.quizs.length - 1) {
                        } else {
                            this._hint = false;
                            this._curQidx = this._curQidx + 1;
                            this._setNavi();
                        }
                        // if(this.m_player.bPlay) this.m_player.pause();
                        // this._clearAll();
                        // this._tab_save = this._tab;
                        // this._tab = 'SCRIPT';
                        // this._viewScript = false;
                    }
                } else {
                    actions.gotoNextBook();
                }
            }
        );
	}

	public componentDidUpdate(prev: IWriting) {
        const { view } = this.props;

        if (view && !prev.view) {
            this._clearAll();
            this._view = true;
            this._setNavi();
            this._letstalk = false;
        } else if (!view && prev.view) {
            this.c_popup = 'off';
            this._lastFocusIdx = -1;
            this._focusIdx = -1;
            this._roll = '';
            this._isShadowPlay = false;
            this._shadowing = false;
            App.pub_stop();
            if(this.m_player.bPlay) this.m_player.pause();
            this.m_player.setMuted(false);
            this.m_player.setMutedTemp(false);
            _.delay(() => {
                if(view) return;
                this.m_player.seek(this.m_player_inittime * 1000);
                this._view = false;
            }, 300);
        }
    }

	public render() {
        const { state, actions } = this.props;
        const { questionProg,qnaProg,numOfStudent } = this.props.state;

        const introductions = this.m_data.introduction;
        const isQComplete = questionProg >= SENDPROG.COMPLETE;

        const isOnStudy = (this._title === 'COMPREHENSION' && (questionProg === SENDPROG.SENDING || questionProg === SENDPROG.SENDED || qnaProg >= SENDPROG.SENDING)) 
                            || (this._title === 'DIALOGUE' && (this._roll === 'A' || this._roll === 'B' || this._shadowing));
        
        const quizResult = actions.getResult();
        let qResult = -1;        
        if(isQComplete) {
            if(numOfStudent > 0) qResult = Math.round(100 * quizResult[this._curQidx].numOfCorrect / numOfStudent);
            else qResult = 0;
            if(qResult > 100) qResult = 100;
        }

        const isCompI = (this._title === 'COMPREHENSION' && this._tab === 'INTRODUCTION');
        const isCompC = (this._title === 'COMPREHENSION' && this._tab === 'CONFIRM');
        const isCompA = (this._title === 'COMPREHENSION' && this._tab === 'ADDITIONAL');
        const isCompD = (this._title === 'COMPREHENSION' && this._tab === 'DICTATION');
        const isCompS = (this._title === 'COMPREHENSION' && this._tab === 'SCRIPT');
    
        const isViewInfo = (isCompI && questionProg >= SENDPROG.SENDED) || isCompS;
        const isViewReturn = (isCompI && questionProg >= SENDPROG.SENDED) || (isCompS && qnaProg >=  SENDPROG.SENDED);

        const style: React.CSSProperties = {};
    
        return (
            <div className={'t_writing ' + this._title} style={style}>
                <div className="close_box">
                    <ToggleBtn className="btn_intro" onClick={this._goToIntro}/>
                </div>
                <div className="btn_tabs">
                    <ToggleBtn className="btn_tab_introduction" onClick={this._clickIntroduction} on={this._tab === 'INTRODUCTION'} disabled={this._tab === 'INTRODUCTION' || isOnStudy} />
                    <ToggleBtn className="btn_tab_confirm" onClick={this._clickConfirm} on={this._tab === 'CONFIRM'} disabled={this._tab === 'CONFIRM' || isOnStudy} />
                    <ToggleBtn className="btn_tab_additional" onClick={this._clickAdditional} on={this._tab === 'ADDITIONAL'} disabled={this._tab === 'ADDITIONAL' || isOnStudy} />
                    <ToggleBtn className="btn_tab_dictation" onClick={this._clickDictation} on={this._tab === 'DICTATION'} disabled={this._tab === 'DICTATION' || isOnStudy} />
                    <ToggleBtn className="btn_tab_script" onClick={this._clickScript} on={this._tab === 'SCRIPT'} disabled={this._tab === 'SCRIPT' || isOnStudy} />
                </div>
                <div className={'info_box' + (isViewInfo ? ' on' : '')}>
                    <div className="return_cnt_box white" style={{display: isViewReturn ? '' : 'none'}} onClick={this._clickReturn}>
                        <div>{state.retCnt}/{state.numOfStudent}</div>
                    </div>            
                </div>	
                <div className="writing_content_box">
                    <div className="btn_page_box">
                        {introductions.map((introduction, idx) => {
                            return <NItem_w key={idx} tab ={this._tab} on={idx === this._curQidx} idx={idx} onClick={this._onPage}/>;
                        })}
                    </div>
                    <div className={'question' + (state.questionProg >= SENDPROG.COMPLETE ? ' complete' : '')} style={{display: this._tab === 'INTRODUCTION' ? '' : 'none'}}>
                            {introductions.map((introduction, idx) => {
                                return (
                                    <div key={idx} style={{ display: idx === this._curQidx ? '' : 'none' }}>
                                        <QuizBox 
                                            view={this.props.view && idx === this._curQidx}
                                            data={introduction} 
                                            onClosed={this._letstalkClosed}
                                        />                          
                                    </div>
                                );
                            })}
                        </div>
                </div>
                <ComprePopup 
                    type={this.c_popup}
                    view={this.c_popup === 'Q&A' || this.c_popup === 'ROLE PLAY' || this.c_popup === 'SHADOWING'} 
                    imgA={this.m_data.speakerA.image_l}
                    imgB={this.m_data.speakerB.image_l}
                    onSend={this._onPopupSend}
                    onClosed={this._onPopupClosed}
                />
                <LetsTalk 
                    view={this._letstalk} 
                    data={this.m_data.letstalk} 
                    onClosed={this._letstalkClosed}
                />
            </div>
        );
    }
}

export default Writing;
