import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { Observer, observer } from 'mobx-react';
import { hot } from 'react-hot-loader';
import * as _ from 'lodash';

import { Selector, SelectorState } from './selector';
import { ToggleBtn } from '@common/component/button';
import { observable } from 'mobx';
import { App } from '../App';
import * as felsocket from '../felsocket';




const num_state = new SelectorState(1, 10, 1);
const min_state = new SelectorState(0, 10, 1);
const sec_state = new SelectorState(0, 55, 5);



interface IQuizNumTime {
	className: string;
	view: boolean;
	title: string;
	numAll: number;
	numStudied: number;
	numAi: number;

	gotoQuizSelect: () => void;
	onStart: (nqType: QUIZ_SELECT_TYPE, numOfQuiz: number, timeOfQuiz: number) => void;
}
@observer
class QuizNumTime extends React.Component<IQuizNumTime> {
	@observable private _nqType: QUIZ_SELECT_TYPE = '';

	public constructor(props: IQuizNumTime) {
		super(props);

		num_state.reset();
		min_state.reset();
		sec_state.reset();

		const mean = Math.round((this.props.numAll - 1) / 2);
		num_state.setMinMaxStep(1, this.props.numAll, 1, false, false, mean);
		min_state.setMinMaxStep(0, 10, 1, false, false, 0);
		sec_state.setMinMaxStep(0, 55, 5, true, false, 10);
	}

	public componentDidUpdate(prev: IQuizNumTime) {
		if(this.props.view && !prev.view) {
			// this._setNavi();
			num_state.reset();
			min_state.reset();
			sec_state.reset();

			const mean = Math.round((this.props.numAll - 1) / 2);
			num_state.setMinMaxStep(1, this.props.numAll, 1, false, false, mean);
			min_state.setMinMaxStep(0, 10, 1, false, false, 0);
			sec_state.setMinMaxStep(0, 55, 5, true, false, 10);
			
			this._nqType = '';
		} else if(!this.props.view && prev.view) {
			_.delay(() => {
				this._nqType = '';
				
				num_state.reset();
				min_state.reset();
				sec_state.reset();
			}, 500);
		}
	}
	private _onAll = () => {
		App.pub_playBtnTab();
		min_state.reset();
		sec_state.reset();
		num_state.reset();
		if(this._nqType === 'all') {
			this._nqType = '';
			const mean = Math.round((this.props.numAll - 1) / 2);
			num_state.setMinMaxStep(1, this.props.numAll, 1, false, false, mean);
			min_state.setMinMaxStep(0, 10, 1, false, false, 0);
			sec_state.setMinMaxStep(0, 55, 5, true, false, 10);
		} else {
			num_state.setMinMaxStep(1, this.props.numAll, 1, false, true);
			min_state.setMinMaxStep(0, 10, 1, false, false, 0);
			sec_state.setMinMaxStep(0, 55, 5, true, false, 10);
			this._nqType = 'all';
		}
	}
	private _onStudied = () => {
		if(this.props.numStudied < 1) return;
		App.pub_playBtnTab();
		min_state.reset();
		sec_state.reset();
		num_state.reset();
		if(this._nqType === 'studied') {
			this._nqType = '';
			const mean = Math.round((this.props.numAll - 1) / 2);
			num_state.setMinMaxStep(1, this.props.numAll, 1, false, false, mean);
			min_state.setMinMaxStep(0, 10, 1, false, false, 0);
			sec_state.setMinMaxStep(0, 55, 5, true, false, 10);
		} else {
			num_state.setMinMaxStep(1, this.props.numStudied, 1, false, true);
			min_state.setMinMaxStep(0, 10, 1, false, false, 0);
			sec_state.setMinMaxStep(0, 55, 5, true, false, 10);
			this._nqType = 'studied';
		}
	}
	private _onAi = () => {
		if(this.props.numAi < 1) return;
		App.pub_playBtnTab();
		min_state.reset();
		sec_state.reset();
		num_state.reset();
		if(this._nqType === 'ai') {
			this._nqType = '';
			const mean = Math.round((this.props.numAll - 1) / 2);
			num_state.setMinMaxStep(1, this.props.numAll, 1, false, false, mean);
			min_state.setMinMaxStep(0, 10, 1, false, false, 0);
			sec_state.setMinMaxStep(0, 55, 5, true, false, 10);
		} else {
			num_state.setMinMaxStep(1, this.props.numAi, 1, false, true);
			min_state.setMinMaxStep(0, 10, 1, false, false, 0);
			sec_state.setMinMaxStep(0, 55, 5, true, false, 10);
			this._nqType = 'ai';
		}
	}
	private _onStart = () => {
		if(!this.props.view) return;
		const qtime = min_state.value * 60 + sec_state.value;
		if(qtime <= 0) return;

		if(this._nqType === '') this.props.onStart('all', num_state.value, qtime);
		else this.props.onStart(this._nqType, num_state.value, qtime);
	}
	
	private _onBack = () => {
		App.pub_playBtnTab();
		this.props.gotoQuizSelect();
	}
	public render() {
		const {numStudied, numAi, title} = this.props;
		const nqType = this._nqType;
		const style: React.CSSProperties = {};
		if(!this.props.view) {
			style.visibility = 'hidden';
			style.transition = 'visibility 0.3s 0.3s';
		}
		return (
			<div className={this.props.className} style={style}>
				<div className="timer">
					<div className="title">{title}</div>
				</div>
				<div className="check_btns">
					<ToggleBtn className="btn_all" on={nqType === 'all'} onClick={this._onAll}/>
					<ToggleBtn className="btn_studied" disabled={numStudied === 0} on={nqType === 'studied'}  onClick={this._onStudied}/>
					{/* <ToggleBtn className="btn_ai" disabled={numAi === 0} on={nqType === 'ai'} onClick={this._onAi}/> */}
				</div>
				<div className="selector_box">
					<div className="number_select">
						<Selector unlimit={false} state={num_state} unit={' '}/>
					</div>
						<div className="timer_select">
							<div className="selector_L">
								<Selector unlimit={false} state={min_state} unit={'Min(s)'}/>
							</div>
							<div className="selector_R">
								<Selector unlimit={false} state={sec_state} unit={'Sec(s)'}/>
							</div>
						</div>
				</div>
				<ToggleBtn className="btn_start" disabled={(min_state.value === 0 && sec_state.value === 0)} onClick={this._onStart}/>
				<ToggleBtn className="btn_back" onClick={this._onBack}/>
			</div>
		);
	}
}
export default QuizNumTime;


