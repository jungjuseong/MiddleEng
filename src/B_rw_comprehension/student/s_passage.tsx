import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { Observer, observer } from 'mobx-react';

import { IStateCtx, IActionsCtx, QnaProg } from './s_store';
import * as common from '../common';
import { observable } from 'mobx';
import { ToggleBtn } from '@common/component/button';
import * as kutil from '@common/util/kutil';
import * as butil from '@common/component/butil';
import SendUI from '../../share/sendui_new';
import * as style from '../../share/style';
import * as _ from 'lodash';
import { App } from '../../App';
import * as felsocket from '../../felsocket';

const SwiperComponent = require('react-id-swiper').default;

let _downIdx = -1;
let _downX = Number.MIN_VALUE;
let _downY = Number.MIN_VALUE;

interface IScript {
	idx: number;
	script: common.IScript;
	viewTrans: boolean;
	focusSeq: number;
	viewSctiprFocusBG: boolean;
	selected: boolean;
	qnaProg: QnaProg;
	onClick: (script: common.IScript, idx: number) => void;

}
class Script extends React.Component<IScript> {
	constructor(props: IScript) {
		super(props);
	}

	private _onTextDown = (ev: React.MouseEvent<HTMLElement>) => {
		if(this.props.qnaProg !== QnaProg.SELECTING) return;

		const tgt = ev.target as HTMLElement;
		_downIdx = this.props.script.seq;
		_downX = ev.clientX;
		_downY = ev.clientY;
	}
	private _onTextUp = (ev: React.MouseEvent<HTMLElement>) => {
		if(this.props.qnaProg !== QnaProg.SELECTING) {
			_downIdx = -1;
			_downX = Number.MIN_VALUE;
			_downY = Number.MIN_VALUE;
			return;
		}
		const isClick = _downIdx === this.props.script.seq &&
						Math.abs(_downX - ev.clientX) < 30 &&
						Math.abs(_downY - ev.clientY) < 30;

		_downIdx = -1;
		_downX = Number.MIN_VALUE;
		_downY = Number.MIN_VALUE;

		if(!isClick) return;

		this.props.onClick(this.props.script, this.props.idx);		
	}
	private _onTextCancel = (ev: React.MouseEvent<HTMLElement>) => {
		_downIdx = -1;
		_downX = Number.MIN_VALUE;
		_downY = Number.MIN_VALUE;
	}

	public render() {
		const {script, viewTrans, qnaProg, focusSeq, viewSctiprFocusBG, selected} = this.props;
		const arr: string[] = ['eng'];
		if(focusSeq === script.seq) {
			if(viewSctiprFocusBG) arr.push('bg-on');
			arr.push('on');
		}
		if(selected)  arr.push('selected');
		if(viewTrans) arr.push('view-trans');

		return (
			<>
			<div 
				className={arr.join(' ')} 
				onPointerDown={this._onTextDown} 
				onPointerUp={this._onTextUp}
				onPointerCancel={this._onTextCancel}
				onPointerLeave={this._onTextCancel}			
			>
				<span dangerouslySetInnerHTML={{__html: script.dms_passage}}/>
			</div>
			<div className="trans" style={viewTrans ? undefined : style.NONE}>{script.dms_kor.ko}</div>
			</>
		);
	}
}

interface ISPassage {
	view: boolean;
	viewTrans: boolean;
	focusSeq: number;
	qnaProg: QnaProg;
	state: IStateCtx;
	actions: IActionsCtx;
}
@observer
class SPassage extends React.Component<ISPassage> {
	@observable private _swiper: Swiper|null = null;
	@observable private _img_pop_on = false;
	@observable private _selected: number[] = [];

	private _scripts: common.IScript[] = [];

    private _stime = 0;

	private _clickYes = () => {
		if(this._stime === 0) this._stime = Date.now();
		
		const state = this.props.state;
		if(state.qnaProg !== QnaProg.YESORNO) return;

		App.pub_playBtnTab();
		state.qnaProg = QnaProg.SELECTING;

		this._img_pop_on = true;
		_.delay(() => {
			this._img_pop_on = false;
		}, 2000); // 시간수정
	}
	private _clickNo = async () => {
		if(this._stime === 0) this._stime = Date.now();
		
		const state = this.props.state;
		if(state.qnaProg !== QnaProg.YESORNO) return;

		App.pub_playBtnTab();
		state.qnaProg = QnaProg.SENDED;
		if(!App.student) return;
		const passage = this.props.actions.getData().passage[state.passageidx];
		const msg: common.IQNAMsg = {
			msgtype: 'qna_return',
			id: App.student.id,
            returns: [],
            stime: this._stime,
            etime: Date.now(),
            seq: passage.page,
		};
		felsocket.sendTeacher($SocketType.MSGTOTEACHER, msg);
		await kutil.wait(300);
		App.pub_playGoodjob();
		this.props.actions.startGoodJob(); // 추가
	}

