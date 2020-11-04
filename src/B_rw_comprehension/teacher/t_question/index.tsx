import * as React from 'react';
import * as _ from 'lodash';
import { observer } from 'mobx-react';

import { IStateCtx, IActionsCtx, BTN_DISABLE } from '../t_store';
import { App } from '../../../App';
import * as felsocket from '../../../felsocket';
import { ToggleBtn } from '@common/component/button';
import * as common from '../../common';
import { observable } from 'mobx';
import SendUI from '../../../share/sendui_new';
import * as style from '../../../share/style';

import NItem from '@common/component/NItem';
import { SENDPROG } from '../../student/s_store';
import * as kutil from '@common/util/kutil';

import { QuestionItem, IRet } from './_question_item';
import CluePopup from './_clue_popup';

interface IQuestion {
	view: boolean;
	inview: boolean;
    videoPopup: boolean;
    viewStoryBook: boolean;
	studying: boolean;
	data: common.IData;
	state: IStateCtx;
	actions: IActionsCtx;
	onStudy: (studying: BTN_DISABLE) => void;
	onSetNavi: (title: 'Compreshension'|'VISUALIZING', tab: 'Passage'|'GraphicOrganizer') => void;
}

@observer
class Question extends React.Component<IQuestion> {
	@observable private _curIdx = 0;
	@observable private _retCnt = 0;
	@observable private _numOfStudent = 0;
	@observable private _clue = false;

	@observable private _prog = SENDPROG.READY;
	@observable private _viewAnswer = false;
	@observable private _selected: number[] = [];
	
	private _returns: IRet[] = [];
	private _retUsers: string[] = [];

	constructor(props: IQuestion) {
		super(props);
		const questions = props.data.question;
		for(let i = 0; i < questions.length; i++) {
			this._returns[i] = {
				c1: [], c2: [], c3: [], c4: [], percent: -1
			};
			this._selected[i] = 0;
		}
	}

	private _onPage = (idx: number) => {
		if(idx !== this._curIdx) {
			App.pub_playBtnPage();
			this._curIdx = idx;
		}
	}

	private _clickClue = () => {
		if(this._prog < SENDPROG.SENDED) return;
		else if(!this._viewAnswer) return;
		App.pub_playBtnTab();

		this._clue = !this._clue;
	}
	private _offClue = () => this._clue = false;

	private _clickAnswer = () => {
		if(this._prog < SENDPROG.SENDED) return;
		else if(this._viewAnswer) return;
		App.pub_playBtnTab();
		this.props.actions.setQuestionFnc(null);
		const msg: common.IMsg = {msgtype: 'question_end'};
		felsocket.sendPAD($SocketType.MSGTOPAD, msg);

		this._prog = SENDPROG.COMPLETE;
		this._viewAnswer = true;
		this.props.onStudy(''); 
		this.props.actions.setNavi(true, true);
	}

	private _clickReturn = () => {
		App.pub_playBtnTab();
		felsocket.startStudentReportProcess($ReportType.JOIN, this._retUsers);	
		// TO DO
	}

	private _onSend = () => {
		if(!this.props.view || !this.props.inview) return;
		else if(this._prog > SENDPROG.READY) return;
		this._prog = SENDPROG.SENDING;
		this._viewAnswer = false;

		for(let i = 0; i < this._returns.length; i++) {
			const ret = this._returns[i];
			while(ret.c1.length > 0) ret.c1.pop();
			while(ret.c2.length > 0) ret.c2.pop();
			while(ret.c3.length > 0) ret.c3.pop();
			while(ret.c4.length > 0) ret.c4.pop();
			ret.percent = -1;
		}
		this._retCnt = 0;
		while(this._retUsers.length > 0) this._retUsers.pop();
		
		App.pub_playToPad();
		const msg: common.IMsg = {
			msgtype: 'question_send',
		};
		felsocket.sendPAD($SocketType.MSGTOPAD, msg);
		this.props.onStudy('ex_video');   // TO CHECK
		App.pub_reloadStudents(async () => {
			if(!this.props.view || !this.props.inview) return;
			else if(this._prog !== SENDPROG.SENDING) return;
			
			this._numOfStudent = App.students.length;
			await kutil.wait(500);
			if(!this.props.view || !this.props.inview) return;
			else if(this._prog !== SENDPROG.SENDING) return;
			this._prog = SENDPROG.SENDED;
			this.props.actions.setQuestionFnc(this._onReturn);
			this.props.actions.setNavi(false, false);
		});
	}
	private _onReturn = (qmsg: common.IQuizReturnMsg) => {
		if(this._prog < SENDPROG.SENDED) return;
		else if(this._viewAnswer) return;
		let sidx = -1;
		for(let i = 0; i < App.students.length; i++) {
			if(App.students[i].id === qmsg.id) {
				sidx = i;
				break;
			}
		}
		if(sidx < 0) return;
		if(this._retUsers.indexOf(qmsg.id) >= 0) return;
		
		this._retUsers.push(qmsg.id);
		felsocket.addStudentForStudentReportType6(qmsg.id);

		const questions = this.props.data.question;
		for(let i = 0; i < questions.length; i++) {  // 문제별 
			const question = questions[i];

			const ret = this._returns[i];
			const sel = qmsg.returns[i].answer;
			let correct = 0;
			if(ret) {
				if(sel === 1) ret.c1.push(qmsg.id);
				else if(sel === 2) ret.c2.push(qmsg.id);
				else if(sel === 3) ret.c3.push(qmsg.id);
				else if(sel === 4) ret.c4.push(qmsg.id);

				if(question.answer === 1) ret.percent = Math.round( 100 * ret.c1.length / this._numOfStudent);
				else if(question.answer === 2) ret.percent = Math.round( 100 * ret.c2.length / this._numOfStudent);
				else if(question.answer === 3) ret.percent = Math.round( 100 * ret.c3.length / this._numOfStudent);
				else if(question.answer === 4) ret.percent = Math.round( 100 * ret.c4.length / this._numOfStudent);
			}			
		}		
		this._retCnt = this._retUsers.length;		
	}
	private _setNavi() {
		this.props.actions.setNaviView(true);
		if(this._prog === SENDPROG.SENDING || this._prog === SENDPROG.SENDED) this.props.actions.setNavi(false, false);
		else this.props.actions.setNavi(true, true);

		this.props.actions.setNaviFnc(
			() => {
				if(this._curIdx === 0) {
					this.props.state.isNaviBack = true;
					this.props.onSetNavi('Compreshension','Passage');
				} else {
					App.pub_playBtnPage();
					this._curIdx = this._curIdx - 1;
				}
			},
			() => {
				if(this._curIdx >= this.props.data.question.length - 1) {
					this.props.onSetNavi('VISUALIZING','GraphicOrganizer');
				} else {
					App.pub_playBtnPage();
					this._curIdx = this._curIdx + 1;
				}
			}
		);
	}

