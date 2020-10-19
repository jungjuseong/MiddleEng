import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { observable, IObservableObject } from 'mobx';
import { observer } from 'mobx-react';
import * as _ from 'lodash';
import ReactResizeDetector from 'react-resize-detector';

import * as StrUtil from '../util/StrUtil';
import * as kutil from '../util/kutil';
import { ToggleBtn } from './button';
import './Keyboard.scss';

const _CAPSLOCK = 20;
const _TAB = 9;
const _BACK = 8;
const _ENTER = 13;
const _DONE = 0;

const _0 = 48;
const _1 = 49;
const _2 = 50;
const _3 = 51;
const _4 = 52;
const _5 = 53;
const _6 = 54;
const _7 = 55;
const _8 = 56;
const _9 = 57;

const _A = 65;
const _B = 66;
const _C = 67;
const _D = 68;
const _E = 69;
const _F = 70;
const _G = 71;
const _H = 72;
const _I = 73;
const _J = 74;
const _K = 75;
const _L = 76;
const _M = 77;
const _N = 78;
const _O = 79;
const _P = 80;
const _Q = 81;
const _R = 82;
const _S = 83;
const _T = 84;
const _U = 85;
const _V = 86;
const _W = 87;
const _X = 88;
const _Y = 89;
const _Z = 90;

const _COMMA = 188;
const _SINGLEQUOT = 222;
const _STOP = 190;
const _SPACE = 32;

let _pid = -1;
let _initCnt = 0;
let _area: HTMLTextAreaElement|null = null;
let _ipt: HTMLInputElement|null = null;
let _editDiv: IContentEditable|null = null;

let _code = -1;
let _maxLength = -1;
let _change: ((value: string) => void)|null = null;
let _next: (() => void)|null = null;
let _prev: (() => void)|null = null;
let _done: (() => void)|null = null;
let _enter: (() => void)|null = null;

interface IContentEditable {
	keyDown: (keyCode: number, char: string) => void;
	done: () => void;
}
function instanceOfContentEditable(object: any): object is IContentEditable {
    return 'keyDown' in object && 'done' in object;
}


class State {
	@observable public state: 'hide'|'off'|'on' = 'hide';
	@observable public capslock = false;
	@observable public disableDone = false;
}

const _state = new State();
const _throttle = _.throttle(() => {
	if(_code < 0) return;
	if(_editDiv) {
		if(_code === _DONE) {
			_editDiv.done();
		} else {
			const chr: string = _getChar(_code, _state.capslock);
			_editDiv.keyDown(_code, chr);
		}
	} else if(_area) {
		if(document.activeElement !== _area) _area.focus();
		if(_code === _DONE) {
			if(_done) _done();
			else if(_state.state === 'on') _state.state = 'off';
			return;
		} else if( _code === _ENTER) {
			if(_enter) {
				_enter();
				return;
			}
		}
		const selStart = StrUtil.nteInt(_area.selectionStart, -1);
		const selEnd = StrUtil.nteInt(_area.selectionEnd, -1);
		if (selStart < 0 || selEnd < 0) return;

		const chr: string = _getChar(_code, _state.capslock);
		const text = _area.value;
		let prev = text.substring(0, selStart);
		let next = text.substring(selEnd);

		if(_code === _BACK) {
			if (selStart > 0) prev = prev.substring(0, prev.length - 1);
		}

		const newValue = prev + chr + next;

		_area.value = newValue;

		const lenChr = (prev + chr).length;
		_area.setSelectionRange(lenChr, lenChr);
		if(_change) _change(newValue);
	} else if(_ipt) {
		
		if(document.activeElement !== _ipt) _ipt.focus();
		const selStart = StrUtil.nteInt(_ipt.selectionStart, -1);
		const selEnd = StrUtil.nteInt(_ipt.selectionEnd, -1);
		if (selStart < 0 || selEnd < 0 || _code < 0) return;

		const text = _ipt.value;
		const prevLen = text.length;

		const chr: string = _getChar(_code, _state.capslock);
		if(_code === _DONE) {
			if(_done) _done();
			return;
		} else if(_code === _ENTER) {
			if(_enter) _enter();
			return;
		} else if(_code === _TAB) {
			if(_next) _next();
			return;
		} else if(_code === _BACK) {
			if(selStart === 0 && selEnd === 0) {
				if(_prev) _prev();
				return;				
			} 
		} else if(_maxLength > 0) {
			if(prevLen > _maxLength) {
				_ipt.value = text.substring(0, _maxLength);
				_ipt.selectionStart = _maxLength;
				_ipt.selectionEnd = _maxLength;
				return;	
			} else if(prevLen === _maxLength && selStart === _maxLength && selEnd === _maxLength) {
				if(_next) _next();
				return;	
			}
		}
		let prev = text.substring(0, selStart);
		let next = text.substring(selEnd);

		let newValue;
		let lenChr = (prev + chr).length;
		if(_code === _BACK) {
			if (selStart > 0 && selStart === selEnd) prev = prev.substring(0, prev.length - 1);

			newValue = prev + next;
			lenChr = prev.length;

			_ipt.value = newValue;
			_ipt.selectionStart = lenChr;
			_ipt.selectionEnd = lenChr;
			if(_change) _change(newValue);

		} else {
			newValue = prev + chr + next;
			let newLen = newValue.length;
			if(_maxLength > 0 && newLen > _maxLength) {
				newValue = newValue.substring(0, _maxLength);
			}
			newLen = newValue.length;
			lenChr = (prev + chr).length;

			if(lenChr > newLen) {
				lenChr = newLen;
			}

			_ipt.value = newValue;

			_ipt.selectionStart = lenChr;
			_ipt.selectionEnd = lenChr;
			if(_change) _change(newValue);

			if(_maxLength > 0 && lenChr >= newLen) {
				if(_next) _next();
			}
		}
		
		
		

	}
}, 60);

