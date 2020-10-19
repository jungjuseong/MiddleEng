import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { observer } from 'mobx-react';

import { IStateCtx, IActionsCtx, SENDPROG } from './s_store';
import { App } from '../../App';
import * as felsocket from '../../felsocket';
import { ToggleBtn } from '@common/component/button';

import * as kutil from '@common/util/kutil';

import * as common from '../common';
import { observable } from 'mobx';

import { KPen, IPenHistory } from '@common/pen/KPen';
import { PenUI, PenUIStore } from '../../share/penui';

import * as style from '../../share/style';
import SendUI from '../../share/sendui_new';

interface ISPentool {
	view: boolean;
	actions: IActionsCtx;
}

@observer
class SPentool extends React.Component<ISPentool> implements IForDraw {
	private _penui: PenUIStore = new PenUIStore();
	private _kpen?: KPen;

	@observable private _started = false;
    @observable private _prog = SENDPROG.READY;
    
    private _stime = 0;

	public clear() {
		this._started = false;
		this._prog = SENDPROG.READY;
		this.props.actions.setLoading(false);
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
			if(this._stime === 0) this._stime = Date.now();
			
			if(!this.props.view) return false;

			if(!this._penui.erase) this._started = true;
			history.erase = this._penui.erase,
			history.color = this._penui.color,
			history.thick = this._penui.erase ? this._penui.thick_erase : this._penui.thick;
			
			return (this._prog === SENDPROG.READY);
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
	public componentDidUpdate(prev: ISPentool) {
		if(this.props.view && !prev.view) {
            //
            this._stime = 0;
		} else if(!this.props.view && prev.view) {
			// this.m_drawed = false;
			// this.m_ok = false;
			this.clear();
		}
	}

	private _onSend = async () => {
        if(!this.props.view) return;
        else if(!App.student) return;
        else if(!this._kpen) return;
        else if(this._prog !== SENDPROG.READY) return;

        this._prog = SENDPROG.SENDING;
        this.props.actions.setUploadedFnc(this._uploaded);
        this.props.actions.setLoading(true);
        const url = this._kpen.toDataURL('#ffffff');

        App.pub_playToPad();

        if (!App.isDvlp && url !== '') felsocket.uploadImageToServer(url);
        else {
            await kutil.wait(1000);
            this._uploaded('');
        }
	}

	private _uploaded = (url: string) => {
		if(!this.props.view) return;
		else if(!App.student) return;
		else if(!this._kpen) return;
		else if(this._prog !== SENDPROG.SENDING) return;

		const msg: common.IGraphSheetMsg = {
			msgtype: 'sheet_return',
			id: App.student.id,
            type: 'pentool',
            stime: this._stime,
            etime: Date.now(),
            input: url,
		};
		felsocket.sendTeacher($SocketType.MSGTOTEACHER, msg);

		felsocket.uploadStudentReport($ReportType.IMAGE, url, '');
		this._prog = SENDPROG.SENDED;
		this.props.actions.setUploadedFnc(null);
		this.props.actions.setLoading(false);

		App.pub_playGoodjob();
		this.props.actions.startGoodJob();
	}

	public render() {
		const {view, } = this.props;
		return (
			<div className="s-pentool" style={view ? undefined : style.NONE}>
				<div className="draw_box">
					<img 
						src={_project_ + 'student/images/icon_draw.png'}
						width={1205} 
						height={654} 
						style={this._started ? style.NONE : undefined}
					/>
					<canvas 
						ref={this._refCanvas}
						width={1205} 
						height={600} 
					/>
				</div>
				<PenUI view={this._prog < SENDPROG.SENDED} draw={this} store={this._penui} disabled={false}/>

				<SendUI
					view={this._prog < SENDPROG.SENDED && this._penui.undoLen > 0}
					type={'pad'}
					originY={0}
					sended={false}
					onSend={this._onSend}
				/>
			</div>
		);
	}
}
export default SPentool;


