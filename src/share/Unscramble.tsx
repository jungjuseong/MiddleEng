import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { observable, action, autorun, computed } from 'mobx';
import { observer } from 'mobx-react';
import * as _ from 'lodash';

import { App } from '../App';
import { BtnAudio } from './BtnAudio';
import * as butil from '@common/component/butil';
import { ToggleBtn } from '@common/component/button';
import WrapTextNew from '@common/component/WrapTextNew';

const TGT_CLASS = 'target';
const SRC_CLASS = 'source';
const ON_CLASS = 'on';
const WRONG_CLASS = 'wrong';

class Target {
	private _unscramble: Unscramble;
	private _el: HTMLElement;
	public get el() {return this._el;}
	private _text: string;
	private _source: Source|null = null;
	public get isBlank() {return this._source === null;}

	public get source() {return this._source;}

	// public get isOnSource() {return (this._source !== null && this._el.classList.contains(ON_CLASS));}

	public get isCorrect() {
		if(this._source === null) return false;

		// console.log(this._text === this._source.props.text, this._text, this._source.props.text);
		return (this._text === this._source.props.text);
	}

	constructor(unscramble: Unscramble, el: HTMLElement) {
		this._unscramble = unscramble;
		this._el = el;

		if(el.innerText && el.innerText !== '') this._text = '' + el.innerText;
		else if(el.textContent && el.textContent !== '') this._text = '' + el.textContent;
		else this._text = '' + el.innerHTML;
		this._el.onclick = () => {
			if(!unscramble.props.on || unscramble.props.viewAnswer || unscramble.props.disable) return;
			if(this._source && this._el.classList.contains(ON_CLASS)) {
				const tgts = this._unscramble.tgts;
				for(let i = tgts.length - 1; i >= 0; i--) {
					if(tgts[i].isBlank) continue;
					else if(tgts[i] === this) {
						this._source.targetClicked();
					} else break;
				}
			}
		};
	}

	public clear() {
		if(this._source) {
			this.setOnSource(false);
			this._source.clear();
			this._source = null;
		}
		this._el.innerHTML = this._text;
		if(this._el.classList.contains(WRONG_CLASS)) this._el.classList.remove(WRONG_CLASS);
	}
	public setCorrect() {
		if(this._el.classList.contains(WRONG_CLASS)) this._el.classList.remove(WRONG_CLASS);
		if(!this._el.classList.contains(ON_CLASS)) this._el.classList.add(ON_CLASS);
		if(this._source) this._source.stopMove();
	}
	public setWrong() {
		if(!this._el.classList.contains(WRONG_CLASS)) this._el.classList.add(WRONG_CLASS);

		if(this._source) {
			this._source.stopMove();
			if(!this._el.classList.contains(ON_CLASS)) this._el.classList.add(ON_CLASS);
			this._el.innerHTML = this._source.props.text;
		} else this._el.innerHTML = '&nbsp;';
	}
	public setOnSource(on: boolean) {
		if(on && this._source) {
			if(!this._el.classList.contains(ON_CLASS)) {
				this._el.classList.add(ON_CLASS);
				this._unscramble.changeTarget();
			}
		} else {
			if(this._el.classList.contains(ON_CLASS)) {
				this._el.classList.remove(ON_CLASS);
				this._unscramble.changeTarget();
			}
		}
	}

	public setSource(source: Source|null) {
		this._source = source;

		this._unscramble.changeResult();
		if(!source) this.setOnSource(false);
	}

	public reposSource() {
		if(this._source) this._source.repos();
	}
}

interface ISource {
	text: string;
	onClick: () => Target|null;
}
@observer
class Source extends React.Component<ISource> {
	private _target: Target|null = null;
	private _moveCnt = -1;
	@observable private _transX = 0;
	@observable private _transY = 0;
	private _cX = NaN;
	private _cY = NaN;
	private _el!: HTMLElement;
	private _aniIdx = -1;
	constructor(props: ISource) {
		super(props);
	}
	public clear() {
		this._init();
		this._target = null;	
	}
	private _init() {
		if(this._el) this._el.classList.remove(ON_CLASS);
		this._moveCnt = -1;
		this._transX = 0;
		this._transY = 0;
		
	}
	public componentWillMount() {
		this._init();
		if(this._target) {  
			this._target.clear();
			this._target = null;
		}	
	}
	public componentWillUnmount() {
		this._init();
		if(this._target) {  
			this._target.clear();
			this._target = null;
		}
	}
	public _ref = (el: HTMLElement) => {
		if(this._el || !el) return;
		this._el = el;
	}

