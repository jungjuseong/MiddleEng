import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { Observer, observer } from 'mobx-react';

import { StudentContext, useStudent, IStateCtx, IActionsCtx } from './s_store';
import { observable } from 'mobx';

import { Keyboard, state as keyBoardState } from '@common/component/Keyboard';
import * as kutil from '@common/util/kutil';

import KTextInput from '@common/component/KTextInput';
import { App } from '../../App';
import SendUINew from '../../share/sendui_new';
import * as felsocket from '../../felsocket';
import * as common from '../common';

const enum MYSTATE {
	READY,
	DONE,
	SENDING,
	SENDED,
	COMPLETE,
}

interface ITypingQuiz {
	view: boolean;
	entry: string;
	state: IStateCtx;
	actions: IActionsCtx;
}

@observer
class Comp extends React.Component<ITypingQuiz> {
	@observable private _focusIdx: number = -1;
	@observable private _result: ''|'correct'|'wrong' = '';

	@observable private _view_ox = false;
	@observable private _state = MYSTATE.READY;

	private _inputs: KTextInput[] = [];

	private _results: boolean[] = [];

	private _inputWrong: string[] = [];

	private _stime = 0;

	constructor(props: ITypingQuiz) {
		super(props);
		keyBoardState.state = 'on';
	}
	public componentWillUpdate(next: ITypingQuiz) {
		if(next.entry !== this.props.entry) {
			while(this._inputs.length > 0) this._inputs.pop();
			while(this._results.length > 0) this._results.pop();
			while(this._inputWrong.length > 0) this._inputWrong.pop();
		}
	}	
	public componentDidUpdate(prev: ITypingQuiz) {
		if(this.props.view && !prev.view) {
			keyBoardState.state = 'on';
			keyBoardState.capslock = false;
			keyBoardState.disableDone = true;
			this._view_ox = false;
			this._result = '';
			this._focusIdx = 0;
			this._state = MYSTATE.READY;
			this._stime = 0;
		} else if(!this.props.view && prev.view) {
			keyBoardState.state = 'hide';
			keyBoardState.capslock = false;
			keyBoardState.disableDone = false;
			this._focusIdx = -1;
			this._view_ox = false;
			this._result = '';
			while(this._inputs.length > 0) this._inputs.pop();
		}
	}
	private _onRef = (idx: number, input: KTextInput) => {
		if(!this.props.view) return;
		this._inputs[idx] = input;
	}
	private _onFocus = (idx: number) => {
		if(!this.props.view) return;

		if(this._focusIdx !== idx) this._focusIdx = idx;
	}
	private _onPrev = (idx: number) => {
		if(!this.props.view) return;
		else if(idx <= 0) return;
		const input = this._inputs[idx - 1];
		if(input && input.ipt) {
			const txt = input.ipt.value;
			input.ipt.selectionStart = txt.length;
			input.ipt.selectionEnd = txt.length;
			this._focusIdx = idx - 1;
			input.ipt.focus();
			
		}
	}
	private _onNext = (idx: number) => {
		if(!this.props.view) return;
		else if(idx >= this._inputs.length - 1) return;
		const input = this._inputs[idx + 1];
		if(input && input.ipt) {
			const txt = input.ipt.value;
			input.ipt.selectionStart = 0;
			input.ipt.selectionEnd = 0;
			this._focusIdx = idx + 1;
			input.ipt.focus();
			
		}		
	}
	private _onDone = async (idx: number) => {
		if(!this.props.view) return;
		App.pub_playCorrect();
		keyBoardState.state = 'hide';
		this._state = MYSTATE.DONE;

		/*
		let isComplete = true;
		let isCorrect = true;
		const spell = this.props.entry.split('');

		while(this._results.length > 0) this._results.pop();

		for(let i = 0; i  < this._inputs.length; i++) {
			const char = spell[i];
			const ipt = this._inputs[i];
			const val = (ipt && ipt.ipt) ? ipt.ipt.value : '';
			if(ipt && ipt.ipt) ipt.ipt.value = char;
			
			

			if(isComplete && val.length === 0 && char !== ' ') {
				isComplete = false;
				isCorrect = false;
			}

			this._results[i] = (char === ' ' && val.length === 0)  || val === char;
			if(this._results[i]) this._inputWrong[i] = '';
			else {
				this._inputWrong[i] = val;
				isCorrect = false;
			}
		}

		// console.log('isCorrect', isCorrect, isCorrect, this._inputWrong);

		if(isComplete) {
			this._focusIdx = -1;
			keyBoardState.disableDone = true;

			if(isCorrect) {
				this._view_ox = true;
				this._result = 'correct';
				App.pub_playCorrect();
				keyBoardState.state = 'hide';
			} else {
				this._view_ox = true;
				this._result = 'wrong';
				App.pub_playWrong();
				keyBoardState.state = 'hide';
				*/
				/*  틀렸을 경우 재 시작 
				await kutil.wait(1500);
				this._result = '';
				for(let i = 0; i  < this._inputs.length; i++) {
					const ipt = this._inputs[i];
					if(ipt && ipt.ipt) ipt.ipt.value = '';
				}
				this._focusIdx = 0;
				*/
			/*

			}

			await kutil.wait(1800);
			this._view_ox = false;
		}
		*/
	}
	private _onChange = (idx: number, value: string) => {
		if(this._stime === 0) this._stime = Date.now();

		let isComplete = true;
		const spell = this.props.entry.split('');
		for(let i = 0; i  < this._inputs.length; i++) {
			const char = spell[i];
			const ipt = this._inputs[i];
			const val = (ipt && ipt.ipt) ? ipt.ipt.value : '';
			if(val.length === 0 && char !== ' ') {
				isComplete = false;
				break;
			}
		}
		keyBoardState.disableDone = !isComplete;
	}

