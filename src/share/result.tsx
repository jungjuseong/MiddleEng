import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { observable, action, values } from 'mobx';
import { observer } from 'mobx-react';
import * as _ from 'lodash';


import { ToggleBtn } from '@common/component/button';

import { App } from '../App';

const SwiperComponent = require('react-id-swiper').default;

const SLIDES_PER_VIEW = 10;

interface IQIem {
	item: IQusetionResult;
	idx: number;
	percent: number;
	haspre: boolean;
	onClick: (ev: React.MouseEvent<HTMLElement>, idx: number) => void;
}
class QIem extends React.Component<IQIem> {
	private _onClick = (ev: React.MouseEvent<HTMLElement>) => {
		this.props.onClick(ev, this.props.idx);
	}
	public render() {
		const {item, idx, percent, haspre} = this.props;
		const preview = haspre ? item.preview : -1;
		return (
			<div className={'q_item' + (haspre ? ' preview' : '')} onClick={this._onClick}>
				<span>{this.props.idx + 1}</span>
				<span>
					<span className="inclass">
						<span style={{width: percent + '%'}}>
							<span className={percent > 2 ? 'inner' : 'outer'}>{percent + '%'}</span>
						</span>
					</span>
					<span className="preclass" style={{display: preview < 0 ? 'none' : ''}} > 
						<span style={{width: preview + '%'}}>
							<span className={preview > 2 ? 'inner' : 'outer'}>{preview + '%'}</span>
						</span>
					</span>
				</span>
				<span>{this.props.item.name}</span>
			</div>
		);
	}
}

interface IQIemGroup {
	item: IGaNaResult;
	idx: number;
	numOfGa: number;
	numOfNa: number;
	numQ?: boolean;                       // 문항 갯수가 열개 이상
	onClick: (ev: React.MouseEvent<HTMLElement>, idx: number) => void;
}
class QIemGroup extends React.Component<IQIemGroup> {
	private _onClick = (ev: React.MouseEvent<HTMLElement>) => {
		this.props.onClick(ev, this.props.idx);
	}
	public render() {
		const {item, idx, numOfGa, numOfNa, numQ} = this.props;
		const {ga_correct, na_correct} = item;

		const p_ga = (numOfGa > 0) ? 100 * ga_correct / numOfGa : 0;
		const p_na = (numOfNa > 0) ? 100 * na_correct / numOfNa : 0;

		// 빈 그래프에도 클릭하면 해당 문제페이지로 이동 2018-12-06 수정
		return (
			<div className={'q_g_item' + (numQ === true ? ' small' : '')}>
				<div className="box ga" onClick={this._onClick}>
					<span style={{width: p_ga + '%'}} onClick={this._onClick}>
						<span className={p_ga > 2 ? 'inner' : 'outer'}>{Math.round(p_ga) + '%'}</span>
					</span>
				</div>
				<div className="qnum" onClick={this._onClick}>{idx + 1}</div>
				<div className="box na" onClick={this._onClick}>
					<span style={{width: p_na + '%'}}>
						<span className={p_na > 2 ? 'inner' : 'outer'}>{Math.round(p_na) + '%'}</span>
					</span>
				</div>
			</div>
		);
	}
}

