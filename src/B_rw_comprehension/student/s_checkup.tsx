import * as React from 'react';
import * as ReactDOM from 'react-dom';
import * as _ from 'lodash';
import { observer, } from 'mobx-react';
import { observable, } from 'mobx';

import { IStateCtx, IActionsCtx, SENDPROG } from './s_store';

import { App } from '../../App';
import * as felsocket from '../../felsocket';

import * as common from '../common';
import { ToggleBtn } from '@common/component/button';

import * as kutil from '@common/util/kutil';

import * as style from '../../share/style';
import SendUI from '../../share/sendui_new';


interface ISCheckup {
	view: boolean;
	state: IStateCtx;
	actions: IActionsCtx;
}
@observer
class SCheckup extends React.Component<ISCheckup> {
    @observable private _selected = 0;
    
    private _stime = 0;

	public componentDidUpdate(prev: ISCheckup) {
		if (this.props.view && !prev.view) {
			this._selected = 0;
			this._stime = 0;
			this.props.state.checkupProg = SENDPROG.READY;
		} else if (this.props.view && !prev.view) {
			this._selected = 0;
		}
	}
	private _onSend = async () => {
		if (!this.props.view) return;
		else if (!App.student) return;
		else if(this.props.state.checkupProg !== SENDPROG.READY) return;

		const checkup = this.props.actions.getData().checkup[this.props.state.checkupIdx];
		const msg: common.IQNAMsg = {
			msgtype: 'v_checkup_return',
			id: App.student.id,
            returns: [this._selected],
            stime: this._stime,
            etime: Date.now(),
            seq: checkup.seq,
		};
		felsocket.sendTeacher($SocketType.MSGTOTEACHER, msg);
		this.props.state.checkupProg = SENDPROG.SENDING;
		App.pub_playToPad();

		await kutil.wait(500);
		if (!this.props.view) return;
		else if(this.props.state.checkupProg !== SENDPROG.SENDING) return;

		this.props.state.checkupProg = SENDPROG.SENDED;
		App.pub_playGoodjob();
		this.props.actions.startGoodJob();

	}
	private _clickTrue = () => {
		if(this._stime === 0) this._stime = Date.now();
		
		if(this.props.state.checkupProg !== SENDPROG.READY) return;
		App.pub_playBtnTab();
		if(this._selected === 1) this._selected = 0;
		else this._selected = 1;
	}
	private _clickFalse = () => {
		if(this._stime === 0) this._stime = Date.now();
		
		if(this.props.state.checkupProg !== SENDPROG.READY) return;
		App.pub_playBtnTab();
		if(this._selected === 2) this._selected = 0;
		else this._selected = 2;
	}


	public render() {
		const { view, state, actions } = this.props;
		let question = '';
		let answer = 0;
		const checkupIdx = state.checkupIdx;
		const checkup = actions.getData().checkup[checkupIdx];
		if(checkup) {
			question = checkup.question;
			answer = checkup.answer;
		}
		const  arr_true: string[] = ['btn_true'];
		const  arr_false: string[] = ['btn_false'];
		let result = '';
		if(state.checkupProg === SENDPROG.COMPLETE) {
			if(answer === 1) {
				arr_true.push('correct');
				if(this._selected === 2) arr_false.push('wrong');
			} else {
				arr_false.push('correct');	
				if(this._selected === 1) arr_true.push('wrong');		
			}
			result = (answer === this._selected) ? 'correct' : 'wrong';
		}

		return (
			<div className={'s_checkup'} style={view ? undefined : style.NONE}>
				<div className="question">
					<span className="num">
						<span className={'icon ' + result}/>
						<span className="text">{checkupIdx + 1}.</span>
					</span>
					<span className="question">{question}</span>
				</div>
				<div className="choice-box">
					<ToggleBtn 
						className={arr_true.join(' ')}
						on={this._selected === 1} 
						onClick={this._clickTrue}
					/>
					<ToggleBtn 
						className={arr_false.join(' ')}
						on={this._selected === 2} 
						onClick={this._clickFalse}
					/>
				</div>
				<SendUI
					view={view && state.checkupProg < SENDPROG.SENDED && this._selected > 0}
					type={'pad'}
					originY={0}
					sended={false}
					onSend={this._onSend}
				/>
			</div>

		);
	}
}

export default SCheckup;