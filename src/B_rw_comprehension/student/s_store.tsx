import * as React from 'react';
import * as ReactDOM from 'react-dom';
import * as _ from 'lodash';
import { observable, action } from 'mobx';
import { App, IMain } from '../../App';
import * as felsocket from '../../felsocket';
import * as common from '../common';
import { StudentContextBase, IActionsBase, IStateBase, VIEWDIV } from '../../share/scontext';

const enum SENDPROG {
	READY,
	SENDING,
	SENDED,
	COMPLETE,
}
const enum QnaProg {
	UNMOUNT,
	YESORNO,
	SELECTING,
	SENDING,
	SENDED,
}

type MYPROG = ''|'warmup'|'passage'|'question'|'graphic'|'summary'|'v_script'|'v_checkup';
interface IStateCtx extends IStateBase {
	prog: MYPROG;
	warmupidx: number;
	/* Passage 에 관련됨 시작 */
	passageidx: number;
	qnaProg: QnaProg;
	focusSeq: number;
	focusIdx: number;
	isPlay: boolean;

	viewTrans: boolean;
	viewSctiprFocusBG: boolean;
	/* Passage 에 관련됨 끝 */
	questionProg: SENDPROG;
	/* */
	graphicProg: SENDPROG;
	graphicSheet: common.SHEETPAGE;

	summaryProg: SENDPROG;

	isPlay_v: boolean;
	checkupIdx: number;
	checkupProg: SENDPROG;

	isTableItemSwapped: boolean;
}
interface IActionsCtx extends IActionsBase {
	getData: () => common.IData;
	getColor: () => common.COLOR;
	setUploadedFnc: (fnc: ((url: string) => void)|null) => void;
	swapGraphicData: () => void;
  setIsTableItemSwapped: () => void;
}

class StudentContext extends StudentContextBase {
	@observable public state!: IStateCtx;
	public actions!: IActionsCtx;
	private _data!: common.IData;

	private _color: common.COLOR = 'pink';
	private _uploadedFnc: ((url: string) => void)|null = null;

	private _isReadAloud = false;
	private _isShadowing = false;

	constructor() {
		super();
		this.state.prog = '';
		this.state.qnaProg = QnaProg.UNMOUNT;
		this.state.warmupidx = 0;
		this.state.passageidx = 0;
		this.state.focusSeq = -1;
		this.state.focusIdx = -1;
		this.state.viewTrans = false;

		this.state.viewSctiprFocusBG = false;

		this.state.questionProg = SENDPROG.READY;

		this.state.graphicProg = SENDPROG.READY;
		this.state.graphicSheet = '';

		this.state.summaryProg = SENDPROG.READY;

		this.state.checkupIdx = 0;
		this.state.checkupProg = SENDPROG.READY;

		this.state.isPlay = false;
		this.state.isPlay_v = false;

		this.state.isTableItemSwapped = false;

		this.actions.getData = () => this._data;
		this.actions.getColor = () => this._color;

		this.actions.setUploadedFnc = (fnc: ((url: string) => void)|null) => this._uploadedFnc = fnc;

		this.actions.swapGraphicData = () => {
			//Type6일 경우 graphic의 1번, 2번 데이터 swap. Result는 원래의 데이터 순서로 반영.
			const { graphic} = this._data;
			const lastGraphicData = graphic[2];
			this._data.graphic[2] = graphic[1];
			this._data.graphic[1] = lastGraphicData;
		}

		this.actions.setIsTableItemSwapped = () => {
			this.state.isTableItemSwapped = !this.state.isTableItemSwapped;
		}
	}

	@action protected _setViewDiv(viewDiv: VIEWDIV) {
		const state = this.state;
		if(state.viewDiv !== viewDiv) {
			this.state.prog = '';
			this.state.focusIdx = -1;
			this.state.isPlay_v = false;	

			this._clearPassage();
			this.state.questionProg = SENDPROG.READY;
			this.state.graphicProg = SENDPROG.READY;
			this.state.graphicSheet = '';

			this.state.summaryProg = SENDPROG.READY;

			this.state.checkupIdx = 0;
			this.state.checkupProg = SENDPROG.READY;

			this._uploadedFnc = null;
		}
		super._setViewDiv(viewDiv);
	}
	private _clearPassage() {
		this.state.qnaProg = QnaProg.UNMOUNT;
		this.state.focusSeq = -1;
		this.state.viewTrans = false;
		this._isReadAloud = false;
		this._isShadowing = false;
		this.state.viewSctiprFocusBG = false;	
		this.state.isPlay = false;
		
	}
	private _swapGraphicData = () => {
		//Type6일 경우 graphic의 1번, 2번 데이터 swap. Result는 원래의 데이터 순서로 반영.
		const { graphic} = this._data;
		const lastGraphicData = graphic[2];
		this._data.graphic[2] = graphic[1];
		this._data.graphic[1] = lastGraphicData;
	}