	private _refSwiper = (el: SwiperComponent) => {
		if(this._swiper || !el) return;
		this._swiper = el.swiper;
	}

	private _onSend = async () => {
		const state = this.props.state;
		if(!App.student) return;
		else if(state.qnaProg !== QnaProg.SELECTING) return;

		state.qnaProg = QnaProg.SENDING;
		App.pub_playToPad();
		const passage = this.props.actions.getData().passage[state.passageidx];
		const msg: common.IQNAMsg = {
			msgtype: 'qna_return',
			id: App.student.id,
            returns: this._selected.slice(0),
            stime: this._stime,
            etime: Date.now(),
            seq: passage.page,
		};
		felsocket.sendTeacher($SocketType.MSGTOTEACHER, msg);
		await kutil.wait(600);
		if(state.qnaProg === QnaProg.SENDING) {
			state.qnaProg = QnaProg.SENDED;
			App.pub_playGoodjob();
			this.props.actions.startGoodJob();
		}		
	}
	public componentWillReceiveProps(next: ISPassage) {
		if(next.view && !this.props.view) {
			const data = next.actions.getData();
			const passage = data.passage[next.state.passageidx];
			while(this._scripts.length > 0) this._scripts.pop();
			for(let i = 0; i < data.scripts.length; i++ ) {
				const script = data.scripts[i];
				if(script.passage_page === passage.page) this._scripts.push(script);
			}
		}
	}
	private async _updateSwiper() {
		await kutil.wait(100);
		if(this._swiper) {
			this._swiper.update();
			if(this._swiper.scrollbar) this._swiper.scrollbar.updateSize();

			this._swiper.slideTo(0);
		}
	}
	public componentDidUpdate(prev: ISPassage) {
		if(this.props.view && !prev.view) {
			this._img_pop_on = false;
			this._updateSwiper();
			this._stime = 0;
		}
		if(this.props.viewTrans !== prev.viewTrans) {
			this._updateSwiper();
		}
		if(this.props.qnaProg !== prev.qnaProg) {
			if(this.props.qnaProg === QnaProg.UNMOUNT || this.props.qnaProg === QnaProg.YESORNO) {
				while(this._selected.length > 0) this._selected.pop();
			}
		}
		if(this.props.focusSeq >= 0 && this.props.focusSeq !== prev.focusSeq) {
			if(this._swiper) {
				let sidx = -1;
				for(let i = 0; i < this._scripts.length; i++) {
					if(this._scripts[i].seq === this.props.focusSeq) {
						sidx = i;
						break;
					}
				}

				if(sidx >= 1) this._swiper.slideTo(sidx - 1);
				else if(sidx >= 0) this._swiper.slideTo(0);
			}
		}
	}
	private _scriptClick = (script: common.IScript, idx: number) => {
		if(this.props.qnaProg !== QnaProg.SELECTING) return;

		const sidx = this._selected.indexOf(idx);
		if(sidx < 0) this._selected.push(idx);
		else this._selected.splice(sidx, 1);
	}

	public render() {
		const { view,  state, actions, viewTrans, qnaProg} = this.props;

		const data = actions.getData();

		return (
			<div className="s_passage" style={view ? undefined : style.HIDE}>
				<div className="passage_page">
					<span>{state.passageidx + 1}/{data.passage.length}</span>
				</div>
				<div className={'page ' + (state.isPlay ? 'swiper-no-swiping' : '')}>
					<SwiperComponent
						ref={this._refSwiper}
						direction="vertical"
						scrollbar={{ el: '.swiper-scrollbar', draggable: true,}}
						observer={true}
						slidesPerView="auto"
						freeMode={true}						
					>
					{this._scripts.map((script, idx) => {
						const sidx = this._selected.indexOf(idx);
						return (
							<div key={idx} className="script">
								<Script 
									idx={idx}
									viewTrans={viewTrans} 
									qnaProg={qnaProg}
									focusSeq={state.focusSeq}
									viewSctiprFocusBG={state.viewSctiprFocusBG}
									selected={sidx >= 0}
									script={script}
									onClick={this._scriptClick}
								/>
							</div>
						);
					})}	
					</SwiperComponent>
				</div>
				<div className={'img_pop' + (this._img_pop_on ? ' on' : '')} />
				<div className={'btn_box' + (qnaProg === QnaProg.YESORNO ? ' on' : '')}>
					<ToggleBtn className="btn_yes" onClick={this._clickYes} on={qnaProg === QnaProg.SELECTING}/>
					<ToggleBtn className="btn_no" onClick={this._clickNo} on={qnaProg === QnaProg.SENDED}/>
				</div>
				<SendUI
					view={(qnaProg === QnaProg.SELECTING || qnaProg === QnaProg.SENDING) && this._selected.length > 0}
					type={'pad'}
					originY={0}
					sended={false}
					onSend={this._onSend}
				/>
			</div>
		);
	}
}
export default SPassage;


