import * as React from 'react';
import * as _ from 'lodash';
import { observer } from 'mobx-react';
import { observable, _allowStateChangesInsideComputed } from 'mobx';
import { DraggableCore, DraggableData, DraggableEvent } from 'react-draggable';

import { MPlayer } from '@common/mplayer/mplayer';
import { ToggleBtn } from '@common/component/button';
import * as common from '../../common';
import { _getJSX, _getBlockJSX,_sentence2jsx } from '../../../get_jsx';

function _getTimeStr(ms: number, max: number) {
	const maxSec = Math.round(max / 1000);

	let sec = Math.round(ms / 1000);
	let min = Math.floor(sec / 60);
	let hour = Math.floor(min / 60);
	let ret = '';
	sec = sec % 60;
	min = min % 60;
	if (hour > 0 || maxSec >= 3600) {
		ret = hour + ':';
		if (min >= 10) ret += min + ':';
		else ret += '0' + min + ':';
	} else if (maxSec >= 600) {
		if (min >= 10) ret += min + ':';
		else ret += '0' + min + ':';
	} else ret = min + ':';

	if (sec >= 10) ret += sec;
	else ret += '0' + sec;

	return ret;
}

@observer
class ProgBox extends React.Component<{ player: MPlayer, disable: boolean, checkups: common.IScript[] }> {
	private m_dragging = false;
	private m_bg!: HTMLElement;
	private m_bgW = 0;
	private m_s = 0;
	@observable private m_dragLeft = 0;
    private m_dragLeft_s = 0;
    
	private _seek = _.throttle((percent: number) => {
		if(this.props.disable) return;
		const player = this.props.player;
		player.seek(player.duration * percent / 100);
    }, 300, { leading: false });
    
	private _refBG = (el: HTMLElement | null) => {
		if (this.m_bg || !el) return;
		this.m_bg = el;
	}

	private _start = (evt: DraggableEvent, data: DraggableData) => {
		if (!this.m_bg || this.props.disable) return;
		const player = this.props.player;
		if (player.duration <= 0) return;

		this.m_bgW = this.m_bg.getBoundingClientRect().width;
		if (this.m_bgW <= 0) return;

		let left = 100 * data.x / this.m_bgW;
		if (left < 0) left = 0;
		else if (left > 100) left = 100;
		this.m_dragLeft_s = left;
		this.m_dragLeft = left;
		this.m_s = data.x;
		this.m_dragging = true;
    }
    
	private _drag = (evt: DraggableEvent, data: DraggableData) => {
		if (!this.m_dragging || this.props.disable) return;
		let left = this.m_dragLeft_s + 100 * (data.x - this.m_s) / this.m_bgW;
		if (left < 0) left = 0;
		else if (left > 100) left = 100;
		this.m_dragLeft = left;

		const player = this.props.player;
		if (!player.bPlay) this._seek(left);
    }
    
	private _stop = (evt: DraggableEvent, data: DraggableData) => {
		if (!this.m_dragging || this.props.disable) return;

		this.m_dragging = false;
		const player = this.props.player;
		player.seek(player.duration * this.m_dragLeft / 100);
	}

	public render() {
		const {player, checkups} = this.props;
		let percent = 0;
		const duration = player.duration;
		if (duration > 0) {
			percent = (player.viewTime / duration) * 100;
		}
		let btnLeft = 0;
		let dragLeft = this.m_dragLeft;
		if (this.m_dragging) btnLeft = dragLeft;
		else btnLeft = percent;

		return (
			<>
				<div className="prog_box">
					<DraggableCore
						onDrag={this._drag}
						onStart={this._start}
						onStop={this._stop}
					>
						<div className="prog_bg" ref={this._refBG}>
							<div className="prog_bar" style={{ width: percent + '%' }} />
							<div className="prog_tmp" />
							{checkups.map((script, idx) => {
								let per = (duration > 0) ? (script.dms_end * 1000 / duration) * 100 : 0;
								return <span key={idx} className="checkup" style={{ left: per + '%' }}/>;
							})}
							<ToggleBtn className="prog_btn" style={{ left: btnLeft + '%' }} />
						</div>
					</DraggableCore>
				</div>
				<div className="video_time" style={{ width: (player.duration >= 600000 ? 110 : 135) + 'px' }}><span>{_getTimeStr(player.viewTime, player.duration)}</span> / <span>{_getTimeStr(player.duration, player.duration)}</span></div>
			</>
		);
	}
}

export default ProgBox;