import * as React from 'react';
import { observer } from 'mobx-react';

import { observable } from 'mobx';
import { ToggleBtn } from '@common/component/button';
import * as kutil from '@common/util/kutil';

import { IStateCtx, IActionsCtx, QPROG, SPROG } from './s_store';
import SendUINew from '../../share/sendui_new';
import ScriptContainer from '../script_container';
import { IQNAMsg,IScript } from '../common';
import { App } from '../../App';

import * as felsocket from '../../felsocket';

interface ISScript {
	view: boolean;
	questionProg: QPROG;
	scriptProg: SPROG;
	scriptMode: 'COMPREHENSION'|'DIALOGUE';
	qsMode: ''|'question'|'script';

	state: IStateCtx;
	actions: IActionsCtx;
}
@observer
class SScript extends React.Component<ISScript> {
	@observable private _selected: number[] = [];

	private _stime = 0;
	
	private _clickText = (idx: number, script: IScript) => {
		const { scriptProg } = this.props;
		if(this._stime === 0) this._stime = Date.now();

		if(scriptProg !== SPROG.SELECTING) return; 

		const cidx = this._selected.indexOf(idx);
		if(cidx < 0) this._selected.push(idx);
		else this._selected.splice(cidx, 1);
	}

	private _onSend = async () => {
		const { scriptProg, state,actions } = this.props;
		if(!App.student || scriptProg !== SPROG.SELECTING) return; 

		App.pub_playToPad();
		const msg: IQNAMsg = {
			msgtype: 'qna_return',
			id: App.student.id,
			returns: this._selected.slice(0), 
			stime: this._stime,
            etime: Date.now(),
		};
		felsocket.sendTeacher($SocketType.MSGTOTEACHER, msg);
		state.scriptProg = SPROG.SENDING;
		await kutil.wait(600);
		if(state.scriptProg === SPROG.SENDING) {
			state.scriptProg = SPROG.SENDED;
			// console.log('startGoodJob');
			App.pub_playGoodjob();
			actions.startGoodJob(); // 추가
		}
	}
	private _gotoQuestion = () => {
		const { scriptMode,qsMode } = this.props.state;
		if(scriptMode !== 'COMPREHENSION') return;
		else if(qsMode === 'question') return;
		App.pub_playBtnTab();
		this.props.state.qsMode = 'question';
		
	}
	public componentWillReceiveProps(next: ISScript) {
		if(next.scriptProg !== this.props.scriptProg) {
			if(next.scriptProg < SPROG.SELECTING) {
				while(this._selected.length > 0) this._selected.pop();
				this._stime = 0;
			}
		}
	}
	public render() {
		const { scriptMode,scriptProg, actions, state, questionProg} = this.props;
		const c_data = actions.getData();
		return (
			<div className={'s_script ' + state.scriptMode}>
                <ToggleBtn 
                    className="btn_QUESTION" 
                    view={state.scriptMode === 'COMPREHENSION' && questionProg === QPROG.COMPLETE} 
                    onClick={this._gotoQuestion}
                />
				<div className="script_container">
					<ScriptContainer
						view={state.viewDiv === 'content'}
						data={c_data}
						focusIdx={state.focusIdx}
						selected={this._selected}
						qnaReturns={[]}
						roll={state.roll}
						shadowing={state.shadowing}
						noSwiping={state.scriptMode === 'DIALOGUE' && state.isPlay}
						compDiv={scriptMode}
						viewClue={state.viewClue}
						viewScript={true}
						viewTrans={false}
						clickThumb={this._clickText}
						clickText={this._clickText}
					/>
				</div>
				<SendUINew
					view={this.props.view && (scriptProg === SPROG.SELECTING || scriptProg === SPROG.SENDING) && this._selected.length > 0}
					type={'pad'}
					sended={false}
					originY={0}
					onSend={this._onSend}
				/>
			</div>
		);
	}
}

export default SScript;