	public stopMove() {
		this._moveCnt = -1;
	}
	private _move = (f: number) => {
		if(this._moveCnt < 0) return;
		
		if(this._moveCnt % 10 === 0) {
			const srcR = this._el.getBoundingClientRect();
			const srcX = (srcR.left + srcR.right) / 2;
			const srcY = (srcR.top + srcR.bottom) / 2;

			if(this._target) {
				const tgtR = this._target.el.getBoundingClientRect();
				const tgtX = (tgtR.left + tgtR.right) / 2;
				const tgtY = (tgtR.top + tgtR.bottom) / 2;
				
				this._transX = tgtX - this._cX;
				this._transY = tgtY - this._cY;
				if(Math.abs(tgtX - srcX) < 2 && Math.abs(tgtY - srcY) < 2) {
					this._moveCnt = -2;
					if(!this._el.classList.contains(ON_CLASS)) this._el.classList.add(ON_CLASS);
					this._target.setOnSource(true);
					return;
				} 
			} else {
				if(Math.abs(this._cX - srcX) < 2 && Math.abs(this._cY - srcY) < 2) {
					this._moveCnt = -2;
					return;
				} 				
			}
		}
		this._moveCnt++;

		this._aniIdx = window.requestAnimationFrame(this._move);
	}

	public targetClicked() {
		if(!this._target) return;
		else if(!this._el.classList.contains(ON_CLASS)) return;

		App.pub_playBtnTab();

		const tgtR = this._target.el.getBoundingClientRect();
		const tgtX = (tgtR.left + tgtR.right) / 2;
		const tgtY = (tgtR.top + tgtR.bottom) / 2;
		this._transX = tgtX - this._cX;
		this._transY = tgtY - this._cY;

		this._target.setSource(null);
		this._target = null;

		this._el.classList.remove(ON_CLASS);
		this._moveCnt = 0;
		this._transX = 0;
		this._transY = 0;
		this._aniIdx = window.requestAnimationFrame(this._move);		
	}
	private _onClick = () => {
		if(this._moveCnt >= 0 || !this._el) return;

		if(!this._target) {
			const tgt = this.props.onClick();
			if(tgt) {
				App.pub_playBtnTab();
				tgt.setSource(this);
				this._target = tgt;
				this._moveCnt = 0;

				const rect = this._el.getBoundingClientRect();
				this._cX = (rect.left + rect.right) / 2;
				this._cY = (rect.top + rect.bottom) / 2;

				tgt.el.innerHTML = this.props.text;
				this._aniIdx = window.requestAnimationFrame(this._move);
			}
		}
	}
	public repos() {
		if(this._target && this._el.classList.contains(ON_CLASS)) {
			const tgtR = this._target.el.getBoundingClientRect();
			const tgtX = (tgtR.left + tgtR.right) / 2;
			const tgtY = (tgtR.top + tgtR.bottom) / 2;
			
			this._transX = tgtX - this._cX;
			this._transY = tgtY - this._cY;
		}
	}
	public render() {
		const style: React.CSSProperties = {};
		style.transform = `translate(${this._transX}px, ${this._transY}px)`;
		if(this._moveCnt >= 0) style.transition = 'transform 0.3s';
		return (
			<span 
				ref={this._ref} 
				className={SRC_CLASS} 
				onClick={this._onClick}
				style={style}
			>
				{this.props.text}
			</span>
		);
	}
}


interface IUnscramble {
	view: boolean;
	on: boolean;
	idx: number;
	unscramble: string;
	srcs: string[];
	audio: string|null;
	answer: string;
	viewAnswer: boolean;
	disable?: boolean;
	isStudent?: boolean;
	viewAnswerAudio?: boolean;
	viewTargetAudio?: boolean;

