import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { Observer, observer } from 'mobx-react';
import { hot } from 'react-hot-loader';

import { Timer, TimerState } from '../share/Timer';
import { ToggleBtn } from '@common/component/button';
import * as common from './common';
import { App } from '../App';
import { BtnAudio } from '../share/BtnAudio';
import QuizMCBtn from '../share/QuizMCBtn';
import PreInBox from '../share/PreInBox';

import { observable } from 'mobx';
import WrapTextNew from '@common/component/WrapTextNew';



@observer
class QuizSound extends React.Component<common.IQuizPage> {
	@observable private _nPlay = 0;
	@observable private _selected: number = 0;
	@observable private _btnAudioDisabled:boolean = true;
	public componentWillUnmount() {
		this._nPlay = 0;
		this._selected = 0;
	}
	public componentDidUpdate(prev: common.IQuizPage) {
		if(this.props.on && !prev.on) {
			if(this.props.isTeacher) this._selected = 0;
			if(this.props.isTeacher && this.props.quizProg === 'quiz'){
			    this._nPlay = 2;
			    this._btnAudioDisabled = true;
			}else{
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
			word.app_result = this._selected === word.quiz_sound.correct;
		}

		if(this.props.onItemChange) this.props.onItemChange(this.props.idx, this._selected + '');
	}

	private _onStop = () => {
		if(this.props.on && this._nPlay > 0 && this.props.quizProg === 'quiz') {
			this._nPlay = 0;
			this.props.onSoundComplete(this.props.idx);
            this._btnAudioDisabled = false;
		}
	}

	public render() {
		const {isGroup, group, isTeacher, quizProg, hasPreview, percent}  = this.props;
		const word = this.props.quiz;
		const quiz = word.quiz_sound;
		const correct = quiz.correct;
		let choices: string[] = [quiz.choice1, quiz.choice2, quiz.choice3, quiz.choice4];
		if(quiz.choice4 === "") choices = [quiz.choice1, quiz.choice2, quiz.choice3];
		
		return (
			<>
				<PreInBox
					view={isTeacher && quizProg === 'result'}
					preClass={hasPreview ? word.app_sound : -1}
					inClass={percent}
					top={65}
					right={110}
				/>

				<BtnAudio className={'btn_audio' + (isTeacher ? '' : ' ' + quizProg)} url={App.data_url + word.audio} nPlay={this._nPlay} onStop={this._onStop} disabled={this._btnAudioDisabled}/>
				<div className={quiz.choice4 === '' ? 'mc-box-three' : 'mc-box'}>{choices.map((choice, idx) => {
					const arr: string[] = ['quiz_box'];
					let selected = this._selected;


					const total = choice.length;
					let wordClass;
					if(total <= 10) wordClass = ' big';
					else if(total <= 13) wordClass = ' middle';
					else wordClass = ' small';

					if(quizProg === 'result') {
						if(isTeacher) {
							if(correct === idx + 1) arr.push('correct');
							selected = 0;
						} else {
							if(correct === idx + 1) arr.push('correct');
							else if(selected === idx + 1) arr.push('wrong');
							selected = 0;
							/* 정답일 경우 선태 모양 유지
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
					if(quiz.choice4 === "")
						return (
							<div key={idx}>
								<QuizMCBtn 
									key={idx}
									className={arr.join(' ') + wordClass} 
									num={idx + 1} 
									on={selected === (idx + 1)} 
									onClick={this._onMc} 
									disabled={this.props.quizProg !== 'quiz'}
								>
									<WrapTextNew view={this.props.view} /*maxSize={54} minSize={54}*/ lineHeight={120} viewWhenInit={true}><span className={wordClass}>{choice}</span></WrapTextNew>
								</QuizMCBtn>
							</div>
						);
					else 
						return (
							<QuizMCBtn 
								key={idx}
								className={arr.join(' ') + wordClass} 
								num={idx + 1} 
								on={selected === (idx + 1)} 
								onClick={this._onMc} 
								disabled={this.props.quizProg !== 'quiz'}
							>
								<WrapTextNew view={this.props.view} /*maxSize={54} minSize={54}*/ lineHeight={120} viewWhenInit={true}><span className={wordClass}>{choice}</span></WrapTextNew>
							</QuizMCBtn>
						);
				})}</div>
			</>
		);
	}
}
export default QuizSound;

