import * as React from 'react';
import * as ReactDOM from 'react-dom';


import * as _ from 'lodash';
import { hot } from 'react-hot-loader';

import Draggable from 'react-draggable';
import { Observer, observer } from 'mobx-react';
import { observable } from 'mobx';

import { BtnAudio } from '../../share/BtnAudio';

import { ToggleBtn } from '@common/component/button';
import { App } from '../../App';

import { TeacherContext, useTeacher, IStateCtx, IActionsCtx } from './t_store';
import * as common from '../common';
import StudyPopup from './t_study_popup';
import WrapTextNew from '@common/component/WrapTextNew';

const SwiperComponent = require('react-id-swiper').default;

interface IVocaItem {
	word: common.IWordData;
	checked: boolean;
	studied: boolean;
	hasPreview: boolean;
	onStudy: (word: common.IWordData) => void;
	onCheckChange: () => void;
	state: IStateCtx;
}

@observer
class VocaItem extends React.Component<IVocaItem> {
	// text 클릭 시 음성 2018-12-06 수정
	private _btn: BtnAudio | null = null;
	private _refAudio = (btn: BtnAudio) => {
		if(this._btn || !btn ) return;
		this._btn = btn;
	}
	private _entryClick = () => {
		if(this._btn) this._btn.toggle();
	}
	// img 클릭 시 check 2018-12-06 수정
	private _onCheck = () => {
		App.pub_playBtnTab(); // 효과음 추가 2018-12-26 
		this.props.word.app_checked = !this.props.checked;
		this.props.onCheckChange();
	}
	private _onStudy = () => {
		this.props.onStudy(this.props.word);
	}

	/*
	public componentWillUpdate(prev: IVocaItem) {


	}
	*/
	public render() {
		const word = this.props.word;
		const avr = Math.round((word.app_sound + word.app_meaning + word.app_spelling + word.app_sentence) / 4);
		return (
			<div className={'voca_box' + (this.props.studied ? ' click' : '' )}>
				<ToggleBtn className="check" on={this.props.checked} onClick={this._onCheck} />
				<img src={App.data_url + word.thumbnail} draggable={false} onClick={this._onCheck}/>
				<div className="voca_btns">
					<ToggleBtn className="btn_study" onClick={this._onStudy}/>
					<BtnAudio ref={this._refAudio} className="btn_sound" url={App.data_url + word.audio}/>
					<div onClick={this._entryClick}>
						<WrapTextNew view={this.props.state.prog >= 'list'} maxLineNum={1} minSize={16} maxSize={40} textAlign="left">
							{word.entry}
						</WrapTextNew>
					</div>
				</div>
				<div className="topic_progress">
					<span className={'icon_topic ' + word.reading} />				
				</div>	
			</div>
		);
	}
}

interface IComp {
	view: boolean;
	state: IStateCtx;
	actions: IActionsCtx;
}

@observer
class VocaList extends React.Component<IComp> {
	@observable private m_ncheck = 0;
	@observable private m_all = false;
	@observable private m_study: ''|'watch'|'learn'|'speak' = '';
	@observable private m_chooseWord: ''|'watch'|'learn'|'speak' = '';

	private _swiper: Swiper|null = null;

	private m_idx: number = -1;
	private _words: common.IWordData[] = [];

	private _closeChooseWord: _.DebouncedFunc<() => void>;

