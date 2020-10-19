import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { Observer, observer } from 'mobx-react';

import * as _ from 'lodash';

import { IStateCtx, IActionsCtx, SENDPROG } from './s_store';
import * as common from '../common';
import { observable } from 'mobx';
import { App } from '../../App';
import * as felsocket from '../../felsocket';
import { ToggleBtn } from '@common/component/button';
import * as kutil from '@common/util/kutil';
import * as butil from '@common/component/butil';

import SendUI from '../../share/sendui_new';
import * as style from '../../share/style';
import WrapTextNew from '@common/component/WrapTextNew';
import QuizMCBtn from '../../share/QuizMCBtn';
import * as StrUtil from '@common/util/StrUtil';

const SwiperComponent = require('react-id-swiper').default;

interface ISummaryChoice {
	num: number;
	view: boolean;
	text: string;
	selected: number;
	answer: number;
	prog: SENDPROG;
	onClick: (num: number) => void;
}
class SummaryChoice extends React.Component<ISummaryChoice> {
	private _onClick = () => {
		this.props.onClick(this.props.num);
	}
	public render() {
		const {num, text, selected, answer, prog} = this.props;
		let view = this.props.view;
		if(!view) {
			view = false;
		}
		return (
			<QuizMCBtn 
				className={'btn_choice'} 
				num={num} 
				on={num === selected}
				disabled={prog !== SENDPROG.READY}
				onClick={this._onClick}
			>
				<div>
					<WrapTextNew view={view} maxLineNum={1} lineHeight={120} minSize={27} maxSize={30} textAlign="left">
						{text}
					</WrapTextNew>
				</div>
			</QuizMCBtn>
		);
	}
}

interface ISummaryItem {
	view: boolean;
	summary: common.ISummarizing;
	prog: SENDPROG;
	selected: number;
	onSelect: (num: number) => void;
}
@observer
class SummaryItem extends React.Component<ISummaryItem> {
	private _jsx: JSX.Element;
	private _box: HTMLDivElement|null = null;
    private _max: string;
    private _rcalnum: number = 0;

    private _swiper: Swiper|null = null;

	constructor(props: ISummaryItem) {
        super(props);
        const summary = props.summary;
        let max = summary.choice_1;
        if(summary.choice_2.length > max.length) max = summary.choice_2;
        else if(summary.choice_3.length > max.length) max = summary.choice_3;

        const str_qustion = props.summary.question.replace(/<br>/gi, '');
        const nodes = butil.parseBlock(str_qustion, 'block', max);
        this._jsx = (<>{nodes.map((node, idx) => node)}</>);
        this._max = max;
	}
	private _refText = (el: HTMLDivElement) => {
		if(this._box || !el) return;
		this._box = el;
    }
    private _refSwiper = (el: SwiperComponent) => {
		if(this._swiper || !el) return;
		this._swiper = el.swiper;
	}

