import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { ToggleBtn } from '@common/component/button';
import { App } from '../App';

interface IQuizMCBtn {
	className: string;
	num: number;
	on: boolean;
	disabled: boolean;
	onClick: (num: number) => void;
}
export default class QuizMCBtn extends React.Component<IQuizMCBtn> {
	private _onClick = () => {
		if(this.props.disabled) return;
		App.pub_playBtnTab();
		this.props.onClick(this.props.num);
	}
	public render() {
		return <ToggleBtn className={this.props.className + ' btn-mc-' + this.props.num} on={this.props.on} onClick={this._onClick} disabled={this.props.disabled}>{this.props.children}</ToggleBtn>;
	}
}