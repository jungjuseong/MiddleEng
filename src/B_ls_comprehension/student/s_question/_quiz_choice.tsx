import * as React from 'react';

import { QPROG } from '../s_store';
import WrapTextNew from '@common/component/WrapTextNew';
import QuizMCBtn from '../../../share/QuizMCBtn';

interface IQuizChoice {
	view: boolean;
	choice: number;
	answer: number;
	on: boolean;
	questionProg: QPROG;
	onClick: (choice: number) => void;
}

class QuizChoice extends React.Component<IQuizChoice> {
	private _click = () => {
		this.props.onClick(this.props.choice);
	}
	public render() {
		const { choice, on, questionProg, answer } = this.props;
		let isOn = on;
		const arr: string[] = ['btn_choice'];
		if(questionProg === QPROG.COMPLETE || questionProg === QPROG.READYA) {
			if(choice === answer) arr.push('correct');
			else if(on) arr.push('wrong');

			isOn = false;
		}
		return (
			<QuizMCBtn 
				className={arr.join(' ')} 
				num={choice} 
				on={isOn} 
				onClick={this._click} 
				disabled={questionProg !== QPROG.ON}
			>
				<WrapTextNew view={this.props.view} maxLineNum={1} minSize={38} maxSize={44} lineHeight={120} textAlign="left">
					{this.props.children}
				</WrapTextNew>
			</QuizMCBtn>

		);
	}
}

export default QuizChoice;