	private _pages: common.IWordData[][];
	constructor(props: IComp) {
		super(props);
		const words = this.props.actions.getWords();
		const total = words.length;
		this._pages = [];
		for(let i = 0; i < total; i++) {
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
		this.m_all = cnt === words.length;
		this.m_ncheck = cnt;
	}
	private _onAll = () => {
		App.pub_playBtnTab(); // 효과음 추가 2018-12-26 
		const words = this.props.actions.getWords();
		this.m_all = !this.m_all;
		const cnt = this.m_all ? words.length : 0;
		for(const word of words) {
			word.app_checked = this.m_all;
		}
		this.m_ncheck = cnt;
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

	private _onStudy = (word: common.IWordData) => {
		while(this._words.length > 0) this._words.pop();

		const words = this.props.actions.getWords();
		let idx = -1;
		for(let i = 0; i < words.length; i++) {
			this._words[i] = words[i];
			if(word === words[i]) idx = i;
		}
		if(idx < 0) idx = 0;

		// this._words.push(word);
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
		this.props.actions.setNavi(true, true); //
		this.props.actions.setNaviFnc(
			null,
			() => {
				this.props.actions.gotoQuizSelect();
			}
		);
	}

	public componentDidUpdate(prev: IComp) {
		if(this.props.view && !prev.view) {
			this._setNavi();
		} else if(!this.props.view && prev.view) {
			while(this._words.length) this._words.pop();
			const words = this.props.actions.getWords();
			for(const word of words) {
				word.app_checked = false;
			}		
			this.m_ncheck = 0;
			this.m_all = false;
			this.m_idx = -1;
			this.m_study = '';
			this.m_chooseWord = '';
		}
		// console.log('m_ncheck', this.m_ncheck,this.m_study);
	}
	private _refSwiper = (el: SwiperComponent) => {
		if(this._swiper || !el) return;
		this._swiper = el.swiper;
	}
	public render() {
		const { view, state, actions } = this.props;
		const words = actions.getWords();
		const total = words.length;
		const style: React.CSSProperties = {};
		if(!this.props.view) {
			style.visibility = 'hidden';
			style.transition = 'visibility 0.3s 0.3s';
		}


		const numOfPage = this._pages.length;

		return (
			<div className="t_voca_list" style={style}>
				<ToggleBtn className="check_all" on={this.m_all} onClick={this._onAll}/>

				<SwiperComponent
					ref={this._refSwiper}
					direction="vertical"
					scrollbar={{ el: '.swiper-scrollbar', draggable: true,}}
					observer={true}			
				>
					{this._pages.map((items, idx) => {
						return (
							<div key={idx} className={'box' + (numOfPage < 2 ? ' swiper-no-swiping' : '')} >{items.map((item, kidx) => {
								return (
									<VocaItem 
										key={kidx} 
										onCheckChange={this._onCheckChange} 
										word={item} 
										hasPreview={state.hasPreview} 
										studied={item.app_studied} 
										checked={item.app_checked} 
										onStudy={this._onStudy}
										state={state}
									/>
								);
							})}</div>
						);
					})}
				{/*
					<div className="box">
					{words.map((word, idx) => {
						// console.log(word.entry, word.app_studied);
						if(idx < total  /  2 ) return <VocaItem key={idx} onCheckChange={this._onCheckChange} word={word} hasPreview={state.hasPreview} studied={word.app_studied} checked={word.app_checked} onStudy={this._onStudy}/>;
						else return <></>;
					})}	
					</div>
					<div className="box">
					{words.map((word, idx) => {
						// console.log(word.entry, word.app_studied);
						if(idx >= total  /  2 ) return <VocaItem key={idx} onCheckChange={this._onCheckChange} word={word} hasPreview={state.hasPreview} studied={word.app_studied} checked={word.app_checked} onStudy={this._onStudy}/>;
						else return <></>;
					})}	
					</div>
				*/}
				</SwiperComponent>
				<span className="num"><span className="on">{this.m_ncheck}</span>/{total}</span>
				<div className="btns">
					<ToggleBtn className="watch" onClick={this._onWatch}/>
					<ToggleBtn className="learn" onClick={this._onLearn}/>
					<ToggleBtn className="speak" onClick={this._onSpeak}/>
				</div>					
				<span className={'icon_txtpop ' + this.m_chooseWord} />
				<StudyPopup 
					onClosed={this._onStudyEnd} 
					words={this._words}
					study={this.m_study} 
					idx={this.m_idx}
					actions={actions} 
					state={state}
				/>
			</div>
		);
	}
}


export default VocaList;



