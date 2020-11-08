import * as React from 'react';
import * as _ from 'lodash';
import { observer } from 'mobx-react';
import { _allowStateChangesInsideComputed } from 'mobx';

import { MPlayer } from '@common/mplayer/mplayer';
import { ToggleBtn } from '@common/component/button';
import * as common from '../../common';

import { _getJSX, _getBlockJSX,_sentence2jsx } from '../../../get_jsx';
import ProgBox from './_prog_box';

/*
	roll: ''|'A'|'B';
	shadowing: boolean;
	viewCountDown: boolean;
*/

type POPUPTYPE = 'off'|'READALOUD' | 'SHADOWING' | 'CHECKUP' | 'CHECKUPSET';

interface IControlBox {
	player: MPlayer;
	viewCaption: boolean;
	disable: boolean;
	vpop: POPUPTYPE;
	study: POPUPTYPE;
	checkups: common.IScript[];
	isPlay: boolean;
	toggleMute: () => void;
	toggleFullscreen: () => void;
	toggleCaption: () => void;
	togglePlay: () => void;
	stopClick: () => void;

	readaloudClick: () => void;
	shadowingClick: () => void;
	checkupClick: () => void;

	prevClick: () => void;
	nextClick: () => void;
}

@observer
class ControlBox extends React.Component<IControlBox> {
	public render() {
		const {player, study, vpop} = this.props;
		return (
			<div className="control">
				<div className="control_left">
					<ToggleBtn className="btn_play_pause" on={this.props.isPlay} onClick={this.props.togglePlay} />
					<ToggleBtn className="btn_stop" onClick={this.props.stopClick} />
					<ToggleBtn className="btn_prev" onClick={this.props.prevClick} />
					<ToggleBtn className="btn_next" onClick={this.props.nextClick} />
				</div>
				<div className={'control_top ' + study}>
					<div>
						<ProgBox player={player} checkups={this.props.checkups} disable={this.props.disable}/>
					</div>
				</div>
				{/* btn_subscript, btn_audio 추가*/}
				<div className="control_right">
					<ToggleBtn className={'btn_subscript ' + study} on={this.props.viewCaption} onClick={this.props.toggleCaption} />
					<ToggleBtn className="btn_audio" onClick={this.props.toggleMute} on={player.muted} />
					<ToggleBtn className="btn_fullscreen" onClick={this.props.toggleFullscreen} />
					<ToggleBtn className="btn_fullscreen_off" onClick={this.props.toggleFullscreen} />
				</div>
				<div className="control_center">
					<ToggleBtn 
						className="btn_v_listen_repeat" 
						on={vpop === 'SHADOWING' || study === 'SHADOWING'}
						disabled={study === 'READALOUD' || study === 'CHECKUP'}
						onClick={this.props.shadowingClick}
					/>
					<ToggleBtn 
						className="btn_v_readalong"
						on={vpop === 'READALOUD' || study === 'READALOUD'}
						disabled={study === 'CHECKUP' || study === 'SHADOWING'}
						onClick={this.props.readaloudClick}
					/>
					<ToggleBtn 
						className="btn_v_checkup" 
						on={vpop === 'CHECKUP' || study === 'CHECKUP'}
						disabled={study === 'READALOUD' || study === 'SHADOWING'}
						onClick={this.props.checkupClick}
					/>
				</div>
			</div>
		);
	}
}

export default ControlBox;