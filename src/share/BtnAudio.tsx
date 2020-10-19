import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { ToggleBtn } from '@common/component/button';
import * as kutil from '@common/util/kutil';
import { observable } from 'mobx';
import { observer } from 'mobx-react';
import { App } from '../App';

interface IBtnAudio {
	className: string;
	url: string;
	disabled?: boolean;
	nPlay?: number;
	view?: boolean;
	onPlay?: () => void;
	onStop?: () => void;
}

@observer
export class BtnAudio extends React.Component<IBtnAudio> {
	@observable private _playing = false;
	private _nPlay: number = 0;
	public toggle = () => {
		this._onDown();
	}
	public componentWillUnmount() {
		this._nPlay = 0;
		if(this._playing) {
			this._playing = false;
			App.pub_stop();
		}
	}

	private _onPlay = () => {
	    this._playing = true;
        if(this.props.onPlay) this.props.onPlay(); 
        App.pub_play(this.props.url, this._onPlayEnd);
	}
	private _onPlayEnd = async (isEnded: boolean) => {
		if(this._nPlay > 0) {
			this._nPlay = this._nPlay - 1;
			if(this._nPlay > 0) {
				this._playing = false;
				await kutil.wait(500);
				if(this._nPlay > 0) this._onPlay();
				return;
			}
		}
		if(this._playing) {
			this._playing = false;
			if(this.props.onStop) this.props.onStop(); 
		}
	}
    //
	private _onDown = () => {
		if(this.props.disabled) return;
		if(this._playing) {
			this._playing = false;
			App.pub_stop();
			if(this.props.onStop) this.props.onStop(); 
		} else {
			this._playing = true;
			if(this.props.onPlay) this.props.onPlay(); 
			App.pub_play(this.props.url, this._onPlayEnd);
		}
	}
	public componentDidUpdate(prev: IBtnAudio) {
		if(this.props.nPlay !== prev.nPlay) {
			this._nPlay = this.props.nPlay ? this.props.nPlay : 0;
			if(this._nPlay > 0 && !this._playing) this._onPlay();
		}
	}

	public render() {
		return (
			<ToggleBtn className={this.props.className} view={this.props.view} on={this._playing} disabled={this.props.disabled} onMouseDown={this._onDown}/>
		);
	}
}



