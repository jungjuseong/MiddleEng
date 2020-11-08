import * as React from 'react';
import * as _ from 'lodash';
import { observer } from 'mobx-react';
import { observable, _allowStateChangesInsideComputed } from 'mobx';

import { IActionsCtx } from '../t_store';

import { ToggleBtn } from '@common/component/button';

import { App } from '../../../App';
import * as felsocket from '../../../felsocket';
import { CoverPopup } from '../../../share/CoverPopup';

import { IData,IMsgForIdx, IMsg,IQNAMsg } from '../../common';
import * as kutil from '@common/util/kutil';
import SendUI from '../../../share/sendui_new';
import * as style from '../../../share/style';
import { SENDPROG } from '../t_store';
import WrapTextNew from '@common/component/WrapTextNew';

import { _getJSX, _getBlockJSX,_sentence2jsx } from '../../../get_jsx';

type POPUPTYPE = 'off'|'READALOUD' | 'SHADOWING' | 'CHECKUP' | 'CHECKUPSET';

interface IVPopup {
	type: POPUPTYPE;
	data: IData;
    checkupIdx: number;
    actions: IActionsCtx;
	onSend: (type: POPUPTYPE) => void;
	onClosed: () => void;
}

@observer
class VPopup extends React.Component<IVPopup> {
	@observable private _view = false;
	@observable private _prog = SENDPROG.READY;
    @observable private _selected = 0;
    @observable private _retCnt = 0;
    @observable private _numOfStudent = 0;
    private _returnUsers: string[] = [];
	private _onClose = () => {
		App.pub_playBtnTab();
		this._view = false;
	}
	public componentDidUpdate(prev: IVPopup) {
		if (this.props.type !== 'off' && prev.type === 'off') {
			this._view = true;
			this._selected = 0;
			this._prog = SENDPROG.READY;
			this._retCnt = 0;
			this._numOfStudent = 0;
			while(this._returnUsers.length > 0) this._returnUsers.pop();
			this.props.actions.setCheckupFnc(null);
		} else if (this.props.type === 'off' && prev.type !== 'off') {
			this._view = false;
			this._selected = 0;
		}
	}
	private _onSend = () => {
        if (this.props.type === 'off') return;
        else if(this._prog !== SENDPROG.READY) return;

        if(this.props.type === 'CHECKUP') {
            const msg: IMsgForIdx = {msgtype: 'v_checkup_send', idx: this.props.checkupIdx};
            felsocket.sendPAD($SocketType.MSGTOPAD, msg);
            this._retCnt = 0;
            while(this._returnUsers.length > 0) this._returnUsers.pop();
        } else if(this.props.type !== 'CHECKUPSET') {
            const msg: IMsg = {msgtype: this.props.type === 'READALOUD' ? 'v_readaloud_send' : 'v_shadowing_send',};
            felsocket.sendPAD($SocketType.MSGTOPAD, msg);
        }
        
        this._prog = SENDPROG.SENDING;
        App.pub_playToPad();
        
        if(this.props.type === 'CHECKUP') this.props.actions.setCheckupFnc(this._onReturn);
        App.pub_reloadStudents(async () => {
            if(this._prog !== SENDPROG.SENDING) return;

            await kutil.wait(500);

            if(this._prog !== SENDPROG.SENDING) return;

            this._prog = SENDPROG.SENDED;
            this.props.onSend(this.props.type);

            if(this.props.type !== 'CHECKUP') {
                this._view = false;
            } else {
                this._retCnt = 0;
                this._numOfStudent = App.students.length;
            }
        });
	}
	private _clickTrue = () => {
		if(this._prog >= SENDPROG.COMPLETE) return;
		App.pub_playBtnTab();
		if(this._selected === 1) this._selected = 0;
		else this._selected = 1;
	}
	private _clickFalse = () => {
		if(this._prog >= SENDPROG.COMPLETE) return;
		App.pub_playBtnTab();
		if(this._selected === 2) this._selected = 0;
		else this._selected = 2;
    }
    private _onReturn = (msg: IQNAMsg) => {
        if(!this._view) return;

        const student = _.find(App.students, {id: msg.id});
        if(!student) return;
        
        this._returnUsers.push(msg.id);
        felsocket.addStudentForStudentReportType6(msg.id);
        let retCnt = this._retCnt + 1;
        if(retCnt >= this._numOfStudent) retCnt =  this._numOfStudent;
        this._retCnt = retCnt;
    }
    private _clickReturn = () => {
        App.pub_playBtnTab();
        felsocket.startStudentReportProcess($ReportType.JOIN, this._returnUsers);	
    }
	private _clickAnswer = () => {
		if(this._prog !== SENDPROG.SENDED) return;
		App.pub_playBtnTab();

		const msg: IMsg = {msgtype: 'v_checkup_end',};
		felsocket.sendPAD($SocketType.MSGTOPAD, msg);
		this._prog = SENDPROG.COMPLETE;
		this.props.actions.setCheckupFnc(null);
	}
	public render() {
		const { type, checkupIdx, data } = this.props;
		let title;
		if(this.props.type === 'READALOUD') title = 'READ ALONG';
		else if(this.props.type === 'SHADOWING') title = 'LISTEN & REPEAT';
		else if(type === 'CHECKUP' || type === 'CHECKUPSET') title = 'CHECK UP';
		else title = type;

		let question = '';
		let answer = 0;
		if(type === 'CHECKUP') {
			const checkup = data.checkup[checkupIdx];
			if(checkup) {
				question = checkup.question;
				answer = checkup.answer;
			}
		}

		return (
			<CoverPopup className="v_popup" view={this._view} onClosed={this.props.onClosed} >
				<div>
					<div className="head">
						<span>{title}</span>
						<ToggleBtn className="btn_close" onClick={this._onClose} />
					</div>
					<div className="READALOUD content" style={type === 'READALOUD' ? undefined : style.NONE}>
						Read along together.
					</div>
					<div className="SHADOWING content" style={type === 'SHADOWING' ? undefined : style.NONE}>
						Listen and repeat.
					</div>
                    <div className="CHECKUPSET content" style={type === 'CHECKUPSET' ? undefined : style.NONE}>
						Watch the video and answer.
					</div>

					<div className="CHECKUP content" style={type === 'CHECKUP' ? undefined : style.NONE}>
						
						<div className="question">
							<span>{checkupIdx + 1}.</span>
							<div className="qtext">
							<WrapTextNew 
								view={type === 'CHECKUP'}
								maxLineNum={2}
								maxSize={44}
								minSize={36}
								lineHeight={160}
								textAlign={'left'}
							>
								{question}
							</WrapTextNew>
							</div>
						</div>
						<div className="choice-box">
							<ToggleBtn 
								className="btn_true" 
								on={ 
										(this._selected === 1 && this._prog < SENDPROG.COMPLETE)
									||  ( answer === 1 && this._prog === SENDPROG.COMPLETE)
								} 
								onClick={this._clickTrue}
							/>
							<ToggleBtn 
								className="btn_false" 
								on={ 
									(this._selected === 2 && this._prog < SENDPROG.COMPLETE)
								||  ( answer === 2 && this._prog === SENDPROG.COMPLETE)
								} 
								onClick={this._clickFalse}
							/>
						</div>
						<div className="return_cnt_box white" style={{display: this._prog >= SENDPROG.SENDED ? '' : 'none'}} onClick={this._clickReturn}>
							<div>{this._retCnt}/{this._numOfStudent}</div>
						</div>
						<ToggleBtn className="btn_answer" view={this._prog >= SENDPROG.SENDED} disabled={this._prog === SENDPROG.COMPLETE} onClick={this._clickAnswer}/>
						<ToggleBtn className="btn_v_next" view={this._prog === SENDPROG.COMPLETE} onClick={this._onClose}/>
					</div>
					<SendUI
						view={this._prog < SENDPROG.SENDED}
						type={'teacher'}
						sended={false}
						originY={0}
						onSend={this._onSend}
					/>
				</div>
			</CoverPopup>
		);
	}
}

export default VPopup;