	public componentWillReceiveProps(next: ISummaryItem) {
        if(next.selected !== this.props.selected) {
            if(!this._box) return;

            const block = this._box.querySelector('.block');
            if(!block) return;
            const summary = next.summary;

            let text = this._max;
            if(next.selected === 1) text = next.summary.choice_1;
            else if(next.selected === 2) text = next.summary.choice_2;
            else if(next.selected === 3) text = next.summary.choice_3;
            
            while(block.lastChild) block.removeChild(block.lastChild);
            block.appendChild(document.createTextNode(text));

            if(next.selected === 0) {
                if(block.classList.contains('view')) block.classList.remove('view');
            } else {
                if(!block.classList.contains('view')) block.classList.add('view');
            }
        }
        if(next.selected) this._rcalnum++;
        else this._rcalnum = 0;
    }
    public componentDidUpdate(prev: ISummaryItem) {
		if(this.props.view && !prev.view) {
			if(this._swiper) {
				this._swiper.slideTo(0, 0);
				_.delay(() => {
					if(this._swiper) {
						this._swiper.update();
						if(this._swiper.scrollbar) this._swiper.scrollbar.updateSize();
					}
				}, 600);
			}
		}
	}
	public render() {
		const {view, summary, selected, prog} = this.props;

        // console.log(this._jsx);
		return (
			<>	
				<div className="quizs_box">
					<img src={App.data_url + summary.image} />
					{/* <div ref={this._refText}>{this._jsx}</div> */}
					<div ref={this._refText}>
                    <SwiperComponent
                        ref={this._refSwiper}
                        direction="vertical"
                        scrollbar={{ el: '.swiper-scrollbar', draggable: true,}}
                        observer={true}
                        slidesPerView="auto"
                        freeMode={true}						
                    >
                        <div className="txt_box">
                            {this._jsx}
                        </div>
                    </SwiperComponent>
					</div>
				</div>	
				<div className="choice_box">
					<SummaryChoice
						prog={prog}
						num={1}
						view={view}
						text={summary.choice_1}
						selected={selected}
						answer={summary.answer}
						onClick={this.props.onSelect}
					/>
					<SummaryChoice
						prog={prog}
						num={2}
						view={view}
						text={summary.choice_2}
						selected={selected}
						answer={summary.answer}
						onClick={this.props.onSelect}
					/>
					<SummaryChoice
						prog={prog}
						num={3}
						view={view}
						text={summary.choice_3}
						selected={selected}
						answer={summary.answer}
						onClick={this.props.onSelect}
					/>
				</div>
			</>
		);
	}
}


interface ISummaryBox {
	summary: common.ISummarizing;
	prog: SENDPROG;
	len?: number;
	selected: number;
}

class SummaryBox extends React.Component<ISummaryBox> {
	private _jsx: JSX.Element;
	private _box: HTMLDivElement|null = null;
	constructor(props: ISummaryBox) {
		super(props);
		const summary = props.summary;
		let correct;
		if(summary.answer === 2) correct = summary.choice_2;
		else if(summary.answer === 3) correct = summary.choice_3;
		else correct = summary.choice_1;
		
		const nodes = this._parseBlock(props.summary.question, 'block', correct);
		this._jsx = (<>{nodes.map((node, idx) => node)}</>);
	}
	private _refText = (el: HTMLDivElement) => {
		if(this._box || !el) return;
		this._box = el;
	}
    private _parseBlock(txt: string, className: string, newStr?: string) {
        const arr: React.ReactNode[] = [];
    
        const pattern = new RegExp(/\{(.*?)\}/g);
        let result = pattern.exec(txt);
        let lastIdx = 0;
        let key = 0;
        let sTmp = '';
        let script_arr;
        let sarr: React.ReactNode[];
    
        while (result) {
            if(result.index > lastIdx) {
                sTmp = txt.substring(lastIdx, result.index);
                script_arr = sTmp.split('<br>');
                sarr = [];
                script_arr.forEach((line, lidx) => { 
                    if(lidx >= script_arr.length - 1) sarr.push(<span key={'l1_' + lidx}>{line}</span>);
                    else sarr.push(<span key={lidx}>{'l1_' + line}<br/></span>);
                });
                arr.push((<span key={key++}>{sarr.map((node) => node)}</span>));
            }
            sTmp = result[1];
            let str = newStr;
            if(!str) str = sTmp;

            script_arr = str.split('<br>');
            sarr = [];
            script_arr.forEach((line, lidx) => { 
                if(lidx >= script_arr.length - 1) sarr.push(<span key={'l2_' + lidx}>{line}</span>);
                else sarr.push(<span key={'l2_' + lidx}>{line}<br/></span>);
            });
            arr.push((<span key={key++} className={className} data-correct={sTmp}>{sarr.map((node) => node)}</span>));
    
            lastIdx = pattern.lastIndex;
            result = pattern.exec(txt);
        }
        if(lastIdx < txt.length) {
            sTmp = txt.substring(lastIdx);
            script_arr = sTmp.split('<br>');
            sarr = [];
            script_arr.forEach((line, lidx) => { 
                if(lidx >= script_arr.length - 1) sarr.push(<span key={'l3_' + lidx}>{line}</span>);
                else sarr.push(<span key={'l3_' + lidx}>{line}<br/></span>);
            });
            arr.push((<span key={key++}>{sarr.map((node) => node)}</span>));
        }
        return arr;
    }
	public componentWillReceiveProps(next: ISummaryItem) {
		if(next.prog !== this.props.prog && next.prog >= SENDPROG.SENDED) {
			if(!this._box) return;

			const block = this._box.querySelector('.block');
			if(!block) return;
			const summary = next.summary;
	
			let text = '';

			if(next.prog >= SENDPROG.COMPLETE || next.selected === 0) {
				if(summary.answer === 2) text = summary.choice_2;
				else if(summary.answer === 3) text = summary.choice_3;
				else text = summary.choice_1;
			} else {
				if(next.selected === 1) text = summary.choice_1;
				if(next.selected === 2) text = summary.choice_2;
				if(next.selected === 3) text = summary.choice_3;
			}
			
			while(block.lastChild) block.removeChild(block.lastChild);
			block.appendChild(document.createTextNode(text));

			if(next.prog >= SENDPROG.COMPLETE) {
				if(block.classList.contains('view')) block.classList.remove('view');

				if(next.selected === summary.answer) {
					if(block.classList.contains('wrong')) block.classList.remove('wrong');
					if(!block.classList.contains('correct')) block.classList.add('correct');
				} else {
					if(block.classList.contains('correct')) block.classList.remove('correct');
					if(!block.classList.contains('wrong')) block.classList.add('wrong');					
				}
			} else {
				if(block.classList.contains('wrong')) block.classList.remove('wrong');
				if(block.classList.contains('correct')) block.classList.remove('correct');

				if ( next.selected > 0) {
					if(!block.classList.contains('view')) block.classList.add('view');
				} else {
					if(block.classList.contains('view')) block.classList.remove('view');
				}
			}
		}
	}


