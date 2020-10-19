import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { observable, action } from 'mobx';
import { observer } from 'mobx-react';
import * as _ from 'lodash';

import './goodjob.scss';

interface IGoodJob {
	view: boolean;
	delay?: number;
	onComplete: () => void;
}

@observer
export class GoodJob extends React.Component<IGoodJob> {
	private f_1: () => void;
	private f_2: () => void;

	@observable private m_off = false;
	constructor(props: IGoodJob) {
		super(props);

		let delay = props.delay;
		if(!delay) delay = 800;

		this.f_1 = _.debounce(() => {
			if(this.props.view && this.m_off) {
				this.props.onComplete();
			}
			this.m_off = false;
		}, 10);

		this.f_2 = _.debounce(() => {
			if(this.props.view) {
				this.m_off = true;
				this.f_1();
			} else {
				this.m_off = false;
			}
		}, delay);		
	}

	public componentDidUpdate(prevProps: IGoodJob) {
		if( this.props.view && !prevProps.view) {
			this.m_off = false;
			this.f_2();
		} else if(!this.props.view && prevProps.view ) {
			this.m_off = false;
		}
	}
	public render() {
		const arr: string[] = [];
		arr.push('common_goodjob');
		if(this.props.view && this.m_off) arr.push('off');
		else if(this.props.view) arr.push('on');
		return (
			<div className={arr.join(' ')}/>
		);
	}
}