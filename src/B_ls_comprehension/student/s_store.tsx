import * as React from 'react';
import { observable, action } from 'mobx';

import * as _ from 'lodash';
import * as common from '../common';
import { StudentContextBase, IActionsBase, IStateBase, VIEWDIV } from '../../share/scontext';

const enum QPROG {
	UNINIT,
	READYA,
	ON,
	SENDING,
	SENDED,
	COMPLETE,
}
const enum SPROG {
	UNMOUNT,
	MOUNTED,
	YESORNO,
	SELECTING,
	SENDING,
	SENDED,
}

interface IStateCtx extends IStateBase {
	questionView: boolean;
	questionProg: QPROG;
	scriptProg: SPROG;
	scriptMode: 'COMPREHENSION'|'DIALOGUE';
	roll: ''|'A'|'B';
	shadowing: boolean;
	qsMode: ''|'question'|'script';
	viewClue: boolean;
	isPlay: boolean;
	focusIdx: number;
}
interface IActionsCtx extends IActionsBase {
	getData: () => common.IData;
}

class StudentContext extends StudentContextBase {
	@observable public state!: IStateCtx;
	public actions!: IActionsCtx;
	private _data!: common.IData;

	constructor() {
		super();

		this.state.questionView = false;
		this.state.questionProg = QPROG.UNINIT;
		this.state.scriptProg = SPROG.UNMOUNT;
		this.state.scriptMode = 'COMPREHENSION';
		this.state.qsMode  = '';
		this.state.roll = '';
		this.state.viewClue = false;
		this.state.focusIdx = -1;
		this.state.isPlay = false;
		this.state.shadowing = false;
		this.actions.getData = () => this._data;
	}

