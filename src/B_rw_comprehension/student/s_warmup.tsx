import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { Observer, observer } from 'mobx-react';

import { IStateCtx, IActionsCtx, SENDPROG } from './s_store';
import * as common from '../common';
import { App } from '../../App';
import * as felsocket from '../../felsocket';
import SendUI from '../../share/sendui_new';
import { KTextArea } from '@common/component/KTextArea';
import { Keyboard, state as keyBoardState } from '@common/component/Keyboard';
import WrapTextNew from '@common/component/WrapTextNew';
import * as kutil from '@common/util/kutil';

import ReactResizeDetector from 'react-resize-detector';
import * as _ from 'lodash';
import { observable } from 'mobx';



interface ISWarmup {
	view: boolean;
	state: IStateCtx;
	actions: IActionsCtx;
}
@observer
class SWarmup extends React.Component<ISWarmup> {
	private _bndW = 0;
	private _bndH = 0;
	private _bndW_p = 0;
	private _bndH_p = 0;

	private _tarea?: KTextArea;
	private _canvas?: HTMLCanvasElement;
	private _ctx?: CanvasRenderingContext2D;
	@observable private _displayMode: '1'|'2' = '1';

	@observable private _prog: SENDPROG = SENDPROG.READY;
	@observable private _tlen = 0;

    private _stime = 0;

	constructor(props: ISWarmup) {
		super(props);
		keyBoardState.state = 'on';
	}
	private _draw() {
		if(!this.props.view || this._bndW <= 0 || this._bndH <= 0) return;
		else if(this._bndW === this._bndW_p && this._bndH === this._bndH_p) return;
		else if(!this._canvas) return;
		else if(!this._ctx) return;

		this._ctx.clearRect(0, 0, this._canvas.width, this._canvas.height);

		this._canvas.width = this._bndW;
		this._canvas.height = this._bndH;
		common.drawBalloon(
			this._ctx, 
			5, 					// x
			5, 					// y
			this._bndW - 23, 	// w
			this._bndH - 10, 	// h
			this._bndW - 5,     // px
			55, 				// py		
			10,					// round
			this.props.actions.getColor(),
		);

		this._bndW_p = this._bndW;
		this._bndH_p = this._bndH;
	}
	private _refCanvas = (el: HTMLCanvasElement|null) => {
		if(this._canvas || !el) return;
		this._canvas = el;
		this._ctx = this._canvas.getContext('2d') as CanvasRenderingContext2D;
		if(this.props.view) this._draw();
	}
	private _refArea = (el: KTextArea|null) => {
		if(this._tarea || !el) return;
		this._tarea = el;
	}
	private _onChange = (text: string) => {
		if(this._stime === 0) this._stime = Date.now();
		
		if(!this.props.view) return;
		this._tlen = text.trim().length;
		this._draw();
	}
	private _onDone = (text: string) => {
		if(this._stime === 0) this._stime = Date.now();
		
		if(!this.props.view) return;
		this._tlen = text.trim().length;
		this._draw();
		keyBoardState.state = 'off';

	}	
	private _onSend = async () => {
		if(!this.props.view) return;
		else if(this._prog > SENDPROG.READY) return;
		else if(!this._tarea) return;
		else if(!App.student) return;
		const text = this._tarea.value;

		if(text.trim().length === 0) return;
		this._prog = SENDPROG.SENDING;
		keyBoardState.state = 'hide';
		
		const msg: common.IWarmupReturnMsg = {
			msgtype: 'warmup_return',
			id: App.student.id,
			color: this.props.actions.getColor(),
            msg: text,
            stime: this._stime,
			etime: Date.now(),
		};
		
		App.pub_playToPad();
		felsocket.sendTeacher($SocketType.MSGTOTEACHER, msg);

		await kutil.wait(500);

		if(!this.props.view) return;
		else if(this._prog !== SENDPROG.SENDING) return;
		App.pub_playGoodjob();
		this.props.actions.startGoodJob();
		this._prog = SENDPROG.SENDED;
	}
	private _onResize = (w: number, h: number) => {
		this._bndW = w;
		this._bndH = h;
		if(this.props.view) this._draw();
	}

	public componentDidUpdate(prev: ISWarmup) {
		if(this.props.view && !prev.view) {
			this._bndH_p = 0;
			this._bndW_p = 0;
			this._tlen = 0;
			this._prog = SENDPROG.READY;
			keyBoardState.state = 'on';
			this._draw();

			if(App.student) this._displayMode = App.student.displayMode;
			
			// if(this._tarea) this._tarea.
			this._stime = 0;
		} else if(!this.props.view && prev.view) {
			this._bndH_p = 0;
			this._bndW_p = 0;
			this._tlen = 0;
			this._prog = SENDPROG.READY;
			keyBoardState.state = 'hide';
		}
	}
	private _toggle = () => {
		this._displayMode = this._displayMode === '2' ? '1' : '2';
	}
	public render() {
		const { view,  state, actions} = this.props;
		const data = actions.getData();
		const warmup = data.warmup[state.warmupidx];

		let surl;
		if(App.student) surl = this._displayMode === '2' ? App.student.avatar : App.student.thumb;
		else surl = '';

		const keyon = keyBoardState.state === 'on' ? ' key-on' : '';

		const color = actions.getColor();

		return (
			<div className="s_warmup" style={{display : view ? '' : 'none'}}>
				<div className={'box' + keyon}>
					<div className={'speaker'}>
						{/* <img src={App.data_url + warmup.speaker} draggable={false}/>
						<img src={_project_ + 'student/images/bubble_s.png'} draggable={false}/> */}
						<div><WrapTextNew view={view} minSize={32} maxSize={52} maxLineNum={2}  lineHeight={120}>{warmup.question}</WrapTextNew></div>
					</div>
					<div className={'s_typing'}>
						<div className="area-bnd">
							<canvas ref={this._refCanvas}/>
							<KTextArea 
								ref={this._refArea} 
								view={this.props.view} 
								on={this.props.view && this._prog === SENDPROG.READY}
								autoResize={true}
								skipEnter={false}
								onChange={this._onChange}
								onDone={this._onDone}
								maxLength={60}
								maxLineNum={3}
								rows={1}
							/>
							<ReactResizeDetector handleWidth={false} handleHeight={true} onResize={this._onResize}/>
						</div>
						<img src={surl} draggable={false} className={color} onClick={this._toggle}/>
					</div>
				</div>
				
				<Keyboard />
				<SendUI
					view={this._tlen > 0 && keyBoardState.state !== 'on' && this._prog < SENDPROG.SENDED}
					type={'pad'}
					originY={keyBoardState.state === 'on' ? -355 : 0}
					sended={false}
					onSend={this._onSend}
				/>
			</div>
		);
	}
}

export default SWarmup;