	public render() {
		const {summary, prog, selected} = this.props;


		return (
		<>
			<div  className="quiz_box">
				<div className="img-box">
					<img src={App.data_url + summary.image} />
					{/* <ToggleBtn className="btn_zoom" onClick={this._clickZoom}/> */}
				</div>
				<div ref={this._refText}>
                    {this._jsx}
                </div>
			</div>
			<div className="btn_arrow_down" style={{display: this.props.len === summary.seq ? 'none' : ''}}/>
		</>
		);
	}
}

interface ISSummary {
	view: boolean;
	state: IStateCtx;
	actions: IActionsCtx;
}
@observer
class SSummary extends React.Component<ISSummary> {
	@observable private _curIdx = 0;
	@observable private _selected: common.IQuizReturn[] = [];

    private _swiper: Swiper|null = null;
    
	constructor(props: ISSummary) {
		super(props);
		const summaries = props.actions.getData().summarizing;
		for(let i = 0; i < summaries.length; i++) {
            this._selected[i] = {
				answer: 0,
				stime: i === 0 ? Date.now() : 0,
				etime: 0,
			};
        }
	}
	private _refSwiper = (el: SwiperComponent) => {
		if(this._swiper || !el) return;
		this._swiper = el.swiper;
	}

	private _onNext = () => {
		const state = this.props.state;
		if(state.summaryProg !== SENDPROG.READY) return;
		else if(this._curIdx >= this._selected.length - 1) return;
		else if(this._selected[this._curIdx].answer === 0) return;

		App.pub_playBtnTab();
		this._curIdx++;
		
		if(this._selected[this._curIdx]) this._selected[this._curIdx].stime = Date.now();
	}
	private _onSend = async () => {
		const state = this.props.state;
		if(!App.student) return;
		else if(!this.props.view) return;
		else if(state.summaryProg !== SENDPROG.READY) return;
		else if(this._curIdx !== this._selected.length - 1) return;
		else if(this._selected[this._curIdx].answer === 0) return;

		state.summaryProg = SENDPROG.SENDING;
		App.pub_playToPad();
		
		const choices: common.IQuizReturn[] = [];
		this._selected.forEach((choice, idx) => {
			choices.push({
				answer: choice.answer,
				stime: choice.stime,
				etime: choice.etime,				
			});
		});
		const msg: common.IQuizReturnMsg = {
			msgtype: 'summary_return',
            id: App.student.id,
            returns: choices,
        };
        
		felsocket.sendTeacher($SocketType.MSGTOTEACHER, msg);
		await kutil.wait(500);

		if(!this.props.view) return;
		else if(state.summaryProg !== SENDPROG.SENDING) return;

		App.pub_playGoodjob();
		this.props.actions.startGoodJob();

		await kutil.wait(1500);
		if(!this.props.view) return;
		else if(state.summaryProg !== SENDPROG.SENDING) return;

		state.summaryProg = SENDPROG.SENDED;

	}
	private _onChange = (num: number) => {
		if(this.props.state.summaryProg !== SENDPROG.READY) return;
		if(this._curIdx < this._selected.length) {
			App.pub_playBtnTab();
			this._selected[this._curIdx].answer = num;
			this._selected[this._curIdx].etime = Date.now();
		}
		
	}

