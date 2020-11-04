import * as React from 'react';
import { observer } from 'mobx-react';
import * as _ from 'lodash';
import { IStateCtx, IActionsCtx, BTN_DISABLE } from '../t_store';

import { App } from '../../../App';

import NItem from '@common/component/NItem';
import * as common from '../../common';
import { observable } from 'mobx';

import * as felsocket from '../../../felsocket';
import * as style from '../../../share/style';

import { MPlayer, MConfig } from '@common/mplayer/mplayer';

import WarmupVideo from './_warmup_video';
import WarmupItem from './_warmup_item';

interface IWarmup {
	view: boolean;
	inview: boolean;
    videoPopup: boolean;
    viewStoryBook: boolean;
	data: common.IData;
	state: IStateCtx;
	actions: IActionsCtx;
	onStudy: (studying: BTN_DISABLE) => void;
	onSetNavi: (title: 'Compreshension', tab: 'Passage') => void;
}

@observer
class Warmup extends React.Component<IWarmup> {
	private m_player = new MPlayer(new MConfig(true));
	@observable private _curIdx_tgt = 0;
	@observable private _video_zoom = false;

	private _onPage = (idx: number) => {
		if(this._curIdx_tgt !== idx) {
			App.pub_playBtnPage();
			this._curIdx_tgt = idx;
			this.props.actions.setWarmupFnc(null);
			felsocket.sendPAD($SocketType.PAD_ONSCREEN, null);
			this.props.onStudy('');
		}
	}
	private _onVideoZoomed = () => {
		this._video_zoom = true;
	}
	private _setNavi() {
		this.props.actions.setNaviView(true);
		this.props.actions.setNavi(true, true);
		this.props.actions.setNaviFnc(
			() => {
				if(this._curIdx_tgt === 0) {
					this.props.actions.gotoDirection();
				} else {
					App.pub_stop();
					App.pub_playBtnPage();
					this._curIdx_tgt = this._curIdx_tgt - 1;
					this.props.actions.setWarmupFnc(null);
					felsocket.sendPAD($SocketType.PAD_ONSCREEN, null);
					this.props.onStudy('');
				}
			},
			() => {
				if(this._curIdx_tgt >= this.props.data.warmup.length - 1) {
					this.props.onSetNavi('Compreshension','Passage');
				} else {
					App.pub_stop();
					App.pub_playBtnPage();
					this._curIdx_tgt = this._curIdx_tgt + 1;
					this.props.actions.setWarmupFnc(null);
					felsocket.sendPAD($SocketType.PAD_ONSCREEN, null);
					this.props.onStudy('');
				}
			}
		);
	}

	public componentDidUpdate(prev: IWarmup) {
		if(this.props.view && !prev.view) {
			// this._curIdx_tgt = 0;
			this._setNavi();
		} else if(!this.props.view && prev.view) {
			// this.props.actions.setWarmupFnc(null);
		}
		if(this.props.inview && !prev.inview) {
			this._curIdx_tgt = 0;
			felsocket.sendPAD($SocketType.PAD_ONSCREEN, null);
			this.props.onStudy('');
			this._setNavi();
			if(this.props.state.isNaviBack) {
				this._curIdx_tgt = this.props.data.warmup.length - 1;
				this.props.state.isNaviBack = false;
			}
		} else if(!this.props.inview && prev.inview) {
			this.props.actions.setWarmupFnc(null);
		}

		if(this._video_zoom) this._video_zoom = false;

		if(this.props.videoPopup && !prev.videoPopup) {
			if(this.m_player.bPlay) this.m_player.pause();
			this._video_zoom = false;
		} else if(!this.props.videoPopup && prev.videoPopup) {
			this._video_zoom = true;
		}
		 
		if(this.props.inview && prev.inview) {
			if (!this.props.videoPopup && prev.videoPopup) this._setNavi();
			else if(!this.props.viewStoryBook && prev.viewStoryBook) this._setNavi();
		}
	}
	public render() {
		const curIdx_tgt = this._curIdx_tgt;
		const {view, inview, data, state, actions} = this.props;

		let video_jsx;
		let className;
		if(data.warmup_type === common.WarmupType.VIDEO) {
			className = ' video';
			video_jsx = (
				<div className="video_container">
					<WarmupVideo 
						view={view && inview}
						player={this.m_player} 
						data={data}
						onZoomed={this._onVideoZoomed}
					/>
				</div>
			);
		} else className = ' image';

		const returns = state.warmup_returns;

		return (
			<>
			<div className={'warmup' + className} style={inview ? undefined : style.NONE}>
				<div className="nav">
					{data.warmup.length > 1 && 
					<div className="btn_page_box">
						{data.warmup.length > 1 && data.warmup.map((page, idx) => {
							return <NItem key={idx} on={idx === curIdx_tgt} idx={idx} onClick={this._onPage} />;
						})}
					</div>}{/*p1 수정 사항 2020_06_19 */} 
				</div>

				{data.warmup.map((warmup, idx) => {
					return (
						<WarmupItem 
							key={idx} 
							idx={idx} 
							warmupType={data.warmup_type}
							viewDiv={state.viewDiv} 
							view={inview && curIdx_tgt === idx}
							data={warmup}
							state={state}
							actions={actions}
							returns={returns[idx]}
							videoZoom={this._video_zoom}
						/>
					);
				})}

				{video_jsx}


			</div>
			</>
		);
	}
}
export default Warmup;


