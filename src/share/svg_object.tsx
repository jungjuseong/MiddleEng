import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { isUndefined } from 'util';
import { observer } from 'mobx-react';
import { observable } from 'mobx';

import * as _ from 'lodash';

export interface ISVGEmbed {
	className?: string;
	data: string;
	view: boolean;
	bPlay: boolean;	
	time?: number;
}

export class SVGEmbed<T> extends React.Component<T&ISVGEmbed> {
	protected m_obj: HTMLObjectElement|null = null;
	protected m_svg: MYSVGElement|null = null;

	private m_bPlay = false;

	constructor(props: T&ISVGEmbed) {
		super(props);
		this._ref = this._ref.bind(this);
	}
	protected _init() { 
		if (this.m_svg || !this.m_obj) return;
		const obj = this.m_obj;
		if (this.m_svg === null && 
			obj.contentDocument !== null && 
			obj.contentDocument.firstElementChild !== null && 
			obj.contentDocument.firstElementChild.tagName.toLowerCase() === 'svg'
		) {
			this.m_svg = obj.contentDocument.firstElementChild as MYSVGElement;
		}
	}

	private _ref(obj: HTMLObjectElement|null) { 
		if(this.m_obj || !obj) return;
		this.m_obj = obj;
		if (obj.contentDocument == null || obj.contentDocument.firstElementChild == null || obj.contentDocument.firstElementChild.tagName.toLowerCase() !== 'svg') {
			obj.onload = obj.oncanplay = obj.onloadeddata = (e: Event) => {
				if(!this.m_svg) {
					this._init();
					if (this.m_bPlay) this._play(-1);
					else this._pause( -1);
				}
			};
		} else {
			this._pause(-1);
		}
	}
	private _play(time: number) {
		this.m_bPlay = true;
		this._init();		
		if (this.m_svg == null) return;
		try {
			if(time >= 0) this.m_svg.setCurrentTime(time);
			if (this.m_svg.animationsPaused()) {
				this.m_svg.unpauseAnimations();
			}
		} catch (e) {}
		
	}
	private _pause(time: number) {
		this.m_bPlay = false;
		this._init();
		if (this.m_svg == null) return;
		
		try {
			if (time >= 0) this.m_svg.setCurrentTime(time);
			if (!this.m_svg.animationsPaused()) {
				this.m_svg.pauseAnimations();
			}
		} catch (e) {}

	}
	public componentDidUpdate(prev: ISVGEmbed) {
		if(this.props.bPlay !== prev.bPlay || this.props.time !== prev.time) {
			const time = (isUndefined(this.props.time) ? -1 : this.props.time) as number;
			if(this.props.bPlay) this._play(time);
			else this._pause(time);
		}
	}
	public render() {
		const style: React.CSSProperties = {};
		if(!this.props.view)	{
			style.zIndex = -1;
			style.visibility = 'hidden';
			style.pointerEvents = 'none';
		}

		return(
			<object 
				className={this.props.className} 
				ref={this._ref} 
				data={this.props.data} 
				type="image/svg+xml" 
				style={style}
				/* hidden={!this.props.view} */
			/>
		);
	}
}

export interface ISVGBg extends ISVGEmbed {
	viewCharactor: boolean;
}



export class SVGBg extends SVGEmbed<ISVGBg> {
	private m_character: SVGGElement|null = null;
	protected _init() {
		super._init();
		if (!this.m_character && this.m_svg) {
			this.m_character = this.m_svg.querySelector('#character');
			if (this.m_character) {
				this.m_character.setAttribute('opacity', this.props.viewCharactor ? '1' : '0');
			}
		}		
	}

	public componentDidUpdate(prev: ISVGBg&ISVGEmbed) {
		super.componentDidUpdate(prev);
		if(this.m_character && this.props.viewCharactor !== prev.viewCharactor) {
			this.m_character.setAttribute('opacity', this.props.viewCharactor ? '1' : '0');
		}
		
	}
}


interface ISVGAni {
	view: boolean;
	data: string;
	className: string;
	delay?: number;
	onComplete: () => void;
}

@observer
export class SVGAni extends React.Component<ISVGAni> {
	@observable private m_play = false;
	constructor(props: ISVGAni) {
		super(props);
	}

	public componentDidUpdate(prevProps: ISVGAni) {
		if( this.props.view && !prevProps.view) {
			this.m_play = true;
			let delay = this.props.delay;
			if(!delay) delay = 800;

			_.delay(() => {
				this.props.onComplete();
			}, delay);
		} else if(!this.props.view && prevProps.view ) {
			this.m_play = false;
		}
	}
	public render() {
		return (
			<SVGEmbed 
				className={this.props.className}
				data={this.props.data}
				view={this.props.view}
				time={0}
				bPlay={this.m_play}
			/>
		);
	}
}