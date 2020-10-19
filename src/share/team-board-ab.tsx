import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { observable, action } from 'mobx';
import { observer } from 'mobx-react';
import * as _ from 'lodash';

import * as kutil from '@common/util/kutil';

interface ITeamBoardAB {
	className: string;
	view: boolean;
	start: boolean;
	ga_na: 'ga'|'na';
	point: string;
	onAniEnd: () => void;
}

@observer
class TeamBoardAB extends React.Component<ITeamBoardAB> {
	private _svg: MYSVGElement|null = null;
	private _className: string;
	constructor(props: ITeamBoardAB) {
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
	public componentWillUpdate(next: ITeamBoardAB) {
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
	public componentDidUpdate(prev: ITeamBoardAB) {
		if(this.props.start && !prev.start) {
			if(this._svg) {
				const svg = this._svg;
				svg.setCurrentTime(0);
				if (!svg.animationsPaused()) svg.pauseAnimations();
				(async () => {
					await kutil.wait(300);
					if(this.props.start) {
						svg.setCurrentTime(0);
						if (svg.animationsPaused()) svg.unpauseAnimations();
					}

					await kutil.wait(2000);
					if(this.props.start) {
						this.props.onAniEnd();
					}
				})();

			}
		} else if(!this.props.start && prev.start) {
			if(this._svg) {
				this._svg.setCurrentTime(0);
				if (!this._svg.animationsPaused()) this._svg.pauseAnimations();
			}
		}
	}
	public render() {
		return (
			<div className={this._className}>
<svg ref={this._refSVG} imageRendering="auto" baseProfile="basic" version="1.1" x="0px" y="0px" width="727" height="500" xmlns="http://www.w3.org/2000/svg" xmlnsXlink="http://www.w3.org/1999/xlink">
  <g overflow="visible">
    <g transform="translate(108 106.05)">
      <image overflow="visible" xlinkHref={`${_digenglish_lib_}team/board/team_board_${this.props.ga_na ? this.props.ga_na : ''}.png`} height="360" width="511"/>
    </g>
    <g>
      <g transform="translate(445 10)" opacity="0">
        <animateTransform attributeName="transform" additive="replace" type="translate" dur="1.5s" keyTimes="0;.028;.194;.611;.75;1" values="445,230;445,230;445,144.15;445,8.45;445,10;445,10" keySplines=".333 .376 .667 .709;.333 .376 .667 .709;.333 .504 .667 .837;.333 .667 .667 1;.1 .1 .9 .9" calcMode="spline" fill="freeze"/>
        <animate attributeName="opacity" dur="1.5s" keyTimes="0;.028;.194;.611;.75;1" values="0;0;1;1;0;0" keySplines=".333 .376 .667 .709;.333 .376 .667 .709;.333 .504 .667 .837;.333 .667 .667 1;.1 .1 .9 .9" calcMode="spline" fill="freeze"/>
        <g style={{mixBlendMode: 'screen',}} opacity="1">
          <animateTransform attributeName="transform" additive="replace" type="translate" begin=".042s" repeatDur="1.458s" dur="0.833s" keyTimes="0;.45;.95;1" values="154.5,154;158.527,153.992;154.5,154;154.5,154" fill="freeze"/>
          <animateTransform attributeName="transform" additive="sum" type="scale" begin=".042s" repeatDur="1.458s" dur="0.833s" keyTimes="0;.45;.95;1" values="1,1;.7,.7;1,1;1,1" fill="freeze"/>
          <animateTransform attributeName="transform" additive="sum" type="translate" begin=".042s" repeatDur="1.458s" dur="0.833s" keyTimes="0;.45;.95;1" values="-154.5,-154;-154.55,-154;-154.5,-154;-154.5,-154" fill="freeze"/>
          <animate attributeName="opacity" begin=".042s" repeatDur="1.458s" dur="0.833s" keyTimes="0;.45;.95;1" values="1;.6;1;1" fill="freeze"/>
          <image overflow="visible" xlinkHref={`${_digenglish_lib_}team/board/effect01.png`} height="308" width="309"/>
        </g>
      </g>
      <animate attributeName="display" fill="freeze" repeatCount="1" dur="1.5s" keyTimes="0;.028;1" values="none;inline;inline"/>
    </g>
    <g>
      <g transform="translate(551.25 397.1)" opacity="0">
        <animateTransform attributeName="transform" additive="replace" type="translate" dur="1.5s" keyTimes="0;.25;.389;.778;.917;1" values="351.25,400.1;351.25,400.1;395.45,398.9;545.45,397.25;551.25,397.1;551.25,397.1" keySplines=".333 .376 .667 .709;.333 .376 .667 .709;.333 .516 .667 .849;.333 .667 .667 1;.1 .1 .9 .9" calcMode="spline" fill="freeze"/>
        <animate attributeName="opacity" dur="1.5s" keyTimes="0;.25;.389;.778;.917;1" values="0;0;1;1;0;0" keySplines=".333 .376 .667 .709;.333 .376 .667 .709;.333 .516 .667 .849;.333 .667 .667 1;.1 .1 .9 .9" calcMode="spline" fill="freeze"/>
        <g style={{mixBlendMode: 'screen',}} opacity="1">
          <animateTransform attributeName="transform" additive="replace" type="translate" begin=".375s" repeatDur="1.125s" dur="0.833s" keyTimes="0;.5;.95;1" values="58,58;58.019,58.019;58,58;58,58" fill="freeze"/>
          <animateTransform attributeName="transform" additive="sum" type="scale" begin=".375s" repeatDur="1.125s" dur="0.833s" keyTimes="0;.5;.95;1" values="1,1;.7,.7;1,1;1,1" fill="freeze"/>
          <animateTransform attributeName="transform" additive="sum" type="translate" begin=".375s" repeatDur="1.125s" dur="0.833s" keyTimes="0;.5;.95;1" values="-58,-58;-58.1,-58.1;-58,-58;-58,-58" fill="freeze"/>
          <animate attributeName="opacity" begin=".375s" repeatDur="1.125s" dur="0.833s" keyTimes="0;.5;.95;1" values="1;.7;1;1" fill="freeze"/>
          <image overflow="visible" xlinkHref={`${_digenglish_lib_}team/board/effect03.png`} height="116" width="116"/>
        </g>
      </g>
      <animate attributeName="display" fill="freeze" repeatCount="1" dur="1.5s" keyTimes="0;.25;1" values="none;inline;inline"/>
    </g>
    <g>
      <g transform="translate(53.1 316.1)" opacity="0">
        <animateTransform attributeName="transform" additive="replace" type="translate" dur="1.5s" keyTimes="0;.028;.25;.556;.722;1" values="53.1,106.1;53.1,106.1;53.1,198;53.1,303;53.1,316.1;53.1,316.1" keySplines=".333 .381 .667 .714;.333 .381 .667 .714;.333 .5 .667 .833;.333 .667 .667 1;.1 .1 .9 .9" calcMode="spline" fill="freeze"/>
        <animate attributeName="opacity" dur="1.5s" keyTimes="0;.028;.25;.556;.722;1" values=".7;.7;1;1;0;0" keySplines=".333 .381 .667 .714;.333 .381 .667 .714;.333 .5 .667 .833;.333 .667 .667 1;.1 .1 .9 .9" calcMode="spline" fill="freeze"/>
        <g style={{mixBlendMode: 'screen',}} opacity="1">
          <animateTransform attributeName="transform" additive="replace" type="translate" begin=".042s" repeatDur="1.458s" dur="0.833s" keyTimes="0;.45;.95;1" values="58,58;58.019,58.019;58,58;58,58" fill="freeze"/>
          <animateTransform attributeName="transform" additive="sum" type="scale" begin=".042s" repeatDur="1.458s" dur="0.833s" keyTimes="0;.45;.95;1" values="1,1;.7,.7;1,1;1,1" fill="freeze"/>
          <animateTransform attributeName="transform" additive="sum" type="translate" begin=".042s" repeatDur="1.458s" dur="0.833s" keyTimes="0;.45;.95;1" values="-58,-58;-58.1,-58.1;-58,-58;-58,-58" fill="freeze"/>
          <animate attributeName="opacity" begin=".042s" repeatDur="1.458s" dur="0.833s" keyTimes="0;.45;.95;1" values="1;.7;1;1" fill="freeze"/>
          <image overflow="visible" xlinkHref={`${_digenglish_lib_}team/board/effect05.png`} height="116" width="116"/>
        </g>
      </g>
      <animate attributeName="display" fill="freeze" repeatCount="1" dur="1.5s" keyTimes="0;.028;1" values="none;inline;inline"/>
    </g>
  </g>
</svg>
				<div>{this.props.point}</div>
			</div>
		);
	}
}

export default TeamBoardAB;