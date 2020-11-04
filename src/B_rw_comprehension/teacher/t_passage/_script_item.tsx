import * as React from 'react';
import * as _ from 'lodash';
import { observer } from 'mobx-react';

import { App } from '../../../App';
import * as felsocket from '../../../felsocket';
import * as common from '../../common';

interface IScriptItem {
	script: common.IScript;
	curSeq: number;
	retCnt: number;
	qnaRet: common.IQnaReturn;
	viewReturn: boolean;
	onChoose: (script: common.IScript) => void;
}

@observer
class ScriptItem extends React.Component<IScriptItem> {
	
	private _clickReturn = () => {
		if(this.props.viewReturn) {
			App.pub_playBtnTab();
			felsocket.startStudentReportProcess($ReportType.JOIN, this.props.qnaRet.users);	
		}
	}
	private _onClick = (evt: React.MouseEvent) => {
		
		if(evt.target && evt.target instanceof HTMLElement) {
			const el = evt.target as HTMLElement;
			if(el.classList && el.classList.contains('ret-num')) return; 
		}
		this.props.onChoose(this.props.script);
	}

    public render() {
		const { script, curSeq, qnaRet, retCnt, viewReturn } = this.props;
		const arr: string[] = [
			'script_line', 
			(script.seq === curSeq) ? 'on' : ''
		];
		return (
			<span id={'script_' + script.seq} className={arr.join(' ')} onClick={this._onClick}>
				<span onClick={this._clickReturn} className="ret-num" style={{display: viewReturn && qnaRet.num > 0 ? '' : 'none'}}>{qnaRet.num}</span>
				<span className="ret-cnt" style={{display: 'none'}}>{retCnt}</span>
				{/* {script.dms_eng} */}
				<span dangerouslySetInnerHTML={{__html: script.dms_passage}}/>
			</span>
		);
	}
}

export default ScriptItem;