	@action public receive(data: ISocketData) {
		super.receive(data);
		// console.log(data);
		if(data.type === $SocketType.MSGTOPAD && data.data) {
			const msg = data.data as common.IMsg;
			if(msg.msgtype === 'warmup_send') {
				const wmsg = msg as common.IMsgForIdx;
				if(wmsg.idx >= this._data.warmup.length) return;
				this._setViewDiv('content');
				this.state.warmupidx = wmsg.idx;
				this.state.prog = 'warmup';
			} else if(msg.msgtype === 'passage_send') {						// passage 시작
				const wmsg = msg as common.IMsgForIdx;
				if(wmsg.idx >= this._data.passage.length) return;
				this._setViewDiv('content');
				this.state.passageidx = wmsg.idx;
				this.state.prog = 'passage';
			} else if(msg.msgtype === 'qna_send') {							// passage qna 전달
				if(this.state.prog !== 'passage') return;
				else if(this.state.qnaProg > QnaProg.UNMOUNT) return;
				this._clearPassage();
				this.state.qnaProg = QnaProg.YESORNO;
			} else if(msg.msgtype === 'readaloud_send') {					// passage readaloud 전달
				if(this.state.prog === '') {
					const wmsg = msg as common.IMsgForIdx;
					if(wmsg.idx >= this._data.passage.length) return;
					this._setViewDiv('content');
					this.state.passageidx = wmsg.idx;
					this.state.prog = 'passage';
				} else if(this.state.prog !== 'passage') return;
				this._clearPassage();
				this._isReadAloud = true;
				this.state.isPlay = true;
			} else if(msg.msgtype === 'shadowing_send') {					// passage shadowing 전달
				if(this.state.prog === '') {
					const wmsg = msg as common.IMsgForIdx;
					if(wmsg.idx >= this._data.passage.length) return;
					this._setViewDiv('content');
					this.state.passageidx = wmsg.idx;
					this.state.prog = 'passage';
				} else if(this.state.prog !== 'passage') return;
				this._clearPassage();
				this._isShadowing = true;
				this.state.isPlay = true;					
			} else if(msg.msgtype === 'dialogue_end') {						// passage  qna, readaloud, shadowing 종료
				if(this.state.prog === '') {
					const wmsg = msg as common.IMsgForIdx;
					if(wmsg.idx >= this._data.passage.length) return;
					this._setViewDiv('content');
					this.state.passageidx = wmsg.idx;
					this.state.prog = 'passage';
				} else if(this.state.prog !== 'passage') return;
				this._clearPassage();
			} else if(msg.msgtype === 'focusidx') {							// passage  focusidx 전달
				if(!this._isShadowing && !this._isReadAloud) return;
				const imsg = msg as common.IMsgForIdx;
				if(this.state.prog === 'passage') {
					if(this.state.focusSeq !== imsg.idx) {
						this.state.viewSctiprFocusBG = this._isReadAloud;
						this.state.focusSeq = imsg.idx;
					}
				} else if(this.state.prog === 'v_script') {
					if(this.state.focusIdx !== imsg.idx) {
						this.state.viewSctiprFocusBG = this._isReadAloud;
						this.state.focusIdx = imsg.idx;
					}
				}
			} else if(msg.msgtype === 'playing' || msg.msgtype === 'paused') {
				if(this.state.viewDiv !== 'content') return;
				
				if(this.state.prog === 'passage') this.state.isPlay = (msg.msgtype === 'playing');
				else if(this.state.prog === 'v_script') this.state.isPlay_v = (msg.msgtype === 'playing');
			} else if(msg.msgtype === 'view_yourturn') {					// passage  yourturn(말하기 시작) 전달
				if(!this._isShadowing) return;
				const imsg = msg as common.IMsgForIdx;
				if(this.state.prog === 'passage') {
					this.state.focusSeq = imsg.idx;
					this.state.viewSctiprFocusBG = (this.state.focusSeq >= 0);
				} else if(this.state.prog === 'v_script') {
					this.state.focusSeq = imsg.idx;
					this.state.viewSctiprFocusBG = (this.state.focusIdx >= 0);
				}
			} else if(msg.msgtype === 'view_trans') {						// passage  해석 보기 전달
				if(this.state.prog !== 'passage') return;
				else if(this.state.qnaProg !== QnaProg.UNMOUNT) return;
				else if(this._isShadowing) return;
				else if(this._isReadAloud) return;
				const imsg = msg as common.IMsgForIdx;

				this.state.viewTrans = (imsg.idx === 1);
			} else if(msg.msgtype === 'question_send') {
				this._setViewDiv('content');
				this.state.questionProg = SENDPROG.READY;
				this.state.prog = 'question';				
			} else if(msg.msgtype === 'question_end') {
				if(this.state.prog !== 'question') return;
				this.state.questionProg = SENDPROG.COMPLETE;
				
			} else if(msg.msgtype === 'graphic_send') {
				this._setViewDiv('content');
				this.state.graphicProg = SENDPROG.READY;

				this.state.graphicSheet = '';
				this.state.prog = 'graphic';
				if(this._data.visualizing_type == 6 && this.state.isTableItemSwapped == false) {
					this.actions.setIsTableItemSwapped();
					this._swapGraphicData();
				}
				
			} else if(msg.msgtype === 'graphic_end') {
				if(this.state.prog !== 'graphic') return;
				this.state.graphicProg = SENDPROG.COMPLETE;
				if(this._data.visualizing_type == 6 && this.state.isTableItemSwapped == true) {
					this.actions.setIsTableItemSwapped();
					this._swapGraphicData();
				}
			} else if(msg.msgtype === 'pentool_send') {
				if(this.state.viewDiv !== 'content') this._setViewDiv('content');
				if(this.state.prog === 'graphic') this.state.graphicSheet = 'pentool';
				else {
					this.state.prog = 'graphic';
					this.state.graphicProg = SENDPROG.READY;
					this.state.graphicSheet = 'pentool';
					this.state.prog = 'graphic';
				}
			} else if(msg.msgtype === 'pentool_end') {
				if(this.state.prog !== 'graphic') return;
				this.state.graphicSheet = '';
			} else if(msg.msgtype === 'keyboard_send') {
				if(this.state.viewDiv !== 'content') this._setViewDiv('content');
				if(this.state.prog === 'graphic') this.state.graphicSheet = 'keyboard';
				else {
					this.state.prog = 'graphic';
					this.state.graphicProg = SENDPROG.READY;
					this.state.graphicSheet = 'keyboard';
					this.state.prog = 'graphic';
				}
			} else if(msg.msgtype === 'keyboard_end') {
				if(this.state.prog !== 'graphic') return;
				this.state.graphicSheet = '';
			} else if(msg.msgtype === 'summary_send') {
				this._setViewDiv('content');
				this.state.graphicProg = SENDPROG.READY;
				this.state.prog = 'summary';
			} else if(msg.msgtype === 'summary_end') {
				if(this.state.prog !== 'summary') return;
				this.state.summaryProg = SENDPROG.COMPLETE;
			} else if(msg.msgtype === 'v_readaloud_send') { // 
				this._setViewDiv('content');
				this.state.focusIdx = -1;
				this._isReadAloud = true;
				this._isShadowing = false;
				this.state.viewSctiprFocusBG = false;
				this.state.isPlay_v = true;
				this.state.prog = 'v_script';
			} else if(msg.msgtype === 'v_shadowing_send') { // 
				this._setViewDiv('content');
				this.state.focusIdx = -1;
				this._isReadAloud = false;
				this._isShadowing = true;
				this.state.viewSctiprFocusBG = false;
				this.state.isPlay_v = true;
				this.state.prog = 'v_script';
			} else if(msg.msgtype === 'v_dialogue_end') {
				
				this.state.focusIdx = -1;
				this._isReadAloud = false;
				this._isShadowing = true;
				this.state.viewSctiprFocusBG = false;
				this.state.isPlay_v = false;
				this._setViewDiv('eyeon');
			} else if(msg.msgtype === 'v_checkup_send') { // 
				this._setViewDiv('content');
				const imsg = msg as common.IMsgForIdx;
				this.state.checkupProg = SENDPROG.READY;
				this.state.checkupIdx = imsg.idx;
				this.state.prog = 'v_checkup';
			} else if(msg.msgtype === 'v_checkup_end') { 
				if(this.state.prog !== 'v_checkup') return;
				this.state.checkupProg = SENDPROG.COMPLETE;
			}
		}
	}
	public uploaded = (url: string) => {
		if(this.state.viewDiv === 'content' && this.state.prog === 'graphic' && this.state.graphicSheet === 'pentool') {
            if(this._uploadedFnc) this._uploadedFnc(url);
        }
	}
	@action public notify = (type: string) => {
		//
	}
	@action public notifyRecorded = (url: string) => {
		//
	}
	public setData(data: any) {
		let cidx = 0;
		const len = common.COLORS.length;
		while(true) {
			cidx = Math.floor(Math.random() * len);
			if(cidx < len) break;
		}
		this._color = common.COLORS[cidx];


		this._data = common.initData(data as common.IData);
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
	SENDPROG,
	QnaProg,
};