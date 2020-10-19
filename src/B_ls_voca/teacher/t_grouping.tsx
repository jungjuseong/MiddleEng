import * as React from 'react';
import * as ReactDOM from 'react-dom';

import { observable, action } from 'mobx';
import { observer } from 'mobx-react';
import * as _ from 'lodash';

import { App } from '../../App';
import { IStateCtx, IActionsCtx } from './t_store';
import TeamGrouping from '../../share/TeamGrouping';


interface IGroup {
	view: boolean;
	state: IStateCtx;
	actions: IActionsCtx;
}
@observer
class Grouping extends React.Component<IGroup> {


	public componentDidUpdate(prev: IGroup) {
		if(this.props.view && !prev.view) {
			this.props.actions.setNaviView(false);
			this.props.actions.setNavi(false, false);
		}
	}
	private _onStart = () => {
		App.pub_playBtnPage();
		this.props.state.prog = 'timer';
	}
	private _onBack = () => {
		App.pub_stop();
		this.props.actions.gotoQuizSelect();		
	}
	public render() {
		const {view, state} = this.props;
		/*
	view: boolean;
	gas: IStudent[];
	nas: IStudent[];
	onStart: () => void;
	onBack: () => void;
		*/
		return (
			<div className="t_grouping">
				<TeamGrouping
					view={view}
					gas={state.gas}
					nas={state.nas}
					onStart={this._onStart}
					onBack={this._onBack}
				/>
			</div>
		);
	}
}

export default Grouping;