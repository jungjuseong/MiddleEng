import * as React from 'react';

import * as _ from 'lodash';
import { observer } from 'mobx-react';
import { observable } from 'mobx';

import { ToggleBtn } from '@common/component/button';
import { App } from '../../../App';

import { IStateCtx, IActionsCtx } from '../t_store';
import { IWordData } from '../../common';
import StudyPopup from '../t_study_popup';
import VocaItem from './_voca_item';

const SwiperComponent = require('react-id-swiper').default;

interface IVocaList {
	view: boolean;
	state: IStateCtx;
	actions: IActionsCtx;
}

@observer
class VocaList extends React.Component<IVocaList> {
	@observable private m_ncheck = 0;
	@observable private m_all = false;
	@observable private m_study: ''|'watch'|'learn'|'speak' = '';
	@observable private m_chooseWord: ''|'watch'|'learn'|'speak' = '';

	private _swiper: Swiper|null = null;
	private m_idx: number = -1;
	private _words: IWordData[] = [];
	private _closeChooseWord: _.DebouncedFunc<() => void>;
	private _pages: IWordData[][];

	constructor(props: IVocaList) {
		super(props);
		const words = this.props.actions.getWords();
		this._pages = [];

		for(let i = 0; i < words.length; i++) {
			if( i % 8 === 0) this._pages[this._pages.length] = [];
			this._pages[this._pages.length - 1].push(words[i]);
		}
		this._closeChooseWord = _.debounce(() => {
			this.m_chooseWord = '';
		}, 2000);
	}

	private _onCheckChange = () => {
		const words = this.props.actions.getWords();

		let cnt = 0;
		for(let word of words) {
			if(word.app_checked) cnt++;
		}
		this.m_all = (cnt === words.length);
		this.m_ncheck = cnt;
	}
	
	private _onAll = () => {
		App.pub_playBtnTab(); // 효과음 추가 2018-12-26 
		const words = this.props.actions.getWords();
		this.m_all = !this.m_all;

		for(const word of words) {
			word.app_checked = this.m_all;
		}
		this.m_ncheck = this.m_all ? words.length : 0;
	}

	private _study(study: ''|'watch'|'learn'|'speak') {
		if(this.m_ncheck === 0) {
			this.m_chooseWord = study;
			this._closeChooseWord();
			return;
		}
		while(this._words.length > 0) this._words.pop();

		const words = this.props.actions.getWords();
		for(const word of words) {
			if(word.app_checked) this._words.push(word);
		}
		App.pub_playPopup();
		this.m_idx = -1;
		this.m_study = study;
	}

	private _onStudy = (word: IWordData) => {
		while(this._words.length > 0) this._words.pop();

		const words = this.props.actions.getWords();

		let idx = -1;
		for(let i = 0; i < words.length; i++) {
			this._words[i] = words[i];
			if(word === words[i]) idx = i;
		}
		if(idx < 0) idx = 0;

		App.pub_playPopup();
		this.m_idx = idx;
		this.m_study = 'learn';
	}

	private _onWatch = () => { this._study('watch'); };
	private _onLearn = () => { this._study('learn'); };
	private _onSpeak = () => { this._study('speak'); };

	private _onStudyEnd = () => {
		const words = this.props.actions.getWords();

		for(const word of words) {
			word.app_checked = false;
		}
		this.m_all = false;
		this.m_ncheck = 0;
		this.m_idx = -1;
		this.m_study = '';
		this._setNavi();
	}

	private _setNavi() {
		this.props.actions.setNaviView(true); //
		this.props.actions.setNavi(false, true); //
		this.props.actions.setNaviFnc(
			null,
			() => {
				this.props.actions.gotoQuizSelect();
			}
		);
	}

	public componentDidUpdate(prev: IVocaList) {
		const { view, actions } = this.props;

		if(view && !prev.view) {
			this._setNavi();
		} else if(!view && prev.view) {
			while(this._words.length) this._words.pop();
			const words = actions.getWords();
			for(const word of words) {
				word.app_checked = false;
			}		
			this.m_ncheck = 0;
			this.m_all = false;
			this.m_idx = -1;
			this.m_study = '';
			this.m_chooseWord = '';
		}
	}

	private _refSwiper = (el: SwiperComponent) => {
		if(this._swiper || !el) return;
		this._swiper = el.swiper;
	}

	public render() {
		const { view, state, actions } = this.props;
		const words = actions.getWords();
		const style: React.CSSProperties = {};

		if(!view) {
			style.visibility = 'hidden';
			style.transition = 'visibility 0.3s 0.3s';
		}

		const numOfPage = this._pages.length;
		return (
			<div className="t_voca_list" style={style}>
				<ToggleBtn className="check_all" on={this.m_all} onClick={this._onAll}/>
				<SwiperComponent ref={this._refSwiper} direction="vertical" scrollbar={{ el: '.swiper-scrollbar', draggable: true}} observer={true}>
					{this._pages.map((items, idx) => 
						<div key={idx} className={'box' + (numOfPage < 2 ? ' swiper-no-swiping' : '')}>
							{items.map((word, kidx) => 
								<VocaItem 
									key={kidx}
									onCheckChange={this._onCheckChange}
									word={word}
									hasPreview={state.hasPreview}
									onStudy={this._onStudy}
									state={state}
								/>								
							)}
						</div>
					)}
				</SwiperComponent>
				<span className="num"><span className="on">{this.m_ncheck}</span>/{words.length}</span>
				<div className="btns">
					<ToggleBtn className="watch" onClick={this._onWatch}/>
					<ToggleBtn className="learn" onClick={this._onLearn}/>
					<ToggleBtn className="speak" onClick={this._onSpeak}/>
				</div>					
				<span className={'icon_txtpop ' + this.m_chooseWord} />
				<StudyPopup onClosed={this._onStudyEnd} words={this._words}	study={this.m_study} idx={this.m_idx} actions={actions} state={state}/>
			</div>
		);
	}
}

export default VocaList;



