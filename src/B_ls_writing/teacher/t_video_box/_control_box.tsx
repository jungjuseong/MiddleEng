import * as React from 'react';
import * as _ from 'lodash';
import { observer } from 'mobx-react';

import { MPlayer } from '@common/mplayer/mplayer';
import { ToggleBtn } from '@common/component/button';

import ProgBox from './ProgBox';
/*
	roll: ''|'A'|'B';
	shadowing: boolean;
	viewCountDown: boolean;
*/
interface IControlBox {
	player: MPlayer;
	viewCaption: boolean;
	disable: boolean;
	isPlay: boolean;
	toggleMute: () => void;
	toggleFullscreen: () => void;
	toggleCaption: () => void;
	togglePlay: () => void;
	stopClick: () => void;

	prevClick: () => void;
	nextClick: () => void;
}

@observer
class ControlBox extends React.Component<IControlBox> {
	public render() {
		const player = this.props.player;
		return (
			<div className="control">
				<div className="control_left">
					<ToggleBtn className="btn_play_pause" on={this.props.isPlay} onClick={this.props.togglePlay} />
					<ToggleBtn className="btn_stop" onClick={this.props.stopClick} />
					<ToggleBtn className="btn_prev" onClick={this.props.prevClick} />
					<ToggleBtn className="btn_next" onClick={this.props.nextClick} />
				</div>
				<div className="control_top">
					<div>
						<ProgBox player={player} disable={this.props.disable}/>
					</div>
				</div>
				{/* btn_subscript, btn_audio 추가*/}
				<div className="control_right">
					<ToggleBtn className="btn_subscript" on={this.props.viewCaption} onClick={this.props.toggleCaption} />
					<ToggleBtn className="btn_audio" onClick={this.props.toggleMute} on={player.muted} />
					<ToggleBtn className="btn_fullscreen" onClick={this.props.toggleFullscreen} />
					<ToggleBtn className="btn_fullscreen_off" onClick={this.props.toggleFullscreen} />
				</div>
			</div>
		);
	}
}

export default ControlBox;