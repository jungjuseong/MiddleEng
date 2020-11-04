import * as React from 'react';
import { observer } from 'mobx-react';

import { IStateCtx, IActionsCtx } from './t_store';
import { IWordData,TypeQuiz } from '../common';

import QuizSound from '../quiz_sound';
import QuizMeaning from '../quiz_meaning';
import QuizSpelling from '../quiz_spelling';
import QuizUsage from '../quiz_usage';
import QuizTeacher from '../../share/QuizTeacher';

interface ITQuiz {
	view: boolean;
	quizProg: TypeQuizProg;
	numOfReturn: number;
	state: IStateCtx;
	actions: IActionsCtx;
}

@observer
class TQuiz extends React.Component<ITQuiz> {
	private _quizs: IWordData[] = [];
	private _qtype: TypeQuiz = '';
	private _qtime: number = 0;

	public componentWillUpdate(next: ITQuiz) {
		if(next.view && !this.props.view) {
			while(this._quizs.length > 0) this._quizs.pop();

			const words = next.actions.getWords();
			let qtime = 60;
			if(next.state.isGroup) {
				const group = next.actions.getGroupInfo();
				for(let i = 0; i < group.questions.length; i++) {
					const q = group.questions[i];
					this._quizs[i] = words[q.qidx];
				}
				qtime = group.qtime;
			} else {
				const single = next.actions.getSingleInfo();
				for(let i = 0; i < single.questions.length; i++) {
					const quiz = single.questions[i];
					this._quizs[i] = words[quiz.qidx];
				}
				qtime = single.qtime;
			}
			this._qtype = next.state.qtype;
			this._qtime = qtime;
		}
	}

	public render() {
		const {view, state, actions, quizProg, numOfReturn} = this.props;

		let ItemComponent;
		if(this._qtype === 'sound') ItemComponent = QuizSound;
		else if(this._qtype === 'meaning') ItemComponent = QuizMeaning;
		else if(this._qtype === 'spelling') ItemComponent = QuizSpelling;
		else if(this._qtype === 'usage') ItemComponent = QuizUsage;

		return (
			<QuizTeacher 
				view={view}
				className="t_quiz"
				quizProg={quizProg}
				numOfReturn={numOfReturn}
				isGroup={state.isGroup}
				qtime={this._qtime}
				numOfGa={state.gas.length}
				numOfNa={state.nas.length}
				hasPreview={state.hasPreview}
				quizs={this._quizs}
				ItemComponent={ItemComponent}
				qtype={this._qtype}
				getSingleInfo={actions.getSingleInfo}
				getGroupInfo={actions.getGroupInfo}
				setQIdx={actions.setQIdx}
				gotoQuizSelect={actions.gotoQuizSelect}
				setNaviView={actions.setNaviView}
				setNaviFnc={actions.setNaviFnc}
				setNavi={actions.setNavi}
				waitResult={actions.waitResult}
			/>
		);
	}
}
export default TQuiz;