/* 
	blockNum : Block 의 넓이
*/
class UItem extends React.Component<{data: IUserResult, qnum: number, isGroup: boolean, blockNum: number}> {
	public render() {
		const { data, qnum, isGroup } = this.props;
		const qarr = Array.from(Array(qnum).keys());

		let className = '';
		let jsx;
		if(this.props.isGroup) {
			className = ( data.ga_na === 'na') ? ' na' : ' ga';
			let ncorrect = 0;
			for(const q of  data.result) {
				if(q) ncorrect++;
			}
			const percent = Math.round(100 * ncorrect / data.result.length);
			jsx = (
					<>					
						<span style={{width: percent + '%'}} >
							<span className={percent > 2 ? 'inner' : 'outer'}>{Math.round(percent) + '%'}</span>
						</span>
					</>
			);
		} else {
			jsx = (
				<>
					{qarr.map( (idx) => {
						const isCorrect = data.result[idx] === true;
						return <span key={data.id + idx} className={isCorrect ? 'correct' : 'wrong'} style={{width: this.props.blockNum + 'px'}}/>;
					})}
				</>
			);
		}
		return (
			<div className={'list' + className}>
				<span className={'grade ' + 'grade' + data.grade} >{data.grade}</span>
				<span>{data.name}<span hidden={this.props.isGroup === true}>{'(' + data.numOfCorrect + ')'}</span></span>				
				<span  className={isGroup === true ? 'percent' : 'block'}>
				{jsx}
				</span>
			</div>
			
		);
	}
}
class UNum extends React.Component<{idx: number, onClick: (ev: React.MouseEvent<HTMLElement>, idx: number) => void, blockNum: number}> {
	private _onClick = (ev: React.MouseEvent<HTMLElement>) => {
		this.props.onClick(ev, this.props.idx);
	}
	public render() {
		return <span className="unum" onClick={this._onClick} style={{width: this.props.blockNum + 'px'}}>{this.props.idx + 1}</span>;

	}
}
interface IStudentResult {
	isGroup: boolean;
	view: boolean;
	div: 'question'|'student';	
	users: IUserResult[];
	questions: any[];
	onQuestion: (ev: React.MouseEvent<HTMLElement>, idx: number) => void;
}
class Student extends React.Component<IStudentResult> {
	private _swiper?: Swiper;
	private _averge = 0;

	public componentWillUpdate(next: IStudentResult) {
		if(next.view && next.div === 'student' && this.props.div !== 'student') {
			this._averge = 0;
			if(next.isGroup) {
				const users = next.users;
				let sumq = 0;
				let sumc = 0;
				for(const u of users) {
					sumq = sumq + u.result.length;
					sumc = sumc + u.numOfCorrect;
				}

				this._averge = Math.round( 100 * sumc / sumq);
			}
		}
	}
	public componentDidUpdate(prev: IStudentResult) {
		if( (this.props.view && !prev.view) || this.props.div !== prev.div) {
			if(this.props.view && this.props.div === 'student') {
				this._updateSwiper();
			} else if(this.props.view && !prev.view) {
				_.delay(() => {
					if(this._swiper) {
						this._swiper.slideTo(0, 0);
						this._updateSwiper();
						this._swiper.slideTo(0, 0);
					}
				}, 300);
			}
		}
	}

	private _updateSwiper() {
		if(this._swiper) {
			
			this._swiper.update();
			if(this._swiper.scrollbar) this._swiper.scrollbar.updateSize();
		}
	}
	private _refSwiper =  (el: SwiperComponent|null) => {
		if(this._swiper || !el) return;
		this._swiper = el.swiper;
	}
	public render() {

		// 문제 수 마다  block의 width 값 다르게 처리
		const qlength = this.props.questions.length;

		let blockW: number;
		if(qlength <= 5) blockW = 155;
		else if(qlength > 10) blockW = 51;
		else blockW = 78;

		let listJSX;
		if(this.props.isGroup) {
			listJSX = (
				<>
					<div className="average">
						{/* 기존 평균값 icon이 아닌 아래의 width표시를 원하셔서 수정 */}
						<div className="icon_average" style={{left: this._averge + '%'}}>
							<span>Average</span>
							<span>{'('  + this._averge + '%)'}</span>
						</div>
						<div style={{left: this._averge + '%'}}/>
					</div>
					<div className="list-g">
						<span>0</span>
						<span>10</span>
						<span>20</span>
						<span>30</span>
						<span>40</span>
						<span>50</span>
						<span>60</span>
						<span>70</span>
						<span>80</span>
						<span>90</span>
						<span>100(%)</span>
					</div>
				</>
			);
		} else {
			listJSX = (
				<div className="list">
					<span/>
					<span/>
					<span>{this.props.questions.map((val, idx) => {
						return <UNum key={'unum_' + idx} idx={idx} onClick={this.props.onQuestion} blockNum={blockW}/>;
					})}</span>
				</div>
			);			
		}

		const style: React.CSSProperties = {};
		if(this.props.div !== 'student') {
			style.visibility = 'hidden';
			style.opacity = 0;
			style.pointerEvents = 'none';
		}
	
		return(
			<>
			<div className={'student' + (this.props.isGroup ? ' s-group' : '')} style={style}>
				<div className="icon_info"/>
				{listJSX}
				<SwiperComponent 
					ref={this._refSwiper} 
					direction="vertical"
					observer={true}
					slidesPerView="auto"
					freeMode={true}
					mousewheel={true}	
					noSwipingClass="result-no-swiping"	
					scrollbar={{el: '.swiper-scrollbar',draggable: true, hide: false}}
				>
					<div className={this.props.users.length <= SLIDES_PER_VIEW ? 'result-no-swiping' : ''}>
					<div className="average"><div style={{width: this._averge + '%'}}/></div>
					{this.props.users.map((val, idx) => {
						return <UItem key={val.id} data={val} qnum={this.props.questions.length} isGroup={this.props.isGroup} blockNum={blockW}/>;
					})}
					</div>
				</SwiperComponent>
			</div>
					

			</>
		);
	}
}

