import * as React from 'react';
import * as _ from 'lodash';
import { observable, action } from 'mobx';
import { App } from '../../App';

import { TypeQuiz, IWordData, IData, IMsg, IQuizMsg, IDrillMsg, initData } from '../common';
import { StudentContextBase, IActionsBase, IStateBase, VIEWDIV } from '../../share/scontext';

type MYPROG = ''|'quiz'|'spelling'|'record';

interface IQuizInfo extends IStudentQuizInfo {
	qtype: TypeQuiz;
}

interface IStateCtx extends IStateBase {
	prog: MYPROG;
	quizProg: TypeQuizProg;
	groupProg: TypeGroupProg;
	startSelectedAni: boolean;
	forceStopIdx: number;
	qidx: number;
	point: number;
	ga_na: undefined|'ga'|'na';
	groupResult: ''|'win'|'lose'|'tie';
	isGroup: boolean;

	mediaType: 'audio'|'video';
	bRecordSend: boolean;
	recorded: string;
	uploaded: string;
	notice: string;
}

interface IActionsCtx extends IActionsBase {
	getWord: () => IWordData;
	getWords: () => IWordData[];
	getQuizInfo: () => IQuizInfo;
	setQuizProg: (prog: TypeQuizProg) => void;
	unsetForceStop: () => void;

	onStartRecord: () => void;
	onStopRecord: () => void;
	onUploadMedia: (url: string) => void;
	setFeedback: (feedback: 'off'|'on'|'sended') => void;
}

class StudentContext extends StudentContextBase {
	@observable public state!: IStateCtx;
	public actions!: IActionsCtx;
	private _data!: IData;

	private _quizInfo: IQuizInfo = {
		qidxs: [],
		points: [],
		qtime: 0,
		qtype: '',
	};

	private _word!: IWordData;

	constructor() {
		super();
		this.state.prog = '';
		this.state.ga_na = undefined;
		this.state.qidx = 0;
		this.state.groupProg = '';
		this.state.startSelectedAni = false;
		this.state.forceStopIdx = -1;
		this.state.quizProg = '';
		this.state.isGroup = false;
		this.state.mediaType = 'audio';
		this.state.bRecordSend = false;
		this.state.recorded = '';
		this.state.uploaded = '';
		this.state.notice = '';
		this.state.groupResult = '';

		this.actions.getWord = () => this._word;
		this.actions.getWords = () => this._data.page1.words;
		this.actions.getQuizInfo = () => this._quizInfo;

		this.actions.setQuizProg = (prog: TypeQuizProg) => {
			this.state.quizProg = prog;
		};

		this.actions.unsetForceStop = () => {
			this.state.forceStopIdx = -1;
		};

		this.actions.onStartRecord = () => {
			this.state.notice = '';
			this.state.recorded = '';
			if(App.isDvlp) {
				_.delay(() => {
					if(this.state.mediaType === 'video') this.state.notice = 'notifyStartVideoRecord';
					else this.state.notice = 'notifyStartVoice';
				}, 300);
			}
		};
		this.actions.onStopRecord = () => {
			this.state.notice = '';
			if(App.isDvlp) {
				_.delay(() => {
					if(this.state.mediaType === 'video') this.notifyVideoRecord('/content/B_ls_voca/data/LS_L6_U7_L1_10_watch.mp4');
					else this.notifyRecorded('/content/B_ls_voca/data/LS_L6_U7_L1_SENTENCE_10_watch.mp3');
				}, 300);
			}
		};

		this.actions.onUploadMedia = (url: string) => {
			this.state.uploaded = '';
			if(App.isDvlp) {
				_.delay(() => {
					this.state.uploaded = url;
				}, 300);
			}
		};
	}

