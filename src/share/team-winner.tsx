import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { observable, action } from 'mobx';
import { observer } from 'mobx-react';
import * as _ from 'lodash';

interface ITeamWinner {
	className: string;
	winner: ''|'ga'|'na'|'tie';
	onAniEnd: () => void;
}

@observer
class TeamWinner extends React.Component<ITeamWinner> {
	private _svg: MYSVGElement|null = null;
	private _audio_winner: HTMLAudioElement|null = null;
	private _audio_tie: HTMLAudioElement|null = null;
	private _className: string;
	constructor(props: ITeamWinner) {
		super(props);
		this._className = props.className + ' hide';
	}
	private _refSVG = (svg: SVGElement|null) => {
		if(this._svg || !svg) return;
		this._svg = svg as MYSVGElement;
		this._svg.setCurrentTime(0);

		if(this.props.winner !== '' && this._svg.animationsPaused()) this._svg.unpauseAnimations();
		else if (this.props.winner === '' && !this._svg.animationsPaused()) this._svg.pauseAnimations();
	}
	private _refAudioWinner = (audio: HTMLAudioElement|null) => {
		if(this._audio_winner || !audio) return;
		this._audio_winner = audio;
		this._audio_winner.currentTime = 0;

		if((this.props.winner === 'ga' || this.props.winner === 'na') && this._audio_winner.paused) this._audio_winner.play();
		else if ((this.props.winner !== 'ga' && this.props.winner !== 'na')  && !this._audio_winner.paused) this._audio_winner.pause();	
	}
	private _refAudioTie = (audio: HTMLAudioElement|null) => {
		if(this._audio_tie || !audio) return;
		this._audio_tie = audio;
		this._audio_tie.currentTime = 0;

		if(this.props.winner === 'tie' && this._audio_tie.paused) this._audio_tie.play();
		else if (this.props.winner !== 'tie'  && !this._audio_tie.paused) this._audio_tie.pause();	
	}
	public componentWillUpdate(next: ITeamWinner) {
		const isChange = (this.props.winner !== next.winner);

		if(isChange) {
			const arr: string[] = [];
			arr.push(next.className);
			if(next.winner === '') arr.push('hide');
			this._className = arr.join(' ');
		}	
		
	}
	public componentDidUpdate(prev: ITeamWinner) {
		if(this.props.winner !== '' && prev.winner === '') {
			if(this._svg) {
				this._svg.setCurrentTime(0);
				if (this._svg.animationsPaused()) this._svg.unpauseAnimations();
			}
			if(this._audio_winner) {
				this._audio_winner.currentTime = 0;
				if((this.props.winner === 'ga' || this.props.winner === 'na') && this._audio_winner.paused) this._audio_winner.play();
				else if ((this.props.winner !== 'ga' && this.props.winner !== 'na')  && !this._audio_winner.paused) this._audio_winner.pause();	
			}
			if(this._audio_tie) {
				this._audio_tie.currentTime = 0;
				if(this.props.winner === 'tie' && this._audio_tie.paused) this._audio_tie.play();
				else if (this.props.winner !== 'tie'  && !this._audio_tie.paused) this._audio_tie.pause();			
			}

			_.delay(() => {
				this.props.onAniEnd();
			}, 5300);
		} else if(this.props.winner === '' && prev.winner !== '') {
			if(this._svg) {
				this._svg.setCurrentTime(0);
				if (!this._svg.animationsPaused()) this._svg.pauseAnimations();
			}
			if(this._audio_winner) {
				this._audio_winner.currentTime = 0;
				if(!this._audio_winner.paused) this._audio_winner.pause();
			}
			if(this._audio_tie) {
				this._audio_tie.currentTime = 0;
				if(!this._audio_tie.paused) this._audio_tie.pause();
			}
		}
	}
	public render() {
		
		return (
			<div className={this._className}>
				<audio ref={this._refAudioWinner} controls={false} autoPlay={false} src={`${_digenglish_lib_}team/winner/winner.mp3`}/>
				<audio ref={this._refAudioTie} controls={false} autoPlay={false} src={`${_digenglish_lib_}team/winner/tie.mp3`}/>
<svg ref={this._refSVG} imageRendering="auto" baseProfile="basic" version="1.1" x="0px" y="0px" width="1280" height="800" xmlns="http://www.w3.org/2000/svg" xmlnsXlink="http://www.w3.org/1999/xlink">
  <g overflow="visible">
  	<g transform="translate(232.05 104.05)" opacity="0">
      <animateTransform attributeName="transform" additive="replace" type="translate" dur="5s" keyTimes="0;0.077;0.864;0.932;1" values="626.1,387.1;639.946,399.987;639.946,399.987;626.1,387.1;626.1,387.1" fill="freeze"/>
      <animateTransform attributeName="transform" additive="sum" type="scale" dur="5s" keyTimes="0;0.077;0.864;0.932;1" values="1,1;1.624,1.413;1.624,1.413;1,1;1,1" fill="freeze"/>
      <animateTransform attributeName="transform" additive="sum" type="translate" dur="5s" keyTimes="0;1" values="-394.05,-283.05;-394.05,-283.05" fill="freeze"/>
      <animate attributeName="opacity" dur="5s" keyTimes="0;0.077;0.864;0.932;1" values="0;.5;.5;0;0" fill="freeze"/>
      <path fill="#000" stroke="none" d="M788.15 566.1L788.15 0 0 0 0 566.1 788.15 566.1Z"/>
    </g>
	<g display={this.props.winner === 'ga' || this.props.winner === 'na' ? '' : 'none'}>
		<g display="none">
		<g transform="translate(364.55 133.6)" opacity="0">
			<animate attributeName="opacity" dur="5.167s" keyTimes="0;0.097;0.148;0.768;0.787;0.819;1" values="0;0;1;1;.63;0;0" fill="freeze"/>
			<g>
			<animateTransform attributeName="transform" additive="replace" type="translate" begin=".5s" repeatDur="1.767s" dur="1.533s" keyTimes="0;.152;.326;.478;.652;.805;.978;1" values="284.5,251;284.522,251.023;284.5,251;284.522,251.023;284.5,251;284.522,251.023;284.5,251;284.5,251" fill="freeze"/>
			<animateTransform attributeName="transform" additive="sum" type="scale" begin=".5s" repeatDur="1.767s" dur="1.533s" keyTimes="0;.152;.326;.478;.652;.805;.978;1" values="1,1;.8,.8;1,1;.8,.8;1,1;.8,.8;1,1;1,1" fill="freeze"/>
			<animateTransform attributeName="transform" additive="sum" type="translate" begin=".5s" repeatDur="1.767s" dur="1.533s" keyTimes="0;.152;.326;.478;.652;.805;.978;1" values="-284.5,-251;-284.6,-251.1;-284.5,-251;-284.6,-251.1;-284.5,-251;-284.6,-251.1;-284.5,-251;-284.5,-251" fill="freeze"/>
			<image overflow="visible" xlinkHref={`${_digenglish_lib_}team/winner/2.png`} height="502" width="569"/>
			</g>
		</g>
		<animate attributeName="display" fill="freeze" repeatCount="1" dur="5.167s" keyTimes="0;0.097;0.826;1" values="none;inline;none;none"/>
		</g>
		<g>
		<g transform="translate(332 543.15)" opacity="0">
			<animate attributeName="opacity" dur="5.167s" keyTimes="0;0.064;0.135;0.787;0.852;1" values="0;0;1;1;0;0" fill="freeze"/>
			<image overflow="visible" xlinkHref={`${_digenglish_lib_}team/winner/ribbon.png`} height="133" width="631"/>
		</g>
		<animate attributeName="display" fill="freeze" repeatCount="1" dur="5.167s" keyTimes="0;0.064;1" values="none;inline;inline"/>
		</g>
		<g>
		<g transform="translate(497.1 577.6)" opacity="0">
			<animate attributeName="opacity" dur="5.167s" keyTimes="0;0.064;0.135;0.787;0.852;1" values="0;0;1;1;0;0" fill="freeze"/>
			<image overflow="visible" xlinkHref={`${_digenglish_lib_}team/winner/winner.png`} height="62" width="294"/>
		</g>
		<animate attributeName="display" fill="freeze" repeatCount="1" dur="5.167s" keyTimes="0;0.064;1" values="none;inline;inline"/>
		</g>
		<g>
		<g transform="translate(497.1 128)" opacity="0">
			<animate attributeName="opacity" dur="5.167s" keyTimes="0;0.064;0.135;0.787;0.852;1" values="0;0;1;1;0;0" fill="freeze"/>
			<image overflow="visible" xlinkHref={`${_digenglish_lib_}team/winner/crown.png`} height="197" width="301"/>
		</g>
		<animate attributeName="display" fill="freeze" repeatCount="1" dur="5.167s" keyTimes="0;0.064;1" values="none;inline;inline"/>
		</g>
		<g>
		<g transform="translate(531.6 315)" opacity="0">
			<animate attributeName="opacity" dur="5.167s" keyTimes="0;0.064;0.135;0.787;0.852;1" values="0;0;1;1;0;0" fill="freeze"/>
			<path fill="#FFF" stroke="none" d="M228.55 16.55Q228.55 .55 212.55 .55L18.5 .55Q2.5 .55 2.5 16.55L2.5 205.6Q2.5 221.6 18.5 221.6L212.55 221.6Q228.55 221.6 228.55 205.6L228.55 16.55Z"/>
			<image overflow="visible" xlinkHref={`${_digenglish_lib_}team/winner/team_${this.props.winner ? this.props.winner : ''}.png`}  height="226" width="231"/>
		</g>
		<animate attributeName="display" fill="freeze" repeatCount="1" dur="5.167s" keyTimes="0;0.064;1" values="none;inline;inline"/>
		</g>
	</g>
	<g display={this.props.winner === 'tie' ? '' : 'none'}>
		<g>
		<g id=".__EB.__A6.__AC.__EB.__B3.__B8" transform="translate(327 503.65)" opacity="0">
			<animate attributeName="opacity" dur="4.833s" keyTimes="0;0.069;0.145;0.841;0.91;1" values="0;0;1;1;0;0" fill="freeze"/>
			<image overflow="visible" xlinkHref={`${_digenglish_lib_}team/winner/ribbon.png`} height="133" width="631"/>
		</g>
		<animate attributeName="display" fill="freeze" repeatCount="1" dur="4.833s" keyTimes="0;0.069;1" values="none;inline;inline"/>
		</g>
		<g>
		<g id="ww" transform="translate(492.1 538.1)" opacity="0">
			<animate attributeName="opacity" dur="4.833s" keyTimes="0;0.069;0.145;0.841;0.91;1" values="0;0;1;1;0;0" fill="freeze"/>
			<image overflow="visible" xlinkHref={`${_digenglish_lib_}team/winner/tie.png`} height="62" width="133" transform="translate(84.55 -2)"/>
		</g>
		<animate attributeName="display" fill="freeze" repeatCount="1" dur="4.833s" keyTimes="0;0.069;1" values="none;inline;inline"/>
		</g>
		<g>
		<g id=".__EC.__99.__95.__EA.__B4.__80" transform="translate(494.15 245.5)" opacity="0">
			<animate attributeName="opacity" dur="4.833s" keyTimes="0;0.069;0.145;0.841;0.91;1" values="0;0;1;1;0;0" fill="freeze"/>
			<image overflow="visible" xlinkHref={`${_digenglish_lib_}team/winner/hand.png`} height="245" width="332" transform="translate(-17.45 -6.4)"/>
		</g>
		<animate attributeName="display" fill="freeze" repeatCount="1" dur="4.833s" keyTimes="0;0.069;1" values="none;inline;inline"/>
		</g>
		<g>
		<g id="A" transform="translate(198.5 236.5)" opacity="0">
			<animate attributeName="opacity" dur="4.833s" keyTimes="0;0.069;0.145;0.841;0.91;1" values="0;0;1;1;0;0" fill="freeze"/>
			<image overflow="visible" xlinkHref={`${_digenglish_lib_}team/winner/team_ga.png`} height="226" width="231"/>
		</g>
		<animate attributeName="display" fill="freeze" repeatCount="1" dur="4.833s" keyTimes="0;0.069;1" values="none;inline;inline"/>
		</g>
		<g>
		<g id="B" transform="translate(855.5 236.5)" opacity="0">
			<animate attributeName="opacity" dur="4.833s" keyTimes="0;0.069;0.145;0.841;0.91;1" values="0;0;1;1;0;0" fill="freeze"/>
			<image overflow="visible" xlinkHref={`${_digenglish_lib_}team/winner/team_na.png`} height="226" width="231"/>
		</g>
		<animate attributeName="display" fill="freeze" repeatCount="1" dur="4.833s" keyTimes="0;0.069;1" values="none;inline;inline"/>
		</g>
	</g>
	<g display="none">
      <g transform="translate(388.55 219.05)">
        <g display="none">
          <g transform="translate(80.55 86.95)" opacity="0">
            <animate attributeName="opacity" dur="5.167s" keyTimes="0;0.135;0.194;0.709;0.774;1" values="0;0;1;1;0;0" fill="freeze"/>
            <g opacity="1">
              <animateTransform attributeName="transform" additive="replace" type="translate" begin=".7s" repeatDur="1.5s" dur="0.5s" keyTimes="0;.467;.933;1" values="22,22;22.025,22.025;22,22;22,22" fill="freeze"/>
              <animateTransform attributeName="transform" additive="sum" type="scale" begin=".7s" repeatDur="1.5s" dur="0.5s" keyTimes="0;.467;.933;1" values="1,1;.64,.64;1,1;1,1" fill="freeze"/>
              <animateTransform attributeName="transform" additive="sum" type="translate" begin=".7s" repeatDur="1.5s" dur="0.5s" keyTimes="0;.467;.933;1" values="-22,-22;-22.15,-22.15;-22,-22;-22,-22" fill="freeze"/>
              <animate attributeName="opacity" begin=".7s" repeatDur="1.5s" dur="0.5s" keyTimes="0;.467;.933;1" values="1;.76;1;1" fill="freeze"/>
              <image overflow="visible" xlinkHref={`${_digenglish_lib_}team/winner/effect1.png`} height="44" width="44"/>
            </g>
          </g>
          <animate attributeName="display" fill="freeze" repeatCount="1" dur="5.167s" keyTimes="0;0.135;0.813;1" values="none;inline;none;none"/>
        </g>
        <g display="none">
          <g transform="translate(452.1 22.05)" opacity="0">
            <animate attributeName="opacity" dur="5.167s" keyTimes="0;0.168;0.226;0.742;0.806;1" values="0;0;1;1;0;0" fill="freeze"/>
            <g opacity="1">
              <animateTransform attributeName="transform" additive="replace" type="translate" begin=".867s" repeatDur="1.333s" dur="0.533s" keyTimes="0;.5;.938;1" values="27.5,27.5;27.517,27.517;27.5,27.5;27.5,27.5" fill="freeze"/>
              <animateTransform attributeName="transform" additive="sum" type="scale" begin=".867s" repeatDur="1.333s" dur="0.533s" keyTimes="0;.5;.938;1" values="1,1;.614,.614;1,1;1,1" fill="freeze"/>
              <animateTransform attributeName="transform" additive="sum" type="translate" begin=".867s" repeatDur="1.333s" dur="0.533s" keyTimes="0;.5;.938;1" values="-27.5,-27.5;-27.7,-27.7;-27.5,-27.5;-27.5,-27.5" fill="freeze"/>
              <animate attributeName="opacity" begin=".867s" repeatDur="1.333s" dur="0.533s" keyTimes="0;.5;.938;1" values="1;.61;1;1" fill="freeze"/>
              <image overflow="visible" xlinkHref={`${_digenglish_lib_}team/winner/effect2.png`} height="55" width="55"/>
            </g>
          </g>
          <animate attributeName="display" fill="freeze" repeatCount="1" dur="5.167s" keyTimes="0;0.168;0.813;1" values="none;inline;none;none"/>
        </g>
        <g display="none">
          <g transform="translate(-44 107.95)" style={{mixBlendMode: 'screen',}} opacity="0">
            <animateTransform attributeName="transform" additive="replace" type="translate" dur="5.167s" keyTimes="0;0.174;0.297;1" values="113.55,107.95;113.55,107.95;-44,107.95;-44,107.95" keySplines=".25 .5 .5 1;.25 .5 .5 1;.1 .1 .9 .9" calcMode="spline" fill="freeze"/>
            <animate attributeName="opacity" dur="5.167s" keyTimes="0;0.174;0.297;1" values="1;1;0;0" keySplines=".25 .5 .5 1;.25 .5 .5 1;.1 .1 .9 .9" calcMode="spline" fill="freeze"/>
            <image overflow="visible" xlinkHref={`${_digenglish_lib_}team/winner/effect3.png`} height="23" width="11"/>
          </g>
          <animate attributeName="display" fill="freeze" repeatCount="1" dur="5.167s" keyTimes="0;0.174;0.813;1" values="none;inline;none;none"/>
        </g>
        <g display="none">
          <g transform="translate(8.6 181.3)" style={{mixBlendMode: 'screen',}} opacity="0">
            <animateTransform attributeName="transform" additive="replace" type="translate" dur="5.167s" keyTimes="0;0.187;0.31;1" values="115.75,151;115.75,151;8.6,181.3;8.6,181.3" keySplines=".25 .5 .5 1;.25 .5 .5 1;.1 .1 .9 .9" calcMode="spline" fill="freeze"/>
            <animate attributeName="opacity" dur="5.167s" keyTimes="0;0.187;0.31;1" values="1;1;0;0" keySplines=".25 .5 .5 1;.25 .5 .5 1;.1 .1 .9 .9" calcMode="spline" fill="freeze"/>
            <image overflow="visible" xlinkHref={`${_digenglish_lib_}team/winner/effect3.png`} height="23" width="11" transform="matrix(.8 0 0 .8 0 0)"/>
          </g>
          <animate attributeName="display" fill="freeze" repeatCount="1" dur="5.167s" keyTimes="0;0.187;0.813;1" values="none;inline;none;none"/>
        </g>
        <g display="none">
          <g transform="translate(502.95 80.8)" style={{mixBlendMode: 'screen',}} opacity="0">
            <animate attributeName="opacity" dur="5.167s" keyTimes="0;0.181;0.303;1" values="1;1;0;0" keySplines=".25 .5 .5 1;.25 .5 .5 1;.1 .1 .9 .9" calcMode="spline" fill="freeze"/>
            <image overflow="visible" xlinkHref={`${_digenglish_lib_}team/winner/effect3.png`} height="23" width="11" transform="matrix(.559 .573 -.573 .559 13.15 0)"/>
          </g>
          <animate attributeName="display" fill="freeze" repeatCount="1" dur="5.167s" keyTimes="0;0.181;0.813;1" values="none;inline;none;none"/>
        </g>
        <g display="none">
          <g transform="translate(506.25 136.05)" style={{mixBlendMode: 'screen',}} opacity="0">
            <animateTransform attributeName="transform" additive="replace" type="translate" dur="5.167s" keyTimes="0;0.194;0.316;1" values="410.1,160.05;410.1,160.05;506.25,136.05;506.25,136.05" keySplines=".25 .5 .5 1;.25 .5 .5 1;.1 .1 .9 .9" calcMode="spline" fill="freeze"/>
            <animate attributeName="opacity" dur="5.167s" keyTimes="0;0.194;0.316;1" values="1;1;0;0" keySplines=".25 .5 .5 1;.25 .5 .5 1;.1 .1 .9 .9" calcMode="spline" fill="freeze"/>
            <image overflow="visible" xlinkHref={`${_digenglish_lib_}team/winner/effect6.png`} height="32" width="16"/>
          </g>
          <animate attributeName="display" fill="freeze" repeatCount="1" dur="5.167s" keyTimes="0;0.194;0.813;1" values="none;inline;none;none"/>
        </g>
        <g display="none">
          <g transform="translate(33.6 -40)" style={{mixBlendMode: 'screen',}} opacity="0">
            <animateTransform attributeName="transform" additive="replace" type="translate" dur="5.167s" keyTimes="0;0.181;0.303;1" values="131.76,73.459;131.76,73.459;45.6,-17.5;45.6,-17.5" keySplines=".25 .5 .5 1;.25 .5 .5 1;.1 .1 .9 .9" calcMode="spline" fill="freeze"/>
            <animateTransform attributeName="transform" additive="sum" type="scale" dur="5.167s" keyTimes="0;0.181;0.303;1" values=".6,.6;.6,.6;1,1;1,1" keySplines=".25 .5 .5 1;.25 .5 .5 1;.1 .1 .9 .9" calcMode="spline" fill="freeze"/>
            <animateTransform attributeName="transform" additive="sum" type="translate" dur="5.167s" keyTimes="0;0.181;0.303;1" values="-12.1,-22.6;-12.1,-22.6;-12,-22.5;-12,-22.5" keySplines=".25 .5 .5 1;.25 .5 .5 1;.1 .1 .9 .9" calcMode="spline" fill="freeze"/>
            <animate attributeName="opacity" dur="5.167s" keyTimes="0;0.181;0.303;1" values="1;1;0;0" keySplines=".25 .5 .5 1;.25 .5 .5 1;.1 .1 .9 .9" calcMode="spline" fill="freeze"/>
            <image overflow="visible" xlinkHref={`${_digenglish_lib_}team/winner/effect7.png`} height="45" width="24"/>
          </g>
          <animate attributeName="display" fill="freeze" repeatCount="1" dur="5.167s" keyTimes="0;0.181;0.813;1" values="none;inline;none;none"/>
        </g>
        <g display="none">
          <g transform="translate(417.8 -11)" style={{mixBlendMode: 'screen',}} opacity="0">
            <animateTransform attributeName="transform" additive="replace" type="translate" dur="5.167s" keyTimes="0;0.2;0.322;1" values="379.8,86.95;379.8,86.95;417.8,-11;417.8,-11" keySplines=".25 .5 .5 1;.25 .5 .5 1;.1 .1 .9 .9" calcMode="spline" fill="freeze"/>
            <animate attributeName="opacity" dur="5.167s" keyTimes="0;0.2;0.322;1" values="1;1;0;0" keySplines=".25 .5 .5 1;.25 .5 .5 1;.1 .1 .9 .9" calcMode="spline" fill="freeze"/>
            <image overflow="visible" xlinkHref={`${_digenglish_lib_}team/winner/effect7.png`} height="45" width="24" transform="matrix(.797 .604 -.604 .797 27.2 0)"/>
          </g>
          <animate attributeName="display" fill="freeze" repeatCount="1" dur="5.167s" keyTimes="0;0.2;0.813;1" values="none;inline;none;none"/>
        </g>
      </g>
      <animate attributeName="display" fill="freeze" repeatCount="1" dur="5.167s" keyTimes="0;0.135;0.852;1" values="none;inline;none;none"/>
    </g>
  </g>
</svg>
			</div>
		);
	}
}

export default TeamWinner;