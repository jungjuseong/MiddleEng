import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { observable, action } from 'mobx';
import { observer } from 'mobx-react';

interface IBtn {
	id?: string;
	useMap?: string;
	className?: string;
	on?: boolean;
	disabled?: boolean;
	view?: boolean;
	preventEvent?: boolean;
	style?: React.CSSProperties;
	onClick?: (evt: React.MouseEvent<HTMLElement>) => void;
	onMouseDown?: (evt: Event) => void;
	onMouseUp?: (evt: Event) => void;
	onMouseLeave?: (evt: Event) => void;
	onTransitionEnd?: (evt: React.TransitionEvent<HTMLElement>) => void;
	onRef?: (el: HTMLElement) => void;
	disableCapture?: boolean;
	
}

class MyButton<T> extends React.Component<T&IBtn> {
	protected m_el?: HTMLElement;
	@observable protected m_pID = -1;
	constructor(props: T&IBtn) {
		super(props);
		this._inited = this._inited.bind(this);
		this._onClick = this._onClick.bind(this);
		
	}
	protected _inited(el: HTMLElement|null) {
		if(this.m_el || !el) return;
		this.m_el = el;
		if(this.props.onRef) this.props.onRef(el);
		el.setAttribute('touch-action', 'none');

		el.addEventListener('pointerdown', (evt) => {
			if (this.m_pID >= 0) return;
			this.m_pID = evt.pointerId;
			if(!this.props.disableCapture) {
				try {el.setPointerCapture(this.m_pID);} catch (e) {}
			}
			if(this.props.onMouseDown) this.props.onMouseDown(evt);
		});	
	
		el.addEventListener('pointerup', (evt) => {
			if (this.m_pID !== evt.pointerId) return;
			try {el.releasePointerCapture(this.m_pID);} catch (e) {}
			this.m_pID = -1;
			if(this.props.onMouseUp) this.props.onMouseUp(evt);
		});
		el.addEventListener('pointerleave', (evt) => {
			if(this.props.disableCapture) {
				if (this.m_pID !== evt.pointerId) return;
				try {el.releasePointerCapture(this.m_pID);} catch (e) {}
				this.m_pID = -1;
			}
			if(this.props.onMouseLeave) this.props.onMouseLeave(evt);
		});

		el.addEventListener('pointercancel', (evt) => {
			if (this.m_pID !== evt.pointerId) return;
			try {el.releasePointerCapture(this.m_pID);} catch (e) {}
			this.m_pID = -1;
			if(this.props.onMouseLeave) this.props.onMouseLeave(evt);
		});

	}
	protected _onClick(evt: React.MouseEvent<HTMLElement>) {
		if(this.props.onClick) this.props.onClick(evt);
		if(this.props.preventEvent) {
			evt.preventDefault();
			evt.stopPropagation();
		}
	}

	public componentDidUpdate(prev: T&IBtn) {
		if(this.props.disabled && !prev.disabled || (!this.props.view && prev.view)) {
			// console.log(this.m_pID);
			if(this.m_pID >= 0 ) {
				try {
					if(this.m_el) this.m_el.releasePointerCapture(this.m_pID);
				} catch (e) {}
				this.m_pID = -1;
			}			
		}
	}
	/*
	protected _onMouseDown(evt: React.MouseEvent<HTMLElement>) {
		if(this.props.onMouseDown) this.props.onMouseDown(evt);
		if(this.props.preventEvent) {
			evt.preventDefault();
			evt.stopPropagation();
		}
	}
	protected _onMouseUp(evt: React.MouseEvent<HTMLElement>) {
		if(this.props.onMouseUp) this.props.onMouseUp(evt);
		if(this.props.preventEvent) {
			evt.preventDefault();
			evt.stopPropagation();
		}
	}
	*/
}

@observer
export class ToggleBtn<T> extends MyButton<T&IBtn> {
	@observable protected m_on = false;
	constructor(props: T&IBtn) {
		super(props);
		this.m_on = props.on === true;
	}
	public componentWillReceiveProps(nextProps: T&IBtn) {
		if(this.props.on !== nextProps.on) this.m_on = nextProps.on === true;
	}

	public render() {
		const arr: string[] = [];
		if(this.props.className) arr.push(this.props.className as string);
		if(this.m_on) arr.push('on');
		if(this.m_pID > 0) arr.push('down');
		
		const className = arr.join(' ');
		let style = this.props.style;
		if(this.props.view === false) {
			if(!style) style = {};
			style.display = 'none';
		}

		return (
			<button 
				id={this.props.id} 
				className={className} 
				onClick={this._onClick}
				ref={this._inited} 
				disabled={this.props.disabled === true}
				draggable={false}
				onTransitionEnd={this.props.onTransitionEnd}
				style={style}
			>
				{this.props.children}
			</button>
		);
	}
}

interface IAudioBtn {
	src: string;
	playFnc: (url: string, callBack: (isEnded: boolean) => void) => void;
	pauseFnc: () => void;
	onPause?: (isEnded: boolean) => void;
}
@observer
export class AudioBtn extends ToggleBtn<IAudioBtn> {
	constructor(props: IAudioBtn) {
		super(props);

		// console.log('AudioBtn', props.src);
	}
	@action public play() {
		if(!this.m_on) {
			this.m_on = true;
			this.props.playFnc(this.props.src, (isEnded: boolean) => {
				if(this.m_on) {
					this.m_on = false;

					if(this.props.onPause) this.props.onPause(isEnded);
				}
			});
		}
	}
	@action protected _onClick(evt: React.MouseEvent<HTMLElement>) {
		if(this.m_on) {
			this.props.pauseFnc();
			this.m_on = false;
		} else {
			this.play();
		}
		super._onClick(evt);
	}
}

interface IImgBtn {
	src?: string;
	useMap?: string;
}

@observer
export class ImgBtn extends MyButton<IImgBtn> {
	@observable protected m_on = false;
	constructor(props: IBtn) {
		super(props);
		this.m_on = props.on === true;
	}
	public componentWillReceiveProps(nextProps: IBtn) {
		if(this.props.on !== nextProps.on) this.m_on = nextProps.on === true;
	}

	public render() {
		const arr: string[] = [];
		if(this.props.className) arr.push(this.props.className as string);
		if(this.m_on) arr.push('on');
		if(this.m_pID > 0) arr.push('down');
		if(this.props.disabled === true) arr.push('disable');
		
		const className = arr.join(' ');
		let style = this.props.style;
		if(this.props.view === false) {
			if(!style) style = {};
			style.display = 'none';
		}

		return (
			<img 
				id={this.props.id} 
				className={className} 
				onClick={this._onClick}
				ref={this._inited} 
				draggable={false}
				onTransitionEnd={this.props.onTransitionEnd}
				style={style}
				src={this.props.src}
				useMap={this.props.useMap}
			/>
		);
	}
}
