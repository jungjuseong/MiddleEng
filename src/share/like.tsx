import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { observable, action } from 'mobx';
import { observer, Observer } from 'mobx-react';

import { TweenMax, TimelineMax, Power2, Sine } from 'gsap';
import * as _ from 'lodash';
import { DraggableCore, DraggableData } from 'react-draggable';

import { ToggleBtn } from '@common/component/button';
import * as StrUtil from '@common/util/StrUtil';

import { App } from '../App';
import * as felsocket from '../felsocket';

import { BtnSwitch } from './BtnSwitch';


interface ILikeBtn {
	className: string;
	on: boolean;
	onChange: () => void;
}
export class LikeBtn extends React.Component<ILikeBtn> {
	public render() {
		return (
			<BtnSwitch className={this.props.className} {...this.props}/>
		);
	}

}

export class LikeSVG extends React.Component<{soundOff: boolean}> {
	private m_cache: HTMLElement[] = [];
	private m_svg!: MYSVGElement;
	
	private m_normal!: SVGGElement;
	private m_happy!: SVGGElement;
	private m_love!: SVGGElement;

	private m_audio: HTMLAudioElement|null = null;

	public animate(idx: number): LikeAniType {
		let emoti: HTMLElement;
		if(this.m_cache[idx]) {
			emoti = this.m_cache[idx];
		} else {
			emoti = document.getElementById('svg_emoti_' + idx) as HTMLElement;
			this.m_cache[idx] = emoti;
		}

		_empty(this.m_normal);
		_empty(this.m_happy);
		_empty(this.m_love);

		const cName = emoti.getAttribute('class');
		let ani: LikeAniType = 'normal';
		if(cName === 'love') {
			ani = cName;
			this.m_normal.style.display = 'none';
			this.m_happy.style.display = 'none';
			this.m_love.style.display = 'unset';
			this.m_love.appendChild(emoti);	
		} else if( cName === 'happy') {
			ani = cName;
			this.m_normal.style.display = 'none';
			this.m_happy.style.display = 'unset';
			this.m_love.style.display = 'none';
			this.m_happy.appendChild(emoti);						
		} else {
			ani = 'normal';
			this.m_normal.style.display = 'unset';
			this.m_happy.style.display = 'none';
			this.m_love.style.display = 'none';
			this.m_normal.appendChild(emoti);					
		}

		this.m_svg.setCurrentTime(0);
		if (this.m_svg.animationsPaused()) {
			this.m_svg.unpauseAnimations();
		}
		
		if(!this.props.soundOff) {
			const audio = document.getElementById('audio_emoti_' + idx) as HTMLAudioElement;
			if(audio) {
				if(this.m_audio !== audio && this.m_audio) {
					if (!this.m_audio.paused) this.m_audio.pause();
					this.m_audio.currentTime = 0;					
				}

				audio.currentTime = 0;
				if (audio.paused) audio.play();
			} 
			this.m_audio = audio;
		} else if (this.m_audio) {
			if (!this.m_audio.paused) this.m_audio.pause();
			this.m_audio.currentTime = 0;
		}
		return ani;
	}

