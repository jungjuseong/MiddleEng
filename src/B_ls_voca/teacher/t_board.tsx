import * as React from 'react';

import { observer } from 'mobx-react';
import { IStateCtx, IActionsCtx } from './t_store';
import TeamSpindle from '../../share/TeamSpindle';
import * as kutil from '@common/util/kutil';

interface IBoard {
	view: boolean;
	numOfReturn: number; 
	state: IStateCtx;
	actions: IActionsCtx;
}

@observer
class Board extends React.Component<IBoard> {

	private _getAudio = (idx: number) => {
		const word = this.props.actions.getWords()[idx];
		if(word) return word.audio;
		else return '';
	}

	private _gotoResult = async () => {
		this.props.actions.prepareGroupResult();
		this.props.actions.setQuizProg('wait-result');
		this.props.state.prog = 'quiz';
		await kutil.wait(100);
		this.props.actions.setQuizProg('result');
	}

	public render() {
		const { view, numOfReturn, state, actions } = this.props;

		return (
			<TeamSpindle
				view={view}
				numOfReturn={numOfReturn}
				numOfGa={state.gas.length}
				numOfNa={state.nas.length}
				hasAudio={state.qtype !== 'usage'}
				getAudio={this._getAudio}
				gotoResult={this._gotoResult}

				getGroupInfo={actions.getGroupInfo}
				setQIdx={actions.setQIdx}
				gotoQuizSelect={actions.gotoQuizSelect}

				setNaviView={actions.setNaviView}
				setNaviFnc={actions.setNaviFnc}
				setNavi={actions.setNavi}
			/>
		);
	}
}

export default Board;