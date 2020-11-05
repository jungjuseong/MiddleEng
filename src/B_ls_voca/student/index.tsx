import * as React from 'react';

import { observer, Observer } from 'mobx-react';
import { hot } from 'react-hot-loader/root';
import * as _ from 'lodash';

import { SVGBg, SVGEmbed, SVGAni } from '../../share/svg_object';
import VideoDirection from '../../share/video-direction';

import { sContext, StudentProvider, StudentContext, useStudent, IStateCtx, IActionsCtx } from './s_store';

import { Loading } from '../../share/loading';

import Quiz from './s_quiz';
import VocaTyping from './s_voca_typing';
import SSpeakRecord from './s_speak_record';

import './index.scss';
import '../../font.scss';

@observer
class StudentComponent extends React.Component<{state: IStateCtx, actions: IActionsCtx}> {
	public render() {
		const { viewDiv,svg_bg,directionON,loading,goodjob } = this.props.state;
		const leftPos = viewDiv === 'direction' ? 0 : -1280;

		return (
			<>
			<div id="preload_hidden">
				<span>가나다라</span><span style={{fontWeight: 'bold'}}>가나다라</span>
			</div>
			<SVGBg 
				className="bg_svg" 
				data="/content/digenglish_lib/images/theme0_bg.svg" 
				{...svg_bg}
			/>
			<div className="content-container"><div className="content-wrapper" style={{left: leftPos + 'px',}}>
				<div>
					<VideoDirection 
							className="video-direction" 
							view={viewDiv === 'direction'} 
							on={directionON} 
							isTeacher={false}
							video_url={_digenglish_lib_ + 'direction/ls_rw_voca.webp'}
							video_frame={125} 
					/>
				</div>
				<div>
					<Quiz/>
					<VocaTyping />
					<SSpeakRecord />

					<Loading view={loading}/>
					<SVGAni 
						className="goodjob-svg" 
						view={goodjob} 
						delay={2000}
						data={`${_digenglish_lib_}images/goodjob_ls.svg`}
						onComplete={this.props.actions.goodjobComplete}
					/>
					<SVGEmbed 
						className="eyeon_svg" 
						data={`${_digenglish_lib_}images/eyeon_ls.svg`}
						view={viewDiv === 'eyeon' || viewDiv === 'direction'}
						bPlay={false}
					/>
				</div>
			</div></div>

			</>
		);
	}
}

const Student = useStudent((store: StudentContext) => (
	<Observer>{() => (
		<StudentComponent 
			state={store.state} 
			actions={store.actions}
		/>
	)}</Observer>
));
export { StudentProvider as AppProvider, sContext as appContext };
export default hot(Student);