	@action protected _setViewDiv(viewDiv: VIEWDIV) {
		const state = this.state;
		if(state.viewDiv !== viewDiv) {
			if(viewDiv !== 'content') {
				this.state.prog = '';
				this.state.groupProg = '';
				this.state.forceStopIdx = -1;
				this.state.ga_na = undefined;
			}
		}
		super._setViewDiv(viewDiv);
	}
	@action public receive(data: ISocketData) {
		super.receive(data);
		if(data.type === $SocketType.MSGTOPAD && data.data) {
			const msg = data.data as  IMsg;
			if(msg.msgtype === 'quiz') {           // 문제수/시간 설정에서 start 버튼 클릭시
				const qmsg = msg as IQuizMsg;

				this._quizInfo.qidxs = qmsg.qidxs;
				this._quizInfo.points = [];
				for(let i = 0; i < qmsg.qidxs.length; i++) {
					this._quizInfo.points[i] = 0;
				}
				this._quizInfo.qtime = qmsg.qtime;
				this._quizInfo.qtype = qmsg.qtype;
				this.state.isGroup = qmsg.isGroup;
				this.state.forceStopIdx = -1;

				this.actions.setQuizProg('');
				this.state.qidx = 0;
				this._setViewDiv('content');
				this.state.groupResult = '';
				if(this.state.isGroup) this.state.groupProg = 'inited';
				this.state.prog = 'quiz';
			} else if(msg.msgtype === 'force_stop') {
				if(
					this.state.viewDiv === 'content' && 
					this.state.prog === 'quiz' && 
					(this.state.quizProg === '' || this.state.quizProg === 'quiz')
				) {
					const fmsg = msg as IFlipMsg;
					this.state.forceStopIdx = fmsg.idx;
				}
			} else if(msg.msgtype === 'start_quiz') {         // 타이머 스타트 시
				if(this.state.viewDiv === 'content' && this.state.prog === 'quiz' && this.state.quizProg === '') {
					const qmsg = msg as IMsgQuizIdx;
					this.state.qidx = qmsg.qidx;
					this.actions.setQuizProg('quiz');
				}
			} else if(msg.msgtype === 'pad_gana') {            // 팀 A, B 결정
				const qmsg = msg as IMsgGaNa;
				if(App.student) {
					let ga_na: undefined|'ga'|'na';
					if(App.student.id === qmsg.ga) ga_na = 'ga';
					else if(App.student.id === qmsg.na) ga_na = 'na';
					
					if(ga_na) {
						this._quizInfo.qidxs = [];
						this._quizInfo.points = [];
						this._quizInfo.qtime = 5;
						this.state.isGroup = true;
						this.state.ga_na = ga_na;
						this.actions.setQuizProg('');
						this._setViewDiv('content');
						this.state.groupProg = 'initing';
						this.state.prog = 'quiz';
						this.state.startSelectedAni = false;
						_.delay(() => {
							if(this.state.groupProg === 'initing') {
								this.state.startSelectedAni = true;
							}
								
						}, 10);
					}
				}
			} else if(msg.msgtype === 'send_point') {      // 그룹일 경우 포인트 전달
				if(!this.state.isGroup) return;
				else if(this.state.prog !== 'quiz') return;
				else if(this.state.groupProg !== 'inited') return;

				const qmsg = msg as IMsgQuizIdx;
				this._quizInfo.points[qmsg.qidx] = qmsg.point;
				this.state.qidx = qmsg.qidx;
				this.state.groupProg = 'onquiz';

				this.actions.setQuizProg('');
			} else if(msg.msgtype === 'next_quiz') {        // 그룹일 경우 스핀들 버튼 클릭시
				if(!this.state.isGroup) return;
				else if(this.state.prog !== 'quiz') return;

				const qmsg = msg as IMsgQuizIdx;
				this.state.qidx = qmsg.qidx;
				
				this.state.groupProg = 'inited';
				this.actions.setQuizProg('');

			} else if(msg.msgtype === 'end_quiz') {           // 그룹일 경우  모든 계산이 완료.
				if(!this.state.isGroup) return;
				else if(this.state.prog !== 'quiz') return;

				const qmsg = msg as IMsgGaNaResult;
				if(qmsg.ga_point === qmsg.na_point) this.state.groupResult = 'tie';
				else if(qmsg.ga_point > qmsg.na_point && this.state.ga_na === 'ga') this.state.groupResult = 'win';
				else if(qmsg.ga_point < qmsg.na_point && this.state.ga_na === 'na') this.state.groupResult = 'win';
				else this.state.groupResult = 'lose';
					
				// this.state.qidx = 0;
				this.state.groupProg = 'complete';
				this.actions.setQuizProg('result');
			} else if(
					msg.msgtype === 'spelling' || 
					msg.msgtype === 'speak_audio' || 
					msg.msgtype === 'speak_video' ||
					msg.msgtype === 'speaking_audio' || 
					msg.msgtype === 'speaking_video' 
			) {
				const qmsg = msg as IDrillMsg;

				const word = _.find(this._data.page1.words, {idx: qmsg.word_idx});
				if(word) {
					this._word = word;
					this._setViewDiv('content');
					this.state.mediaType = (msg.msgtype === 'speak_video' || msg.msgtype === 'speaking_video') ? 'video' : 'audio';

					if(msg.msgtype === 'spelling') this.state.prog = msg.msgtype;
					else this.state.prog = 'record';

					this.state.bRecordSend = (
						msg.msgtype === 'speak_audio' || msg.msgtype === 'speak_video' ||
						msg.msgtype === 'speaking_audio' || msg.msgtype === 'speaking_video'
					);
				}
			}
		}
	}
	public uploaded = (url: string) => {
		if(this.state.viewDiv === 'content' && this.state.prog === 'record') {
			this.state.uploaded = url;
		}
	}
	@action public notify = (type: string) => {
		if(this.state.viewDiv === 'content' && this.state.prog === 'record') {
			this.state.notice = type;
		}
	}