	onChange?: (idx: number, complete: boolean, correct: boolean, inputs?: string[]) => void;
	onAnswerClick?: () => void;
}

const HIDE_STYLE: React.CSSProperties = {
	pointerEvents: 'none',
	opacity: 0,
};
const NONE_STYLE: React.CSSProperties = {
	display: 'none',
};


@observer
class Unscramble extends React.Component<IUnscramble> {
	private _tgt_jsx!: JSX.Element;
	private _answer_jsx!: JSX.Element;

	private _tgts: Target[] = [];
	private _tgt_box!: HTMLElement;
	private _answer_box!: HTMLElement;

	@observable private _isCorrect: boolean = false;

	@observable private _recalcNum = 0;

	private _btnAnswerAndio?: BtnAudio;

	public get tgts() {return this._tgts;}
	constructor(props: IUnscramble) {
		super(props);
		this._tgt_jsx = butil.parseUnscramble(props.unscramble, TGT_CLASS);
		
		if(this.props.isStudent) this._answer_jsx = butil.parseUnscramble(props.unscramble, TGT_CLASS);
		else this._answer_jsx = butil.parseUnscramble(props.answer, 'block');
	}
	public changeTarget() {
		this._recalcNum++;
	}	

	public componentWillReceiveProps(next: IUnscramble) {
		if(next.unscramble !== this.props.unscramble) {
			this._tgt_jsx = butil.parseUnscramble(next.unscramble, TGT_CLASS);
			if(this.props.isStudent) this._answer_jsx = butil.parseUnscramble(next.unscramble, TGT_CLASS);
			
		}
		if(next.answer !== this.props.answer) {
			if(!this.props.isStudent) this._answer_jsx = butil.parseUnscramble(next.answer, 'block');
		}
	}
	public reset() {
		this._isCorrect = false;
		for(let i = 0; i < this._tgts.length; i++) {
			this._tgts[i].clear();
		}
		if(this.props.isStudent && this._answer_box) {
			const els = this._answer_box.getElementsByClassName(TGT_CLASS);	
			for(let i = 0; i < els.length; i++) {
				const item = els.item(i);
				if(item && item.classList.contains(WRONG_CLASS))  item.classList.remove(WRONG_CLASS);
			}
		}			
	}

	public componentDidUpdate(prev: IUnscramble) {
		if(this.props.view && !prev.view) {
			this.reset();
		}

		if(this.props.isStudent && this.props.viewAnswer && !prev.viewAnswer) {
			let isCorrect = true;
			const els = this._answer_box.getElementsByClassName(TGT_CLASS);

			for(let i = 0; i < this._tgts.length; i++) {
				const item = els.item(i);
				if(this._tgts[i].isCorrect) {
					this._tgts[i].setCorrect();
					if(item && item.classList.contains(WRONG_CLASS))  item.classList.remove(WRONG_CLASS);
				} else {
					isCorrect = false;
					this._tgts[i].setWrong();

					
					if(item && !item.classList.contains(WRONG_CLASS))  item.classList.add(WRONG_CLASS);
				}
			}

			this._isCorrect = isCorrect;
			this._recalcNum++;
		}
	}
	private _refTgtBox = (el: HTMLElement) => {
		if(this._tgt_box || !el) return;
		this._tgt_box = el;
		while(this._tgts.length > 0) this._tgts.pop();
		const els = el.getElementsByClassName(TGT_CLASS);

		for(let i = 0; i < els.length; i++) {
			const item = els.item(i);
			if(item) this._tgts[this._tgts.length] = new Target(this, item as HTMLElement);
		}
	}
	private _refAnswerBox = (el: HTMLElement) => {
		if(this._answer_box || !el) return;
		this._answer_box = el;
	}
	private _srcClick = () => {
		if(!this.props.on || !this._tgt_box) return null;
		else if(this.props.viewAnswer || this.props.disable) return null;

		let tgt: Target|null = null;
		
		for(let i = 0; i < this._tgts.length; i++) {
			if(this._tgts[i].isBlank) {
				tgt = this._tgts[i];
				break;
			}
		}
		return tgt;
	}

