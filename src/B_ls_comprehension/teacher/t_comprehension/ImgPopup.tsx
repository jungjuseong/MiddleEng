import * as React from 'react';
import * as _ from 'lodash';

import { observer } from 'mobx-react';
import { observable } from 'mobx';

import { ToggleBtn } from '@common/component/button';

import { App } from '../../../App';
import { CoverPopup } from '../../../share/CoverPopup';

interface IImgPopup {
	url: string;
	view: boolean;
	onClosed: () => void;
}

@observer
class ImgPopup extends React.Component<IImgPopup> {
	@observable private m_view = false;

	private _onClose = () => {
		App.pub_playBtnTab();
		this.m_view = false;
	}
	public componentDidUpdate(prev: IImgPopup) {
		if(this.props.view && !prev.view) {
			this.m_view = true;
		} else if(!this.props.view && prev.view) {
			this.m_view = false;
		}
	}

	public render() {
		return (
			<CoverPopup className="img_popup" view={this.m_view} onClosed={this.props.onClosed}>
				<div>
					<img src={this.props.url} />
					<ToggleBtn className="btn_zoom" onClick={this._onClose}/>
				</div>
			</CoverPopup>
		);
	}
}

export default ImgPopup;