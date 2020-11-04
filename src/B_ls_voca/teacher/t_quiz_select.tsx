import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { Observer, observer } from 'mobx-react';

import { TeacherContext, useTeacher, IStateCtx, IActionsCtx } from './t_store';
import * as _ from 'lodash';
import { hot } from 'react-hot-loader';
import * as common from '../common';
import { ToggleBtn } from '@common/component/button';
import { observable } from 'mobx';

import { App } from '../../App';
import * as felsocket from '../../felsocket';
import * as kutil from '@common/util/kutil';

interface IBtnItem {
	myqtype: common.TypeQuiz;
	qtype: common.TypeQuiz;
	average: number;
	viewSingleBtn: boolean;
	view_s: boolean;
	view_g: boolean;
	onClick: (qtype: common.TypeQuiz) => void;
	onResult: (qtype: common.TypeQuiz, isGroup: boolean) => void;
}

class BtnItem extends React.Component<IBtnItem> {
	private _onClick = () => {
		this.props.onClick(this.props.myqtype);
	}
	private _onResultS = () => {
		this.props.onResult(this.props.myqtype, false);
	}
	private _onResultG = () => {
		this.props.onResult(this.props.myqtype, true);
	}
	public render() {
		const {myqtype, qtype, average, viewSingleBtn, view_s, view_g} = this.props;
		return (
			<div className={'quiz_' + myqtype}>
				<ToggleBtn className={'btn_quiz_' + myqtype} on={myqtype === qtype} onClick={this._onClick}/>
				
				<div className="result_btns">
					<div className="quiz_progress">
						<div className="percent_data" style={{display: average < 0 ? 'none' : ''}}>
							<span style={{width: average < 0 ? '0%' : average + '%'}} />
						</div>
						<span style={{display: average < 0 ? 'none' : ''}}>{average < 0 ? '' : average + '%'}</span>
					</div>
					<ToggleBtn className={'btn_result_single' + (viewSingleBtn && view_s ? '' : ' off')} onClick={this._onResultS}/>
					{/*
					<ToggleBtn className={'btn_result_single' + (view_s ? '' : ' off') + (view_s ? '' : ' hide')} onClick={this._onResultS}/>
					*/}
					<ToggleBtn className={'btn_result_group' + (view_g ? '' : ' off')} onClick={this._onResultG}/>
				</div>
			</div>
		);		
	}
}

interface IQuizSelect {
	view: boolean;
	state: IStateCtx;
	actions: IActionsCtx;
}

@observer
class QuizSelect extends React.Component<IQuizSelect> {
	private _sound_avg = -1;
	private _meaning_avg = -1;
	private _spelling_avg = -1;
	private _sentence_avg = -1;

	@observable private _qtype: common.TypeQuiz = '';
	@observable private _numOfStudent = 0;

	private _souns_s: boolean = false;
	private _souns_g: boolean = false;

	private _meaning_s: boolean = false;
	private _meaning_g: boolean = false;

	private _spelling_s: boolean = false;
	private _spelling_g: boolean = false;

	private _sentence_s: boolean = false;
	private _sentence_g: boolean = false;


	private _onClickBtn = (qtype: common.TypeQuiz) => {
		App.pub_playBtnTab();
		if(this._qtype === qtype) this._qtype = '';
		else this._qtype = qtype;
		// this.props.state.qtype = this._qtype;
	}
	private _onResult = (qtype: common.TypeQuiz, isGroup: boolean) => {
		const {state, actions} = this.props;
		if(actions.gotoQuizResult(qtype, isGroup)) {
			App.pub_playBtnTab();
		}
	}

