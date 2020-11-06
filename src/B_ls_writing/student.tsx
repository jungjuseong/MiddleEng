import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { observable, action } from 'mobx';
import { observer, Observer } from 'mobx-react';
import { hot } from 'react-hot-loader';
import * as _ from 'lodash';

import * as felsocket from '../felsocket';
import { SVGBg, SVGEmbed } from '../share/svg_object';
import { PageDirection } from '../share/page_direction';


import { sContext, StudentProvider, StudentConsumer, StudentContext, useStudent, } from './student/s_store';
import { GoodJob } from '../share/goodjob';
import { Loading } from '../share/loading';

import { LikeSend } from '../share/like';

import { Sample } from './student/s_sample';


import './student.scss';
import '../font.scss';


const SVGBgHoc = useStudent((store: StudentContext) => (
	<Observer>{() => (
		<SVGBg 
			className="bg_svg" 
			data="/content/digenglish_lib/images/theme0_bg.svg" 
			{...store.state.svg_bg}
		/>
	)}</Observer>
));
const PageDirectionHoc = useStudent((store: StudentContext) => (
	<Observer>{() => (
		<PageDirection 
			className="page_direction" 
			view={store.state.viewDiv === 'direction'} 
			on={store.state.directionON} 
			isTeacher={false}
		/>
	)}</Observer>
));

const EyeOnHoc = useStudent((store: StudentContext) => (
	<Observer>{() => (
		<SVGEmbed 
			className="eyeon_svg" 
			data="/content/digenglish_lib/images/eyeon2.svg"
			view={store.state.viewDiv === 'eyeon'}
			bPlay={false}
		/>
	)}</Observer>
));

const LoadingHoc = useStudent((store: StudentContext) => (
	<Observer>{() => (
		<Loading view={store.state.loading}/>
	)}</Observer>
));

const GoodJobHoc = useStudent((store: StudentContext) => (
	<Observer>{() => (
		<GoodJob view={store.state.goodjob} onComplete={store.actions.goodjobComplete}/>
	)}</Observer>
));




class Student extends React.Component<{}> {
	public render() {
		return (
			<>
			<div id="preload_hidden">
				<span>가나다라</span><span style={{fontWeight: 'bold'}}>가나다라</span>
			</div>
			<SVGBgHoc />
			<PageDirectionHoc />
			
			<Sample/>
			<EyeOnHoc />
			<LoadingHoc />
			<GoodJobHoc />
			</>
		);
	}
}
export {StudentProvider as AppProvider, sContext as appContext};
export default hot(module)(Student);