const _interval = (f: number) => {
	if(_code < 0) {
		_throttle.cancel();
		return;
	}
	if(_initCnt > 30) _throttle();
	_initCnt++;
	_pid = window.requestAnimationFrame(_interval);
};

function _getChar(code: number, capslock: boolean): string {
	let chr;
	if(code === _SPACE) return ' ';
	else if(code === _TAB) return '\t';
	else if(code === _ENTER) return '\n';
	else if(code === _BACK) return '';
	else if (code === _COMMA) {
		return capslock ?  '-' : ',';
	} else if (code === _SINGLEQUOT) {
		return capslock ?  '\"' : '\'';
	} else if (code === _STOP) {
		return capslock ?  '?' : '.';
	} else if (code >= _A && code <= _Z) {
		chr = String.fromCharCode(code);
		return capslock ?  chr : chr.toLowerCase();
	} else {
		if(capslock) {
			if (code === _0) return ')';
			else if (code === _1) return '!';
			else if (code === _2) return '@';
			else if (code === _3) return '#';
			else if (code === _4) return '$';
			else if (code === _5) return '%';
			else if (code === _6) return '^';
			else if (code === _7) return '&';
			else if (code === _8) return '*';
			else if (code === _9) return '(';
			else return '';
		} else return String.fromCharCode(code);
	}		
}
function setCallback(
	change: ((value: string) => void)|null = null,
	prev: (() => void)|null = null,
	next: (() => void)|null = null,
	done: (() => void)|null = null,
	enter: (() => void)|null = null,
) {
	_change = change;
	_prev = prev;
	_next = next;
	_done = done;
	_enter = enter;
}
function setInputs(el: HTMLElement|IContentEditable|null, maxLength: number = 0) {
	if(el && instanceOfContentEditable(el) ) {
		_editDiv = el;
		_ipt = null;
		_area = null;
	} else if(el instanceof HTMLTextAreaElement) {
		_area = el;
		_ipt = null;
		_editDiv = null;
	} else if(el instanceof HTMLInputElement) {
		_ipt = el;
		_area = null;
		_editDiv = null;
	} else {
		_ipt = null;
		_area = null;
		_editDiv = null;
		_code = -1;
	}
	_maxLength = maxLength;
}

interface IKey {
	className: string;
	keyCode: number;
	on?: boolean;
}

class Key extends React.Component<IKey> {
	constructor(props: IKey) {
		super(props);
	}

	private _keyDown = () => {
		if(this.props.keyCode === _CAPSLOCK) {
			_state.capslock = !_state.capslock;
			return;
		}
		if(_pid >= 0) {
			window.cancelAnimationFrame(_pid);
			_pid = -1;
		}
		_throttle.cancel();

		_code = this.props.keyCode;
		_throttle();
		_initCnt = 0;
		// await kutil.wait(500);
		_pid = window.requestAnimationFrame(_interval);
	}
	private _keyUp = () => {
		_initCnt = 0;
		if(_pid >= 0) {
			window.cancelAnimationFrame(_pid);
			_pid = -1;
		}
		_throttle.cancel();
		_code = -1;
	}
	private _leave = () => {
		_initCnt = 0;
		if(_pid >= 0) {
			window.cancelAnimationFrame(_pid);
			_pid = -1;
		}
		_throttle.cancel();
		_code = -1;
	}

	public render() {
		return (
			<ToggleBtn 
				className={this.props.className}
				onMouseDown={this._keyDown}
				onMouseUp={this._keyUp}
				onMouseLeave={this._leave}
				disableCapture={true}
				on={this.props.on}
			>
				{this.props.children}
			</ToggleBtn>
		);
	}
}

@observer
class Keyboard extends React.Component<{}> {

	/*
	public componentDidUpdate(prev: IKeyboard) {
		if(this.props.state !== prev.state) {
			if(this.props.state !== 'on') {
				_code = -1;
				if(this.props.state === 'hide') _state.capslock = false;
			}
		}
	}
	*/
	private _on = () => {
		if(_state.state === 'off') _state.state = 'on';
	}
	private _off = () => {
		if(_state.state === 'on') _state.state = 'off';
	}

