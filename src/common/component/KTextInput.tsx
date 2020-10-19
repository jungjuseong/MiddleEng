import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { observable } from 'mobx';
import { observer } from 'mobx-react';

import * as _ from 'lodash';
import { hot } from 'react-hot-loader';

import * as keyboard from './Keyboard';
import * as kutil from '@common/util/kutil';


interface IKTexInput {
	on: boolean;
	tabIndex: number;
	disabled?: boolean;
	value?: string;
	className?: string;
	maxLength?: number;
	onRef?: (tabIndex: number, inputs: KTextInput) => void;
	onChange?: (tabIndex: number, text: string) => void;
	onPrev?: (tabIndex: number) => void;
	onNext?: (tabIndex: number) => void;
	onEnter?: (tabIndex: number) => void;
	onDone?: (tabIndex: number) => void;
	onFocus?: (tabIndex: number) => void;
}

@observer
class KTextInput extends React.Component<IKTexInput> {
	private _ipt: HTMLInputElement|null = null;
	public get ipt() {return this._ipt;}

	public componentWillMount() {
		if(this.props.onRef) this.props.onRef(this.props.tabIndex, this);
	}
	private _onRef = (el: HTMLInputElement|null) => {
		if(this._ipt || !el) return;
		this._ipt = el;
		if(this.props.on && document.activeElement !== this._ipt) {
			this._ipt.focus();
		}
		if(this.props.onRef) this.props.onRef(this.props.tabIndex, this);
	}
	private _onSelect = () => {
		// console.log('_onSelect');
		if(this._ipt) this._ipt.selectionStart = this._ipt.selectionEnd;
		// keyboard.setInputs(this._ipt, this._change);
	}
	private _onKeyDown = (evt: React.KeyboardEvent) => {
		evt.preventDefault();
	}
	private _onKeyUp = (evt: React.KeyboardEvent) => {
		evt.preventDefault();
	}
	private _onKeyPress = (evt: React.KeyboardEvent) => {
		evt.preventDefault();
	}
	private _onChange = (value: string) => {
		if(this.props.onChange) this.props.onChange(this.props.tabIndex, value);
	}
	private _onPrev = () => {
		if(this.props.onPrev) this.props.onPrev(this.props.tabIndex);
	}
	private _onNext = () => {
		if(this.props.onNext) this.props.onNext(this.props.tabIndex);
	}
	private _onEnter = () => {
		if(this.props.onEnter) this.props.onEnter(this.props.tabIndex);
	}
	private _onDone = () => {
		if(this.props.onDone) this.props.onDone(this.props.tabIndex);
	}
	private _onFocus = (evt: React.FocusEvent) => {
		// console.log('_onFocus');
		keyboard.setInputs(this._ipt, this.props.maxLength);
		keyboard.setCallback(
			this._onChange,
			this._onPrev,
			this._onNext,
			this._onDone,
			this._onEnter
		);
		if(this.props.onFocus) this.props.onFocus(this.props.tabIndex);
	}
	private async _focus() {
		await kutil.wait(10);
		if(this.props.on && this._ipt) {
			if(document.activeElement !== this._ipt) this._ipt.focus();
		}
	}
	private _onBlur = (evt: React.FocusEvent) => {
		this._focus();
	}

	public componentDidUpdate(prev: IKTexInput) {
		if(this.props.on && !prev.on) {
			if(this._ipt && document.activeElement !== this._ipt) this._ipt.focus();
		}
		if(this.props.value && this.props.value !== prev.value) {
			if(this._ipt) this._ipt.value = this.props.value;
		}
	}
	public render() {
		const {on, className, maxLength, tabIndex, disabled} = this.props; 
		// const arr: string[] = ['k-text-input'];
		// if(className) arr.push(className);
		
		return (
			<input 
				ref={this._onRef}
				type="text"
				className={className}
				tabIndex={tabIndex}
				maxLength={maxLength}
				size={maxLength}
				disabled={disabled}
				autoCapitalize="off"
				autoComplete="off"
				autoCorrect="off"
				unselectable="on"
				autoFocus={false}
				spellCheck={false}

				onFocus={this._onFocus}
				onBlur={this._onBlur}
				onSelect={this._onSelect}
				onKeyDown={this._onKeyDown}
				onKeyUp={this._onKeyUp}
				onKeyPress={this._onKeyPress}
			/>
		);

	}

}

export default KTextInput;