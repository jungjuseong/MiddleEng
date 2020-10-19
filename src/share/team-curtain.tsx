import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { observable, action } from 'mobx';
import { observer } from 'mobx-react';
import * as _ from 'lodash';

interface ITeamCurtain {
	className: string;
	view: boolean;
	start: boolean;
}

@observer
class TeamCurtain extends React.Component<ITeamCurtain> {
	private _svg: MYSVGElement|null = null;
	private _audio: HTMLAudioElement|null = null;
	private _className: string;
	constructor(props: ITeamCurtain) {
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
	public componentWillUpdate(next: ITeamCurtain) {
		const isChange = (this.props.view !== next.view) ||
							(this.props.start !== next.start);

		if(isChange) {
			const arr: string[] = [];
			arr.push(next.className);
			if(!next.view) arr.push('hide');
			if(next.start) arr.push('view-ani');
			this._className = arr.join(' ');
		}	
		
	}
	public componentDidUpdate(prev: ITeamCurtain) {
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
				<audio ref={this._refAudio} controls={false} autoPlay={false} src={`${_digenglish_lib_}team/curtain/curtain.mp3`}/>
<svg ref={this._refSVG} imageRendering="auto" baseProfile="basic" version="1.1" x="0px" y="0px" width="1280" height="800" xmlns="http://www.w3.org/2000/svg" xmlnsXlink="http://www.w3.org/1999/xlink">
  <g overflow="visible">
    <g>
      <g transform="matrix(.351 0 0 1 -152 -10)">
        <animateTransform attributeName="transform" additive="replace" type="translate" dur="1.125s" keyTimes="0;.074;.778;1" values="318.517,392.5;318.517,392.5;-77.055,382.5;-77.055,382.5" fill="freeze"/>
        <animateTransform attributeName="transform" additive="sum" type="scale" dur="1.125s" keyTimes="0;.074;.778;1" values="1.492,1;1.492,1;.351,1;.351,1" fill="freeze"/>
        <animateTransform attributeName="transform" additive="sum" type="translate" dur="1.125s" keyTimes="0;.074;.778;1" values="-213.5,-392.5;-213.5,-392.5;-213.2,-392.5;-213.2,-392.5" fill="freeze"/>
        <image overflow="visible" xlinkHref={`${_digenglish_lib_}team/curtain/curtain_02_l.png`} height="785" width="427"/>
      </g>
      <animate attributeName="display" fill="freeze" repeatCount="1" dur="1.125s" keyTimes="0;.074;1" values="none;inline;inline"/>
    </g>
    <g>
      <g transform="matrix(.357 0 0 1 1287.15 0)">
        <animateTransform attributeName="transform" additive="replace" type="translate" dur="1.125s" keyTimes="0;.074;.778;1" values="958.967,392.5;958.967,392.5;1365.595,392.5;1365.595,392.5" fill="freeze"/>
        <animateTransform attributeName="transform" additive="sum" type="scale" dur="1.125s" keyTimes="0;.074;.778;1" values="1.459,1;1.459,1;.357,1;.357,1" fill="freeze"/>
        <animateTransform attributeName="transform" additive="sum" type="translate" dur="1.125s" keyTimes="0;.074;.778;1" values="-220,-392.5;-220,-392.5;-220.15,-392.5;-220.15,-392.5" fill="freeze"/>
        <image overflow="visible" xlinkHref={`${_digenglish_lib_}team/curtain/curtain_02_r.png`} height="785" width="440"/>
      </g>
      <animate attributeName="display" fill="freeze" repeatCount="1" dur="1.125s" keyTimes="0;.074;1" values="none;inline;inline"/>
    </g>
    <g display="none">
      <g>
        <image overflow="visible" xlinkHref={`${_digenglish_lib_}team/curtain/curtain_01.png`} height="784" width="1280"/>
      </g>
      <animate attributeName="display" fill="freeze" repeatCount="1" dur="1.125s" keyTimes="0;.074;1" values="inline;none;none"/>
    </g>
  </g>
</svg>	
			</div>
		);
	}
}

export default TeamCurtain;