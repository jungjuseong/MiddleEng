import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { observable } from 'mobx';
import { observer } from 'mobx-react';

import { ToggleBtn } from '@common/component/button';
import * as butil from '@common/component/butil';
import * as kutil from '@common/util/kutil';
import * as common from './common';
import { App } from '../App';
import PreInBox from '../share/PreInBox';

import QuizMCBtn from '../share/QuizMCBtn';
import WrapTextNew from '@common/component/WrapTextNew';
import { getNextId } from 'mobx/lib/internal';

@observer
class QuizUsage extends React.Component<common.IQuizPage> {
	@observable private _selected: number = 0;
	@observable private _rcalcNum = 0;
	private _jsx: JSX.Element;
	private _div?: HTMLElement;
	constructor(props: common.IQuizPage) {
		super(props);

		const qs = props.quiz.quiz_usage;
		let max = 0;
		let sMax = '';
		sMax = qs.choice1;
		max = sMax.length;

		if(qs.choice2.length > max) {
			sMax = qs.choice2;
			max = sMax.length;
		}
		if(qs.choice3.length > max) {
			sMax = qs.choice3;
			max = sMax.length;
		}


		this._jsx = this._getJSX(qs.sentence, sMax);
	}
	private _getJSX(text: string, max: string) {
		const nodes = butil.parseBlock(text, 'block', max);
		return (
			<>
				{nodes.map((node) => node)}
			</>
		);

	}
	private async _soundComplete() {
		if(this.props.idx > 0) await kutil.wait(300);
		if(this.props.on) this.props.onSoundComplete(this.props.idx);
	}

	public componentWillUnmount() {
		this._selected = 0;
		this._setBlock(0, false);
	}
	public componentDidUpdate(prev: common.IQuizPage) {
		if(this.props.on && !prev.on) {
			if(this.props.isTeacher) this._selected = 0;

			this._soundComplete();
			
		} else if(!this.props.on && prev.on) {
			if(this.props.isTeacher) this._selected = 0;
		}
		
		if(this.props.view && !prev.view) {
			this._rcalcNum = 0;
			this._selected = 0;
			this._setBlock(0, false);
		} else if(!this.props.view && prev.view) {
			this._rcalcNum = 0;
			this._selected = 0;
			this._setBlock(0, false);
		}

		if(this.props.view && this.props.quizProg === 'result' && prev.quizProg !== 'result') {
			const quiz = this.props.quiz.quiz_usage;

			this._setBlock(quiz.correct, false);
		}
	}

	private _onMc = (num: number) => {
		if(!this.props.on) return;
		else if(this.props.quizProg !== 'quiz') return;

		if(this._selected === num) this._selected = 0;
		else this._selected = num;

		if(!this.props.isTeacher) {
			const word = this.props.quiz;
			word.app_result = this._selected === word.quiz_usage.correct;
		}

		this._setBlock(this._selected, true);

		if(this.props.onItemChange) this.props.onItemChange(this.props.idx, this._selected + '');
	}

	private _refSentence = (div: HTMLDivElement) => {
		if(!div) return;

		this._div = div;
	}

	private _setBlock = (num: number, bView: boolean) => {
		if(!this._div) return;

		let block = this._div.querySelector('.block');
		if(!block) return;

		const quiz = this.props.quiz.quiz_usage;

		if(num < 1 || num > 3) {
			num = quiz.correct;
			bView = false;
		}

		let choice: string|undefined;
		if(num === 1) choice = quiz.choice1;
		else if(num === 2) choice = quiz.choice2;
		else choice = quiz.choice3;
		

		if(bView && !block.classList.contains('view')) block.classList.add('view');
		else if(!bView && block.classList.contains('view')) block.classList.remove('view');


		block.innerHTML = choice;
		this._rcalcNum++;
	}
	

	public render() {
		const {isGroup, group, isTeacher, quizProg, hasPreview, percent}  = this.props;
		const word = this.props.quiz;
		const quiz = word.quiz_usage;
		const correct = quiz.correct;
		const choices: string[] = [quiz.choice1, quiz.choice2, quiz.choice3];

		return (
			<>
				<PreInBox
					view={isTeacher && quizProg === 'result'}
					preClass={hasPreview ? word.app_sentence : -1}
					inClass={percent}
					top={150}
					right={140}
				/>

				<div className="img_box">
					{/*<CorrectBar className={p_type + ' sentence'}/>*/}
					<img src={App.data_url + word.quiz_usage.image} draggable={false} />
					<div className={'quiz_usage' + (quizProg === 'result' ? ' result' : '')}><div ref={this._refSentence}>
						<WrapTextNew view={this.props.view} maxSize={48} minSize={44} lineHeight={130} rcalcNum={this._rcalcNum} viewWhenInit={true}>{this._jsx}</WrapTextNew>
					</div></div>
				</div>
				<div className="usage">{choices.map((choice, idx) => {
					const arr: string[] = ['quiz_box'];
					let selected = this._selected;

					let wordClass;
					if(choice.length <= 13) wordClass = ' big';
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
					return (
						<QuizMCBtn 
							key={idx}
							className={arr.join(' ') + wordClass} 
							num={idx + 1} 
							on={selected === (idx + 1)} 
							onClick={this._onMc} 
							disabled={this.props.quizProg !== 'quiz'}
						>
							<WrapTextNew view={this.props.view} /*maxSize={36} minSize={36}*/ lineHeight={110} viewWhenInit={true}>{choice}</WrapTextNew>
						</QuizMCBtn>
					);
				})}</div>
			</>
		);
	}
}

export default QuizUsage;