interface IResultGroup {
	view: boolean;
	div: 'question'|'student';
	users: IUserResult[];
	questions: IGaNaResult[];
	viewBtnBack?: boolean;
	tmp: number;
	onBack?: (ev: React.MouseEvent<HTMLElement>) => void;
	onQuestion: (ev: React.MouseEvent<HTMLElement>, idx: number) => void;
	onChangeDiv: (ev: React.MouseEvent<HTMLElement>, viewDiv: 'question'|'student') => void;

	ga_point: number;
	na_point: number;
	numOfGa: number;
	numOfNa: number;
}
@observer
class QuestionGroup extends React.Component<IResultGroup> {
	/*
	private m_swiper!: Swiper;
	private _refSwiper = (el: SwiperComponent|null) => {
		if(this.m_swiper || !el) return;
		this.m_swiper = el.swiper;
	}

	public componentDidUpdate(prev: IResultGroup) {
		if(this.props.view && !prev.view) {
			this.m_swiper.slideTo(0, 0);
			_.delay(() => {
				this.m_swiper.update();
				this.m_swiper.scrollbar.updateSize();
				this.forceUpdate();
			}, 50);
		}
	}
	*/

	public render() {
		const {ga_point, na_point, questions, view, div} = this.props;
		const style: React.CSSProperties = {};
		if(div !== 'question') {
			style.pointerEvents = 'none';
			style.opacity = 0;
			style.zIndex = -1;
		}

		const arr: string[] = ['icon_win'];
		if(ga_point > na_point) arr.push('ga');
		else if(ga_point < na_point) arr.push('na');

		return (
			<div className="question_g" style={style}>
				<div className="point ga">{ga_point}</div>
				<div className="point na">{na_point}</div>
				<div className={arr.join(' ')} hidden={ga_point === na_point}/>
				<div className="q_list">
					{this.props.questions.map((val, idx) => {
						
						let numQ;
						if(this.props.questions.length > 10) numQ = true;	// 10문제 이상일 경우 
						else numQ = false;

						return (
							<QIemGroup 
								key={'q_' + idx} 
								item={val} 
								idx={idx}
								numQ={numQ}
								numOfGa={this.props.numOfGa}
								numOfNa={this.props.numOfNa}
								onClick={this.props.onQuestion}
							/>
						);
					})}
				</div>
				<div style={{height: '0px',}}/>
			</div>
		);
	}
}
@observer
export class ResultGroup extends React.Component<IResultGroup> {
	public static defaultProps = {
		viewBtnBack: true,
	};
	private _clickQ = (ev: React.MouseEvent<HTMLElement>) => {
		App.pub_playBtnTab();
		this.props.onChangeDiv(ev, 'question');
	}
	private _clickS = (ev: React.MouseEvent<HTMLElement>) => {
		App.pub_playBtnTab();
		this.props.onChangeDiv(ev, 'student');
	}

