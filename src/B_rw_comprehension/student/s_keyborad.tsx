import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { observable } from 'mobx';
import {  observer } from 'mobx-react';

import { IStateCtx, IActionsCtx, SENDPROG } from './s_store';
import { ToggleBtn } from '@common/component/button';
import * as common from '../common';
import { KTextArea } from '@common/component/KTextArea';
import { Keyboard, state as keyBoardState } from '@common/component/Keyboard';


import { App } from '../../App';
import * as felsocket from '../../felsocket';
import * as style from '../../share/style';
import SendUI from '../../share/sendui_new';
import * as kutil from '@common/util/kutil';


interface ISKeyboard {
	view: boolean;
	actions: IActionsCtx;
}

@observer
class SKeyboard extends React.Component<ISKeyboard> {
	private m_tarea?: KTextArea;
	private _text = '';

	@observable private _textLen = 0;
    @observable private _prog = SENDPROG.READY;
    
    private _stime = 0;

	constructor(props: ISKeyboard) {
		super(props);
		keyBoardState.state = 'on';
	}


	private _refArea = (el: KTextArea|null) => {
		if(this.m_tarea || !el) return;
		this.m_tarea = el;
	}
	private _onChange = (text: string) => {		
		if(this.props.view && this._prog === SENDPROG.READY) {
			if(this._stime === 0) this._stime = Date.now();

			this._text = text;
			this._textLen = text.trim().length;
		}
	}
	private _onDone = (text: string) => {
		if(this.props.view && this._prog === SENDPROG.READY) {
			this._text = text;
			this._textLen = text.trim().length;
			keyBoardState.state = 'off';
		}
	}
	public componentDidUpdate(prev: ISKeyboard) {
		if(this.props.view && !prev.view) {
			keyBoardState.state = 'on';
			this._prog = SENDPROG.READY;
			this._text = '';
			this._textLen = 0;
			this._stime = 0;
		} else if(!this.props.view && prev.view) {
			keyBoardState.state = 'hide';
		}
	} 
	private _onSend = async () => {
		if(!this.props.view) return;
		else if(!App.student) return;
		else if(!this.m_tarea) return;
		else if(this._textLen === 0) return;
		else if(this._prog !== SENDPROG.READY) return;

		this._prog = SENDPROG.SENDING;
		keyBoardState.state = 'hide';

		App.pub_playToPad();

		felsocket.uploadStudentReport($ReportType.TEXT, this._text, '');

		const msg: common.IGraphSheetMsg = {
			msgtype: 'sheet_return',
			id: App.student.id,
            type: 'keyboard',
            stime: this._stime,
            etime: Date.now(),
            input: this._text,
		};

		felsocket.sendTeacher($SocketType.MSGTOTEACHER, msg);

		await kutil.wait(500);
		if(!this.props.view) return;
		else if(this._prog !== SENDPROG.SENDING) return;

		this._prog = SENDPROG.SENDED;
		App.pub_playGoodjob();
		this.props.actions.startGoodJob();
		

	}

	
	public render() {
		return (
			<div className="s-keyboard" style={this.props.view ? undefined : style.NONE}>
				<div className={'area-bnd ' + keyBoardState.state}>
					<KTextArea 
						ref={this._refArea} 
						view={this.props.view}
						on={this.props.view && this._prog === SENDPROG.READY}
						maxLineNum={7}
						onChange={this._onChange}
						onDone={this._onDone}
					/>
				</div>
				<SendUI
					view={this._prog < SENDPROG.SENDED && this._textLen > 0 && keyBoardState.state !== 'on'}
					type={'pad'}
					originY={keyBoardState.state === 'on' ? -380 : 0}
					sended={false}
					onSend={this._onSend}
				/>
				<Keyboard/>
			</div>
		);
	}
}

export default SKeyboard;


