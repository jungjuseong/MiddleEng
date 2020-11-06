import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { observable, action } from 'mobx';
import { observer, inject, Observer } from 'mobx-react';
import { hot } from 'react-hot-loader';
import * as _ from 'lodash';
import ReactResizeDetector from 'react-resize-detector';
const SwiperComponent = require('react-id-swiper').default;

import '../font.scss';
import './teacher.scss';
import { App, IMain } from '../App';
import * as felsocket from '../felsocket';

import { SVGBg, } from '../share/svg_object';
import { ToggleBtn, AudioBtn } from '@common/component/button';

import { PageDirection } from '../share/page_direction';
import { Navi } from '../share/navi';

import { tContext, TeacherContext, TeacherProvider, TeacherConsumer, useTeacher } from './teacher/t_store';
import { Sample } from './teacher/t_sample';





const SVGBgHoc = useTeacher((store: TeacherContext) => (
	<Observer>{() => (
		<SVGBg 
			className="bg_svg" 
			data="/content/digenglish_lib/images/theme0_bg.svg" 
			{...store.state.svg_bg}
		/>
	)}</Observer>
));


const PageDirectionHoc = useTeacher((store: TeacherContext) => (
	<Observer>{() => (
		<PageDirection 
			className="page_direction" 
			view={store.state.viewDiv === 'direction'} 
			on={store.state.directionON} 
			isTeacher={true}
			onEndStart={store.actions.onDirectionEndStart}
			onEnd={store.actions.onDirectionEnded}
		/>
	)}</Observer>
));

/*
const BtnBoxHoc = useTeacher((store: TeacherContext) => (
	<Observer>{() => (
		<div className="btn_box" hidden={!store.state.btnView}>
			<ToggleBtn onClick={store.actions.goto1} disabled={store.state.viewDiv === 'page1'} className="btn_1"/>
			<ToggleBtn onClick={store.actions.goto2} disabled={store.state.viewDiv === 'page2'} className="btn_2"/>
		</div>
	)}</Observer>
));
*/
const NaviHoc = useTeacher((store: TeacherContext) => (
	<Observer>{() => (
		<Navi {...store.state.navi} onLeftClick={store.actions.naviLeft} onRightClick={store.actions.naviRight}/>
	)}</Observer>
));



class Teacher extends React.Component {
	public render() {

		return (
			<>
				<div id="preload_hidden">
					<span>가나다라s</span><span style={{fontWeight: 'bold'}}>가나다라</span>
					<span className="set" /> <span className="unlimit" /> <span className="start" />
					<span className="time1" /><span className="time2" /> <span className="time3" />
				</div>
				<SVGBgHoc/>
				<PageDirectionHoc/>

				<Sample />
				<NaviHoc/>
			</>
		);

		
	}
}

export {TeacherProvider as AppProvider, tContext as appContext};
export default hot(module)(Teacher);
