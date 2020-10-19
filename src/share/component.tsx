import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { observable, action } from 'mobx';
import { observer } from 'mobx-react';
import * as _ from 'lodash';

interface ITextNavi {
	idx: number;
	className: string;
	onClick?: (ev: React.MouseEvent<HTMLElement>, idx: number) => void;
}

export class TextNavi extends React.Component<ITextNavi> {
	private _onClick = (ev: React.MouseEvent<HTMLElement>) => {
		if(this.props.onClick) this.props.onClick(ev, this.props.idx);
	}
	public render() {
		return(
			<span className={this.props.className} onClick={this._onClick}>{this.props.idx + 1}</span>
		);
	}
}

interface ITextNaviUser extends ITextNavi {
	viewIcon: boolean;
	isCorrect: boolean;
}

export class TextNaviUser extends React.Component<ITextNaviUser> {
	private _onClick = (ev: React.MouseEvent<HTMLElement>) => {
		if(this.props.onClick) this.props.onClick(ev, this.props.idx);
	}
	public render() {
		const arr: string[] = [this.props.className];
		if(this.props.viewIcon) {
			if(this.props.isCorrect) arr.push('correct');
			else arr.push('wrong');
		} 
		return(
			<span className={arr.join(' ')} onClick={this._onClick}>{this.props.idx + 1}</span>
		);
	}
}
