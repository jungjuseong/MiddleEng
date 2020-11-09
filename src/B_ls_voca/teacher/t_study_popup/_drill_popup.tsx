import * as React from 'react';
import * as _ from 'lodash';

import { observer } from 'mobx-react';
import { observable } from 'mobx';

import { ToggleBtn } from '@common/component/button';
import * as butil from '@common/component/butil';
import { App } from '../../../App';
import { IStateCtx, IActionsCtx } from '../t_store';
import * as common from '../../common';
import { CoverPopup } from '../../../share/CoverPopup';
import { POPUPTYPE } from '../t_voca_detail';
import { BtnAudio } from '../../../share/BtnAudio';
import SendUINew from '../../../share/sendui_new';
import * as felsocket from '../../../felsocket';

import WrapTextNew from '@common/component/WrapTextNew';

interface IDrillItem {
	type: POPUPTYPE;
	view: boolean; 
	word: common.IWordData|null;
	state: IStateCtx;
	actions: IActionsCtx;
	onClosed: () => void;
}

@observer
class DrillPopup extends React.Component<IDrillItem> {
	@observable private m_view = false;
	@observable private m_sended = false;	
	@observable private _nPlay = -1;

	private _getJSX(text: string) {
		const nodes = butil.parseBlock(text, 'block');
		return (
			<>
				{nodes.map((node, idx) => node)}
			</>
		);
	}

	private _onClose = () => {
		App.pub_playBtnTab();

		felsocket.sendPAD($SocketType.PAD_ONSCREEN, null);
		this.m_view = false;
	}
	
	private _onSend = () => {
		if(!this.props.word || !this.props.view || !this.m_view || this.props.type !== 'spelling') return;
		App.pub_reloadStudents(() => {
			if(!this.props.word || !this.props.view || !this.m_view) return;
			const msg: common.IDrillMsg = {
				msgtype: this.props.type as 'spelling',
				word_idx: this.props.word.idx,
			};
			felsocket.sendPAD($SocketType.MSGTOPAD, msg);
			while(this.props.state.returnUsers.length > 0) this.props.state.returnUsers.pop();
			this.props.actions.setRetCnt(0);
			this.props.actions.setNumOfStudent(App.students.length);
		});
		this.m_sended = true;
		App.pub_playToPad();
	}

	public componentDidUpdate(prev: IDrillItem) {
		if(this.props.view && !prev.view) {
			this.m_view = true;
			this.m_sended = false;

			this.props.actions.setNumOfStudent(App.students.length);

		} else if(!this.props.view && prev.view) {
			this.m_view = false;
			this.m_sended = false;


			this.props.state.speaking_audio = false;
			this.props.state.speaking_video = false;
		}
	}

	private _onVideo = () => {
        const { view, word, state, actions } = this.props;

        if(!view || !word || state.speaking_audio) return;
        App.pub_playBtnTab();
		
        state.speaking_video = !state.speaking_video;
        state.speaking_audio = false;
        if(state.speaking_video) {
            felsocket.startStudentReportProcess($ReportType.VIDEO, null, 'C');

            App.pub_reloadStudents(() => {
                const msg: common.IDrillMsg = {
                    msgtype: 'speaking_video',
                    word_idx: word.idx,
                };
                felsocket.sendPAD($SocketType.MSGTOPAD, msg);
                actions.setRetCnt(0);
                actions.setNumOfStudent(App.students.length);
            });
        } else {
            felsocket.sendPAD($SocketType.PAD_ONSCREEN, null);
        }
    }
    
	private _onAudio = () => {
        const { view, word, state, actions } = this.props;

        if(!view || !word || state.speaking_video) return;
        App.pub_playBtnTab();

        state.speaking_audio = !state.speaking_audio;
        state.speaking_video = false;
        if(state.speaking_audio) {
            felsocket.startStudentReportProcess($ReportType.AUDIO, null, 'C');
            App.pub_reloadStudents(() => {
                const msg: common.IDrillMsg = {
                    msgtype: 'speaking_audio',
                    word_idx: word.idx,
                };
                felsocket.sendPAD($SocketType.MSGTOPAD, msg);                
                actions.setRetCnt(0);
                actions.setNumOfStudent(App.students.length);
            });
        } else {
            felsocket.sendPAD($SocketType.PAD_ONSCREEN, null);            
        }
    }
    
	private _onReturn = () => {
        App.pub_playBtnTab();
        if(this.props.type === 'spelling') {
            const users: string[] = [];
            for(let i = 0; i < this.props.state.returnUsers.length; i++) {
                users[i] = this.props.state.returnUsers[i];
            }
            felsocket.startStudentReportProcess($ReportType.JOIN, users);
        } else if(this.props.type === 'speak') {
            felsocket.showStudentReportListPage();
        }
	}

	private _onSound = () => {
		this._nPlay = 1;
	}
	private _onStop = () => {
		this._nPlay = -1;
	}
	private _onSentenceSound = () => {
		const {  word } = this.props;
		if(!word) return;
		let audio = word.sentence_audio;

		App.pub_play(App.data_url + audio, (isEnded: boolean) => {
			//
		});
	}

	public render() {
        const { type, view, onClosed, word } = this.props;
        const { speaking_video,speaking_audio,retCnt,numOfStudent } = this.props.state;
        const entry = word ? word.entry : '';
        const audio = word ? word.audio : '';
        const sentence = word ? this._getJSX(word.sentence) : <></>;

        return (
            <CoverPopup className="drill_popup" view={view && this.m_view} onClosed={onClosed}>
                <div className="nav">
                    <span className="type">{type.toUpperCase()}</span>
                    <ToggleBtn className="btn_close" onClick={this._onClose}/>
                </div>
                <div className={'content ' + type}>
                    <BtnAudio className="btn_audio" url={App.data_url + audio} onStop={this._onStop} nPlay={this._nPlay}/> 
                    
                    <div className="p_btns">
                        <div className="return_cnt_box white" onClick={this._onReturn} hidden={(type === 'spelling') ? !this.m_sended : !speaking_video && !speaking_audio}>
                            <div>{retCnt}/{numOfStudent}</div>
                        </div>					
                        <ToggleBtn className="btn_p_video"  on={speaking_video} disabled={speaking_audio} onClick={this._onVideo} view={type !== 'spelling'}/>
                        <ToggleBtn className="btn_p_voice"  on={speaking_audio} disabled={speaking_video} onClick={this._onAudio} view={type !== 'spelling'}/>
                    </div>

                    <div className="entry_spell" onClick={this._onSound}>
                        <WrapTextNew maxSize={80} minSize={70} view={type === 'spelling' || type === 'speak' && view && this.m_view}>
                            {entry}
                        </WrapTextNew>
                    </div>
                    <span className="line" hidden={type === 'spelling'}/>
                    <div className="meaning_eng" hidden={type === 'spelling'}>
                        <WrapTextNew maxSize={43} minSize={38} view={type === 'speak' && view && this.m_view} onClick={this._onSentenceSound}>
                            {sentence}
                        </WrapTextNew>
                    </div>
                    <SendUINew 
                        type="teacher"
                        view={this.m_view && type === 'spelling'}
                        sended={this.m_sended}
                        originY={0}
                        onSend={this._onSend}
                    />
                </div>
            </CoverPopup>
        );
	}
}

export default DrillPopup;