	private _recorded(url: string, type: 'audio'|'video') {
		this.state.notice = '';
		_.delay(() => {
			if(
				this.state.viewDiv === 'content' && 
				this.state.mediaType === type &&
				this.state.prog === 'record'
			) {
				this.state.recorded = url;
			}
		}, 300);
	}
	@action public notifyRecorded = (url: string) => {
		if(	
			this.state.viewDiv === 'content' && 
			this.state.mediaType === 'audio' && 
			this.state.prog === 'record'
		) {
			this._recorded(url, this.state.mediaType);
		}
	}
	public notifyVideoRecord = (url: string) => {
		if(	
			this.state.viewDiv === 'content' && 
			this.state.mediaType === 'video' && 
			this.state.prog === 'record'
		) {
			this._recorded(url, this.state.mediaType);
		}
	}

	public setData(data: IData) {
		data = initData(data);
		const words = data.page1.words;
		for(let i = 0; i < words.length; i++) {
			const word = words[i];

			word.app_idx = i;
			word.app_checked = false;
			word.app_studied = false;
			word.app_result = false;

			word.app_sound = 0;
			word.app_meaning = 0;
			word.app_spelling = 0;
			word.app_sentence = 0;
		}
		this._word = words[0];
		this._data = data;		
	}
}

const sContext = new StudentContext();
const  { Provider: SProvider, Consumer: StudentConsumer } = React.createContext( sContext );
class StudentProvider extends React.Component<{}> {
	public render() {
		return (
			<SProvider value={sContext}>
				{this.props.children}
			</SProvider>
		);
	}
}
function useStudent(WrappedComponent: any) {
	return function UseAnother(props: any) {
		return (
			<StudentConsumer>{(store: StudentContext) => (
					<WrappedComponent
						{...store}
					/>
			)}</StudentConsumer>
		);
	};
}
export {
	sContext,
	StudentProvider,
	StudentConsumer,
	StudentContext,
	useStudent,
	IStateCtx,
	IActionsCtx,
};