	public changeResult() {
		if(!this.props.on) return;
		else if(this.props.viewAnswer || this.props.disable) return;
		let isComplete = true;
		let isCorrect = true;
		let inputs: string[] = [];
		for(let i = 0; i < this._tgts.length; i++) {
			const tgt = this._tgts[i];

			tgt.reposSource();
			if(tgt.source) inputs.push(tgt.source.props.text);
			else inputs.push('');
			if(tgt.isBlank) isComplete = false;
			if(!tgt.isCorrect) isCorrect = false;
			
		}
		if(this.props.onChange) this.props.onChange(this.props.idx, isComplete, isCorrect, inputs);
	}

	private _onAnswerSound = (evt?: React.MouseEvent<HTMLElement>) => {
			if(!evt || !evt.target) return;

			const tgt = evt.target as HTMLElement;
			if(!(tgt instanceof HTMLButtonElement)) {
				if(this._btnAnswerAndio) this._btnAnswerAndio.toggle();
			}

			
			if(this.props.onAnswerClick) this.props.onAnswerClick();
		
	}
	private _refAnswerAudio = (btn: BtnAudio) => {
		if(this._btnAnswerAndio || !btn) return;
		this._btnAnswerAndio = btn;
	}

	public render() {
		const {view, audio, viewAnswer, srcs, on, isStudent, viewAnswerAudio, viewTargetAudio} = this.props;
		let viewAnswerBox = viewAnswer;
		if(isStudent && viewAnswerBox) viewAnswerBox = !this._isCorrect;
		const src_jsx = (
			<>
			{srcs.map((src,idx) => {
				return <Source key={idx} text={src} onClick={this._srcClick}/>;
			})}
			</>
		);

		let front_jsx;	// 정답 화살표 대신 answer버튼으로 변경해야함
		if(isStudent)  front_jsx = <ToggleBtn className="btn_answer" disabled={true} />;
		
		
		let answerAudio_jsx;
		if(audio && viewAnswerAudio) answerAudio_jsx = <BtnAudio ref={this._refAnswerAudio} className="btn_audio" url={App.data_url + audio} />;

		let targetAndio_jsx;
		if(audio && viewTargetAudio) targetAndio_jsx = <BtnAudio ref={this._refAnswerAudio} className="btn_audio" url={App.data_url + audio} />;

		const answer_jsx = (
			<>
				{front_jsx}
				{answerAudio_jsx}
				{this._answer_jsx}
			</>
		);
		/*
	className?: string;
	view: boolean;
	maxSize?: number;
	minSize?: number;
	lineHeight?: number;
	maxLineNum?: number;      					// minSize로 바꿀 최대 라인 수
	textAlign?: 'left'|'center'|'right';
	rcalcNum?: number;
	onRef?: (el: HTMLElement) => void;
	onClick?: () => void;
		*/
		return (
			<>
				<div className="target-container">
					<div className={'target-wrapper' + (viewAnswer ? ' view-answer' : '')  + (viewAnswer && viewAnswerBox ? '' : ' hide-answer-box')}>
						{targetAndio_jsx}
						<WrapTextNew 
							className="target-box" 
							view={view}
							rcalcNum={this._recalcNum}
							onRef={this._refTgtBox}
							textAlign="left"
							viewWhenInit={true}
						>
							{this._tgt_jsx}
						</WrapTextNew>
					</div>
					<div className={`answer-wrapper ${viewAnswer ? ' view-answer' : ''}`} style={viewAnswerBox ? undefined : HIDE_STYLE}>
						<WrapTextNew 
							className="answer-box" 
							view={view} 
							rcalcNum={viewAnswer ? 1 : 0}
							viewWhenInit={true}
							textAlign="left"
							onRef={this._refAnswerBox}
							onClick={this._onAnswerSound}
						>
							{answer_jsx} 
						</WrapTextNew>
					</div>
				</div>
				<div className="source-container" style={viewAnswer ? NONE_STYLE : undefined}>
					<WrapTextNew className="source-box" view={view}>
						{src_jsx}
					</WrapTextNew>
				</div>
			</>
		);
	}
}

export default Unscramble;
