import * as React from 'react';
import * as _ from 'lodash';
import { observable } from 'mobx';
import { observer } from 'mobx-react';

import { SENDPROG } from '../t_store';
import { App } from '../../../App';
import { ToggleBtn } from '@common/component/button';

import * as kutil from '@common/util/kutil';
import * as common from '../../common';

import { CoverPopup } from '../../../share/CoverPopup';
import SendUI from '../../../share/sendui_new';

interface ISheetPopup {
	view: boolean;
	onClosed: () => void;
	onSend: (sheetpage: common.SHEETPAGE) => void;
}
@observer
class SheetPopup extends React.Component<ISheetPopup> {
	@observable private m_view = false;

	@observable private _sheetpage: common.SHEETPAGE = '';
	@observable private _prog = SENDPROG.READY;

	private _onKeyboard = () => {
		if (!this.props.view) return;
		else if (this._prog !== SENDPROG.READY) return;
		else if (this._sheetpage === 'keyboard') return;
		App.pub_playBtnTab();
		this._sheetpage = 'keyboard';
	}
	private _onPentool = () => {
		if (!this.props.view) return;
		else if (this._prog !== SENDPROG.READY) return;
		else if (this._sheetpage === 'pentool') return;
		App.pub_playBtnTab();
		this._sheetpage = 'pentool';
	}
	private _onSend = async () => {
		if (!this.props.view) return;
		else if (this._prog !== SENDPROG.READY) return;
		else if (this._sheetpage === '') return;

		App.pub_playToPad();
		this._prog = SENDPROG.SENDING;

		await kutil.wait(500);

		if (!this.props.view) return;
		else if (this._prog !== SENDPROG.SENDING) return;

		this._prog = SENDPROG.SENDED;

		this.props.onSend(this._sheetpage);
	}
	private _onClose = () => {
		App.pub_playBtnTab();
		this.m_view = false;
	}
	public componentDidUpdate(prev: ISheetPopup) {
		if (this.props.view && !prev.view) {
			this.m_view = true;
			this._sheetpage = '';
			this._prog = SENDPROG.READY;
		} else if (!this.props.view && prev.view) {
			this.m_view = false;
			this._prog = SENDPROG.READY;
		}
	}
	public render() {
		return (
			<CoverPopup className="sheet_popup" view={this.m_view} onClosed={this.props.onClosed}>
				<span className="title">NEW SHEET</span><ToggleBtn className="btn_close" onClick={this._onClose} />
				<div>
					<span className="content">Make your own graphic organizer.</span>
					<div className="sheet_btns">
						<ToggleBtn className="btn_pentool" on={this._sheetpage === 'pentool'} onClick={this._onPentool} />
						<ToggleBtn className="btn_keyboard" on={this._sheetpage === 'keyboard'} onClick={this._onKeyboard} />
					</div>
				</div>
				<SendUI
					view={this.props.view && this._sheetpage !== '' && this._prog < SENDPROG.SENDED}
					type={'teacher'}
					sended={false}
					originY={0}
					preventUpWhenView={true}
					onSend={this._onSend}
				/>
			</CoverPopup>
		);
	}
}

export default SheetPopup;