import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { observable, action } from 'mobx';
import { observer } from 'mobx-react';
import * as _ from 'lodash';

interface ITeamPadResult {
	className: string;
	result: ''|'win'|'lose'|'tie';
	onAniEnd: () => void;
}

@observer
class TeamPadResult extends React.Component<ITeamPadResult> {
	private _svg: MYSVGElement|null = null;
	private _audio_win: HTMLAudioElement|null = null;
	private _audio_lose: HTMLAudioElement|null = null;
	private _audio_tie: HTMLAudioElement|null = null;
	private _className: string;
	constructor(props: ITeamPadResult) {
		super(props);
		this._className = props.className + ' hide';
	}
	private _refSVG = (svg: SVGElement|null) => {
		if(this._svg || !svg) return;
		this._svg = svg as MYSVGElement;
		this._svg.setCurrentTime(0);

		if(this.props.result !== '' && this._svg.animationsPaused()) this._svg.unpauseAnimations();
		else if (this.props.result === '' && !this._svg.animationsPaused()) this._svg.pauseAnimations();
	}
	private _refAudioWin = (audio: HTMLAudioElement|null) => {
		if(this._audio_win || !audio) return;
		this._audio_win = audio;
		this._audio_win.currentTime = 0;

		if(this.props.result === 'win' && this._audio_win.paused) this._audio_win.play();
		else if (this.props.result !== 'win' && !this._audio_win.paused) this._audio_win.pause();	
	}
	private _refAudioLose = (audio: HTMLAudioElement|null) => {
		if(this._audio_lose || !audio) return;
		this._audio_lose = audio;
		this._audio_lose.currentTime = 0;

		if(this.props.result === 'lose' && this._audio_lose.paused) this._audio_lose.play();
		else if (this.props.result !== 'lose' && !this._audio_lose.paused) this._audio_lose.pause();	
	}
	