	public render() {
		const {view} = this.props;
		
		return (
			<div className="share_result">
				<div className="icon_result_group" style={{display: this.props.div === 'question' ? '' : 'none'}}/>
				<div className="title-result" style={{display: this.props.div === 'question' ? 'none' : ''}}>RESULTS</div>
				<QuestionGroup {...this.props}/>
				<Student {...this.props} isGroup={true}/>
				<div className="result_btn_box">
					<ToggleBtn onClick={this._clickQ} disabled={this.props.div === 'question'} className="btn_q"/>
					<ToggleBtn onClick={this._clickS} disabled={this.props.div === 'student'} className="btn_s"/>
				</div>
				<ToggleBtn className="common_back" view={this.props.viewBtnBack} onClick={this.props.onBack}/>
			</div>
		);
	}
}
interface IResultNormal {
	view: boolean;
	haspre: boolean;
	div: 'question'|'student';
	users: IUserResult[];
	questions: IQusetionResult[];
	viewBtnBack?: boolean;
	tmp: number;
	onBack?: (ev: React.MouseEvent<HTMLElement>) => void;
	onQuestion: (ev: React.MouseEvent<HTMLElement>, idx: number) => void;
	onChangeDiv: (ev: React.MouseEvent<HTMLElement>, viewDiv: 'question'|'student') => void;
}
class QuestionNormal extends React.Component<IResultNormal> {
	private m_swiper!: Swiper;

	private _refSwiper =  (el: SwiperComponent|null) => {
		if(this.m_swiper || !el) return;
		this.m_swiper = el.swiper;
	}


	public componentDidUpdate(prev: IResultNormal) {
		if(this.props.view && !prev.view) {
			// console.log('update swiper a');
			this.m_swiper.slideTo(0, 0);
			_.delay(() => {
				this.m_swiper.update();
				if(this.m_swiper.scrollbar) this.m_swiper.scrollbar.updateSize();
				this.forceUpdate();

				// console.log('update swiper b');
			}, 500);
		}
	}

	public render() {
		const numOfStudent = this.props.users.length;

		return (
			
			<div className="question" hidden={this.props.div !== 'question'}>
				<div className="q_title">
					<span>0</span>
					<span>10</span>
					<span>20</span>
					<span>30</span>
					<span>40</span>
					<span>50</span>
					<span>60</span>
					<span>70</span>
					<span>80</span>
					<span>90</span>
					<span>100(%)</span>
				</div>
				<SwiperComponent
					ref={this._refSwiper} 
					direction="vertical"
					observer={true}
					slidesPerView="auto"
					freeMode={true}	
					noSwipingClass="result-no-swiping"	
					scrollbar={{el: '.swiper-scrollbar',draggable: true, hide: false}}
				>
					<div style={{height: 'auto'}} className={this.props.questions.length <= 10 ? 'result-no-swiping' : ''}>
				{this.props.questions.map((val, idx) => {
					let percent = numOfStudent > 0 ? Math.round((val.numOfCorrect / numOfStudent) * 100) : 0;
					if(percent > 100) percent = 100;
					return (
						<QIem 
							key={'q_' + idx} 
							item={val} 
							idx={idx} 
							percent={percent}
							haspre={this.props.haspre}
							onClick={this.props.onQuestion}
						/>
					);
				})}
					</div>
				</SwiperComponent>
		</div>
		);
	}
}
@observer
export class Result extends React.Component<IResultNormal> {
	public static defaultProps = {
		viewBtnBack: true,
	};
	private _clickQ = (ev: React.MouseEvent<HTMLElement>) => {
		App.pub_playBtnTab();
		this.props.onChangeDiv(ev, 'question');
	}
	private _clickS = (ev: React.MouseEvent<HTMLElement>) => {
		App.pub_playBtnTab();
		this.props.onChangeDiv(ev, 'student');
	}

	public render() {
		return (
			<div className="share_result">
				<div className={this.props.haspre ? 'icon_result_info' : 'icon_inclass_info'} style={{display: this.props.div === 'question' ? '' : 'none'}}/>
				<div className="title-result">RESULTS</div>
				<QuestionNormal {...this.props}/>
				<Student {...this.props} isGroup={false}/>

				<div className="result_btn_box">
					<ToggleBtn onClick={this._clickQ} disabled={this.props.div === 'question'} className="btn_q"/>
					<ToggleBtn onClick={this._clickS} disabled={this.props.div === 'student'} className="btn_s"/>
				</div>
				<ToggleBtn className="common_back" view={this.props.viewBtnBack} onClick={this.props.onBack}/>
			</div>
		);
	}
}