	private _refSVG = (svg: SVGElement|null) => {
		if(this.m_svg || !svg) return;
		this.m_svg = svg as MYSVGElement;
	}
	private _refNormal = (g: SVGGElement|null) => {
		if(this.m_normal || !g) return;
		this.m_normal = g;
	}
	private _refHappy = (g: SVGGElement|null) => {
		if(this.m_happy || !g) return;
		this.m_happy = g;		
	}
	private _refLove = (g: SVGGElement|null) => {
		if(this.m_love || !g) return;
		this.m_love = g;			
	}
	public render() {
		return (
			<svg ref={this._refSVG} imageRendering="optimizeSpeed" baseProfile="basic" version="1.1" preserveAspectRatio="xMidYMid slice" x="0px" y="0px" width="1280" height="800" viewBox="0 0 1280 800">
				<defs>
					<linearGradient id="Gradient_bg" gradientUnits="userSpaceOnUse" x1=".05" y1="196.35" x2=".05" y2="-187.450" spreadMethod="pad">
						<stop offset="0%" stopColor="#51B3D6"/>
						<stop offset="100%" stopColor="#1586DE"/>
					</linearGradient>
					<animateTransform xlinkHref="#svg_normal" attributeName="transform" additive="replace" type="translate" fill="freeze" repeatCount="1" dur="2.5s" keyTimes="0;.083;.133;.183;.233;.283;.333;.483;.583;1" values="639.2,578.85;639.3,334.4;619.3,334.4;659.3,334.4;619.3,334.4;659.3,334.4;639.3,334.4;639.3,-143.65;638.8,-143.85;638.8,-143.85"/>
					<animate id="svg_ani_normal" xlinkHref="#svg_normal" attributeName="opacity" fill="freeze" repeatCount="1" dur="2.5s" keyTimes="0;.083;1" values="0;1;1"/>
					
					<animateTransform xlinkHref="#svg_happy" attributeName="transform" additive="replace" type="translate" fill="freeze" repeatCount="1" dur="2.5s" keyTimes="0;.083;.133;.183;.233;.283;.333;.383;.433;.483;.583;1" values="640.075,579.45;639.7,334.625;639.665,334.637;639.7,334.625;639.602,334.628;639.7,334.625;639.68,334.675;639.7,334.625;639.602,334.628;639.7,334.625;639.7,-97.125;639.7,-97.125"/>
					<animateTransform xlinkHref="#svg_happy" attributeName="transform" additive="sum" type="rotate" fill="freeze" repeatCount="1" dur="2.5s" keyTimes="0;.083;.133;.183;.233;.283;.333;.383;.433;.483;1" values="0,0,0;0,0,0;29,0,0;0,0,0;-30,0,0;0,0,0;30,0,0;0,0,0;-30,0,0;0,0,0;0,0,0"/>
					<animateTransform xlinkHref="#svg_happy" attributeName="transform" additive="sum" type="skewX" fill="freeze" repeatCount="1" dur="2.5s" keyTimes="0;.183;.233;.283;.333;.383;.433;.483;1" values="0;0;-.001;0;.001;0;-.001;0;0"/>
					<animateTransform xlinkHref="#svg_happy" attributeName="transform" additive="sum" type="translate" fill="freeze" repeatCount="1" dur="2.5s" keyTimes="0;.083;.133;.183;.233;.283;.333;.383;.433;.483;.583;1" values="-.15,-.2;-.1,-.05;-.05,0;-.1,-.05;-.05,-.05;-.1,-.05;-.1,0;-.1,-.05;-.05,-.05;-.1,-.05;-.1,.05;-.1,.05"/>
					<animate id="svg_ani_happy"  xlinkHref="#svg_happy" attributeName="opacity" fill="freeze" repeatCount="1" dur="2.5s" keyTimes="0;.083;1" values="0;1;1"/>
					
					<animateTransform xlinkHref="#svg_love" attributeName="transform" additive="replace" type="translate" fill="freeze" repeatCount="1" dur="2.5s" keyTimes="0;.083;.183;.25;.317;.383;.45;.483;.583;1" values="639.95,579.6;639.6,334.9;639.6,334.9;639.625,334.875;639.6,334.9;639.625,334.875;639.6,334.9;639.6,334.9;639.6,-143.1;639.6,-143.1"/>
					<animateTransform xlinkHref="#svg_love" attributeName="transform" additive="sum" type="scale" fill="freeze" repeatCount="1" dur="2.5s" keyTimes="0;.183;.25;.317;.383;.45;1" values="1,1;1,1;1.5,1.5;1,1;1.5,1.5;1,1;1,1"/>
					<animateTransform xlinkHref="#svg_love" attributeName="transform" additive="sum" type="translate" fill="freeze" repeatCount="1" dur="2.5s" keyTimes="0;.183;.25;.317;.383;.45;1" values="0,0;0,0;-.15,-.05;0,0;-.15,-.05;0,0;0,0"/>
					<animate id="svg_ani_love" xlinkHref="#svg_love" attributeName="opacity" fill="freeze" repeatCount="1" dur="2.5s" keyTimes="0;.083;1" values="0;1;1"/>
				</defs>
				<g>
					<g transform="translate(639.85 321.85)">
						<path fill="url(#Gradient_bg)" stroke="none" d="M85.8 -203.05Q44.9 -220.35 .05 -220.35 -44.8 -220.35 -85.75 -203.05 -125.3 -186.3 -155.8 -155.8 -186.3 -125.3 -203.05 -85.75 -220.35 -44.85 -220.35 0 -220.35 44.85 -203.05 85.8 -186.3 125.35 -155.8 155.85 -125.3 186.35 -85.75 203.1 -44.8 220.4 .05 220.4 44.9 220.4 85.8 203.1 125.35 186.35 155.85 155.85 186.35 125.35 203.1 85.8 220.4 44.85 220.4 0 220.4 -44.85 203.1 -85.75 186.35 -125.3 155.85 -155.8 125.35 -186.3 85.8 -203.05Z"/>
						<animate attributeName="opacity" fill="freeze" repeatCount="1" dur="2.5s" keyTimes="0;.083;0.4;0.6;1" values="0;1;1;0;0"/>
					</g>
				</g>
				<g id="svg_normal" ref={this._refNormal}/>
				<g id="svg_happy" ref={this._refHappy}/>
				<g id="svg_love" ref={this._refLove}/>
			</svg>
		);
	}
}


