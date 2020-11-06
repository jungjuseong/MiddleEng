import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { observer } from 'mobx-react';
import { hot } from 'react-hot-loader';

import * as common from '../common';
import { ToggleBtn } from '@common/component/button';
import { App } from '../../App';
import { BtnAudio } from '../../share/BtnAudio';
import { ResponsiveText } from '../../share/ResponsiveText';

import * as butil from '@common/component/butil';

export type POPUPTYPE = ''|'sound'|'meaning'|'usage'|'main video'|'spelling'|'speak';

interface IAudioText {
	audio_url: string;
	audio_className: string;
	text_className: string;
}
class AudioText extends React.Component<IAudioText> {
	private _btn: BtnAudio| null = null;
	private _refBtn = (btn: BtnAudio) => {
		if(this._btn || !btn) return;
		this._btn = btn;
	}
	private _clickText = () => {
		if(!this._btn) return;
		
		this._btn.toggle();
	}
	public render() {
		const {audio_url, audio_className, text_className} = this.props;
		return (
			<>
			<BtnAudio ref={this._refBtn} className={audio_className} url={audio_url}/>
			<div className={text_className} onClick={this._clickText}>{this.props.children}</div>
			</>
		);
	}
}

function DetailItem(props: {word: common.IWordData}) {
	const word = props.word;
	return (
		<div className="detail_box">
			<img  src={App.data_url + word.image} draggable={false} />
			<div className="entry_box">
				<div className="entry">
					<AudioText
						audio_className="btn_audio"
						audio_url={App.data_url + word.audio}
						text_className="re_entry"
					>
						<ResponsiveText className="re_entry" maxSize={70} minSize={54} lineHeight={120} length={word.entry.length}>
							{word.entry}
						</ResponsiveText>
						<ResponsiveText className="re_meaning" maxSize={45} minSize={24} lineHeight={120} length={word.meaning.length}>
							{word.pumsa}.{word.meaning}
						</ResponsiveText>
					</AudioText>
					{/*  19-02-11 190211 LS_voca 검수 p.8 수정
					<ResponsiveText className="re_entry" maxSize={100} minSize={75} lineHeight={120} length={word.entry.length}>
						{word.entry}
					</ResponsiveText>
					*/}
				</div>					
				<div className="meaning_eng">
					<AudioText
						audio_className="btn_audio"
						audio_url={App.data_url + word.meaning_audio}
						text_className="re_meaning"
					>
						{word.pumsa}. {word.meaning_eng}
					</AudioText>
					{/*  19-02-11 190211 LS_voca 검수 p.8 수정
					<ResponsiveText className="re_meaning" maxSize={40} minSize={30} lineHeight={120} length={word.entry.length}>
						{word.pumsa}. {word.meaning_eng}
					</ResponsiveText>
					*/}
				</div>
			</div>
			<div className="sentence_box">
				<div className="sentence">
					<AudioText
						audio_className="btn_audio"
						audio_url={App.data_url + word.sentence_audio}
						text_className="re_sentence"
					>
						{butil.parseBlock(word.sentence, 'block')}
					</AudioText>
					<ResponsiveText className="re_sentence_kor" maxSize={55} minSize={40} lineHeight={120} length={word.sentence.length}>
						{butil.parseBlock(word.sentence, 'block')}
					</ResponsiveText>
					{/*  19-02-11 190211 LS_voca 검수 p.8 수정	
					<ResponsiveText className="re_sentence" maxSize={55} minSize={40} lineHeight={120} length={word.entry.length}>
						{butil.parseBlock(word.sentence, 'block')}
					</ResponsiveText>
					*/}
				</div>
			</div>
		</div>
	);
}

	// 무조건 on되게  수정 2020_07_31
function ProgItem(props: {name: string, percent: number, min: number}) {
	// console.log('what?',props.percent, props.max);
	return (
		<div className={'on'}>
			<div>{props.name}</div>
			<div><span style={{width: props.percent < 0 ? '0%' : props.percent + '%'}}/></div>
			<div>{props.percent < 0 ? '' : props.percent + '%'}</div>
		</div>
	);
}

interface IVocaDetail {
	view: boolean;
	idx: number;
	current: number;
	hasPreview: boolean;
	word: common.IWordData;
	onPopup: (word: common.IWordData, type: POPUPTYPE) => void;
}
@observer
class VocaDetail extends React.Component<IVocaDetail> {
	private _onSoundClick = () => this.props.onPopup(this.props.word, 'sound');
	private _onMeaningClick = () => this.props.onPopup(this.props.word, 'meaning');
	private _onSentenceClick = () => this.props.onPopup(this.props.word, 'usage');
	private _onUsageClick = () => this.props.onPopup(this.props.word, 'main video');
	private _onSpellingClick = () => this.props.onPopup(this.props.word, 'spelling');
	private _onSpeakingClick = () => this.props.onPopup(this.props.word, 'speak');
	
	public componentDidUpdate(prev: IVocaDetail) {
		const on = this.props.current === this.props.idx;
		const prevOn = prev.current === prev.idx;
		const view = this.props.view;
		const preView = prev.view;

		if((view && !preView) || (on && !prevOn)) {
			if(view && on) {
				// console.log(this.props.idx, this.props.current);
				this.props.word.app_studied = true;
			}
		}
	}
	
	public render() {
		const { view, word, hasPreview } = this.props;
		const min = Math.min(word.app_sound, word.app_meaning, word.app_spelling, word.app_sentence);

		let sum = word.app_sound + word.app_meaning + word.app_spelling + word.app_sentence;
		return (
			<>
				{/* <div className="preview-box" style={{display: hasPreview && !(sum < 0) ? '' : 'none'}}>
					<ProgItem name="SOUND" percent={word.app_sound} min={min}/>
					<ProgItem name="MEANING" percent={word.app_meaning} min={min}/>
					<ProgItem name="SPELLING" percent={word.app_spelling} min={min}/>
					<ProgItem name="USAGE" percent={word.app_sentence} min={min}/>
				</div> */}
				<DetailItem word={word} />
				<div className="lecture_btns">
					<ToggleBtn className="btn_sound" onClick={this._onSoundClick} />	
					<ToggleBtn className="btn_meaning"  onClick={this._onMeaningClick}/>	
					<ToggleBtn className="btn_usage"  onClick={this._onSentenceClick}/>	
				</div>
				<div className="drill_btns">
					<ToggleBtn className="btn_spelling" onClick={this._onSpellingClick}/>	
					<ToggleBtn className="btn_speaking"onClick={this._onSpeakingClick}/>	
				</div>
			</>
		);
	}
}
export default VocaDetail;