	private _onSend = async () => {
		if(!this.props.view) return;
		else if(this._state !== MYSTATE.DONE) return;


		// App.pub_playGoodjob();
		// this.props.actions.startGoodJob();

		// await kutil.wait(2500);

		let isComplete = true;
		let isCorrect = true;
		const spell = this.props.entry.split('');

		for(let i = 0; i  < this._inputs.length; i++) {
			const char = spell[i];
			const ipt = this._inputs[i];
			const val = (ipt && ipt.ipt) ? ipt.ipt.value : '';
			// if(ipt && ipt.ipt) ipt.ipt.value = char;
			
			if(isComplete && val.length === 0 && char !== ' ') {
				isComplete = false;
				isCorrect = false;
			}

			this._results[i] = (char === ' ' && val.length === 0)  || val === char;
			if(this._results[i]) this._inputWrong[i] = '';
			else {
				this._inputWrong[i] = val;
				isCorrect = false;
			}
		}

		if(!isComplete) return;

		App.pub_playGoodjob();
		this.props.actions.startGoodJob();

		await kutil.wait(3000);

		if(isComplete) {
			this._state = MYSTATE.SENDING;
			if(App.student) {
				let user_input = '';
				for(let i = 0; i  < this._inputs.length; i++) {
					const ipt = this._inputs[i];
					user_input += (ipt && ipt.ipt) ? ipt.ipt.value : '';
				}

				const msg: common.ISpellingReturnMsg = {
					msgtype: 'spelling_return',
					id: App.student.id,
					isCorrect,
					stime: this._stime,
					etime: Date.now(),
					word_idx: this.props.actions.getWord().idx,
					user_input,
				};
				felsocket.sendTeacher($SocketType.MSGTOTEACHER, msg);
			}
			this._state = MYSTATE.SENDED;


			for(let i = 0; i  < this._inputs.length; i++) {
				const ipt = this._inputs[i];
				if(ipt && ipt.ipt) ipt.ipt.value = spell[i];
			}
			this._focusIdx = -1;
			keyBoardState.disableDone = true;

			if(isCorrect) {
				this._view_ox = true;
				this._result = 'correct';
				App.pub_playCorrect();
			} else {
				this._view_ox = true;
				this._result = 'wrong';
				App.pub_playWrong();
			}
		}

		await kutil.wait(1800);
		this._view_ox = false;
	}
	
	public render() {
		let spell: string[];
		let style: React.CSSProperties|undefined;
		if(this.props.view) {
			spell = this.props.entry.split('');
		} else {
			spell = [];
			style = {};
			style.zIndex = -1;
			style.visibility = 'hidden';
			style.pointerEvents = 'none';
			style.color = 'rgb(250,0,0)';
		}
		const total = spell.length;
		let cName = 'underline_L';
		if(total > 13) cName = 'underline_XS';
		else if(total > 10) cName = 'underline_S';
		else if(total > 7) cName = 'underline_M';

		return (
			<div className="s_voca_typing" style={style}>
				<div className={'typing_box ' + keyBoardState.state}>	
					{spell.map((char, idx) => {
						let classWrong = '';
						if(this._result === 'wrong' && idx < this._results.length) {
							if(!this._results[idx]) classWrong = ' wrong';
						}

						return (
							<KTextInput 
								key={idx}
								tabIndex={idx}
								className={cName + classWrong} 
								on={idx === this._focusIdx}
								maxLength={1}
								disabled={this._result !== ''}
								onRef={this._onRef}
								onFocus={this._onFocus}
								onPrev={this._onPrev}
								onNext={this._onNext}
								onEnter={this._onNext}
								onDone={this._onDone}
								onChange={this._onChange}
							/>
						);
					})}
					<div className="answer"  hidden={this._result !== 'wrong'}>
						{this._inputWrong.map((char, idx) => {
							let classWrong = '';
							if(this._result === 'wrong' && idx < this._results.length) {
								if(!this._results[idx]) classWrong = ' wrong';
							}
							return (
								<span key={idx} className={cName + classWrong}>{char}</span>
							);
						})}
					</div>
					<div className={'icon_answer correct' + (this._view_ox && this._result === 'correct' ? ' on' : '')}/>
					<div className={'icon_answer wrong' + (this._view_ox && this._result === 'wrong' ? ' on' : '')}/>						
				</div>
				
				<Keyboard/>

				<SendUINew 
					type="pad"
					view={this._state === MYSTATE.DONE}
					sended={this._state === MYSTATE.SENDED}
					originY={0}
					onSend={this._onSend}
				/>
			</div>
		);
	}
}

const VocaTyping = useStudent((store: StudentContext) => (
	<Observer>{() => {
		const view = store.state.viewDiv === 'content' && store.state.prog === 'spelling';
		let entry = '';
		if(view) {
			entry = store.actions.getWord().entry;	
		}
		return (
			<Comp 
				view={view}
				entry={entry}
				actions={store.actions} 
				state={store.state}
			/>
		);
	}}</Observer>
));

export default VocaTyping;