	public render() {
		const {state, capslock, disableDone} = _state;
		return (
			
	<div className={'keyboard-box ' + state + (capslock ? ' uppercase' : '')} >
		
		<div>
			<Key className="s" keyCode={_1}>{_getChar(_1, capslock)}</Key>
			<Key className="s" keyCode={_2}>{_getChar(_2, capslock)}</Key>
			<Key className="s" keyCode={_3}>{_getChar(_3, capslock)}</Key>
			<Key className="s" keyCode={_4}>{_getChar(_4, capslock)}</Key>
			<Key className="s" keyCode={_5}>{_getChar(_5, capslock)}</Key>
			<Key className="s" keyCode={_6}>{_getChar(_6, capslock)}</Key>
			<Key className="s" keyCode={_7}>{_getChar(_7, capslock)}</Key>
			<Key className="s" keyCode={_8}>{_getChar(_8, capslock)}</Key>
			<Key className="s" keyCode={_9}>{_getChar(_9, capslock)}</Key>
			<Key className="s" keyCode={_0}>{_getChar(_0, capslock)}</Key>
			<Key className="s" keyCode={_COMMA}>{_getChar(_COMMA, capslock)}</Key>
			<Key className="s" keyCode={_SINGLEQUOT}>{_getChar(_SINGLEQUOT, capslock)}</Key>
			<Key className="s" keyCode={_STOP}>{_getChar(_STOP, capslock)}</Key>
			<Key className="s key_back" keyCode={_BACK}/>
	</div>
		<div>
			<Key className="m alpha" keyCode={_Q}>{_getChar(_Q, capslock)}</Key>
			<Key className="m alpha" keyCode={_W}>{_getChar(_W, capslock)}</Key>
			<Key className="m alpha" keyCode={_E}>{_getChar(_E, capslock)}</Key>
			<Key className="m alpha" keyCode={_R}>{_getChar(_R, capslock)}</Key>
			<Key className="m alpha" keyCode={_T}>{_getChar(_T, capslock)}</Key>
			<Key className="m alpha" keyCode={_Y}>{_getChar(_Y, capslock)}</Key>
			<Key className="m alpha" keyCode={_U}>{_getChar(_U, capslock)}</Key>
			<Key className="m alpha" keyCode={_I}>{_getChar(_I, capslock)}</Key>
			<Key className="m alpha" keyCode={_O}>{_getChar(_O, capslock)}</Key>
			<Key className="m alpha" keyCode={_P}>{_getChar(_P, capslock)}</Key>
			<Key className="b key_shift" on={_state.capslock} keyCode={_CAPSLOCK} />
	</div>
		<div>
			<Key className="m alpha" keyCode={_A}>{_getChar(_A, capslock)}</Key>
			<Key className="m alpha" keyCode={_S}>{_getChar(_S, capslock)}</Key>
			<Key className="m alpha" keyCode={_D}>{_getChar(_D, capslock)}</Key>
			<Key className="m alpha" keyCode={_F}>{_getChar(_F, capslock)}</Key>
			<Key className="m alpha" keyCode={_G}>{_getChar(_G, capslock)}</Key>
			<Key className="m alpha" keyCode={_H}>{_getChar(_H, capslock)}</Key>
			<Key className="m alpha" keyCode={_J}>{_getChar(_J, capslock)}</Key>
			<Key className="m alpha" keyCode={_K}>{_getChar(_K, capslock)}</Key>
			<Key className="m alpha" keyCode={_L}>{_getChar(_L, capslock)}</Key>
			<Key className="b key_enter" keyCode={_ENTER} />
	</div>
		<div>
		<Key className="m alpha" keyCode={_Z}>{_getChar(_Z, capslock)}</Key>
		<Key className="m alpha" keyCode={_X}>{_getChar(_X, capslock)}</Key>
		<Key className="m alpha" keyCode={_C}>{_getChar(_C, capslock)}</Key>
		<Key className="m alpha" keyCode={_V}>{_getChar(_V, capslock)}</Key>
		<Key className="m alpha" keyCode={_B}>{_getChar(_B, capslock)}</Key>
		<Key className="m alpha" keyCode={_N}>{_getChar(_N, capslock)}</Key>
		<Key className="m alpha" keyCode={_M}>{_getChar(_M, capslock)}</Key>
		<Key className="b key_space" keyCode={_SPACE} />
		<Key className={'b done' + (disableDone ? ' dis' : '')} keyCode={_DONE} />
	</div>
		<ToggleBtn className="key_hide" onClick={this._off}/>
		<ToggleBtn className="key_view" onClick={this._on}/>
	</div>
		);
	}
}

export { Keyboard, setInputs, IContentEditable, setCallback, _state as state };