	private _refAudioTie = (audio: HTMLAudioElement|null) => {
		if(this._audio_tie || !audio) return;
		this._audio_tie = audio;
		this._audio_tie.currentTime = 0;

		if(this.props.result === 'tie' && this._audio_tie.paused) this._audio_tie.play();
		else if (this.props.result !== 'tie'  && !this._audio_tie.paused) this._audio_tie.pause();	
	}
	public componentWillUpdate(next: ITeamPadResult) {
		const isChange = (this.props.result !== next.result);

		if(isChange) {
			const arr: string[] = [];
			arr.push(next.className);
			if(next.result === '') arr.push('hide');
			this._className = arr.join(' ');
			// console.log(this._className);
		}	
		
	}
	public componentDidUpdate(prev: ITeamPadResult) {
		if(this.props.result !== '' && prev.result === '') {
			if(this._svg) {
				this._svg.setCurrentTime(0);
				if (this._svg.animationsPaused()) this._svg.unpauseAnimations();
			}
			if(this._audio_win) {
				this._audio_win.currentTime = 0;
				if(this.props.result === 'win' && this._audio_win.paused) this._audio_win.play();
				else if (this.props.result !== 'win'  && !this._audio_win.paused) this._audio_win.pause();	
			}
			if(this._audio_lose) {
				this._audio_lose.currentTime = 0;
				if(this.props.result === 'lose' && this._audio_lose.paused) this._audio_lose.play();
				else if (this.props.result !== 'lose'  && !this._audio_lose.paused) this._audio_lose.pause();	
			}
			if(this._audio_tie) {
				this._audio_tie.currentTime = 0;
				if(this.props.result === 'tie' && this._audio_tie.paused) this._audio_tie.play();
				else if (this.props.result !== 'tie'  && !this._audio_tie.paused) this._audio_tie.pause();			
			}

			_.delay(() => {
				this.props.onAniEnd();
			}, 5300);
		} else if(this.props.result === '' && prev.result !== '') {
			if(this._svg) {
				this._svg.setCurrentTime(0);
				if (!this._svg.animationsPaused()) this._svg.pauseAnimations();
			}
			if(this._audio_win) {
				this._audio_win.currentTime = 0;
				if(!this._audio_win.paused) this._audio_win.pause();
			}
			if(this._audio_lose) {
				this._audio_lose.currentTime = 0;
				if(!this._audio_lose.paused) this._audio_lose.pause();
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
				<audio ref={this._refAudioWin} controls={false} autoPlay={false} src={`${_digenglish_lib_}team/winner/winner.mp3`}/>
				<audio ref={this._refAudioLose} controls={false} autoPlay={false} src={`${_digenglish_lib_}team/good-work.mp3`}/>
				<audio ref={this._refAudioTie} controls={false} autoPlay={false} src={`${_digenglish_lib_}team/winner/tie.mp3`}/>


<svg ref={this._refSVG} imageRendering="auto" baseProfile="basic" version="1.1" x="0px" y="0px" width="1280" height="800" xmlns="http://www.w3.org/2000/svg" xmlnsXlink="http://www.w3.org/1999/xlink">
<defs>
    <filter id="filter7" filterUnits="objectBoundingBox" width="100%" height="100%" x="0%" y="0%">
      <feColorMatrix type="matrix" in="SourceGraphic" result="colorTrans" values="1 0 0 0 0 0 1 0 0 0 0 0 1 0 0 0 0 0 .88 0"/>
    </filter>
    <filter id="filter8" filterUnits="objectBoundingBox" width="100%" height="100%" x="0%" y="0%">
      <feColorMatrix type="matrix" in="SourceGraphic" result="colorTrans" values="1 0 0 0 0 0 1 0 0 0 0 0 1 0 0 0 0 0 .75 0"/>
    </filter>
    <filter id="filter9" filterUnits="objectBoundingBox" width="100%" height="100%" x="0%" y="0%">
      <feColorMatrix type="matrix" in="SourceGraphic" result="colorTrans" values="1 0 0 0 0 0 1 0 0 0 0 0 1 0 0 0 0 0 .63 0"/>
    </filter>
    <filter id="filter11" filterUnits="objectBoundingBox" width="100%" height="100%" x="0%" y="0%">
      <feColorMatrix type="matrix" in="SourceGraphic" result="colorTrans" values="1 0 0 0 0 0 1 0 0 0 0 0 1 0 0 0 0 0 .25 0"/>
    </filter>
    <filter id="filter12" filterUnits="objectBoundingBox" width="100%" height="100%" x="0%" y="0%">
      <feColorMatrix type="matrix" in="SourceGraphic" result="colorTrans" values="1 0 0 0 0 0 1 0 0 0 0 0 1 0 0 0 0 0 .13 0"/>
    </filter>
    <filter id="filter13" filterUnits="objectBoundingBox" width="100%" height="100%" x="0%" y="0%">
      <feColorMatrix type="matrix" in="SourceGraphic" result="colorTrans" values="1 0 0 0 0 0 1 0 0 0 0 0 1 0 0 0 0 0 0 0"/>
    </filter>
    <g id="Wkrf0o9r1" overflow="visible">
      <use xlinkHref="#22" transform="matrix(1 .021 -.021 1 21.7 6.35)"/>
      <use xlinkHref="#11" transform="translate(25.2 -2.5)"/>
    </g>
    <g id="11" overflow="visible">
      <image overflow="visible" xlinkHref={`${_digenglish_lib_}team/pad_result/hand1.png`} height="239" width="186"/>
    </g>
    <g id="22" overflow="visible">
      <image overflow="visible" xlinkHref={`${_digenglish_lib_}team/pad_result/hand2.png`} height="224" width="218"/>
    </g>
    <pattern id="Pattern_1" patternUnits="userSpaceOnUse" patternTransform="matrix(.258 .965 -.965 .258 127.9 -26.75)" width="60" height="65">
      <image id="effect_png" x="0" y="0" width="60" height="65"/>
    </pattern>
  </defs>
  
  <g overflow="visible">
	{/* 배경 */}
    <g transform="translate(232.05 104.05)" opacity="0">
      <animateTransform attributeName="transform" additive="replace" type="translate" dur="5s" keyTimes="0;0.075;0.867;0.933;1" values="626.1,387.1;639.946,399.987;639.946,399.987;626.1,387.1;626.1,387.1" fill="freeze"/>
      <animateTransform attributeName="transform" additive="sum" type="scale" dur="5s" keyTimes="0;0.075;0.867;0.933;1" values="1,1;1.624,1.413;1.624,1.413;1,1;1,1" fill="freeze"/>
      <animateTransform attributeName="transform" additive="sum" type="translate" dur="5s" keyTimes="0;1" values="-394.05,-283.05;-394.05,-283.05" fill="freeze"/>
      <animate attributeName="opacity" dur="5s" keyTimes="0;0.075;0.867;0.933;1" values="0;.5;.5;0;0" fill="freeze"/>
      <path fill="#000" stroke="none" d="M788.15 566.1L788.15 0 0 0 0 566.1 788.15 566.1Z"/>
    </g>
	{/* 승리 */}
	<g display={this.props.result === 'win' ? '' : 'none'}>
    	<g display="none">
			<g transform="matrix(.94 0 0 .94 374.6 164.65)" style={{mixBlendMode: 'screen',}} opacity="0" display="none">
				<animate attributeName="opacity" dur="5s" keyTimes="0;0.1;0.167;0.792;0.858;1" values="0;0;1;1;0;0" fill="freeze"/>
				<g transform="matrix(.95 0 0 .95 14.2 12.55)">
				<animateTransform attributeName="transform" additive="replace" type="translate" dur="5s" keyTimes="0;0.1;0.158;0.225;0.283;0.35;0.809;0.858;1" values="284.5,251;284.5,251;284.522,251.023;284.5,251;284.522,251.023;284.5,251;284.522,251.023;284.558,250.989;284.558,250.989" fill="freeze"/>
				<animateTransform attributeName="transform" additive="sum" type="scale" dur="5s" keyTimes="0;0.1;0.158;0.225;0.283;0.35;0.809;0.858;1" values="1,1;1,1;.8,.8;1,1;.8,.8;1,1;.8,.8;.95,.95;.95,.95" fill="freeze"/>
				<animateTransform attributeName="transform" additive="sum" type="translate" dur="5s" keyTimes="0;0.1;0.158;0.225;0.283;0.35;0.809;0.858;1" values="-284.5,-251;-284.5,-251;-284.6,-251.1;-284.5,-251;-284.6,-251.1;-284.5,-251;-284.6,-251.1;-284.65,-251.05;-284.65,-251.05" fill="freeze"/>
				<image overflow="visible" xlinkHref={`${_digenglish_lib_}team/pad_result/2.png`} height="502" width="569"/>
				</g>
				<animate attributeName="display" fill="freeze" repeatCount="1" dur="5s" keyTimes="0;0.1;0.867;1" values="none;inline;none;none"/>
			</g>
			<animate attributeName="display" fill="freeze" repeatCount="1" dur="5s" keyTimes="0;0.1;0.867;1" values="none;inline;none;none"/>
		</g>
		<g>
			<g transform="translate(476.25 227.2)" opacity="0">
				<animate attributeName="opacity" dur="5s" keyTimes="0;0.075;0.142;0.833;0.9;1" values="0;0;1;1;0;0" fill="freeze"/>
				<image overflow="visible" xlinkHref={`${_digenglish_lib_}team/pad_result/circle.png`} height="330" width="320"/>
			</g>
			<animate attributeName="display" fill="freeze" repeatCount="1" dur="5s" keyTimes="0;0.075;1" values="none;inline;inline"/>
		</g>
		<g>
			<g transform="translate(462.25 220.2)" opacity="0">
				<animate attributeName="opacity" dur="5s" keyTimes="0;0.075;0.142;0.833;0.9;1" values="0;0;1;1;0;0" fill="freeze"/>
				<image overflow="visible" xlinkHref={`${_digenglish_lib_}team/pad_result/crown.png`} height="237" width="339"/>
			</g>
			<animate attributeName="display" fill="freeze" repeatCount="1" dur="5s" keyTimes="0;0.075;1" values="none;inline;inline"/>
		</g>
		<g>
			<g transform="translate(321.2 457.25)" opacity="0">
				<animate attributeName="opacity" dur="5s" keyTimes="0;0.075;0.142;0.833;0.9;1" values="0;0;1;1;0;0" fill="freeze"/>
				<image overflow="visible" xlinkHref={`${_digenglish_lib_}team/pad_result/ribbon.png`} height="133" width="631"/>
			</g>
			<animate attributeName="display" fill="freeze" repeatCount="1" dur="5s" keyTimes="0;0.075;1" values="none;inline;inline"/>
		</g>
		<g>
			<g transform="translate(486.15 491.15)" opacity="0">
				<animate attributeName="opacity" dur="5s" keyTimes="0;0.075;0.142;0.833;0.9;1" values="0;0;1;1;0;0" fill="freeze"/>
				<image overflow="visible" xlinkHref={`${_digenglish_lib_}team/pad_result/WINNER.png`} height="62" width="294"/>
			</g>
			<animate attributeName="display" fill="freeze" repeatCount="1" dur="5s" keyTimes="0;0.075;1" values="none;inline;inline"/>
		</g>
	</g>
  
	{/* 패배 */}
	<g display={this.props.result === 'lose' ? '' : 'none'}>
		<g>
			<g transform="translate(476.25 227.2)" opacity="0">
				<animate attributeName="opacity" dur="4s" keyTimes="0;0.075;0.134;0.833;0.9;1" values="0;0;1;1;0;0" fill="freeze"/>
				<image overflow="visible" xlinkHref={`${_digenglish_lib_}team/pad_result/circle.png`} height="330" width="320"/>
			</g>
			<animate attributeName="display" fill="freeze" repeatCount="1" dur="4s" keyTimes="0;0.075;1" values="none;inline;inline"/>
		</g>
		<g mask="url(#lose-mask123)">
			<g>
				<g transform="translate(517.6 285.6)" filter="url(#filter13)">
					<g>
						<use xlinkHref="#22" transform="matrix(.992 .122 -.122 .992 57.65 -17.75)">
							<animateTransform attributeName="transform" additive="replace" type="translate" dur="4s" keyTimes="0;0.908;0.909;0.916;0.917;0.95;0.966;0.992;1" values="215.498,199.889;215.498,199.889;220.456,197.643;220.456,197.643;225.468,195.326;205.429,204.37;205.429,204.37;220.456,197.643;220.456,197.643" fill="freeze"/>
							<animateTransform attributeName="transform" additive="sum" type="rotate" dur="4s" keyTimes="0;0.908;0.909;0.916;0.917;0.95;0.966;0.992;1" values="5.023,0,0;5.023,0,0;7.008,0,0;7.008,0,0;8.952,0,0;1.226,0,0;1.226,0,0;7.008,0,0;7.008,0,0" fill="freeze"/>
							<animateTransform attributeName="transform" additive="sum" type="scale" dur="4s" keyTimes="0;0.916;0.95;0.966;0.992;1" values="1,.999;1,.999;1,1;1,1;1,.999;1,.999" fill="freeze"/>
							<animateTransform attributeName="transform" additive="sum" type="translate" dur="4s" keyTimes="0;0.908;0.909;0.916;0.917;0.95;0.966;0.992;1" values="-188,-194;-188,-194;-187.95,-193.95;-187.95,-193.95;-188,-193.9;-187.95,-194.1;-187.95,-194.1;-187.95,-193.95;-187.95,-193.95" fill="freeze"/>
						</use>
						<animate attributeName="display" fill="freeze" repeatCount="1" dur="4s" keyTimes="0;0.9;1" values="none;inline;inline"/>
					</g>
					<g>
						<use xlinkHref="#11" transform="matrix(.988 -.153 .153 .988 -5.1 23.4)">
							<animateTransform attributeName="transform" additive="replace" type="translate" dur="4s" keyTimes="0;0.908;0.909;0.916;0.917;0.95;0.966;0.992;1" values="169.301,232.936;169.301,232.936;170.521,233.373;170.521,233.373;171.756,233.84;166.7,232;166.7,232;170.521,233.373;170.521,233.373" fill="freeze"/>
							<animateTransform attributeName="transform" additive="sum" type="rotate" dur="4s" keyTimes="0;0.908;0.909;0.916;0.917;0.95;0.966;0.992;1" values="-5.809,0,0;-5.809,0,0;-8.81,0,0;-8.81,0,0;-11.96,0,0;0,0,0;0,0,0;-8.81,0,0;-8.81,0,0" fill="freeze"/>
							<animateTransform attributeName="transform" additive="sum" type="scale" dur="4s" keyTimes="0;0.916;0.95;0.966;0.992;1" values="1,.999;1,.999;1,1;1,1;1,.999;1,.999" fill="freeze"/>
							<animateTransform attributeName="transform" additive="sum" type="translate" dur="4s" keyTimes="0;0.908;0.909;0.916;0.917;0.95;0.966;0.992;1" values="-141.6,-234.6;-141.6,-234.6;-141.45,-234.55;-141.45,-234.55;-141.45,-234.65;-141.5,-234.5;-141.5,-234.5;-141.45,-234.55;-141.45,-234.55" fill="freeze"/>
						</use>
						<animate attributeName="display" fill="freeze" repeatCount="1" dur="4s" keyTimes="0;0.9;1" values="none;inline;inline"/>
					</g>
				</g>
				<animate attributeName="display" fill="freeze" repeatCount="1" dur="4s" keyTimes="0;0.9;1" values="none;inline;inline"/>
			</g>
			<g display="none">
				<g  transform="translate(517.6 285.6)" filter="url(#filter12)">
					<use xlinkHref="#22" transform="matrix(.998 .053 -.053 .998 33.1 -1.55)"/>
					<use xlinkHref="#11" transform="matrix(1 -.049 .049 1 15.15 5.2)"/>
				</g>
				<animate attributeName="display" fill="freeze" repeatCount="1" dur="4s" keyTimes="0;0.892;0.9;1" values="none;inline;none;none"/>
			</g>
			<g display="none">
				<use xlinkHref="#Wkrf0o9r1" transform="translate(517.6 285.6)" filter="url(#filter11)"/>
				<animate attributeName="display" fill="freeze" repeatCount="1" dur="4s" keyTimes="0;0.892;0.9;1" values="none;inline;none;none"/>
			</g>
			<g display="none">
				<use xlinkHref="#Wkrf0o9r1" transform="translate(517.6 285.6)" opacity=".38">
					<animate attributeName="opacity" dur="4s" keyTimes="0;0.875;0.875;1" values=".5;.5;.38;.38" calcMode="discrete" fill="freeze"/>
				</use>
				<animate attributeName="display" fill="freeze" repeatCount="1" dur="4s" keyTimes="0;0.867;0.884;1" values="none;inline;none;none"/>
			</g>
			<g display="none">
				<g transform="translate(517.6 285.6)" filter="url(#filter9)">
					<use xlinkHref="#22" transform="matrix(.998 .053 -.053 .998 33.1 -1.4)"/>
					<use xlinkHref="#11" transform="matrix(1 -.049 .049 1 15.2 5.15)"/>
				</g>
				<animate attributeName="display" fill="freeze" repeatCount="1" dur="4s" keyTimes="0;0.859;0.867;1" values="none;inline;none;none"/>
			</g>
			<g display="none">
				<g transform="translate(517.6 285.6)" filter="url(#filter8)">
					<use xlinkHref="#22" transform="matrix(.996 .088 -.088 .996 45.3 -9.65)"/>
					<use xlinkHref="#11" transform="matrix(.995 -.101 .101 .995 4.85 13.95)"/>
				</g>
				<animate attributeName="display" fill="freeze" repeatCount="1" dur="4s" keyTimes="0;0.85;0.859;1" values="none;inline;none;none"/>
			</g>
			<g display="none">
				<g transform="translate(517.6 285.6)" filter="url(#filter7)">
					<use xlinkHref="#22" transform="matrix(.992 .122 -.122 .992 57.65 -17.6)"/>
					<use xlinkHref="#11" transform="matrix(.988 -.153 .153 .988 -5.05 23.35)"/>
				</g>
				<animate attributeName="display" fill="freeze" repeatCount="1" dur="4s" keyTimes="0;0.842;0.85;1" values="none;inline;none;none"/>
			</g>
			<g display="none">
				<g transform="translate(517.6 285.6)">
				<use xlinkHref="#22" transform="matrix(.988 .156 -.156 .988 70 -25.45)"/>
				<use xlinkHref="#11" transform="matrix(.978 -.207 .207 .978 -15.25 33.65)"/>
				</g>
				<animate attributeName="display" fill="freeze" repeatCount="1" dur="4s" keyTimes="0;0.834;0.842;1" values="none;inline;none;none"/>
			</g>
			<g display="none">
			<g transform="translate(517.6 285.6)">
				<g display="none">
					<use xlinkHref="#22" transform="matrix(.992 .122 -.122 .992 57.65 -17.75)">
						<animateTransform attributeName="transform" additive="replace" type="translate" dur="4s" keyTimes="0;0.134;0.167;0.2;0.216;0.25;0.284;0.3;0.825;1" values="205.429,204.37;205.429,204.37;225.468,195.326;205.429,204.37;205.429,204.37;225.468,195.326;205.429,204.37;205.429,204.37;220.456,197.643;220.456,197.643" fill="freeze"/>
						<animateTransform attributeName="transform" additive="sum" type="rotate" dur="4s" keyTimes="0;0.134;0.167;0.2;0.216;0.25;0.284;0.3;0.825;1" values="1.226,0,0;1.226,0,0;8.952,0,0;1.226,0,0;1.226,0,0;8.952,0,0;1.226,0,0;1.226,0,0;7.008,0,0;7.008,0,0" fill="freeze"/>
						<animateTransform attributeName="transform" additive="sum" type="scale" dur="4s" keyTimes="0;0.134;0.167;0.2;0.216;0.25;0.284;0.3;0.825;1" values="1,1;1,1;1,.999;1,1;1,1;1,.999;1,1;1,1;1,.999;1,.999" fill="freeze"/>
						<animateTransform attributeName="transform" additive="sum" type="translate" dur="4s" keyTimes="0;0.134;0.167;0.2;0.216;0.25;0.284;0.3;0.825;1" values="-187.95,-194.1;-187.95,-194.1;-188,-193.9;-187.95,-194.1;-187.95,-194.1;-188,-193.9;-187.95,-194.1;-187.95,-194.1;-187.95,-193.95;-187.95,-193.95" fill="freeze"/>
					</use>
					<animate attributeName="display" fill="freeze" repeatCount="1" dur="4s" keyTimes="0;0.134;0.834;1" values="none;inline;none;none"/>
				</g>
				<g display="none">
					<use xlinkHref="#11" transform="matrix(.988 -.153 .153 .988 -5.1 23.4)">
						<animateTransform attributeName="transform" additive="replace" type="translate" dur="4s" keyTimes="0;0.134;0.167;0.2;0.216;0.25;0.284;0.3;0.825;1" values="166.7,232;166.7,232;171.756,233.84;166.7,232;166.7,232;171.756,233.84;166.7,232;166.7,232;170.521,233.373;170.521,233.373" fill="freeze"/>
						<animateTransform attributeName="transform" additive="sum" type="rotate" dur="4s" keyTimes="0;0.134;0.167;0.2;0.216;0.25;0.284;0.3;0.825;1" values="0,0,0;0,0,0;-11.96,0,0;0,0,0;0,0,0;-11.96,0,0;0,0,0;0,0,0;-8.81,0,0;-8.81,0,0" fill="freeze"/>
						<animateTransform attributeName="transform" additive="sum" type="scale" dur="4s" keyTimes="0;0.134;0.167;0.2;0.216;0.25;0.284;0.3;0.825;1" values="1,1;1,1;1,.999;1,1;1,1;1,.999;1,1;1,1;1,.999;1,.999" fill="freeze"/>
						<animateTransform attributeName="transform" additive="sum" type="translate" dur="4s" keyTimes="0;0.134;0.167;0.2;0.216;0.25;0.284;0.3;0.825;1" values="-141.5,-234.5;-141.5,-234.5;-141.45,-234.65;-141.5,-234.5;-141.5,-234.5;-141.45,-234.65;-141.5,-234.5;-141.5,-234.5;-141.45,-234.55;-141.45,-234.55" fill="freeze"/>
					</use>
					<animate attributeName="display" fill="freeze" repeatCount="1" dur="4s" keyTimes="0;0.134;0.834;1" values="none;inline;none;none"/>
				</g>
			</g>
			<animate attributeName="display" fill="freeze" repeatCount="1" dur="4s" keyTimes="0;0.134;0.834;1" values="none;inline;none;none"/>
		</g>

		<g display="none">
			<use xlinkHref="#Wkrf0o9r1" transform="translate(517.6 285.6)"/>
			<animate attributeName="display" fill="freeze" repeatCount="1" dur="4s" keyTimes="0;0.075;0.134;1" values="none;inline;none;none"/>
		</g>

		</g>

		<mask id="lose-mask123">
			<g>
				<path fill="#FFF" stroke="none" d="M771.4 388Q771.4 332.4 732.05 293.1 692.75 253.75 637.1 253.75 581.5 253.75 542.2 293.1 502.85 332.4 502.85 388 502.85 443.6 542.2 482.95 581.5 522.3 637.1 522.3 692.75 522.3 732.05 482.95 771.4 443.6 771.4 388Z" fillOpacity="1"/>
			</g>
		</mask>
		<g>
			<g transform="translate(321.2 457.25)" opacity="0">
				<animate attributeName="opacity" dur="4s" keyTimes="0;0.075;0.134;0.833;0.9;1" values="0;0;1;1;0;0" fill="freeze"/>
				<image overflow="visible" xlinkHref={`${_digenglish_lib_}team/pad_result/ribbon.png`} height="133" width="631"/>
			</g>
			<animate attributeName="display" fill="freeze" repeatCount="1" dur="4s" keyTimes="0;0.075;1" values="none;inline;inline"/>
		</g>
		<g>
			<g transform="translate(468.6 490.2)" opacity="0">
				<animate attributeName="opacity" dur="4s" keyTimes="0;0.075;0.134;0.833;0.9;1" values="0;0;1;1;0;0" fill="freeze"/>
				<image overflow="visible" xlinkHref={`${_digenglish_lib_}team/pad_result/GOOD_WORK.png`} height="54" width="339"/>
			</g>
			<animate attributeName="display" fill="freeze" repeatCount="1" dur="4s" keyTimes="0;0.075;1" values="none;inline;inline"/>
		</g>
		<g display="none">
			<g transform="matrix(.968 0 0 .968 490.5 243.55)" opacity="0">
				<animateTransform attributeName="transform" additive="replace" type="translate" dur="4s" keyTimes="0;.267;.333;.34999;.4;.41699;.483;.49999;.567;.58299;.65;.66699;.733;1" values="519.585,275.054;519.585,275.054;509.669,265.083;509.669,265.083;519.585,275.054;519.585,275.054;509.669,265.083;509.669,265.083;519.585,275.054;519.585,275.054;509.669,265.083;509.669,265.083;519.585,275.054;519.585,275.054" fill="freeze"/>
				<animateTransform attributeName="transform" additive="sum" type="scale" dur="4s" keyTimes="0;.267;.333;.34999;.4;.41699;.483;.49999;.567;.58299;.65;.66699;.733;1" values=".968,.968;.968,.968;1.21,1.21;1.21,1.21;.968,.968;.968,.968;1.21,1.21;1.21,1.21;.968,.968;.968,.968;1.21,1.21;1.21,1.21;.968,.968;.968,.968" fill="freeze"/>
				<animateTransform attributeName="transform" additive="sum" type="translate" dur="4s" keyTimes="0;.267;.333;.34999;.4;.41699;.483;.49999;.567;.58299;.65;.66699;.733;1" values="-30.1,-32.6;-30.1,-32.6;-30.1,-32.55;-30.1,-32.55;-30.1,-32.6;-30.1,-32.6;-30.1,-32.55;-30.1,-32.55;-30.1,-32.6;-30.1,-32.6;-30.1,-32.55;-30.1,-32.55;-30.1,-32.6;-30.1,-32.6" fill="freeze"/>
				<animate attributeName="opacity" dur="4s" keyTimes="0;.267;.333;.66699;.733;1" values="0;0;1;1;0;0" fill="freeze"/>
				<image overflow="visible" xlinkHref={`${_digenglish_lib_}team/pad_result/effect.png`} height="65" width="60" transform="matrix(.979 -.204 .204 .979 -4.55 10)"/>
				<path fill="url(#Pattern_1)" stroke="none" d="M87.3 -11.05Q87.1 -13.4 87 -15.8L65.15 -10 80.65 48 82.2 47.65Q82.05 45.5 82 43.35L82.55 42Q82.1 39.9 82.85 37.7L82.6 36.5 83.2 35.05 82.85 33.45Q84.75 21.9 85.9 10.4L86.45 5.2Q86.75 4.7 86.8 4.2 87.25 2.2 87.1 .4 87.75 -.25 87.65 -1.75 87.4 -4.8 87.75 -8.15 87.4 -9.55 87.3 -11.05Z"/>
			</g>
			<animate attributeName="display" fill="freeze" repeatCount="1" dur="4s" keyTimes="0;.267;.75;1" values="none;inline;none;none"/>
		</g>
	</g>
	{/* 동점 */}
	<g display={this.props.result === 'tie' ? '' : 'none'}>
		<g>
			<g transform="translate(476.25 227.2)" opacity="0">
				<animate attributeName="opacity" dur="4.958s" keyTimes="0;0.076;0.152;0.798;0.866;1" values="0;0;1;1;0;0" fill="freeze"/>
				<image overflow="visible" xlinkHref={`${_digenglish_lib_}team/pad_result/circle.png`} height="330" width="320"/>
			</g>
			<animate attributeName="display" fill="freeze" repeatCount="1" dur="4.958s" keyTimes="0;0.076;1" values="none;inline;inline"/>
		</g>
		<g mask="url(#tie-mask123)">
			<g id="dkrtnm" transform="translate(503.4 273.1)" opacity="0">
				<animate attributeName="opacity" dur="4.958s" keyTimes="0;0.076;0.152;0.798;0.866;1" values="0;0;1;1;0;0" fill="freeze"/>
				<image overflow="visible" xlinkHref={`${_digenglish_lib_}team/pad_result/hand.png`} height="243" width="266"/>
			</g>
		<animate attributeName="display" fill="freeze" repeatCount="1" dur="4.958s" keyTimes="0;0.076;1" values="none;inline;inline"/>
		</g>
		<mask id="tie-mask123">
			<g>
				<path fill="#FFF" stroke="none" d="M771.4 388Q771.4 332.4 732.05 293.1 692.75 253.75 637.1 253.75 581.5 253.75 542.2 293.1 502.85 332.4 502.85 388 502.85 443.6 542.2 482.95 581.5 522.3 637.1 522.3 692.75 522.3 732.05 482.95 771.4 443.6 771.4 388Z" fillOpacity="1"/>
			</g>
		</mask>
		<g>
			<g transform="translate(321.2 457.25)" opacity="0">
				<animate attributeName="opacity" dur="4.958s" keyTimes="0;0.076;0.152;0.798;0.866;1" values="0;0;1;1;0;0" fill="freeze"/>
				<image overflow="visible" xlinkHref={`${_digenglish_lib_}team/pad_result/ribbon.png`} height="133" width="631"/>
			</g>
			<animate attributeName="display" fill="freeze" repeatCount="1" dur="4.958s" keyTimes="0;0.076;1" values="none;inline;inline"/>
		</g>
		<g>
			<g id="tie" transform="translate(569.6 490.6)" opacity="0">
				<animate attributeName="opacity" dur="4.958s" keyTimes="0;0.076;0.152;0.798;0.866;1" values="0;0;1;1;0;0" fill="freeze"/>
				<image overflow="visible" xlinkHref={`${_digenglish_lib_}team/pad_result/tie.png`} height="62" width="133"/>
			</g>
			<animate attributeName="display" fill="freeze" repeatCount="1" dur="4.958s" keyTimes="0;0.076;1" values="none;inline;inline"/>
		</g>
	</g>

	{/* 불꽃놀이 */}
	<g display="none">
		<g transform="translate(378.5 221.1)">
			<g display="none">
				<g transform="translate(80.55 86.95)" opacity="0">
					<animate attributeName="opacity" dur="5s" keyTimes="0;0.109;0.184;0.35;0.833;1" values="0;0;1;1;0;0" fill="freeze"/>
					<g opacity="1">
					<animateTransform attributeName="transform" additive="replace" type="translate" begin=".542s" repeatDur="1.875s" dur="0.625s" keyTimes="0;.467;.933;1" values="22,22;22.025,22.025;22,22;22,22" fill="freeze"/>
					<animateTransform attributeName="transform" additive="sum" type="scale" begin=".542s" repeatDur="1.875s" dur="0.625s" keyTimes="0;.467;.933;1" values="1,1;.64,.64;1,1;1,1" fill="freeze"/>
					<animateTransform attributeName="transform" additive="sum" type="translate" begin=".542s" repeatDur="1.875s" dur="0.625s" keyTimes="0;.467;.933;1" values="-22,-22;-22.15,-22.15;-22,-22;-22,-22" fill="freeze"/>
					<animate attributeName="opacity" begin=".542s" repeatDur="1.875s" dur="0.625s" keyTimes="0;.467;.933;1" values="1;.76;1;1" fill="freeze"/>
					<image overflow="visible" xlinkHref={`${_digenglish_lib_}team/pad_result/effect1.png`} height="44" width="44"/>
					</g>
				</g>
				<animate attributeName="display" fill="freeze" repeatCount="1" dur="5s" keyTimes="0;0.109;0.884;1" values="none;inline;none;none"/>
			</g>
			<g display="none">
				<g transform="translate(452.1 22.05)" opacity="0">
					<animate attributeName="opacity" dur="5s" keyTimes="0;0.15;0.225;0.792;0.875;1" values="0;0;1;1;0;0" fill="freeze"/>
					<g opacity="1">
						<animateTransform attributeName="transform" additive="replace" type="translate" begin=".75s" repeatDur="1.667s" dur="0.667s" keyTimes="0;.5;.937;1" values="27.5,27.5;27.517,27.517;27.5,27.5;27.5,27.5" fill="freeze"/>
						<animateTransform attributeName="transform" additive="sum" type="scale" begin=".75s" repeatDur="1.667s" dur="0.667s" keyTimes="0;.5;.937;1" values="1,1;.614,.614;1,1;1,1" fill="freeze"/>
						<animateTransform attributeName="transform" additive="sum" type="translate" begin=".75s" repeatDur="1.667s" dur="0.667s" keyTimes="0;.5;.937;1" values="-27.5,-27.5;-27.7,-27.7;-27.5,-27.5;-27.5,-27.5" fill="freeze"/>
						<animate attributeName="opacity" begin=".75s" repeatDur="1.667s" dur="0.667s" keyTimes="0;.5;.937;1" values="1;.61;1;1" fill="freeze"/>
						<image overflow="visible" xlinkHref={`${_digenglish_lib_}team/pad_result/effect2.png`} height="55" width="55"/>
					</g>
				</g>
				<animate attributeName="display" fill="freeze" repeatCount="1" dur="5s" keyTimes="0;0.15;0.884;1" values="none;inline;none;none"/>
			</g>
			<g display="none">
			<g transform="translate(-44 107.95)" style={{mixBlendMode: 'screen',}} opacity="0">
				<animateTransform attributeName="transform" additive="replace" type="translate" dur="5s" keyTimes="0;0.158;0.317;1" values="113.55,107.95;113.55,107.95;-44,107.95;-44,107.95" keySplines=".25 .5 .5 1;.25 .5 .5 1;.1 .1 .9 .9" calcMode="spline" fill="freeze"/>
				<animate attributeName="opacity" dur="5s" keyTimes="0;0.158;0.317;1" values="1;1;0;0" keySplines=".25 .5 .5 1;.25 .5 .5 1;.1 .1 .9 .9" calcMode="spline" fill="freeze"/>
				<image overflow="visible" xlinkHref={`${_digenglish_lib_}team/pad_result/effect3.png`} height="23" width="11"/>
			</g>
			<animate attributeName="display" fill="freeze" repeatCount="1" dur="5s" keyTimes="0;0.158;0.884;1" values="none;inline;none;none"/>
			</g>
			<g display="none">
			<g transform="translate(8.6 181.3)" style={{mixBlendMode: 'screen',}} opacity="0">
				<animateTransform attributeName="transform" additive="replace" type="translate" dur="5s" keyTimes="0;0.175;0.334;1" values="115.75,151;115.75,151;8.6,181.3;8.6,181.3" keySplines=".25 .5 .5 1;.25 .5 .5 1;.1 .1 .9 .9" calcMode="spline" fill="freeze"/>
				<animate attributeName="opacity" dur="5s" keyTimes="0;0.175;0.334;1" values="1;1;0;0" keySplines=".25 .5 .5 1;.25 .5 .5 1;.1 .1 .9 .9" calcMode="spline" fill="freeze"/>
				<image overflow="visible"  xlinkHref={`${_digenglish_lib_}team/pad_result/effect3.png`} height="23" width="11" transform="matrix(.8 0 0 .8 0 0)"/>
			</g>
			<animate attributeName="display" fill="freeze" repeatCount="1" dur="5s" keyTimes="0;0.175;0.884;1" values="none;inline;none;none"/>
			</g>
			<g display="none">
			<g transform="translate(502.95 80.8)" style={{mixBlendMode: 'screen',}} opacity="0">
				<animate attributeName="opacity" dur="5s" keyTimes="0;0.167;0.325;1" values="1;1;0;0" keySplines=".25 .5 .5 1;.25 .5 .5 1;.1 .1 .9 .9" calcMode="spline" fill="freeze"/>
				<image overflow="visible" xlinkHref={`${_digenglish_lib_}team/pad_result/effect3.png`} height="23" width="11" transform="matrix(.559 .573 -.573 .559 13.15 0)"/>
			</g>
			<animate attributeName="display" fill="freeze" repeatCount="1" dur="5s" keyTimes="0;0.167;0.884;1" values="none;inline;none;none"/>
			</g>
			<g display="none">
			<g transform="translate(506.25 136.05)" style={{mixBlendMode: 'screen',}} opacity="0">
				<animateTransform attributeName="transform" additive="replace" type="translate" dur="5s" keyTimes="0;0.184;0.341;1" values="410.1,160.05;410.1,160.05;506.25,136.05;506.25,136.05" keySplines=".25 .5 .5 1;.25 .5 .5 1;.1 .1 .9 .9" calcMode="spline" fill="freeze"/>
				<animate attributeName="opacity" dur="5s" keyTimes="0;0.184;0.341;1" values="1;1;0;0" keySplines=".25 .5 .5 1;.25 .5 .5 1;.1 .1 .9 .9" calcMode="spline" fill="freeze"/>
				<image overflow="visible" xlinkHref={`${_digenglish_lib_}team/pad_result/effect6.png`} height="32" width="16"/>
			</g>
			<animate attributeName="display" fill="freeze" repeatCount="1" dur="5s" keyTimes="0;0.184;0.884;1" values="none;inline;none;none"/>
			</g>
			<g display="none">
			<g transform="translate(33.6 -40)" style={{mixBlendMode: 'screen',}} opacity="0">
				<animateTransform attributeName="transform" additive="replace" type="translate" dur="5s" keyTimes="0;0.167;0.325;1" values="131.76,73.459;131.76,73.459;45.6,-17.5;45.6,-17.5" keySplines=".25 .5 .5 1;.25 .5 .5 1;.1 .1 .9 .9" calcMode="spline" fill="freeze"/>
				<animateTransform attributeName="transform" additive="sum" type="scale" dur="5s" keyTimes="0;0.167;0.325;1" values=".6,.6;.6,.6;1,1;1,1" keySplines=".25 .5 .5 1;.25 .5 .5 1;.1 .1 .9 .9" calcMode="spline" fill="freeze"/>
				<animateTransform attributeName="transform" additive="sum" type="translate" dur="5s" keyTimes="0;0.167;0.325;1" values="-12.1,-22.6;-12.1,-22.6;-12,-22.5;-12,-22.5" keySplines=".25 .5 .5 1;.25 .5 .5 1;.1 .1 .9 .9" calcMode="spline" fill="freeze"/>
				<animate attributeName="opacity" dur="5s" keyTimes="0;0.167;0.325;1" values="1;1;0;0" keySplines=".25 .5 .5 1;.25 .5 .5 1;.1 .1 .9 .9" calcMode="spline" fill="freeze"/>
				<image overflow="visible" xlinkHref={`${_digenglish_lib_}team/pad_result/effect7.png`} height="45" width="24"/>
			</g>
			<animate attributeName="display" fill="freeze" repeatCount="1" dur="5s" keyTimes="0;0.167;0.884;1" values="none;inline;none;none"/>
			</g>
			<g display="none">
			<g transform="translate(417.8 -11)" style={{mixBlendMode: 'screen',}} opacity="0">
				<animateTransform attributeName="transform" additive="replace" type="translate" dur="5s" keyTimes="0;0.191;0.35;1" values="379.8,86.95;379.8,86.95;417.8,-11;417.8,-11" keySplines=".25 .5 .5 1;.25 .5 .5 1;.1 .1 .9 .9" calcMode="spline" fill="freeze"/>
				<animate attributeName="opacity" dur="5s" keyTimes="0;0.191;0.35;1" values="1;1;0;0" keySplines=".25 .5 .5 1;.25 .5 .5 1;.1 .1 .9 .9" calcMode="spline" fill="freeze"/>
				<image overflow="visible" xlinkHref={`${_digenglish_lib_}team/pad_result/effect7.png`} height="45" width="24" transform="matrix(.797 .604 -.604 .797 27.2 0)"/>
			</g>
			<animate attributeName="display" fill="freeze" repeatCount="1" dur="5s" keyTimes="0;0.191;0.884;1" values="none;inline;none;none"/>
			</g>
		</g>
		<animate attributeName="display" fill="freeze" repeatCount="1" dur="5s" keyTimes="0;0.109;0.884;1" values="none;inline;none;none"/>
	</g>

  </g>
</svg>
			</div>
		);
	}
}

export default TeamPadResult;