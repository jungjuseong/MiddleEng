import * as React from 'react';

import { observer } from 'mobx-react';
import { observable } from 'mobx';
import * as _ from 'lodash';

import { App } from '../../App';
import { ToggleBtn } from '@common/component/button';
import * as kutil from '@common/util/kutil';

import { IStateCtx, IActionsCtx, QPROG, SPROG } from '../student/s_store';
import * as felsocket from '../../felsocket';
import * as common from '../common';

import SQuestion from './s_question';
import SScript from './s_script';

interface ISContent {
	view: boolean;
	questionView: boolean;
	questionProg: QPROG;
	scriptProg: SPROG;
	scriptMode: 'COMPREHENSION'|'DIALOGUE';
	qsMode: ''|'question'|'script';

	state: IStateCtx;
	actions: IActionsCtx;
}

@observer
class SContent extends React.Component<ISContent> {
	@observable private _img_pop_on = false;

	private _stime = 0;
	
	private _clickYes = () => {
		if(this._stime === 0) this._stime = Date.now();

		const state = this.props.state;
		if(state.scriptProg !== SPROG.YESORNO) return;
		else if(state.scriptMode !== 'COMPREHENSION') return;

		App.pub_playBtnTab();
		state.qsMode = 'script';
		state.scriptProg = SPROG.SELECTING;

		this._img_pop_on = true;
		_.delay(() => {
			this._img_pop_on = false;
		}, 2000); // 시간수정
	}
	private _clickNo = async () => {
		if(this._stime === 0) this._stime = Date.now();

		const state = this.props.state;
		if(state.scriptProg !== SPROG.YESORNO) return;
		else if(state.scriptMode !== 'COMPREHENSION') return;
		App.pub_playBtnTab();
		state.scriptProg = SPROG.SENDED;
		if(!App.student) return;
		const script = this.props.actions.getData().scripts[this.props.state.focusIdx];
		const msg: common.IQNAMsg = {
			msgtype: 'qna_return',
			id: App.student.id,
			returns: [],
			stime: this._stime,
            etime: Date.now(),
		};
		felsocket.sendTeacher($SocketType.MSGTOTEACHER, msg);
		// console.log('startGoodJob');

		await kutil.wait(300);
		App.pub_playGoodjob();
		this.props.actions.startGoodJob(); // 추가
	}
	public componentWillUpdate(next: ISContent) {
		//
	}
	public render() {
		const {view, state, actions, questionProg, scriptProg, scriptMode, qsMode} = this.props;
		const style: React.CSSProperties = {};
		if(!view) {
			style.opacity = 0;
			style.zIndex = -1;
			style.pointerEvents = 'none';				
		}
		return (
			<div className="s_content" style={style}>
				<SScript
					view={this.props.view && scriptProg > SPROG.UNMOUNT}
					questionProg={questionProg}
					scriptProg={scriptProg}
					scriptMode={scriptMode}
					qsMode={qsMode}
					state={state}
					actions={actions}
				/>
				<SQuestion 
					view={this.props.view && this.props.questionView} 
					questionView={this.props.questionView}
					questionProg={questionProg}
					scriptProg={scriptProg}
					scriptMode={scriptMode}
					qsMode={qsMode}
					state={state}
					actions={actions}
				/>

				<div className={'img_pop' + (this._img_pop_on ? ' on' : '')} />
				<div className={'btn_box' + (scriptProg === SPROG.YESORNO ? ' on' : '')}>
					<ToggleBtn className="btn_yes" onClick={this._clickYes} on={scriptProg === SPROG.SELECTING}/>
					<ToggleBtn className="btn_no" onClick={this._clickNo} on={scriptProg === SPROG.SENDED}/>
				</div>
			</div>
		);
	}
}

export default SContent;