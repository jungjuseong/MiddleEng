import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { observer } from 'mobx-react';
import * as _ from 'lodash';

import { IStateCtx, IActionsCtx } from './t_store';
import { App } from '../../App';
import * as felsocket from '../../felsocket';
import { ToggleBtn } from '@common/component/button';
import * as common from '../common';
import { observable } from 'mobx';

import { KPen, IPenHistory } from '@common/pen/KPen';
import { PenUI, PenUIStore } from '../../share/penui';

interface IPentool {
	view: boolean;
	numOfStudent: number;
	actions: IActionsCtx;
	onBack: () => void;
}

@observer
class PentoolSheet extends React.Component<IPentool> implements IForDraw {
	private _penui: PenUIStore = new PenUIStore();
	private _kpen?: KPen;

	@observable private _retCnt = 0; 
	public clear() {
		if(!this._kpen) return;

		this._kpen.clear();
		this._penui.setUndoLen(0);
		this._penui.setErase(false);
	}

	public reset() {
		if(!this._kpen) return;
		this._kpen.reset();
		this._penui.setUndoLen(0);
	}
	public undo() {
		if(!this._kpen) return;
		const last = this._kpen.undo();
		const len = this._kpen.undoLen;
		this._penui.setUndoLen(len);
		// this.m_drawed = len > 0;
		if(len === 0) this._penui.setErase(false);
	}
	public redo() {
		// 
	}
	public canUndo() {return (this._kpen && this._kpen.undoLen > 0) as boolean;}
	public canRedo() {return false;}

	private _refCanvas = (el: HTMLCanvasElement|null) => {
		if(this._kpen || !el) return;

		const fdown = (e: MouseEvent, history: IPenHistory) => {
			if(!this.props.view) return false;

			history.erase = this._penui.erase,
			history.color = this._penui.color,
			history.thick = this._penui.erase ? this._penui.thick_erase : this._penui.thick;
			
			return true;
		};

		const fmove = (e: MouseEvent, history: IPenHistory) => {
			// if(this.m_ok) return;
		};

		const fup = (e: MouseEvent, history: IPenHistory) => {
			if(!this._kpen) return false;
			this._penui.setUndoLen(this._kpen.undoLen);
			
			// if(!history.erase) this._drawed = true;
			return true;

		};

		this._kpen = new KPen(el, fdown, fmove, fup);
	}
	public componentDidUpdate(prev: IPentool) {
		if(this.props.view && !prev.view) {
			this._retCnt = 0;
			this.props.actions.setGraphSheetFnc(this._onReturn);
		} else if(!this.props.view && prev.view) {
			// this.m_drawed = false;
			// this.m_ok = false;
			this.clear();
		}
	}
	private _onReturn = (msg: common.IGraphSheetMsg) => {
		// console.log('PenTool, _onReturn', msg.id, msg.type, msg);
		if(!this.props.view) return;
		else if(msg.type !== 'pentool') return;


		const student = _.find(App.students, {id: msg.id});
		if(!student) return;
		let retCnt = this._retCnt + 1;
		if(retCnt >= this.props.numOfStudent) retCnt =  this.props.numOfStudent;
		this._retCnt = retCnt;
	}
	private _clickReturn = () => {
		if(!this.props.view) return;
		App.pub_playBtnTab();
		felsocket.showStudentReportListPage();
	}

	public render() {
		return (
				<>
					<div className="draw_box">
						<canvas 
							ref={this._refCanvas}
							width={980} 
							height={542} 
						/>
					</div>
					<div className="return_cnt_box white" onClick={this._clickReturn}>
						<div>{this._retCnt}/{this.props.numOfStudent}</div>
					</div>
					<PenUI view={true} draw={this} store={this._penui} disabled={false}/>
					<ToggleBtn className="btn_back" onClick={this.props.onBack}/>
				</>
		);
	}
}
export { PentoolSheet };


