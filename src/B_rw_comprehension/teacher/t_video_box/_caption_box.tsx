

import * as React from 'react';

import * as _ from 'lodash';
import { observer } from 'mobx-react';
import { observable, _allowStateChangesInsideComputed } from 'mobx';

import { ToggleBtn } from '@common/component/button';
import { App } from '../../../App';
import * as common from '../../common';
import { _getJSX, _getBlockJSX,_sentence2jsx } from '../../../get_jsx';

@observer
class CaptionBox extends React.Component<{view: boolean, inview: boolean, script?: common.IScript}> {
	@observable private _viewEng = true;
	@observable private _viewTrans = true;

    private _toggleEng = () => {
		this._viewEng = !this._viewEng;
	}

	public componentDidUpdate(prev: {view: boolean, inview: boolean}) {
		if(this.props.view && !prev.view) {
			this._viewEng = true;
			this._viewTrans = true;
		}
	}	
	public render() {
		const {inview, script} = this.props;
		// console.log(App.lang);
		let eng;
		let trans;
		if(script) {
			if(this._viewEng) eng = script.dms_eng;
			else eng = <>&nbsp;</>;
			if(this._viewTrans) trans = script.dms_kor[App.lang];
			else trans = <>&nbsp;</>;
		} else {
			eng = <>&nbsp;</>;
			trans = <>&nbsp;</>;
		}
		return (
			<div className="caption_box" style={{display: inview ? '' : 'none'}}>
				<div className="caption_eng"><span>{eng}</span><ToggleBtn className="btn_eng" on={this._viewEng} onClick={this._toggleEng}/></div>
				{/* <div className="caption_trans"><span>{trans}</span><ToggleBtn className="btn_trans" on={this._viewTrans} onClick={this._toggleTrans}/></div> */}
			</div>
		);
	}
}

export default CaptionBox;