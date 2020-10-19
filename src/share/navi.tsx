import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { observable, action } from 'mobx';
import { observer } from 'mobx-react';

import * as _ from 'lodash';

import { ToggleBtn } from '@common/component/button';

interface INavi {
	view: boolean;
	enableLeft: boolean;
	enableRight: boolean;
	onLeftClick?: (evt: React.MouseEvent<HTMLElement>) => void;
	onRightClick?: (evt: React.MouseEvent<HTMLElement>) => void;
}

@observer
export class Navi extends React.Component<INavi> {
	@observable private m_on = false;
	private m_isStarted = false;
	// private _off: (() => void) & _.Cancelable;  // 상시 출력

	constructor(props: INavi) {
		super(props);
		/* 	19-02-11 190125 검수 수정  p.12    상시 출력
		this._off = _.debounce(() => {
			this.m_on = false;
		}, 2000);
		*/
	}
	private _onClick = (evt: React.MouseEvent<HTMLElement>) => {
		this.m_on = true;
		// this._off();  // 상시 출력
	}

	public componentDidUpdate(prev: INavi) {
		if(!this.m_isStarted && this.props.view && !prev.view) {
			this.m_isStarted = true;
			this.m_on = true;
			// this._off();	// 상시 출력		
		}
	}

	public render() {
		const classes = this.m_on ? undefined : 'off';
		const style: React.CSSProperties = {
			visibility: this.props.view ? 'visible' : 'hidden',
		};
		return (
			<>
		<div id="common_navi_left" className={classes} style={style}><div><div onClick={this._onClick}>
			<ToggleBtn 
				className="right" 
				disabled={!this.props.enableRight}	
				onClick={this.props.onRightClick}
			/>
			<ToggleBtn 
				className="left" 
				disabled={!this.props.enableLeft}
				onClick={this.props.onLeftClick}	
			/>	
		</div></div></div>
		<div id="common_navi_right" className={classes} style={style}><div><div onClick={this._onClick}>
			<ToggleBtn 
				className="right" 
				disabled={!this.props.enableRight}
				onClick={this.props.onRightClick}	
			/>
			<ToggleBtn 
				className="left" 
				disabled={!this.props.enableLeft}
				onClick={this.props.onLeftClick}	
			/>
		</div></div></div>
			</>
		);
	}
}