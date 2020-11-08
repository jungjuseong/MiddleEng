import * as React from 'react';
import * as _ from 'lodash';
import { observable } from 'mobx';
import {  observer } from 'mobx-react';

import { IActionsCtx } from './t_store';
import { ToggleBtn } from '@common/component/button';
import { IGraphSheetMsg } from '../common';
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
	
	private _onReturn = (msg: IGraphSheetMsg) => {
		const { view,numOfStudent } = this.props;

		if (!view || msg.type !== 'keyboard') return;
		if (!_.find(App.students, {id: msg.id})) return;
		
		this._retCnt = (this._retCnt + 1 >= numOfStudent) ? numOfStudent : this._retCnt + 1;
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
		const { view,actions } = this.props;
		if(view && !prev.view) {
			keyBoardState.state = 'on';
			this._retCnt = 0;
			actions.setGraphSheetFnc(this._onReturn);
		} else if(!view && prev.view) {
			keyBoardState.state = 'hide';
		}
	} 
	public _clickReturn = () => {
		const { view } = this.props;
		if(!view) return;
		App.pub_playBtnTab();
		felsocket.showStudentReportListPage();
	}
	
	public render() {
		const { view,numOfStudent,onBack } = this.props;
		return (
			<>
				<KTextArea 
					className={keyBoardState.state}
					ref={this._refArea} 
					view={view}
					on={view}
					maxLineNum={7}
					onChange={this._onChange}
					onDone={this._onDone}
				/>
				<div className="return_cnt_box white" onClick={this._clickReturn}>
					<div>{this._retCnt}/{numOfStudent}</div>
				</div>
				<Keyboard/>
				<ToggleBtn className="btn_back" onClick={onBack}/>
			</>
		);
	}
}

export { KeyboardSheet };


