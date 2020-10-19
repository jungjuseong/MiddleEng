import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { DraggableCore, DraggableData, DraggableEvent } from 'react-draggable';

interface IBtnSwitch {
	on: boolean;
	className: string;
	onChange: () => void;
}
export class BtnSwitch extends React.Component<IBtnSwitch> {
	private m_s = 0;
	private m_dragging = false;
	private _start = (evt: DraggableEvent, data: DraggableData) => {
		this.m_s = data.x;
		this.m_dragging = true;
	}
	private _drag = (evt: DraggableEvent, data: DraggableData) => {
		if(!this.m_dragging) return;
	}
	private _stop = (evt: DraggableEvent, data: DraggableData) => {
		if(!this.m_dragging) return;
		this.m_dragging = false;
		if( this.props.on && data.x > this.m_s - 5) {
			this.props.onChange();
		} else if( !this.props.on && data.x < this.m_s + 5) {
			this.props.onChange();
		}
	}

	public render() {
		const text = this.props.on ? 'ON' : 'OFF';
		return (
			<DraggableCore
				onDrag={this._drag}
				onStart={this._start}
				onStop={this._stop}
			>
			<div className={this.props.className + ' ' + text}><span/>{text}</div>
			</DraggableCore>
		);
	}

}