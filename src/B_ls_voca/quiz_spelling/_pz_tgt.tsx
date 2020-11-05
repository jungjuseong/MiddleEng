import * as React from 'react';

import PzSrc from './_pz_src';
import { IPzTgt } from '../common';

class PzTgt extends React.Component<IPzTgt> {
	public src: PzSrc|null = null;
	private _el: HTMLElement|null = null;
	public get el() {return this._el;}
	public reset() {
		this.src = null;
	}
	private _onRef = (el: HTMLElement) => {
		if(this._el || !el) return;
		this._el = el;
	}

	public componentWillMount() {
		this.props.onMountTgt(this, this.props.idx);
	}
	public render() {
		const {idx, char} = this.props;
		let result: ''|'correct'|'wrong';
		if(!this.props.isTeacher && this.props.quizProg === 'result') {
			result = (this.src && this.props.char === this.src.props.char) ? 'correct' : 'wrong';
		} else result = '';
		return <span className={'pz-tgt ' + result} ref={this._onRef}><span>{char}</span></span>;	
	}
}

export default PzTgt;