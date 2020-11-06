import * as React from 'react';

import { observer, Observer } from 'mobx-react';
import { hot } from 'react-hot-loader/root';
import * as _ from 'lodash';

import '../../font.scss';
import './index.scss';

import { Navi } from '../../share/navi';

import * as t_store from './t_store';
import { TeacherProvider, tContext } from './t_store';
import VideoDirection from '../../share/video-direction';
import { App } from '../../App';
import Comprehension from './t_writing';

const _WIDTH = 1280;

interface ITeacher {
	state: t_store.IStateCtx;
	actions: t_store.IActionsCtx;
}

@observer
class TeacherPage extends React.Component<ITeacher> {
	constructor(props: ITeacher) {
		super(props);

		// console.log('==>', props.actions.getData());
	}
	public render() {
		const {state, actions} = this.props;
		const viewDiv = state.viewDiv;
		return (
			<>
				<div id="preload_hidden" style={{opacity: 0}}>
					<span>가나다라s</span><span style={{fontWeight: 'bold'}}>가나다라</span>
					<span className="set" /> <span className="unlimit" /> <span className="start" />
					<span className="time1" /><span className="time2" /> <span className="time3" />
				</div>
				{/*
				<SVGBg 
					className="bg_svg" 
					data="/content/digenglish_lib/images/theme0_bg.svg" 
					{...state.svg_bg}
				/>
				*/}
				<div className="content-container">
					<div className="content-wrapper" style={{left: (viewDiv === 'direction' ? 0 : -_WIDTH) + 'px'}}>
						<div><VideoDirection 
							className="video-direction" 
							view={viewDiv === 'direction'} 
							on={state.directionON} 
							isTeacher={true}
							video_url=''
							video_frame={125}
							onEndStart={actions.onDirectionEndStart}
							onEnd={actions.onDirectionEnded}
						>
							<div className="lesson">{App.lesson}</div>
						</VideoDirection></div>
						<div><Comprehension view={viewDiv === 'content'}  state={state} actions={actions}/></div>
					</div>
				</div>

				<Navi {...state.navi} onLeftClick={actions.naviLeft} onRightClick={actions.naviRight}/>
			</>
		);
	}
}
const Teacher = t_store.useTeacher((val: t_store.TeacherContext) => (
	<Observer>{() => (
		<TeacherPage state={val.state} actions={val.actions}/>
	)}</Observer>
));

export { TeacherProvider as AppProvider, tContext as appContext };
export default hot(Teacher);