	private _onSingle = () => {
		if(this._qtype === '') return;
		App.pub_playBtnTab();
		this.props.actions.setQuizInfo([], 5, false);
		// this.props.state.isGroup = false;
		this.props.state.qtype = this._qtype;
		this.props.state.prog = 'timer';
	}
	private _onGroup = () => {
		if(this._qtype === '') return;
		if(this._numOfStudent < 2) return;
		App.pub_playBtnTab();
		this.props.actions.setQuizInfo([], 5, true);
		// this.props.state.isGroup = true;
		this.props.state.qtype = this._qtype;
		this.props.state.prog = 'grouping';
	}
	private _setNavi() {
		this.props.actions.setNaviView(true);
		this.props.actions.setNavi(true, App.nextBook);
		this.props.actions.setNaviFnc(
			() => {
				this.props.state.prog = 'list';
			},
			null
		);
	}
	private _reloadedStudent = async () => {
		if(this.props.view) {
			this._numOfStudent = App.students.length;
		} else {
			this._numOfStudent = 0;
			return;
		}
		
		await kutil.wait(3000);
		if(this.props.view) {
			App.pub_reloadStudents(this._reloadedStudent);
		} else {
			this._numOfStudent = 0;
		}
	}
	public componentWillUpdate(next: IQuizSelect) {
		if(next.view && !this.props.view) {
			felsocket.sendPAD($SocketType.PAD_ONSCREEN, null);
			this._setNavi();
			this._qtype = '';
			if(next.state.hasPreview) {
				const words = next.actions.getWords();
				let sound = 0;
				let meaning = 0;
				let spelling = 0;
				let sentence = 0;
				for(const word of words) {
					sound += word.app_sound;
					meaning += word.app_meaning;
					spelling += word.app_spelling;
					sentence += word.app_sentence;
				}
				this._sound_avg = Math.round(sound / words.length);
				this._meaning_avg = Math.round(meaning / words.length);
				this._spelling_avg = Math.round(spelling / words.length);
				this._sentence_avg = Math.round(sentence / words.length);
			} else {
				this._sound_avg = -1;
				this._meaning_avg = -1;
				this._spelling_avg = -1;
				this._sentence_avg = -1;				
			}
			let tmp = next.actions.getQuizResult('sound');
			this._souns_s = tmp.single !== null;
			this._souns_g = tmp.group !== null;
			tmp = next.actions.getQuizResult('meaning');
			this._meaning_s = tmp.single !== null;
			this._meaning_g = tmp.group !== null;
			tmp = next.actions.getQuizResult('spelling');
			this._spelling_s = tmp.single !== null;
			this._spelling_g = tmp.group !== null;
			tmp = next.actions.getQuizResult('usage');
			this._sentence_s = tmp.single !== null;
			this._sentence_g = tmp.group !== null;
		}
	}
	public componentDidUpdate(prev: IQuizSelect) {
		if(this.props.view && !prev.view) {
			this._numOfStudent = 0;
			App.pub_reloadStudents(this._reloadedStudent);
		}
	}
	public render() {
		const qtype = this._qtype;
		const selected = this._qtype !== '';
		const viewSingle = this._souns_s || this._meaning_s || this._spelling_s || this._sentence_s;
		const style: React.CSSProperties = {};

		if(!this.props.view) {
			style.visibility = 'hidden';
			style.transition = 'visibility 0.3s 0.3s';
		}

		return (
			<div className="t_quiz_select" style={style}>
				<div className="title">QUIZ</div>
				<div className="quiz">
					<BtnItem 
						myqtype="sound" 
						qtype={qtype} 
						average={this._sound_avg} 
						viewSingleBtn={viewSingle} 
						view_s={this._souns_s} 
						view_g={this._souns_g} 
						onClick={this._onClickBtn}
						onResult={this._onResult}
					/>
					<BtnItem 
						myqtype="meaning" 
						qtype={qtype} 
						average={this._meaning_avg} 
						viewSingleBtn={viewSingle} 
						view_s={this._meaning_s} 
						view_g={this._meaning_g} 
						onClick={this._onClickBtn}
						onResult={this._onResult}
					/>
					<BtnItem 
						myqtype="spelling" 
						qtype={qtype} 
						average={this._spelling_avg} 
						viewSingleBtn={viewSingle} 
						view_s={this._spelling_s} 
						view_g={this._spelling_g} 
						onClick={this._onClickBtn}
						onResult={this._onResult}
					/>	
					<BtnItem 
						myqtype="usage" 
						qtype={qtype} 
						average={this._sentence_avg} 
						viewSingleBtn={viewSingle} 
						view_s={this._sentence_s} 
						view_g={this._sentence_g} 
						onClick={this._onClickBtn}
						onResult={this._onResult}
					/>
		
				</div>
				<div className="t_choice">
					<ToggleBtn className="single" disabled={!selected} onClick={this._onSingle}/>
					<ToggleBtn className={'group' + (this._numOfStudent < 2 ? ' hide' : '')} disabled={!selected} onClick={this._onGroup}/>
				</div>
			</div>
		);
	}
}

export default QuizSelect;


