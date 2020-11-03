import * as React from 'react';
import * as _ from 'lodash';
import { observer } from 'mobx-react';

import { App } from '../../../App';
import { ToggleBtn } from '@common/component/button';

import { observable } from 'mobx';
import { CoverPopup } from '../../../share/CoverPopup';
import SendUI from '../../../share/sendui_new';

interface IPopupItem {
	type: 'off'|'READALOUD'|'SHADOWING'|'QNA';
	view: boolean;
	onClosed: () => void;
	onSend: () => void;
}

@observer
class PassagePopup extends React.Component<IPopupItem> {
	@observable private m_view = false;

	private _onClose = () => {
		App.pub_playBtnTab();
		this.m_view = false;
	}
	public componentDidUpdate(prev: IPopupItem) {
		if (this.props.view && !prev.view) {
			this.m_view = true;
		} else if (!this.props.view && prev.view) {
			this.m_view = false;
		}
	}
	public render() {
		let title;
		if(this.props.type === 'READALOUD') title = 'READ ALONG';
		else if(this.props.type === 'SHADOWING') title = 'LISTEN & REPEAT';
		else if(this.props.type === 'QNA') title = 'Q & A';
		else title = this.props.type;

		return (
			<CoverPopup className={'passage_popup ' + this.props.type} view={this.props.view && this.m_view} onClosed={this.props.onClosed} >
				<span>{title}</span><ToggleBtn className="btn_close" onClick={this._onClose} />
				<div className="popup_content">
					<span>Read along together.</span>
					<span>Listen and repeat.</span>
					<span>Do you have any questions?</span>
				</div>
				<SendUI
					view={this.props.view}
					type={'teacher'}
					sended={false}
					originY={0}
					onSend={this.props.onSend}
				/>
			</CoverPopup>
		);
	}
}

export default PassagePopup;