import * as React from 'react';

import { BtnAudio } from '../../../share/BtnAudio';

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

export default AudioText;