import * as React from 'react';
import { observable } from 'mobx';
import { observer } from 'mobx-react';
import * as _ from 'lodash';

import { ToggleBtn } from '@common/component/button';
import { IStateCtx, IActionsCtx, TProg } from './t_store';
import { App } from '../../App';
import VocaList from './t_voca_list';
import QuizSelect from './t_quiz_select';
import Timer from './t_timer';
import TQuiz from './t_quiz';
import Grouping from './t_grouping';
import Board from './t_board';

import VideoDirection from '../../share/video-direction';

const _WIDTH = 1280;

interface IContentBox {
	prog: TProg;
	state: IStateCtx;
	actions: IActionsCtx;
}

@observer
class ContentBox extends React.Component<IContentBox> {
	@observable private _idx = 0;
	@observable private _idx_sub = 0;

	private _bRapid_sub = false;
	private _grouping: React.CSSProperties = {};
	private _timer: React.CSSProperties = {};
	private _board: React.CSSProperties = {};
	
	private _goToIntro = () => {
        alert('go to Intro page');
        return;
    }

	public componentWillUpdate(next: IContentBox) {
		const { state,prog } = this.props;
		
		if(state.prog !== next.state.prog) {
			if(state.isGroup) {
				this._grouping.display = '';
				this._board.display = '';
				this._grouping.opacity = (next.prog === 'grouping' || prog === 'grouping') ? 1 : 0;
				this._timer.opacity = (next.prog === 'timer' || prog === 'timer') ? 1 : 0;
				this._board.opacity = (next.prog === 'board' || prog === 'board') ? 1 : 0;
			} else {
				this._grouping.display = 'none';
				this._board.display = 'none';
				this._timer.opacity = (next.prog === 'timer' || prog === 'timer') ? 1 : 0;
			}
		}
	}

	public componentDidUpdate(prev: IContentBox) {
		const { state,prog } = this.props;

		if(prog !== prev.prog) {
			let idx = 0;
			let idx_sub = 0;
			if(state.isGroup) {
				switch (prog) {
					case 'list': 			idx = 1; idx_sub = 0; break;
					case 'quiz-select': 	idx = 2; idx_sub = 0; break;
					case 'grouping': 		idx = 3; idx_sub = 0; break;
					case 'timer': 			idx = 3; idx_sub = 1; break;
					case 'board': 			idx = 3; idx_sub = 2; break;						
					case 'quiz':			idx = 3; idx_sub = 3; break;
					default: 				break;
				}
			} else {
				switch (prog) {
					case 'list': 			idx = 1; idx_sub = 0; break;
					case 'quiz-select': 	idx = 2; idx_sub = 0; break;
					case 'timer': 			idx = 3; idx_sub = 0; break;
					case 'quiz':			idx = 3; idx_sub = 1; break;
					default: 				break;
				}
			}

			if(this._idx !== idx) {
				const pidx = this._idx;
				this._idx = idx;
				if(this._idx_sub !== idx_sub) {
					this._bRapid_sub = idx_sub > this._idx_sub;

					if(this._bRapid_sub) {
						this._idx_sub = idx_sub;
					} else {
						const pidx_sub = this._idx_sub;
						_.delay(() => {
							if(this._idx === idx && this._idx_sub === pidx_sub) {
								this._idx_sub = idx_sub;
							}
						}, 300);
					}	
				} else this._bRapid_sub = false;
			} else if(this._idx_sub !== idx_sub) {
				this._bRapid_sub = false;
				this._idx_sub = idx_sub;
			}
		}
	}

	public render() {
		const { prog, state, actions } = this.props;
		const style_sub: React.CSSProperties = {
			left: (-this._idx_sub * _WIDTH) + 'px',
			transitionDelay: this._bRapid_sub ? '0s' : '',
		};

		return (
			<div className={'content-container'}>
				<div className="close_box">
                    <ToggleBtn className="btn_intro" onClick={this._goToIntro}/>
                </div>
				<div className="content-wrapper" style={{left: (-this._idx * _WIDTH) + 'px'}}>
					<div>
						<VideoDirection 
							className="video-direction"
							view={state.viewDiv === 'direction'} 
							on={state.directionON} 
							isTeacher={true}
							video_url={_digenglish_lib_ + 'direction/ls_rw_voca.webp'}
							video_frame={125}
							onEndStart={actions.onDirectionEndStart}
							onEnd={actions.onDirectionEnded}
						>
							<div className="lesson">{App.lesson}</div>
						</VideoDirection>
					</div>
					<div>
						<VocaList view={prog === 'list'} state={state} actions={actions}/>
					</div>
					<div>
						<QuizSelect view={prog === 'quiz-select'} state={state} actions={actions}/>
					</div>
					<div className="sub-container">
						<div className="sub-wrapper" style={style_sub}>
							<div style={{...this._grouping}}><Grouping view={prog === 'grouping'} state={state} actions={actions}/></div>
							<div style={{...this._timer}}><Timer view={prog === 'timer'} state={state} actions={actions}/></div>
							<div style={{...this._board}}><Board view={prog === 'board'} numOfReturn={state.numOfReturn} state={state} actions={actions}/></div>
							<div><TQuiz view={prog === 'quiz'} quizProg={state.quizProg} numOfReturn={state.numOfReturn} state={state} actions={actions}/></div>
						</div>
					</div>
				</div>
			</div>
		);
	}
}

export default ContentBox;