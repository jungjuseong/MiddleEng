import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { observable } from 'mobx';
import { observer } from 'mobx-react';

import * as _ from 'lodash';
import { hot } from 'react-hot-loader';

interface IMovieClip {
	className: string;
	view: boolean;
	totalFrames: number;
	url: string;
	bPlay: boolean;
}

@observer
class MovieClip extends React.Component<IMovieClip> {
	private _div: HTMLDivElement|null = null;
	@observable private _cur: number = -1;
	private _loaded: number = 0;
	private _loading: number = -1;
	private _isPlaying = false;

	private _last = 0;
	private _aniIdx = -1;
	private _imgs: HTMLImageElement[] = [];

	constructor(props: IMovieClip) {
		super(props);
		this._init(props);
	}
	private _onload = (e: Event) => {
		if(this._loading !== this._loaded) return;
		const img = e.target as HTMLImageElement;
		img.removeEventListener('load', this._onload);
		img.removeEventListener('error', this._onerror);
		let chk = img.getAttribute('_loading');

		if(!chk) return;
		let idx = parseInt(chk, 10);
		if(this._loading !== idx) return;

		img.removeAttribute('_loading');

		this._imgs[this._loaded] = img;

		if(this._cur < 0 && !this._isPlaying) this._cur = 0;
		/*
		if(this._div) {
			if(this._loaded === this._cur) {
				img.style.display = 'inline-block';
				if(this._cur > 0) this._imgs[this._cur - 1].style.display = 'none';
			} else img.style.display = 'none';
			this._div.appendChild(img);
		}
		*/
		this._loaded++;
		this._load(this.props);
		//
	}
	private _onerror = (e: ErrorEvent) => {
		this._onload(e);
	}
	private _load(props: IMovieClip) {
		if(!props.view) return;
		else if(this._loaded >= props.totalFrames) return;
		else if(this._loading >= this._loaded) return;

		this._loading++;

		const idx = this._loading;
		let url;
		if(idx < 10) url = props.url + '00' + idx + '.png';
		else if(idx < 100) url = props.url + '0' + idx + '.png';
		else url = props.url + idx + '.png';

		const img = document.createElement('img');
		img.setAttribute('_loading', idx + '');
		img.addEventListener('load', this._onload);
		img.addEventListener('error', this._onerror);
		/*
		img.style.position = 'absolute';
		img.style.left = '0px';
		img.style.top = '0px';
		img.style.width = '100%';
		img.style.height = '100%';
		*/
		img.src = url;
	}
	private _init(props: IMovieClip) {
		this._cur = -1;
		this._loaded = 0;
		this._loading = -1;
		/*
		if(this._div) {
			while(this._div.lastChild) this._div.removeChild(this._div.lastChild);
		}
		*/
		while(this._imgs.length > 0) {
			const img = this._imgs.pop();
			if(img) {
				img.removeAttribute('_loading');
				img.removeEventListener('load', this._onload);
				img.removeEventListener('error', this._onerror);
			}
		}
		if(props.view) this._load(props);
	}
	private _ref = (el: HTMLDivElement) => {
		if(this._div || !el) return;
		this._div = el;
	}

	private _play = (f: number) => {
		if(!this._isPlaying) return;
		const time = Date.now();
		if(time - this._last >= 33) {
			const loaded = this._loaded;
			const loading = this._loading;
			const max = this._imgs.length;
			if(this._cur < max - 1) {
				// if(this._cur > 0) this._imgs[this._cur - 1].style.display = 'none';
				// this._imgs[this._cur].style.display = 'inline-block';
				this._cur++;
			} else {
				if(this._cur >= this.props.totalFrames - 1) {
					this._cur = this.props.totalFrames - 1;
					this._isPlaying = false;
				}
			}
			
			this._last =  time;
		}
		this._aniIdx = window.requestAnimationFrame(this._play);
	}	
	private _start() {
		this._last =  -10000;

		this._aniIdx = window.requestAnimationFrame(this._play);
	}

	public componentWillReceiveProps(next: IMovieClip) {
		//
	}
	public componentDidUpdate(prev: IMovieClip) {
		if(this.props.totalFrames !== prev.totalFrames || this.props.url !== prev.url) {
			this._init(this.props);
		} else {
			if(this.props.view && !prev.view) this._load(this.props);
		}

		// const prevCur = this._cur;
		if(this.props.view && !prev.view) this._cur = -1;
		
		const prevPlaying = this._isPlaying;
		this._isPlaying = this.props.view && this.props.bPlay;

		/*
		if(prevCur !== this._cur) {
			if(prevCur < this._imgs.length) {
				this._imgs[prevCur].style.display = 'none';
				if(prevCur > 0) this._imgs[prevCur - 1].style.display = 'none';
			}
			if(this._cur < this._imgs.length) this._imgs[this._cur].style.display = 'inline-block';
		}
		*/
		if(!prevPlaying && this._isPlaying) this._start();
		else if(!this._isPlaying && this._aniIdx >= 0) window.cancelAnimationFrame(this._aniIdx); 
	}

	public render() {
		let url;
		let dispaly;
		if(this._cur < 0 || this._cur >= this._imgs.length) {
			url = this.props.url + '000.png';
		} else {
			url = this._imgs[this._cur].src;
		}
		return (
			<div ref={this._ref} className={this.props.className}>
				<img src={url} draggable={false} style={{width: '100%', height: '100%'}}/>
			</div>
		);
	}
}


export default MovieClip;