import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { observable, action } from 'mobx';
import { observer } from 'mobx-react';
import * as _ from 'lodash';

interface INewDirection {
	className: string;
	view: boolean;
	on: boolean;
	isTeacher: boolean;
	onEnd?: () => void;
	onEndStart?: () => void;
	category?: string;
	title?: string;
}


@observer
class NewDirection extends React.Component<INewDirection> {
	@observable private m_on = false;

	constructor(props: INewDirection) {
		super(props);

		this.m_on = props.view && props.on;
	}
	private _onClick = () => {
		if(this.props.isTeacher) this._off();
	}
	@action private _off = () => {
		if(this.props.view && this.m_on) {
			this.m_on = false;
			if(this.props.onEndStart) this.props.onEndStart();
			_.delay(() => {
				if(this.props.view && !this.m_on) {
					// console.log('33333', this.props.onEnd);
					if(this.props.onEnd) this.props.onEnd();
				}
			}, 500);
		}
	}


	public componentDidUpdate(prev: INewDirection) {
		if(this.props.view) {
			if(!prev.view) {
				this.m_on = this.props.on;
			} else if(this.props.on && !prev.on) this.m_on = true;
			else if (!this.props.on && prev.on) {
				this._off();
			}
		} else this.m_on = false;
	}
	public render() {
		const arr: string[] = [];
		arr.push(this.props.className);
		if(this.props.view) {
			if(this.m_on) arr.push('on');
		} else {
			arr.push('hide');
		}
		return (
			<div className={arr.join(' ')} onClick={this._onClick}>
				{this.props.children}
				<div className="direction"/>
			</div>
		);
	}
}

export default NewDirection;