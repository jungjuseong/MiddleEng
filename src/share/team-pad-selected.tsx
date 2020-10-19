import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { observable, action } from 'mobx';
import { observer } from 'mobx-react';
import * as _ from 'lodash';

interface ITeamPadSelected {
	className: string;
	start: boolean;
	view: boolean;
	viewBG: boolean;
	ga_na?: 'ga'|'na';
}


@observer
class TeamPadSelected extends React.Component<ITeamPadSelected> {
	private _svg: MYSVGElement|null = null;
	private _audio: HTMLAudioElement|null = null;
	private _className: string;
	constructor(props: ITeamPadSelected) {
		super(props);
		this._className = props.className;
	}
	private _refSVG = (svg: SVGElement|null) => {
		if(this._svg || !svg) return;
		this._svg = svg as MYSVGElement;
		this._svg.setCurrentTime(0);
		if(this.props.start && this._svg.animationsPaused()) this._svg.unpauseAnimations();
		else if (!this.props.start && !this._svg.animationsPaused()) this._svg.pauseAnimations();
	}
	private _refAudio = (audio: HTMLAudioElement|null) => {
		if(this._audio || !audio) return;
		this._audio = audio;
		this._audio.currentTime = 0;
		if(this.props.start && this._audio.paused) this._audio.play();
		else if (!this.props.start && !this._audio.paused) this._audio.pause();	
	}
	public componentWillUpdate(next: ITeamPadSelected) {
		const isChange = (this.props.view !== next.view) ||
							(this.props.start !== next.start);

		if(isChange) {
			const arr: string[] = [];
			arr.push(next.className);
			if(!next.view) arr.push('hide');
			if(!next.viewBG) arr.push('hide-bg');
			if(next.start) arr.push('view-ani');
			this._className = arr.join(' ');
		}	
		
	}
	public componentDidUpdate(prev: ITeamPadSelected) {
		if(this.props.start && !prev.start) {
			if(this._svg) {
				this._svg.setCurrentTime(0);
				if (this._svg.animationsPaused()) this._svg.unpauseAnimations();
			}
			if(this._audio) {
				this._audio.currentTime = 0;
				if(this._audio.paused) this._audio.play();
			}
		} else if(!this.props.start && prev.start) {
			if(this._svg) {
				this._svg.setCurrentTime(0);
				if (!this._svg.animationsPaused()) this._svg.pauseAnimations();
			}
			if(this._audio) {
				this._audio.currentTime = 0;
				if(!this._audio.paused) this._audio.pause();
			}
		}
	}
	public render() {
		
		return (
			<div className={this._className}>
				<audio ref={this._refAudio} controls={false} autoPlay={false} src={`${_digenglish_lib_}team/team_selected/team.mp3`}/>
				<img className="icon" src={`${_digenglish_lib_}team/icon_${this.props.ga_na ? this.props.ga_na : ''}_s.png`}/>
<svg ref={this._refSVG} imageRendering="auto" baseProfile="basic" version="1.1" x="0px" y="0px" width="1280" height="800" xmlns="http://www.w3.org/2000/svg" xmlnsXlink="http://www.w3.org/1999/xlink">
  <g overflow="visible">
    <g>
      <g transform="matrix(.605 0 0 .605 480.05 254.35)" opacity="0">
        <animateTransform attributeName="transform" additive="replace" type="translate" dur="1.458s" keyTimes="0;.143;.286;.54299;.686;1" values="652.112,406.16;652.112,406.16;652.091,406.157;652.091,406.157;652.112,406.16;652.112,406.16" fill="freeze"/>
        <animateTransform attributeName="transform" additive="sum" type="scale" dur="1.458s" keyTimes="0;.143;.286;.54299;.686;1" values=".605,.605;.605,.605;1.045,1.045;1.045,1.045;.605,.605;.605,.605" fill="freeze"/>
        <animateTransform attributeName="transform" additive="sum" type="translate" dur="1.458s" keyTimes="0;.143;.286;.54299;.686;1" values="-284.7,-251.2;-284.7,-251.2;-284.65,-251.35;-284.65,-251.35;-284.7,-251.2;-284.7,-251.2" fill="freeze"/>
        <animate attributeName="opacity" dur="1.458s" keyTimes="0;.143;.286;.54299;.686;1" values="0;0;1;1;0;0" fill="freeze"/>
        <image overflow="visible" xlinkHref={`${_digenglish_lib_}team/team_selected/2.png`} height="502" width="569"/>
      </g>
      <animate attributeName="display" fill="freeze" repeatCount="1" dur="1.458s" keyTimes="0;.143;.714;1" values="none;inline;none;none"/>
    </g>
    <g>
      <g transform="translate(505.7 266.8)" opacity="1">
        <animate attributeName="opacity" dur="1.458s" keyTimes="0;.543;.686;1" values="0;0;1;1" fill="freeze"/>
        <image overflow="visible" xlinkHref={`${_digenglish_lib_}team/team_selected/team_${this.props.ga_na ? this.props.ga_na : ''}.png`} height="226" width="231" transform="matrix(1.259 0 0 1.259 0 0)"/>
      </g>
      <animate attributeName="display" fill="freeze" repeatCount="1" dur="1.458s" keyTimes="0;.543;1" values="none;inline;inline"/>
    </g>
    <g>
      <g transform="translate(291.5 39.5)">
        <g>
          <g transform="translate(6 12)" opacity="0">
            <animate attributeName="opacity" dur="1.458s" keyTimes="0;.143;.543;.886;1" values="0;0;1;0;0" fill="freeze"/>
            <image overflow="visible" xlinkHref={`${_digenglish_lib_}team/team_selected/05.png`} height="701" width="701"/>
          </g>
          <animate attributeName="display" fill="freeze" repeatCount="1" dur="1.458s" keyTimes="0;.143;1" values="none;inline;inline"/>
        </g>
        <g>
          <g transform="matrix(1.21 0 0 1.21 -20.95 -15.75)" opacity="0">
            <animateTransform attributeName="transform" additive="replace" type="translate" dur="1.458s" keyTimes="0;.143;.429;1" values="376.511,374.511;376.511,374.511;370.391,374.442;370.391,374.442" fill="freeze"/>
            <animateTransform attributeName="transform" additive="sum" type="scale" dur="1.458s" keyTimes="0;.143;.429;1" values=".8,.8;.8,.8;1.21,1.21;1.21,1.21" fill="freeze"/>
            <animateTransform attributeName="transform" additive="sum" type="translate" dur="1.458s" keyTimes="0;.143;.429;1" values="-323.65,-322.65;-323.65,-322.65;-323.4,-322.45;-323.4,-322.45" fill="freeze"/>
            <animate attributeName="opacity" dur="1.458s" keyTimes="0;.143;.429;.6;1" values="0;0;1;0;0" fill="freeze"/>
            <image overflow="visible" xlinkHref={`${_digenglish_lib_}team/team_selected/03.png`} height="645" width="647"/>
          </g>
          <animate attributeName="display" fill="freeze" repeatCount="1" dur="1.458s" keyTimes="0;.143;1" values="none;inline;inline"/>
        </g>
        <g>
          <g transform="matrix(1.1 0 0 1.1 7.6 9.7)" opacity="0">
            <animateTransform attributeName="transform" additive="replace" type="translate" dur="1.458s" keyTimes="0;.229;.457;1" values="363.511,364.511;363.511,364.511;363.492,364.547;363.492,364.547" fill="freeze"/>
            <animateTransform attributeName="transform" additive="sum" type="scale" dur="1.458s" keyTimes="0;.229;.457;1" values=".8,.8;.8,.8;1.1,1.1;1.1,1.1" fill="freeze"/>
            <animateTransform attributeName="transform" additive="sum" type="translate" dur="1.458s" keyTimes="0;.229;.457;1" values="-323.65,-322.65;-323.65,-322.65;-323.6,-322.65;-323.6,-322.65" fill="freeze"/>
            <animate attributeName="opacity" dur="1.458s" keyTimes="0;.457;.657;1" values="1;1;0;0" fill="freeze"/>
            <image overflow="visible" xlinkHref={`${_digenglish_lib_}team/team_selected/04.png`} height="645" width="647"/>
          </g>
          <animate attributeName="display" fill="freeze" repeatCount="1" dur="1.458s" keyTimes="0;.229;1" values="none;inline;inline"/>
        </g>
        <g>
          <g transform="translate(65.5 88.95)" opacity="0">
            <animateTransform attributeName="transform" additive="replace" type="translate" dur="1.458s" keyTimes="0;.2;.457;.686;1" values="326.516,335.456;326.516,335.456;261.512,281.361;234.5,257.45;234.5,257.45" keySplines=".333 .453 .667 .787;.333 .453 .667 .787;.333 .667 .667 1;.1 .1 .9 .9" calcMode="spline" fill="freeze"/>
            <animateTransform attributeName="transform" additive="sum" type="scale" dur="1.458s" keyTimes="0;.2;.457;.686;1" values=".6,.6;.6,.6;.911,.911;1,1;1,1" keySplines=".333 .453 .667 .787;.333 .453 .667 .787;.333 .667 .667 1;.1 .1 .9 .9" calcMode="spline" fill="freeze"/>
            <animateTransform attributeName="transform" additive="sum" type="translate" dur="1.458s" keyTimes="0;.2;.457;.686;1" values="-169.2,-168.6;-169.2,-168.6;-169.15,-168.6;-169,-168.5;-169,-168.5" keySplines=".333 .453 .667 .787;.333 .453 .667 .787;.333 .667 .667 1;.1 .1 .9 .9" calcMode="spline" fill="freeze"/>
            <animate attributeName="opacity" dur="1.458s" keyTimes="0;.2;.457;.686;1" values="0;0;1;0;0" keySplines=".333 .453 .667 .787;.333 .453 .667 .787;.333 .667 .667 1;.1 .1 .9 .9" calcMode="spline" fill="freeze"/>
            <image overflow="visible" xlinkHref={`${_digenglish_lib_}team/team_selected/02.png`} height="337" width="338"/>
          </g>
          <animate attributeName="display" fill="freeze" repeatCount="1" dur="1.458s" keyTimes="0;.2;1" values="none;inline;inline"/>
        </g>
        <g>
          <g transform="translate(472.05 467.05)" opacity="0">
            <animateTransform attributeName="transform" additive="replace" type="translate" dur="1.458s" keyTimes="0;.2;.457;.714;1" values="372.05,365.05;372.05,365.05;464.05,467.05;472.05,467.05;472.05,467.05" keySplines=".25 .5 .5 1;.25 .5 .5 1;0 0 1 1;.1 .1 .9 .9" calcMode="spline" fill="freeze"/>
            <animate attributeName="opacity" dur="1.458s" keyTimes="0;.457;.714;1" values="1;1;0;0" keySplines=".25 .5 .5 1;0 0 1 1;.1 .1 .9 .9" calcMode="spline" fill="freeze"/>
            <image overflow="visible" xlinkHref={`${_digenglish_lib_}team/team_selected/01.png`} height="145" width="145"/>
          </g>
          <animate attributeName="display" fill="freeze" repeatCount="1" dur="1.458s" keyTimes="0;.2;1" values="none;inline;inline"/>
        </g>
      </g>
      <animate attributeName="display" fill="freeze" repeatCount="1" dur="1.458s" keyTimes="0;.143;1" values="none;inline;inline"/>
    </g>
  </g>
</svg>
			</div>
		);
	}
}

export default TeamPadSelected;