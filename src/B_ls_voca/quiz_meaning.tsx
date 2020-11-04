import * as React from 'react';
import { observer } from 'mobx-react';
import { observable } from 'mobx';

import * as common from './common';
import { App } from '../App';
import { BtnAudio } from '../share/BtnAudio';
import QuizMCBtn from '../share/QuizMCBtn';

import PreInBox from '../share/PreInBox';

@observer
class QuizMeaning extends React.Component<common.IQuizPage> {
	@observable private _nPlay = 0;
	@observable private _selected: number = 0;
	@observable private _btnAudioDisabled: boolean = true;

	public componentWillUnmount() {
		this._btnAudioDisabled = true;
		this._nPlay = 0;
		this._selected = 0;
	}

	public componentDidUpdate(prev: common.IQuizPage) {
		
		if(this.props.on && !prev.on) {
			if(this.props.isTeacher) this._selected = 0;
			if(this.props.isTeacher && this.props.quizProg === 'quiz') {
			    this._nPlay = 2;
			    this._btnAudioDisabled = true;
			} else {
			    this._nPlay = 0;
			    this._btnAudioDisabled = false;
			}
		} else if(!this.props.on && prev.on) {
			this._nPlay = 0;
			if(this.props.isTeacher) this._selected = 0;
		}
		if(!this.props.view && prev.view) {
			this._selected = 0;
		}
	}

	private _onMc = (num: number) => {
		if(!this.props.on) return;
		else if(this.props.quizProg !== 'quiz') return;

		if(this._selected === num) this._selected = 0;
		else this._selected = num;

		if(!this.props.isTeacher) {
			const word = this.props.quiz;
			word.app_result = this._selected === word.quiz_meaning.correct;
		}
		if(this.props.onItemChange) this.props.onItemChange(this.props.idx, this._selected + '');
	}

	private _onStop = () => {
		if(this.props.on && this._nPlay > 0 && this.props.quizProg === 'quiz') {
			this._nPlay = 0;
			this._btnAudioDisabled = false;
			this.props.onSoundComplete(this.props.idx);
			console.log('end?, click ok');
		}
	}
	public render() {
		const {isGroup, group, isTeacher, quizProg, hasPreview, percent}  = this.props;
		const word = this.props.quiz;
		const quiz = word.quiz_meaning;
		const correct = quiz.correct;
		const choices: string[] = [quiz.choice1, quiz.choice2, quiz.choice3];

		return (
			<>
				<PreInBox
					view={isTeacher && quizProg === 'result'}
					preClass={hasPreview ? word.app_meaning : -1}
					inClass={percent}
					top={65}
					right={110}
				/>
				<BtnAudio className={'btn_audio' + (isTeacher ? '' : ' ' + quizProg)} url={App.data_url + word.audio} nPlay={this._nPlay} onStop={this._onStop} disabled={this._btnAudioDisabled}/>
				<div className="word">{word.entry}</div>
				<div className="mean">{choices.map((choice, idx) => {
					const arr: string[] = ['quiz_box'];
					let selected = this._selected;
					if(quizProg === 'result') {
						if(isTeacher) {
							if(correct === idx + 1) arr.push('correct');
							selected = 0;
						} else {
							if(correct === idx + 1) arr.push('correct');
							else if(selected === idx + 1) arr.push('wrong');
							selected = 0;
							/*		정답일 경우 선태 모양 유지
							if(correct === selected) {
								selected = this._selected;
								// if(correct === idx + 1) arr.push('correct');
							} else {
								if(correct === idx + 1) arr.push('correct');
								if(selected === idx + 1) arr.push('wrong');
								selected = 0;
							} 
							*/
						}
					}
					return (
						<QuizMCBtn 
							key={idx}
							className={arr.join(' ')} 
							num={idx + 1} 
							on={selected === (idx + 1)} 
							onClick={this._onMc} 
							disabled={this.props.quizProg !== 'quiz'}
						>
							{choice}
						</QuizMCBtn>
					);
				})}</div>
			</>
		);
	}
}
export default QuizMeaning;


