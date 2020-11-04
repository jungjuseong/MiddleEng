import * as React from 'react';

import { observable } from 'mobx';
import { observer } from 'mobx-react';

import { ToggleBtn } from '@common/component/button';
import * as kutil from '@common/util/kutil';
import * as common from '../common';
import { App } from '../../App';
import { BtnAudio } from '../../share/BtnAudio';
import PreInBox from '../../share/PreInBox';

import PzTgt from './_pz_tgt';
import PzSrc from './_pz_src';

@observer
class QuizSpelling extends React.Component<common.IQuizPage> {
	@observable private _nPlay = 0;
	@observable private _btnAudioDisabled: boolean = true;

	private _tgts: PzTgt[] = [];
	private _srcs: PzSrc[] = [];
	private _chars: string[] = [];

	constructor(props: common.IQuizPage) {
		super(props);
		
		const entry = props.quiz.quiz_spelling ? props.quiz.quiz_spelling.entry : props.quiz.entry;
		const len = entry.length;
		const arr: number[] = [];
		while (arr.length < len) {
			const idx = Math.floor(len * Math.random());
			if(idx < len && arr.indexOf(idx) < 0) {
				arr.push(idx);
			}
		}		
		for (let i = 0; i < arr.length; i++) {
			this._chars[i] = entry.charAt(arr[i]);
		}
	}
	public componentWillUnmount() {
		this._nPlay = 0;
	}
	public componentDidMount() {
		if(this.props.isTeacher && this.props.view && this.props.quizProg === 'result') {
			this._viewAnswer();
		}		
	}
	private _reset() {
		for(const tgt of this._tgts) {
			if(tgt) tgt.reset();
		}
		for(const src of this._srcs) {
			if(src) src.reset();
		}
	}
	public componentDidUpdate(prev: common.IQuizPage) {
		if(this.props.on && !prev.on) {
			if(this.props.isTeacher && this.props.quizProg === 'quiz') {
			    this._nPlay = 2;
			    this._btnAudioDisabled = true;
			} else {
			    this._nPlay = 0;
			    this._btnAudioDisabled = false;
			}
		} else if(!this.props.on && prev.on) {
			if(this.props.isTeacher && this.props.quizProg !== 'result') this._reset();
			this._nPlay = 0;
		}

		if(!this.props.view && prev.view) {
			this._reset();
		}
		if(
			this.props.isTeacher && 
			this.props.quizProg === 'result' &&
			(prev.quizProg !== 'result' || (this.props.view && !prev.view))
		) {
			this._viewAnswer();
		}
	}
	private async _viewAnswer() {
		await kutil.wait( 300 );
		if(this.props.quizProg !== 'result' || !this.props.view) return;
	
		this._reset();
		await kutil.wait( 100 );
		if(this.props.quizProg !== 'result' || !this.props.view) return;

		if(this._chars.length === this._srcs.length && this._chars.length === this._tgts.length) {
			for(let i = 0; i < this._chars.length; i++) {
				if(!this._srcs[i] || !this._tgts[i]) return;
			}

			for(const src of this._srcs) {
				if(src && src.el) {
					for(const tgt of this._tgts) {
						if(tgt && tgt.src === null && src.props.char === tgt.props.char) {
							if(tgt.el) src.setTgt(tgt, true);
							break;
						}
					}
				}
			}
		}
	}

	private _onStop = () => {
		if(this.props.on && this._nPlay > 0 && this.props.quizProg === 'quiz') {
			this._nPlay = 0;
			this._btnAudioDisabled = false;
			this.props.onSoundComplete(this.props.idx);
			console.log('end?, click ok');
		}
	}
	private _onMountTgt = (tgt: PzTgt, idx: number) => {
		this._tgts[idx] = tgt;
	}
	private _onMountSrc = (src: PzSrc, idx: number) => {
		this._srcs[idx] = src;
	}
	private _onSrcDown = (src: PzSrc) => {
		if(src.moving) return;

		const srcEL = src.el;
		if(src.tgt) {
			src.setTgt(null, false);
			// src.tgt.reset();
			// src.reset();
		} else if(srcEL) {
			for(const tgt of this._tgts) {
				const tgtEL = tgt.el;
				if(tgt.src === null && tgtEL) {
					src.setTgt(tgt, false);
					break;
				}
			}
		}
		let isCorrect = true;
		let isAll = true;
		let answer: string[] = [];

		for(const tgt of this._tgts) {
			if(!tgt.src) {
				isCorrect = false;
				isAll = false;
				answer.push('');
			} else {
				answer.push(tgt.src.props.char);
				if(tgt.src.props.char !== tgt.props.char) isCorrect = false;	
			}
		}
		if(this.props.onItemChange) this.props.onItemChange(this.props.idx, JSON.stringify(answer));
		
		if(! this.props.isTeacher) {
			this.props.quiz.app_result = isCorrect;
		}
	}
	public render() {
		const {quiz, isTeacher, quizProg, hasPreview, percent}  = this.props;
		const word = quiz;

		const entry = quiz.quiz_spelling ? quiz.quiz_spelling.entry : quiz.entry;

		const chars = entry.split('');
		const total = entry.length;
		let wordClass;
		if(total <= 7) wordClass = 'big';
		else if(total <= 10) wordClass = 'middle';
		else if(total <= 13) wordClass = 'small';
		else wordClass = 'x-small';
		return (
			<>
				<PreInBox
					view={isTeacher && quizProg === 'result'}
					preClass={hasPreview ? word.app_spelling : -1}
					inClass={percent}
					top={65}
					right={110}
				/>
				<BtnAudio className={'btn_audio' + (isTeacher ? '' : ' ' + quizProg)} url={App.data_url + word.audio} nPlay={this._nPlay} onStop={this._onStop} disabled={this._btnAudioDisabled}/>
				<div className="spelling">
					<div className={'target-box ' + wordClass}>					 
						{chars.map((spell, idx) => {
							return <PzTgt key={idx} idx={idx} char={spell} isTeacher={isTeacher} quizProg={quizProg} onMountTgt={this._onMountTgt}/>;	
						})}
					</div>
					<div className={'source-box ' + wordClass}>
						{this._chars.map((spell, idx) => {
							return <PzSrc key={idx} idx={idx} char={spell} isTeacher={isTeacher} quizProg={quizProg} onMountSrc={this._onMountSrc} onDown={this._onSrcDown} disabled={quizProg !== 'quiz'}/>;	
						})}
					</div>					
				</div>
			</>
		);
	}
}

export default QuizSpelling;


