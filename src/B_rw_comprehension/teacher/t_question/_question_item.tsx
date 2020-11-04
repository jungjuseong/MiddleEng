import * as React from 'react';
import * as _ from 'lodash';
import { observer } from 'mobx-react';

import { App } from '../../../App';
import * as felsocket from '../../../felsocket';
import * as common from '../../common';

import { CorrectBar } from '../../../share/Progress_bar';
import * as style from '../../../share/style';

import WrapTextNew from '@common/component/WrapTextNew';
import QuizMCBtn from '../../../share/QuizMCBtn';

interface IRet { 
	c1: string[];
	c2: string[];
	c3: string[];
	c4: string[];
	percent: number;
}

interface IQuestionItem {
	view: boolean;
	idx: number;
	ret: IRet;
	viewAnswer: boolean;
	question: common.IQuestion;
	selected: number;
	onClick: (idx: number, selected: number) => void;
}

@observer
class QuestionItem extends React.Component<IQuestionItem> {
	constructor(props: IQuestionItem) {
		super(props);
	}

	private _clickReturn = (users: string[]) => {
		App.pub_playBtnTab();
		felsocket.startStudentReportProcess($ReportType.JOIN, users);	
	}
	private _onClick = (selected: number) => {
		if(this.props.viewAnswer) return;
		this.props.onClick(this.props.idx, selected);
	}

	private _onQuestion = () => {
		App.pub_play(App.data_url + this.props.question.audio, (isEnded: boolean) => {
			//
		});
	}

	public componentDidUpdate(prev: IQuestionItem) {
		if(!this.props.view && prev.view) {
			App.pub_stop();
		}
	}

	public render() {
		const {view, idx, question, ret, viewAnswer, selected} = this.props;
		let percent = -1;
		
		if(viewAnswer) {
			percent = ret.percent;
			if(percent < 0) percent = 0;
			else if(percent > 100) percent = 100;
		}

		let btnClassName1 = 'btn_choice';
		let btnClassName2 = 'btn_choice';
		let btnClassName3 = 'btn_choice';
		let btnClassName4 = 'btn_choice';
		if(viewAnswer) {
			if(question.answer === 1) btnClassName1 = btnClassName1 + ' correct';
			else if(question.answer === 2) btnClassName2 = btnClassName2 + ' correct';
			else if(question.answer === 3) btnClassName3 = btnClassName3 + ' correct';
			else if(question.answer === 4) btnClassName4 = btnClassName4 + ' correct';
		}

		return (
			<div className="choice-item" key={idx} style={view ? undefined : style.NONE}>
				<div className="correct_rate_box"  style={viewAnswer ? undefined : style.NONE}>
				<CorrectBar className="correct_rate" preview={-1} result={percent}  />
				</div>
				<div className="quizs_box"><div>
					<WrapTextNew 
						view={view}
						maxLineNum={2}
						maxSize={38}
						minSize={36}
						lineHeight={120}
						textAlign={'left'}
						onClick={this._onQuestion}
					>
						{question.question}
					</WrapTextNew>
				</div></div>
				<div className="choice_box">
					<QuizMCBtn 
						className={btnClassName1} 
						num={1} 
						on={viewAnswer ? question.answer === 1 : selected === 1}
						disabled={false}
						onClick={this._onClick}
					>
						<WrapTextNew view={view} maxLineNum={1} lineHeight={120} minSize={28} maxSize={32} textAlign="left">
							{question.choice_1}
						</WrapTextNew>
					</QuizMCBtn>
					<span style={viewAnswer ? undefined : style.HIDE} onClick={() => this._clickReturn(ret.c1)}>{ret.c1.length}</span>
				</div>
				<div className="choice_box">
					<QuizMCBtn 
						className={btnClassName2}
						num={2} 
						on={viewAnswer ? question.answer === 2 : selected === 2}
						disabled={false}
						onClick={this._onClick}
					>
						<WrapTextNew view={view} maxLineNum={1} lineHeight={120} minSize={28} maxSize={32} textAlign="left">
							{question.choice_2}
						</WrapTextNew>
					</QuizMCBtn>
					<span style={viewAnswer ? undefined : style.HIDE} onClick={() => this._clickReturn(ret.c2)}>{ret.c2.length}</span>
				</div>
				<div className="choice_box">
					<QuizMCBtn 
						className={btnClassName3}
						num={3} 
						on={viewAnswer ? question.answer === 3 : selected === 3}
						disabled={false}
						onClick={this._onClick}
					>
						<WrapTextNew view={view} maxLineNum={1} lineHeight={120} minSize={28} maxSize={32} textAlign="left">
							{question.choice_3}
						</WrapTextNew>
					</QuizMCBtn>
					<span style={viewAnswer ? undefined : style.HIDE} onClick={() => this._clickReturn(ret.c3)}>{ret.c3.length}</span>
				</div>
				<div className="choice_box" style={{display: ( question.choice_4 === '' ? 'none' : undefined)}}>
					<QuizMCBtn 
						className={btnClassName4}  
						num={4} 
						on={viewAnswer ? question.answer === 4 : selected === 4}
						disabled={false}
						onClick={this._onClick}
					>
						<WrapTextNew view={view} maxLineNum={1} lineHeight={120} minSize={28} maxSize={32} textAlign="left">
							{question.choice_4}
						</WrapTextNew>
					</QuizMCBtn>
					<span style={viewAnswer ? undefined : style.HIDE} onClick={() => this._clickReturn(ret.c4)}>{ret.c4.length}</span>
				</div>
			</div>
		);
	}
}

export { QuestionItem, IRet };