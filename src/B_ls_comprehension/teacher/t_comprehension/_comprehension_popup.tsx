import * as React from 'react';
import * as _ from 'lodash';
import { observer } from 'mobx-react';
import { observable } from 'mobx';

import { ToggleBtn } from '@common/component/button';
import * as kutil from '@common/util/kutil';

import { App } from '../../../App';
import SendUINew from '../../../share/sendui_new';
import { CoverPopup } from '../../../share/CoverPopup';

/* 팝업Page */
interface IComprehensionPopup {
	type: 'off'|'Q&A' |'ROLE PLAY'|'SHADOWING';	// 19-02-01 190108_검수사항 p.13 수정 
	view: boolean;
	imgA: string;
	imgB: string;
	onSend: (roll: ''|'A'|'B') => void;
	onClosed: () => void;
}

@observer
class ComprehensionPopup extends React.Component<IComprehensionPopup> {
	@observable private m_view = false;
	@observable private m_sendView = false;

	@observable private m_roll: ''|'A'|'B' = '';
	private onSend = async () => {
		this.props.onSend(this.m_roll);
		await kutil.wait(400);
		this.m_view = false;
	}
	private _onClose = () => {
		this.m_view = false;
	}
	private _onRollA = () => {
		if(this.props.type !== 'ROLE PLAY') return;
		App.pub_playBtnTab();
		this.m_roll = 'A';
		this.m_sendView = true;
	}
	private _onRollB = () => {
		if(this.props.type !== 'ROLE PLAY') return;
		App.pub_playBtnTab();
		this.m_roll = 'B';
		this.m_sendView = true;
	}
	public componentDidUpdate(prev: IComprehensionPopup) {
		if (this.props.view && !prev.view) {
			this.m_view = true;
			this.m_sendView = this.props.type !== 'ROLE PLAY' ;
			this.m_roll = '';
		} else if (!this.props.view && prev.view) {
			this.m_view = false;
			this.m_sendView = false;
			this.m_roll = '';
		}
	}
	public render() {
		const { view, onClosed, imgA, imgB } = this.props;
		return (
			<CoverPopup className={'compre_popup ' + this.props.type} view={view && this.m_view} onClosed={this.props.onClosed} >
				<span>{this.props.type === 'SHADOWING' ? 'LISTEN & REPEAT' : this.props.type}</span><ToggleBtn className="btn_close" onClick={this._onClose} />
				<div className="popup_content">
					<span>Do you have any questions?</span>
					<span>Choose the role.</span>
					<span>Listen and repeat.</span>
					<div className="img_box">
						<div className={'A' + (this.m_roll === 'A' ? ' on' : '')}>
							<span className="icon_check A" />
							<img src={App.data_url + imgA} onClick={this._onRollA}/>
						</div>
						<div className={'B' + (this.m_roll === 'B' ? ' on' : '')}>
							<span className="icon_check B" />
							<img src={App.data_url + imgB} onClick={this._onRollB}/>
						</div>
					</div>
				</div>
				<SendUINew
					view={this.m_sendView}
					preventUpWhenView={true}
					type={'teacher'}
					sended={false}
					originY={0}
					onSend={this.onSend}
				/>
			</CoverPopup>
		);
	}
}

export default ComprehensionPopup;