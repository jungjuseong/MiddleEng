import * as React from 'react';
import * as _ from 'lodash';
import { observer } from 'mobx-react';
import { observable, } from 'mobx';

import { ToggleBtn } from '@common/component/button';
import { App } from '../../../App';

import * as common from '../../common';

@observer
export class CaptionBox extends React.Component<{view: boolean, script?: common.IScript}> {
	@observable private _viewEng = true;
	@observable private _viewTrans = true;
	private _toggleEng = () => {
		this._viewEng = !this._viewEng;
	}
	private _toggleTrans = () => {
		this._viewTrans = !this._viewTrans;
	}	
	public render() {
		const {view, script} = this.props;
		// console.log(App.lang);
		let eng;
		let trans;
		if(script) {
			if(this._viewEng) eng = script.dms_eng;
			else eng = <>&nbsp;</>;
			if(this._viewTrans) trans = script.dms_kor;
			else trans = <>&nbsp;</>;
		} else {
			eng = <>&nbsp;</>;
			trans = <>&nbsp;</>;
		}
		return (
			<div className="caption_box" style={{display: this.props.view ? '' : 'none'}}>
				<div className="caption_eng"><span>{eng}</span><ToggleBtn className="btn_eng" on={this._viewEng} onClick={this._toggleEng}/></div>
				{/* <div className="caption_trans"><span>{trans}</span><ToggleBtn className="btn_trans" on={this._viewTrans} onClick={this._toggleTrans}/></div> */}
			</div>
		);
	}
}

export default CaptionBox;