	public componentDidUpdate(prev: ISSummary) {
		if(!this.props.view && prev.view) {
			for(let i = 0; i < this._selected.length; i++) {
				this._selected[i].answer = 0;
				this._selected[i].stime = Date.now();
				this._selected[i].etime = 0;
			}
			this._curIdx = 0;
			if(this._swiper) {
				this._swiper.slideTo(0, 0);
				_.delay(() => {
					if(this._swiper) {
						this._swiper.update();
						if(this._swiper.scrollbar) this._swiper.scrollbar.updateSize();
					}
				}, 600);
			}
		}
	}

	public render() {
		const { view, state, actions} = this.props;

		const summaries = actions.getData().summarizing;
		let curIdx = this._curIdx;
		if(state.summaryProg >= SENDPROG.SENDED) curIdx = this._selected.length;
		
		const isResult =  curIdx === this._selected.length;
		const isLast =  curIdx === (this._selected.length - 1);

		let selected = this._selected[0].answer;
		if(curIdx < this._selected.length) selected = this._selected[curIdx].answer;
		else selected = 0;

		const btnNextView = selected > 0 && curIdx < this._selected.length - 1 && state.summaryProg === SENDPROG.READY;
		const sendView = selected > 0 && isLast && state.summaryProg <= SENDPROG.SENDING;

		return (
			<div className="s_summary" style={view ? undefined : style.HIDE}>
				<div className="btn_page_box" style={isResult ? style.NONE : undefined}>
					{summaries.map((summary, idx) => {
						return <span key={idx} className={curIdx === idx ? 'on' : ''}>{idx + 1}</span>;
					})}
				</div>
				<div className="table-container">
					<div className="table-wrapper" style={{left: -1280 * curIdx}}>
						{summaries.map((summary, idx) => {
							return (
								<div key={idx} className="summary-item">
									<SummaryItem 
										view={view}
										summary={summary} 
										prog={state.summaryProg}
										selected={this._selected[idx].answer}
										onSelect={this._onChange}

									/>
								</div>
							);
						})}

						<div className="s_summary_result" >
							<SwiperComponent
								ref={this._refSwiper}
								direction="vertical"
								scrollbar={{ el: '.swiper-scrollbar', draggable: true,}}
								observer={true}
								slidesPerView="auto"
								freeMode={true}						
							>
							{summaries.map((summary, idx) => {
								return (
									<div key={idx} className="summary_box">
										<SummaryBox 
											summary={summary}
											selected={this._selected[idx].answer}
											len={summaries.length}
											prog={state.summaryProg}
										/>
									</div>
								);
							})}
							</SwiperComponent>
						</div>
					</div>
				</div>
				<ToggleBtn className="btn_next" view={btnNextView} onClick={this._onNext}/>
				<SendUI
					view={sendView}
					type={'pad'}
					originY={0}
					sended={false}
					onSend={this._onSend}
				/>
			</div>
		);
	}
}
export default SSummary;


