import * as React from 'react';
import * as ReactDOM from 'react-dom';
import * as _ from 'lodash';
import { observable } from 'mobx';
import {  observer } from 'mobx-react';

import { IStateCtx, IActionsCtx } from './t_store';
import { ToggleBtn } from '@common/component/button';
import * as common from '../common';
import { KTextArea } from '@common/component/KTextArea';
import { Keyboard, state as keyBoardState } from '@common/component/Keyboard';


import { App } from '../../App';
import * as felsocket from '../../felsocket';


interface IKeyboard {
	view: boolean;
	actions: IActionsCtx;
	numOfStudent: number;
	onBack: () => void;
}

@observer
class KeyboardSheet extends React.Component<IKeyboard> {
	private m_tarea?: KTextArea;
	@observable private _retCnt = 0;

	constructor(props: IKeyboard) {
		super(props);
		keyBoardState.state = 'on';
	}
	
	private _onReturn = (msg: common.IGraphSheetMsg) => {
		// console.log('Keyboard, _onReturn', msg.id, msg.type, msg);
		if(!this.props.view) return;
		else if(msg.type !== 'keyboard') return;

		const student = _.find(App.students, {id: msg.id});
		if(!student) return;
		let retCnt = this._retCnt + 1;
		if(retCnt >= this.props.numOfStudent) retCnt =  this.props.numOfStudent;
		this._retCnt = retCnt;
	}

	private _refArea = (el: KTextArea|null) => {
		if(this.m_tarea || !el) return;
		this.m_tarea = el;
	}
	private _onChange = (text: string) => {
		//
	}
	private _onDone = (text: string) => {
		keyBoardState.state = 'off';
	}

	public componentDidUpdate(prev: IKeyboard) {
		if(this.props.view && !prev.view) {
			keyBoardState.state = 'on';
			this._retCnt = 0;
			this.props.actions.setGraphSheetFnc(this._onReturn);
		} else if(!this.props.view && prev.view) {
			keyBoardState.state = 'hide';
		}
	} 
	public _clickReturn = () => {
		if(!this.props.view) return;
		App.pub_playBtnTab();
		felsocket.showStudentReportListPage();
	}
	
	public render() {
		return (
			<>
				<KTextArea 
					className={keyBoardState.state}
					ref={this._refArea} 
					view={this.props.view}
					on={this.props.view}
					maxLineNum={7}
					onChange={this._onChange}
					onDone={this._onDone}
				/>
				<div className="return_cnt_box white" onClick={this._clickReturn}>
					<div>{this._retCnt}/{this.props.numOfStudent}</div>
				</div>
				<Keyboard/>
				<ToggleBtn className="btn_back" onClick={this.props.onBack}/>
			</>
		);
	}
}

export { KeyboardSheet };