interface ILikeSend {
	className: 'like-send';
	view: boolean;
	on: boolean;
	student: string;
	soundOff: boolean;
}
export class LikeSend extends React.Component<ILikeSend> {
	private m_svg!: LikeSVG;
	private _refSVG = (svg: LikeSVG|null) => {
		if(this.m_svg || !svg) return;
		this.m_svg = svg;
	}
	private _click = (evt: React.MouseEvent) => {
		if(!this.props.view || !this.props.on || !App.student) return;

		const tgt = evt.currentTarget as HTMLElement;
		if(!tgt || !tgt.className) return;
		const name = tgt.className;
		if(name.startsWith('emoti')) {
			const idx = StrUtil.nteInt( name.substring(5), -1);
			if(idx < 0) return;

			const ani = this.m_svg.animate(idx);
						
			const like: ILikeSendMsg = {
				from : App.student.id,
				to : this.props.student,
				like : idx,
				ani,
			};
			felsocket.sendTeacher($SocketType.LIKE_SEND, like);
		}

	}
	public render() {
		return (
			<div className={this.props.className} hidden={!this.props.view}>
				<LikeSVG ref={this._refSVG} soundOff={this.props.soundOff}/>
				<div className={'emoti-bnd' + (this.props.on ? ' on' : '')}>
					<ToggleBtn className="emoti0" onClick={this._click}/>
					<ToggleBtn className="emoti1" onClick={this._click}/>
					<ToggleBtn className="emoti2" onClick={this._click}/>
					<ToggleBtn className="emoti3" onClick={this._click}/>
					<ToggleBtn className="emoti4" onClick={this._click}/>
					<ToggleBtn className="emoti5" onClick={this._click}/>
					<ToggleBtn className="emoti6" onClick={this._click}/>
					<ToggleBtn className="emoti7" onClick={this._click}/>
					<ToggleBtn className="emoti8" onClick={this._click}/>
					<ToggleBtn className="emoti9" onClick={this._click}/>
				</div>
			</div>
		);
	}
}

function _empty(el: Element) {
	while(el.lastChild) {
		el.removeChild(el.lastChild);	
	}		
}

class LikeItem {
	private m_div: HTMLDivElement;
	private m_view: LikeView;
	private m_svg: SVGElement;
	private m_img: HTMLImageElement;
	private m_tline: TimelineMax;

	get div() {return this.m_div;}
	
