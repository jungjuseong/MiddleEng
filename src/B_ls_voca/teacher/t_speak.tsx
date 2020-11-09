import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { Observer, observer } from 'mobx-react';
import * as _ from 'lodash';
import { TeacherContext, useTeacher, IStateCtx, IActionsCtx } from './t_store';
import * as common from '../common';
import { ToggleBtn } from '@common/component/button';
import { App } from '../../App';
import { ResponsiveText } from '../../share/ResponsiveText';
import { hot } from 'react-hot-loader';
import { observable } from 'mobx';

import * as butil from '@common/component/butil';
import WrapTextNew from '@common/component/WrapTextNew';

const enum MYProg {
	UNMOUNT,
	ENTRY,
	ENTRY_PLAYING,
	SENTENCE,
	SENTENCE_PLAYING,
	COMPLETE,
}

interface ISpeak {
	view: boolean;
	idx: number;
	current: number;
	word: common.IWordData;
	state: IStateCtx;
	isAuto: boolean;
	onComplete: () => void;
}

@observer
class Speak extends React.Component<ISpeak> {
	@observable private _prog: MYProg = MYProg.UNMOUNT;

	// private _nodes: React.ReactNode[];
	private _jsx: JSX.Element;
	constructor(props: ISpeak) {
		super(props);

		this._jsx = this._getJSX(props.word.sentence);
	}

	private _getJSX(text: string) {
		const nodes = butil.parseBlock(text, 'block');
		return (
			<>
				{nodes.map((node) => node)}
			</>
		);

	}
	private _play() {
		if(this._prog !== MYProg.ENTRY || !this.props.view) return;
		this._prog = MYProg.ENTRY_PLAYING;
		const word = this.props.word;
		App.pub_stop();
		App.pub_play(
			App.data_url + word.audio, 
			(isEnded) => {
				if(this._prog !== MYProg.ENTRY_PLAYING || !this.props.view) return;
				this._prog = MYProg.SENTENCE;
				_.delay(() => {
					if(this._prog !== MYProg.SENTENCE || !this.props.view) return;
					this._prog = MYProg.SENTENCE_PLAYING;
					App.pub_play(
						App.data_url + word.sentence_audio,
						(isEnd) => {
							if(this._prog !== MYProg.SENTENCE_PLAYING || !this.props.view) return;
							if(isEnd) {
								this._prog = MYProg.COMPLETE;
								this.props.onComplete();
							}
						}
					);
				}, 600);
			}
		);
	}
	private _onEntry = () => {
		if(this._prog < MYProg.COMPLETE) return;
		App.pub_play(App.data_url + this.props.word.audio, (isEnd) => { /* */ });
	}
	private _onSentence = () => {
		if(this._prog < MYProg.COMPLETE) return;
		App.pub_play(App.data_url + this.props.word.sentence_audio, (isEnd) => { /* */ });		
	}
	public componentWillUpdate(next: ISpeak) {
		if(next.word !== this.props.word) {
			this._jsx = this._getJSX(next.word.sentence);
		}

	}
	public componentDidUpdate(prev: ISpeak) {
		const on = this.props.current === this.props.idx;
		const prevOn = prev.current === prev.idx;
		const view = this.props.view;
		const preView = prev.view;

		// console.log('aaaaaa', on, prevOn, view, preView, this.props.current, this.props.idx);
		if((view && !preView) || (on && !prevOn)) {
			if(view && on) {
				if(this._prog === MYProg.COMPLETE) {
					this.props.onComplete();
				} else {
					this._prog = MYProg.ENTRY;
					_.delay(() => {this._play();}, 300);
				}

				this.props.word.app_studied = true;
			}
		} else if((!view && preView || (!on && prevOn))) {
			if(!view && preView || this._prog < MYProg.COMPLETE) this._prog = MYProg.UNMOUNT;

			// App.pub_stop();
		}

		if(view && this.props.isAuto && !prev.isAuto) {
			this._prog = MYProg.UNMOUNT;
		}
	}
	public render() {
		const { word } = this.props;
		
		let fontSize = '100px';
		if(word.entry.length > 14) fontSize = '80px';
		else if(word.entry.length > 10) fontSize = '90px';

		return (
			<>
			<img src={App.data_url + word.image_pad} draggable={false}/>			
			<div className="speak_contents">
				<div className="entry_box" style={{opacity: (this._prog >= MYProg.ENTRY ? 1 : 0)}} onClick={this._onEntry}>
					<span className="speak_entry" style={{fontSize}}>{word.entry}</span>
				</div>
				<div className="sentence_box" style={{opacity: (this._prog >= MYProg.SENTENCE ? 1 : 0)}} onClick={this._onSentence}>
					<div className="speak_sentence">
						<WrapTextNew maxSize={55} minSize={52} lineHeight={120} view={this._prog >= MYProg.ENTRY_PLAYING}>{this._jsx}</WrapTextNew>
					</div>

				</div>					
			</div>
			</>
		);
	}
}
export default Speak;


