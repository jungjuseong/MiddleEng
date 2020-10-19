import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { Observer, observer } from 'mobx-react';

import * as _ from 'lodash';
import * as common from '../common';

import { App } from '../../App';
import { MPlayer, MConfig, IMedia, MPRState } from '@common/mplayer/mplayer';
import { ToggleBtn } from '@common/component/button';
import { matr_transformPoint } from '@common/util/geom';



interface IWatch {
	word: common.IWordData;
	view: boolean;
	idx: number;
	current: number;

	onPlayEnd: (idx: number) => void;
}
@observer
class Watch extends React.Component<IWatch> {
	private _player: MPlayer = new MPlayer(new MConfig(true));
	private _refVideo = (el: HTMLVideoElement|null) => {
		if(this._player.media || !el) return;
		this._player.mediaInited(el as IMedia);

		// 영상 자동재생 추가 2018-12-06 수정
		this._player.addOnPlayEnd(() => {
			this.props.onPlayEnd(this.props.idx);
		});
	}
	private _onPause = () => {
		if(this._player.bPlay) this._player.pause();
		else this._player.play();
	}
	private _onPlay = () => {
		if(!this._player.bPlay) this._player.play();
	}
	public componentDidUpdate(prev: IWatch) {
		const {view, current, idx, word} = this.props;
		
		const on = current === idx;
		const prevOn = prev.current === prev.idx;
		const preView = prev.view;

		if((view && !preView) || (on && !prevOn)) {
			if(view && on) this.props.word.app_studied = true;
		}
		
		if(view) {
			if(current !== prev.current) { 
				if(Math.abs(current - idx) < 4) {
					if(this._player.myState === MPRState.UNINITIALIZED) {
						if(idx === current) {
							this._player.load(App.data_url + word.video);
						} else {
							_.delay(() => {
								if(this.props.view) { 
									this._player.load(App.data_url + word.video);
								}
							}, 300);
						}
						
					}
				} else {
					this._player.unload();
				}

				if(current === idx && !this._player.bPlay) {
					this._player.play();
				} else if(current !== idx && this._player.bPlay) {
					this._player.gotoAndPause(0);
				}
			}
		} else if(!view && prev.view) {
			this._player.unload();
		}
	}
	public render() {
		const word = this.props.word;
		return (
			<>
				<video ref={this._refVideo} onClick={this._onPause}/>
				<ToggleBtn className={'btn_play' + (this._player.bPlay ? ' play' : '')} onClick={this._onPlay}/>
				<span className="icon_entry">{word.entry}</span>
			</>
		);
	}
}

export default Watch;