	constructor(div: HTMLDivElement, view: LikeView) {
		div.style.visibility = 'unset';
		this.m_div = div;
		this.m_view = view;
		this.m_svg = div.querySelector(':scope>svg') as SVGElement;
		this.m_img = div.querySelector(':scope>img') as HTMLImageElement;		
		this.m_tline = new TimelineMax({});

	}
	public animate(sended: ILikeSendMsg) {
		this.m_tline.clear();
		this.m_tline.kill();
		/* Test 시 삭제 */
		const student = _.find(App.students, {id: sended.from});
		if (!student) {
			this.m_view.itemStartEnd();
			this.m_view.itemAniComplete(this);
			return;
		}
		this.m_img.src = student.displayMode === '2' ? student.avatar : student.thumb;
		_empty(this.m_svg);	

		const el = document.getElementById('svg_emoti_' + sended.like) as HTMLElement;

		const g: SVGGElement = el.cloneNode(true) as SVGGElement;
		g.setAttribute('id', '');
		g.setAttribute('transform', '');
		this.m_svg.appendChild(g);
		
		this.m_div.style.opacity = '0';
		this.m_div.style.transform = 'matrix(1, 0, 0, 1, 0, 0)';
		

		this.m_tline.pause(0);
		this.m_tline.fromTo(
			this.m_div, 
			0.5,
			{
				opacity : 0.8,
				transform: 'matrix(0.7, 0, 0, 0.7, 0, 0)',
			},
			{
				opacity : 1,
				transform: 'matrix(1, 0, 0, 1, 0, -100)',
				ease: Power2.easeOut,
				onComplete : () => {
						this.m_view.itemStartEnd();
				},
			}
		);

		if(sended.ani === 'happy') {

			this.m_tline.fromTo(
				this.m_div, 
				0.12,
				{
					transform: 'matrix(0.866, 0.5, -0.5, 0.866, 0, -100)',
				},
				{
					transform: 'matrix(0.866, -0.5, 0.5, 0.866, 0, -100)',
					repeat : 5,
					yoyo: true,
					ease: Sine.easeOut,
				}
			);
		} else if (sended.ani === 'love') {
			this.m_tline.fromTo(
				this.m_div, 
				0.12,
				{
					transform: 'matrix(1, 0, 0, 1, 0, -100)',
				},
				{
					transform: 'matrix(0.8, 0, 0, 0.8, 0, -100)',
					repeat : 5,
					yoyo: true,
					ease: Sine.easeOut,
				}
			);			
		} else {
			this.m_tline.fromTo(
				this.m_div, 
				0.12,
				{
					transform: 'matrix(1, 0, 0, 1, 10, -100)',
				},
				{
					transform: 'matrix(1, 0, 0, 1, -10, -100)',
					repeat : 5,
					yoyo: true,
					ease: Sine.easeOut,
				}
			);				
		}

		this.m_tline.fromTo(
			this.m_div, 
			1.2,
			{
				opacity : 1,
				transform: 'matrix(1, 0, 0, 1, 0, -100)'
			},
			{
				opacity : 0.5,
				transform: 'matrix(0.7, 0, 0, 0.7, 0, -300)',
			}
		);
		this.m_tline.to(
			this.m_div, 
			0.3,
			{
				opacity : 0,
				onComplete : () => {
					_empty(this.m_svg);

					this.m_view.itemAniComplete(this);
					this.m_tline.clear();
					this.m_tline.kill();
						
					
				}
			}
		);
		this.m_tline.pause(0);
		this.m_tline.restart();
	}
	
}

interface ILikeView {
	className: string;
	view: boolean;
	student: string; 
	soundOff: boolean;
}
export class LikeView extends React.Component<ILikeView> {
	private m_buffer: ILikeSendMsg[] = [];
	private m_items: LikeItem[] = [];

	private m_div!: HTMLDivElement;
	private m_itemDiv!: HTMLDivElement;

	private _check() {
		if (!this.props.view) {
			while (this.m_buffer.length > 0) {
				this.m_buffer.pop();
			}
			return;
		}
		if(this.m_buffer.length === 0) return;

		let sended: ILikeSendMsg|null = null;


		let i = 0;
		const len = this.m_buffer.length;
		while (i < len) {
			if (this.m_buffer[i].to === this.props.student) {
				sended = this.m_buffer[i];
				break;
			}
			i++;
		}
		if (sended == null) return;
		_.remove(this.m_buffer, sended);
		
		let item = this.m_items.pop();
		if (!item) {
			item = new LikeItem(this.m_itemDiv.cloneNode(true) as HTMLDivElement, this);
		}
		this.m_div.appendChild(item.div);
		item.animate(sended);

		if(!this.props.soundOff) App.pub_playLikeBubble();
	}

	public itemStartEnd() {
		this._check();
	}
	public itemAniComplete(item: LikeItem) {
		if(item.div.parentElement) item.div.parentElement.removeChild(item.div);
		this.m_items.push(item);
	}	

	public addLike(obj: ILikeSendMsg) {
		if (!this.props.view || this.props.student !== obj.to) return;
		const student = _.find(App.students, {id: obj.from});
		if(!student) return;
		this.m_buffer.push(obj);
		this._check();
	}

	private _refDiv = (el: HTMLDivElement|null) => {
		if(this.m_itemDiv || !el) return;
		this.m_itemDiv = el;
	}
	private _refBnd = (el: HTMLDivElement|null) => {
		if(this.m_div || !el) return;
		this.m_div = el;
	}
	private _clear() {
		while (this.m_buffer.length > 0) {
			this.m_buffer.pop();
		}
	}
	public componentDidUpdate(prev: ILikeView) {
		if(!this.props.view && prev.view) {
			this._clear();
		}
	}
	
	public render() {
		return (
			<div className={this.props.className} ref={this._refBnd} hidden={!this.props.view}>
				<div ref={this._refDiv} style={{visibility: 'hidden'}}>
					<svg viewBox="0 0 125 125" />
					<img src="" />
				</div>
			</div> 
		);
	}
}