	@action protected _setViewDiv(viewDiv: VIEWDIV) {
		const state = this.state;
		if(state.viewDiv !== viewDiv) {
			this.state.questionView = false;
			if(this.state.questionProg < QPROG.COMPLETE) this.state.questionProg = QPROG.UNINIT;
			
			this.state.scriptProg = SPROG.UNMOUNT;
			this.state.qsMode  = '';
			this.state.roll = '';
			this.state.viewClue = false;
			this.state.shadowing = false;
			this.state.isPlay = false;
			this.state.focusIdx = -1;
		}
		super._setViewDiv(viewDiv);
	}
	@action public receive(data: ISocketData) {
		super.receive(data);
		// console.log('receive', data);
		if(data.type === $SocketType.MSGTOPAD && data.data) {
			const msg = data.data as  common.IMsg;
			if(msg.msgtype === 'quiz_send') {
				// if(this.state.questionProg > QPROG.UNINIT) return;
				this.state.scriptProg = SPROG.UNMOUNT;
				this.state.questionView = true;
				this.state.questionProg = QPROG.ON;
				this.state.viewDiv = 'content';
				this.state.scriptMode  = 'COMPREHENSION';
				this.state.qsMode  = 'question';
				this.state.roll = '';
				this.state.shadowing = false;
			} else if(msg.msgtype === 'quiz_end') {
				const qProg = this.state.questionProg;
				if(this.state.viewDiv !== 'content') return;
				else if(qProg !== QPROG.ON && qProg !== QPROG.SENDING && qProg !== QPROG.SENDED) return;

				this.state.questionProg = QPROG.COMPLETE;
			} else if(msg.msgtype === 'script_send') {
				if(this.state.scriptProg !== SPROG.UNMOUNT) return;

				if(this.state.questionProg < QPROG.COMPLETE) this.state.questionProg = QPROG.READYA;
				this.state.questionView = true;

				this.state.scriptProg = SPROG.MOUNTED;
				this.state.viewDiv = 'content';
				this.state.scriptMode  = 'COMPREHENSION';
				this.state.qsMode  = 'script';
				this.state.roll = '';
				this.state.shadowing = false;
			} else if(msg.msgtype === 'view_clue') {
				if(this.state.viewDiv !== 'content') return;
				else if(this.state.scriptProg === SPROG.UNMOUNT) return;

				this.state.qsMode  = 'script';
				this.state.viewClue = true;
			} else if(msg.msgtype === 'hide_clue') {
				if(this.state.viewDiv !== 'content') return;
				else if(this.state.scriptProg === SPROG.UNMOUNT) return;

				this.state.viewClue = false;
			} else if(msg.msgtype === 'qna_send') {
				if(this.state.viewDiv !== 'content') return;
				else if(this.state.scriptProg !== SPROG.MOUNTED) return;

				this.state.focusIdx = -1;
				// this.state.viewClue = false;
				this.state.scriptProg = SPROG.YESORNO;
			} else if(msg.msgtype === 'qna_end') {
				if(this.state.viewDiv !== 'content') return;
				else if(this.state.scriptProg < SPROG.MOUNTED) return;

				// this.state.viewClue = false;
				this.state.scriptProg = SPROG.MOUNTED;
			} else if(msg.msgtype === 'dialogue_send') {
				// if(this.state.scriptProg !== SPROG.UNMOUNT) return;
				// if(this.state.questionProg === QPROG.UNMOUNT) this.state.questionProg = QPROG.MOUNTED;
				
				this.state.scriptProg = SPROG.UNMOUNT;
				if(this.state.questionProg < QPROG.COMPLETE) this.state.questionProg = QPROG.UNINIT;
				this.state.viewDiv = 'content';
				this.state.scriptMode  = 'DIALOGUE';
				this.state.qsMode  = 'script';
				this.state.roll = '';
				this.state.shadowing = false;
				this.state.viewClue = false;
				this.state.focusIdx = -1;			
			} else if(msg.msgtype === 'dialogue_end') { 
				this.state.roll = '';
				this.state.shadowing = false;
				this.state.isPlay = false;
				this.state.focusIdx = -1;			
			} else if(msg.msgtype === 'roll_send') {
				if(this.state.viewDiv !== 'content') return;
				else if(this.state.scriptMode !== 'DIALOGUE') return;
				else if(this.state.qsMode !== 'script') return;

				const rmsg = msg as common.IRollMsg;
				this.state.roll = rmsg.roll;
				this.state.shadowing = false;
				this.state.focusIdx = -1;
			} else if(msg.msgtype === 'shadowing_send') {
				if(this.state.viewDiv !== 'content') return;
				else if(this.state.scriptMode !== 'DIALOGUE') return;
				else if(this.state.qsMode !== 'script') return;	
				this.state.roll = '';
				this.state.shadowing = true;
				this.state.focusIdx = -1;
			} else if(msg.msgtype === 'playing' || msg.msgtype === 'paused') {
				if(this.state.viewDiv !== 'content') return;
				this.state.isPlay = (msg.msgtype === 'playing');
			} else if(msg.msgtype === 'focusidx') {
				if(this.state.viewDiv !== 'content') return;
				else if(this.state.scriptMode === 'COMPREHENSION') return;
				const fmsg = msg as common.IFocusMsg;
				this.state.focusIdx = fmsg.idx;
			}
		}
	}
	public uploaded = (url: string) => {
		//
	}
	@action public notify = (type: string) => {
		//
	}
	@action public notifyRecorded = (url: string) => {
		//
	}

	public setData(data: any) {
		// console.log(data);
		this._data = data as common.IData;

		const scripts = this._data.scripts;
		const speakerA = this._data.speakerA.name;
		const speakerB = this._data.speakerB.name;
		const speakerC = this._data.speakerC.name;
		if(!this._data.speakerD) {
			this._data.speakerD = {
				name: '',
				image_s: '',
				image_l: '',
			};
		}
		if(!this._data.speakerE) {
			this._data.speakerE = {
				name: '',
				image_s: '',
				image_l: '',
			};
		}
		const speakerD = this._data.speakerD.name;
		const speakerE = this._data.speakerE.name;
		for(let i = 0; i < this._data.quizs.length; i++) {
			const q = this._data.quizs[i];

			const arr = q.question.split('<br>');
			
			q.app_question = (
				<>{
					arr.map((str, idx) => {
						if(idx > 0) return <React.Fragment key={idx}><br/>{str}</React.Fragment>;
						else return str;
					})
				}</>
			);
		}
		scripts.forEach((script) => {
			if(script.dms_speaker === speakerA) script.roll = 'A';
			else if (script.dms_speaker === speakerB) script.roll = 'B';
			else if (script.dms_speaker === speakerC) script.roll = 'C';
			else if (script.dms_speaker === speakerD) script.roll = 'D';
			else script.roll = 'E';
		});
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
	QPROG,
	SPROG,
};