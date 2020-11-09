import * as React from 'react';
import { observer } from 'mobx-react';

import { IWordData } from '../../common';
import { ToggleBtn } from '@common/component/button';
import { App } from '../../../App';
import { ResponsiveText } from '../../../share/ResponsiveText';

import * as butil from '@common/component/butil';
import AudioText from './_audio_text';

export type POPUPTYPE = ''|'sound'|'meaning'|'usage'|'main video'|'spelling'|'speak';

function DetailItem(props: {word: IWordData}) {
	const word = props.word;
	return (
		<div className="detail_box">
			<img  src={App.data_url + word.image} draggable={false} />
			<div className="entry_box">
				<div className="entry">
					<AudioText audio_className="btn_audio" audio_url={App.data_url + word.audio} text_className="re_entry">
						<ResponsiveText className="re_entry" maxSize={70} minSize={54} lineHeight={120} length={word.entry.length}>
							{word.entry}
						</ResponsiveText>
						<ResponsiveText className="re_meaning" maxSize={35} minSize={24} lineHeight={120} length={word.meaning.length}>
							{word.meaning}
						</ResponsiveText>
					</AudioText>
					{/*  19-02-11 190211 LS_voca 검수 p.8 수정
					<ResponsiveText className="re_entry" maxSize={100} minSize={75} lineHeight={120} length={word.entry.length}>
						{word.entry}
					</ResponsiveText>
					*/}
				</div>					
				<div className="meaning_eng">
					<AudioText audio_className="btn_audio" audio_url={App.data_url + word.meaning_audio} text_className="re_meaning">
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
					<AudioText audio_className="btn_audio" audio_url={App.data_url + word.sentence_audio} text_className="re_sentence">
						{butil.parseBlock(word.sentence, 'block')}
						<ResponsiveText className="re_sentence_meaning" maxSize={35} minSize={25} lineHeight={120} length={word.sentence_meaning.length}>
						{butil.parseBlock(word.sentence_meaning, 'block')}
					</ResponsiveText>
					</AudioText>
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

interface IVocaDetail {
	view: boolean;
	idx: number;
	current: number;
	hasPreview: boolean;
	word: IWordData;
	onPopup: (word: IWordData, type: POPUPTYPE) => void;
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
		const { word } = this.props;

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



