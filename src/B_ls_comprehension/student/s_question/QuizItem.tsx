import * as React from 'react';

import { QPROG } from '../s_store';
import * as common from '../../common';
import WrapTextNew from '@common/component/WrapTextNew';
import QuizChoice from './QuizChoice';

interface IQuizItem {
	view: boolean;
	idx: number;
	choice: number;
	quiz: common.IQuiz;
	questionProg: QPROG;
	onChoice: (idx: number, choice: number) => void;
}

class QuizItem extends React.Component<IQuizItem> {
	private _onChoice = (choice: number) => {
		this.props.onChoice(this.props.idx, choice);
	}
	public render() {
		const {view, idx, choice, quiz, questionProg} = this.props;
		const answer = quiz.answer;
		return (
			<>
				<div className="quiz"><div>
					<WrapTextNew 
						view={view}
					>
						{quiz.app_question}
					</WrapTextNew>
				</div></div>
				<div className="choice">
					<QuizChoice view={view} choice={1} answer={answer} on={choice === 1} questionProg={questionProg} onClick={this._onChoice}>{quiz.choice_1}</QuizChoice>
					<QuizChoice view={view} choice={2} answer={answer} on={choice === 2} questionProg={questionProg} onClick={this._onChoice}>{quiz.choice_2}</QuizChoice>
					<QuizChoice view={view} choice={3} answer={answer} on={choice === 3} questionProg={questionProg} onClick={this._onChoice}>{quiz.choice_3}</QuizChoice>
				</div>
			</>		
		);
	}
}

export default QuizItem;