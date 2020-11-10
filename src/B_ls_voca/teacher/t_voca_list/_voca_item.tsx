import * as React from 'react';

import * as _ from 'lodash';
import { observer } from 'mobx-react';

import { BtnAudio } from '../../../share/BtnAudio';
import { ToggleBtn } from '@common/component/button';
import { App } from '../../../App';

import { IStateCtx } from '../t_store';
import { IWordData } from '../../common';
import WrapTextNew from '@common/component/WrapTextNew';

interface IVocaItem {
	word: IWordData;
	hasPreview: boolean;
	onStudy: (word: IWordData) => void;
	onCheckChange: () => void;
	state: IStateCtx;
}

@observer
class VocaItem extends React.Component<IVocaItem> {
	private _btn: BtnAudio | null = null;

	private _refAudio = (btn: BtnAudio) => {
		if(this._btn || !btn ) return;
		this._btn = btn;
	}

	private _entryClick = () => {
		if(this._btn) this._btn.toggle();
	}

	// img 클릭 시 check 2018-12-06 수정
	private _onCheck = () => {
        const { word,onCheckChange } = this.props;

        App.pub_playBtnTab(); // 효과음 추가 2018-12-26 
        word.app_checked = !word.app_checked;
        onCheckChange();
    }
    
	private _onStudy = () => {
        const { word } = this.props;
        this.props.onStudy(word);
	}

	public render() {
		const { word,state } = this.props;
		return (
			<div className={'voca_box' + (word.app_studied ? ' click' : '' )}>
				<ToggleBtn className="check" on={word.app_checked} onClick={this._onCheck} />
				<img src={App.data_url + word.thumbnail} draggable={false} onClick={this._onCheck}/>
				<div className="voca_btns">
					<ToggleBtn className="btn_study" onClick={this._onStudy}/>
					<BtnAudio ref={this._refAudio} className="btn_sound" url={App.data_url + word.audio}/>
					<div onClick={this._entryClick}>
						<WrapTextNew view={state.prog >= 'list'} maxLineNum={1} minSize={16} maxSize={40} textAlign="left">
							{word.entry}
						</WrapTextNew>
					</div>
				</div>
				<div className="topic_reading">
					<span className={'icon_topic ' + word.reading} />				
				</div>	
			</div>
		);
	}
}

export default VocaItem;