	private _init() {
		this._curIdx = 0;
		this._clue = false;

		if(!this._viewAnswer) {
			this._prog = SENDPROG.READY;
			// this._viewAnswer = false;
			this._retCnt = 0;
			this._numOfStudent = 0;
			while(this._retUsers.length > 0) this._retUsers.pop();
			for(let i = 0; i < this._returns.length; i++) {
				const ret = this._returns[i];
				while(ret.c1.length > 0) ret.c1.pop();
				while(ret.c2.length > 0) ret.c2.pop();
				while(ret.c3.length > 0) ret.c3.pop();
				while(ret.c4.length > 0) ret.c4.pop();
				ret.percent = -1;
			}

			for(let i = 0; i < this._selected.length; i++) {
				this._selected[i] = 0;
			}
		}
		felsocket.sendPAD($SocketType.PAD_ONSCREEN, null);
	}

	public componentDidUpdate(prev: IQuestion) {
		if(this.props.videoPopup && !prev.videoPopup) {
			if(this.props.state.isVideoStudied) this.props.state.isVideoStudied = false;
		} else if (!this.props.videoPopup && prev.videoPopup) {
			if(this.props.state.isVideoStudied) this._init();
		}
		if(this.props.inview && !prev.inview) {
			this._init();
			this._setNavi();
			if(this.props.state.isNaviBack) {
				this._curIdx = this.props.data.question.length - 1;
				this.props.state.isNaviBack = false;
			}
		} else if(!this.props.inview && prev.inview) {
			this.props.actions.setQuestionFnc(null);
        }
        
		if(this.props.inview && prev.inview) {
			if (!this.props.videoPopup && prev.videoPopup) this._setNavi();
			else if(!this.props.viewStoryBook && prev.viewStoryBook) this._setNavi();
		}
	}
	
	private _onMc = (idx: number, selected: number) => {
		if(this._viewAnswer) return;

		this._selected[idx] = selected; 
	}

	public render() {
		const curIdx = this._curIdx;
		const {view, inview, data} = this.props;
		return (
		<div className="question" style={inview ? undefined : style.NONE}>
			<div className="nav">
				<div className="btn_page_box">
					{data.question.map((page, idx) => {
						return <NItem key={idx} on={idx === curIdx} idx={idx} onClick={this._onPage} />;
					})}
				</div>

				<div className="right">
					<div className="return_cnt_box white" onClick={this._clickReturn} style={this._prog >= SENDPROG.SENDED ? undefined : style.NONE}>
						<div>{this._retCnt}/{this._numOfStudent}</div>
					</div>

					<ToggleBtn 
						className="btn_answer" 
						on={this._viewAnswer} 
						view={this._prog >= SENDPROG.SENDED}
						onClick={this._clickAnswer} 
					/>
					<ToggleBtn 
						className="btn_clue" 
						on={this._clue}
						view={this._prog >= SENDPROG.SENDED && this._viewAnswer} 
						onClick={this._clickClue} 
					/>
				</div>
			</div>
			{data.question.map((quest, idx) => {
				return (
					<QuestionItem 
						key={idx} 
						idx={idx}  
						view={inview && idx === curIdx} 
						question={quest}
						viewAnswer={this._viewAnswer}
						ret={this._returns[idx]}
						selected={this._selected[idx]}
						onClick={this._onMc}
					/>
				);
			})}
			<SendUI
				view={inview && this._prog < SENDPROG.SENDED && !this.props.state.videoPopup}
				type={'teacher'}
				sended={false}
				originY={0}
				onSend={this._onSend}
			/>
			{data.question.map((clue,idx) => {
				return <CluePopup key={idx} view={this._clue && idx === curIdx} questions={clue} idx={curIdx} onClosed={this._offClue}/>;
			})}
		</div>
		);
	}
}

export default Question;


