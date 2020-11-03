import * as React from 'react';
import * as ReactDOM from 'react-dom';

import * as _ from 'lodash';
import { Observer, observer } from 'mobx-react';

import { TeacherContext, useTeacher, IStateCtx, IActionsCtx, BTN_DISABLE } from './t_store';
import { ResponsiveText } from '../../share/ResponsiveText';
import { App } from '../../App';
import * as felsocket from '../../felsocket';
import { ToggleBtn } from '@common/component/button';
import * as common from '../common';
import { observable } from 'mobx';
import SendUI from '../../share/sendui_new';
import { CorrectBar } from '../../share/Progress_bar';
import { CoverPopup } from '../../share/CoverPopup';
import * as style from '../../share/style';

import NItem from '@common/component/NItem';
import WrapText from '@common/component/WrapText';
import { SENDPROG } from '../student/s_store';
import * as butil from '@common/component/butil';
import * as kutil from '@common/util/kutil';
import WrapTextNew from '@common/component/WrapTextNew';
import QuizMCBtn from '../../share/QuizMCBtn';

const SwiperComponent = require('react-id-swiper').default;

function parseLine(txt: string, className: string) {
	const arrBR = txt.split('<br>');

	return (
		<>
			{arrBR.map((line, idx) => {
				const arr = butil.parseBlock(line, className);
				return (
					<React.Fragment key={idx}>{arr}<br /></React.Fragment>
					);
			})}
		</>
	);
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

			/*if(question.answer !== 1 && selected === 1) btnClassName1 = btnClassName1 + ' wrong';
			else if(question.answer !== 2 && selected === 2) btnClassName2 = btnClassName2 + ' wrong';
			else if(question.answer !== 3 && selected === 3) btnClassName3 = btnClassName3 + ' wrong';
			else if(question.answer !== 4 && selected === 4) btnClassName4 = btnClassName4 + ' wrong';*/
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

interface IClue {
	view: boolean;
	idx: number;
	questions: common.IQuestion;
	onClosed: () => void;
}
@observer
class CluePopup extends React.Component<IClue> {
	@observable private m_view = false;
	@observable private _swiper: Swiper|null = null;

	// private _jsx: JSX.Element;

	constructor(props: IClue) {
		super(props);
		// const hints = props.questions.hint;
		// this._jsx = parseLine(hints, 'block');
	}

	private _refSwiper = (el: SwiperComponent) => {
		if(this._swiper || !el) return;
		this._swiper = el.swiper;
	}
	private _onClose = () => {
		this.m_view = false;
	}
	public componentDidUpdate(prev: IClue) {
		if (this.props.view && !prev.view) {
			this.m_view = true;
			if(this._swiper) {
				this._swiper.slideTo(0, 0);
			}
			_.delay(() => {
				if(this._swiper) {
					this._swiper.update();
					if(this._swiper.scrollbar) this._swiper.scrollbar.updateSize();
					this._swiper.slideTo(0, 0);
				}
			}, 500);
		} else if (!this.props.view && prev.view) {
			this.m_view = false;
		}
	}
	public render() {
        const { view, questions } = this.props;
        const hint = questions.hint;

        return (
            <CoverPopup className="clue_popup" view={this.props.view && this.m_view} onClosed={this.props.onClosed} >
                <span className="title">CLUE</span><ToggleBtn className="btn_close" onClick={this._onClose} />
                <div className="clue_script">
                    <SwiperComponent
                        ref={this._refSwiper}
                        direction="vertical"
                        scrollbar={{ el: '.swiper-scrollbar', draggable: true,}}
                        observer={true}
                        slidesPerView="auto"
                        freeMode={true}						
                    >
                        <div className="clue_question">
                            <div className="icon_question" />
                            {this.props.idx + 1}. {this.props.questions.question}
                        </div>
                        <div className="script">
                            <div className="icon_clue" />
                            {/* {this._jsx} */}
                            <span dangerouslySetInnerHTML={{__html: hint}}/>
                        </div>
                    </SwiperComponent>
                </div>
            </CoverPopup>
        );
	}
}

interface IRet { 
	c1: string[];
	c2: string[];
	c3: string[];
	c4: string[];
	percent: number;
}

interface IQUESTION {
	view: boolean;
	inview: boolean;
    videoPopup: boolean;
    viewStoryBook: boolean;
	studying: boolean;
	data: common.IData;
	state: IStateCtx;
	actions: IActionsCtx;
	onStudy: (studying: BTN_DISABLE) => void;
	onSetNavi: (title: 'COMPREHENSION'|'VISUALIZING', tab: 'Passage'|'GraphicOrganizer') => void;
}

@observer
class QUESTION extends React.Component<IQUESTION> {
	@observable private _curIdx = 0;
	@observable private _retCnt = 0;
	@observable private _numOfStudent = 0;
	@observable private _clue = false;

	@observable private _prog = SENDPROG.READY;
	@observable private _viewAnswer = false;
	@observable private _selected: number[] = [];
	
	private _returns: IRet[] = [];
	private _retUsers: string[] = [];

	constructor(props: IQUESTION) {
		super(props);
		const questions = props.data.question;
		for(let i = 0; i < questions.length; i++) {
			this._returns[i] = {
				c1: [], c2: [], c3: [], c4: [], percent: -1
			};
			this._selected[i] = 0;
		}
	}

	private _onPage = (idx: number) => {
		// if(this.props.studying) return;
		if(idx !== this._curIdx) {
			App.pub_playBtnPage();
			this._curIdx = idx;
		}
	}

	private _clickClue = () => {
		if(this._prog < SENDPROG.SENDED) return;
		else if(!this._viewAnswer) return;
		App.pub_playBtnTab();

		this._clue = !this._clue;
	}
	private _offClue = () => this._clue = false;

	private _clickAnswer = () => {
		if(this._prog < SENDPROG.SENDED) return;
		else if(this._viewAnswer) return;
		App.pub_playBtnTab();
		this.props.actions.setQuestionFnc(null);
		const msg: common.IMsg = {msgtype: 'question_end'};
		felsocket.sendPAD($SocketType.MSGTOPAD, msg);

		this._prog = SENDPROG.COMPLETE;
		this._viewAnswer = true;
		this.props.onStudy(''); 
		this.props.actions.setNavi(true, true);
	}

	private _clickReturn = () => {
		App.pub_playBtnTab();
		felsocket.startStudentReportProcess($ReportType.JOIN, this._retUsers);	
		// TO DO
	}

	private _onSend = () => {
		if(!this.props.view || !this.props.inview) return;
		else if(this._prog > SENDPROG.READY) return;
		this._prog = SENDPROG.SENDING;
		this._viewAnswer = false;

		for(let i = 0; i < this._returns.length; i++) {
			const ret = this._returns[i];
			while(ret.c1.length > 0) ret.c1.pop();
			while(ret.c2.length > 0) ret.c2.pop();
			while(ret.c3.length > 0) ret.c3.pop();
			while(ret.c4.length > 0) ret.c4.pop();
			ret.percent = -1;
		}
		this._retCnt = 0;
		while(this._retUsers.length > 0) this._retUsers.pop();
		
		App.pub_playToPad();
		const msg: common.IMsg = {
			msgtype: 'question_send',
		};
		felsocket.sendPAD($SocketType.MSGTOPAD, msg);
		this.props.onStudy('ex_video');   // TO CHECK
		App.pub_reloadStudents(async () => {
			if(!this.props.view || !this.props.inview) return;
			else if(this._prog !== SENDPROG.SENDING) return;
			
			this._numOfStudent = App.students.length;
			await kutil.wait(500);
			if(!this.props.view || !this.props.inview) return;
			else if(this._prog !== SENDPROG.SENDING) return;
			this._prog = SENDPROG.SENDED;
			this.props.actions.setQuestionFnc(this._onReturn);
			this.props.actions.setNavi(false, false);
		});
	}
	private _onReturn = (qmsg: common.IQuizReturnMsg) => {
		if(this._prog < SENDPROG.SENDED) return;
		else if(this._viewAnswer) return;
		let sidx = -1;
		for(let i = 0; i < App.students.length; i++) {
			if(App.students[i].id === qmsg.id) {
				sidx = i;
				break;
			}
		}
		if(sidx < 0) return;
		if(this._retUsers.indexOf(qmsg.id) >= 0) return;
		
		this._retUsers.push(qmsg.id);
		felsocket.addStudentForStudentReportType6(qmsg.id);

		const questions = this.props.data.question;
		for(let i = 0; i < questions.length; i++) {  // 문제별 
			const question = questions[i];

			const ret = this._returns[i];
			const sel = qmsg.returns[i].answer;
			let correct = 0;
			if(ret) {
				if(sel === 1) ret.c1.push(qmsg.id);
				else if(sel === 2) ret.c2.push(qmsg.id);
				else if(sel === 3) ret.c3.push(qmsg.id);
				else if(sel === 4) ret.c4.push(qmsg.id);

				if(question.answer === 1) ret.percent = Math.round( 100 * ret.c1.length / this._numOfStudent);
				else if(question.answer === 2) ret.percent = Math.round( 100 * ret.c2.length / this._numOfStudent);
				else if(question.answer === 3) ret.percent = Math.round( 100 * ret.c3.length / this._numOfStudent);
				else if(question.answer === 4) ret.percent = Math.round( 100 * ret.c4.length / this._numOfStudent);
			}

			
		}		
		
		this._retCnt = this._retUsers.length;
		
	}
	private _setNavi() {
		this.props.actions.setNaviView(true);
		if(this._prog === SENDPROG.SENDING || this._prog === SENDPROG.SENDED) this.props.actions.setNavi(false, false);
		else this.props.actions.setNavi(true, true);

		this.props.actions.setNaviFnc(
			() => {
				if(this._curIdx === 0) {
					this.props.state.isNaviBack = true;
					this.props.onSetNavi('COMPREHENSION','Passage');
				} else {
					App.pub_playBtnPage();
					this._curIdx = this._curIdx - 1;
				}
			},
			() => {
				if(this._curIdx >= this.props.data.question.length - 1) {
					this.props.onSetNavi('VISUALIZING','GraphicOrganizer');
				} else {
					App.pub_playBtnPage();
					this._curIdx = this._curIdx + 1;
				}
			}
		);
	}

	private _init() {
		this._curIdx = 0;
		this._clue = false;

		if(!this._viewAnswer) {
			this._prog = SENDPROG.READY;
			// this._viewAnswer = false;
			this._retCnt = 0;
			this._numOfStudent = 0;
			while(this._retUsers.length > 0) this._retUsers.pop();
			for(let i = 0; i < this._returns.length; i++) {
				const ret = this._returns[i];
				while(ret.c1.length > 0) ret.c1.pop();
				while(ret.c2.length > 0) ret.c2.pop();
				while(ret.c3.length > 0) ret.c3.pop();
				while(ret.c4.length > 0) ret.c4.pop();
				ret.percent = -1;
			}

			for(let i = 0; i < this._selected.length; i++) {
				this._selected[i] = 0;
			}
		}

		felsocket.sendPAD($SocketType.PAD_ONSCREEN, null);

		// for(let i = 0; i < this._selected.length; i++) {
		// 	this._selected[i] = 0;
		// }
	}

	public componentDidUpdate(prev: IQUESTION) {
		if(this.props.videoPopup && !prev.videoPopup) {
			if(this.props.state.isVideoStudied) this.props.state.isVideoStudied = false;
		} else if (!this.props.videoPopup && prev.videoPopup) {
			if(this.props.state.isVideoStudied) this._init();
		}
		if(this.props.inview && !prev.inview) {
			this._init();
			this._setNavi();
			if(this.props.state.isNaviBack) {
				this._curIdx = this.props.data.question.length - 1;
				this.props.state.isNaviBack = false;
			}
		} else if(!this.props.inview && prev.inview) {
			this.props.actions.setQuestionFnc(null);

			// for(let i = 0; i < this._selected.length; i++) {
			// 	this._selected[i] = 0;
			// }
        }
        
		if(this.props.inview && prev.inview) {
			if (!this.props.videoPopup && prev.videoPopup) this._setNavi();
			else if(!this.props.viewStoryBook && prev.viewStoryBook) this._setNavi();
		}
	}
	
	private _onMc = (idx: number, selected: number) => {
		if(this._viewAnswer) return;

		this._selected[idx] = selected; 
	}

	public render() {
		const curIdx = this._curIdx;
		const {view, inview, data} = this.props;
		return (
		<div className="QUESTION" style={inview ? undefined : style.NONE}>
			<div className="nav">
				<div className="btn_page_box">
					{data.question.map((page, idx) => {
						return <NItem key={idx} on={idx === curIdx} idx={idx} onClick={this._onPage} />;
					})}
				</div>

				<div className="right">
					<div className="return_cnt_box white" onClick={this._clickReturn} style={this._prog >= SENDPROG.SENDED ? undefined : style.NONE}>
						<div>{this._retCnt}/{this._numOfStudent}</div>
					</div>

					<ToggleBtn 
						className="btn_answer" 
						on={this._viewAnswer} 
						view={this._prog >= SENDPROG.SENDED}
						onClick={this._clickAnswer} 
					/>
					<ToggleBtn 
						className="btn_clue" 
						on={this._clue}
						view={this._prog >= SENDPROG.SENDED && this._viewAnswer} 
						onClick={this._clickClue} 
					/>
				</div>
			</div>
			{data.question.map((quest, idx) => {
				return (
					<QuestionItem 
						key={idx} 
						idx={idx}  
						view={inview && idx === curIdx} 
						question={quest}
						viewAnswer={this._viewAnswer}
						ret={this._returns[idx]}
						selected={this._selected[idx]}
						onClick={this._onMc}
					/>
				);
			})}
			<SendUI
				view={inview && this._prog < SENDPROG.SENDED && !this.props.state.videoPopup}
				type={'teacher'}
				sended={false}
				originY={0}
				onSend={this._onSend}
			/>
			{data.question.map((clue,idx) => {
				return <CluePopup key={idx} view={this._clue && idx === curIdx} questions={clue} idx={curIdx} onClosed={this._offClue}/>;
			})}
		</div>
		);
	}
}

export default QUESTION;


