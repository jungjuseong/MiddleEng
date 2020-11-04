import * as React from 'react';

import { observer, Observer } from 'mobx-react';
import { hot } from 'react-hot-loader/root';
import * as _ from 'lodash';

import { SVGEmbed, SVGAni } from '../../share/svg_object';
import VideoDirection from '../../share/video-direction';
import { 
	sContext, 
	StudentProvider, 
	StudentConsumer, 
	StudentContext, 
	useStudent, 
	IStateCtx,
	IActionsCtx
} from './s_store';
import { Loading } from '../../share/loading';

import '../../font.scss';
import './index.scss';

import SWarmup from './s_warmup';
import SPassage from './s_passage';
import SQuestion from './s_question';
import SGraphic from './s_graphic';
import SSumary from './s_summary';
import SVScript from './s_v_script';
import SCheckup from './s_checkup';

@observer
class Comp extends React.Component<{state: IStateCtx, actions: IActionsCtx}> {
	public render() {
		const {state, actions} = this.props;
		let left = state.viewDiv === 'direction' ? 0 : -1280;
		return (
			<>
			<div id="preload_hidden" style={{opacity: 0}}>
				<span>가나다라</span><span style={{fontWeight: 'bold'}}>가나다라</span>
			</div>
			<div className="content-container"><div className="content-wrapper" style={{left: left + 'px',}}>
				<div><VideoDirection 
							className="video-direction" 
							view={state.viewDiv === 'direction'} 
							on={state.directionON} 
							isTeacher={false}
							video_url={_digenglish_lib_ + 'direction/rw_comprehension.webp'}
							video_frame={125}
				/></div>
				<div>

					<SWarmup 
						view={state.viewDiv === 'content' && state.prog === 'warmup'}
						state={state}
						actions={actions}
					/>
					<SPassage
						view={state.viewDiv === 'content' && state.prog === 'passage'}
						viewTrans={state.viewTrans}
						qnaProg={state.qnaProg}
						focusSeq={state.focusSeq}
						state={state}
						actions={actions}
					/>
					<SQuestion 
						view={state.viewDiv === 'content' && state.prog === 'question'}
						state={state}
						actions={actions}
					/>
					<SGraphic 
						view={state.viewDiv === 'content' && state.prog === 'graphic'}
						state={state}
						actions={actions}
					/>
					<SSumary 
						view={state.viewDiv === 'content' && state.prog === 'summary'}
						state={state}
						actions={actions}
					/>
					<SVScript
						view={state.viewDiv === 'content' && state.prog === 'v_script'}
						focusIdx={state.focusIdx}
						state={state}
						actions={actions}
					/>
					<SCheckup
						view={state.viewDiv === 'content' && state.prog === 'v_checkup'}
						state={state}
						actions={actions}
					/>
				
					<Loading view={state.loading}/>
					<SVGAni 
						className="goodjob-svg" 
						view={state.goodjob} 
						delay={3000}
						data={`${_digenglish_lib_}images/goodjob_ls.svg`}
						onComplete={actions.goodjobComplete}
					/>
					<SVGEmbed 
						className="eyeon_svg" 
						data={`${_digenglish_lib_}images/eyeon_ls.svg`}
						view={state.viewDiv === 'eyeon' || state.viewDiv === 'direction'}
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
		<Comp 
			state={store.state} 
			actions={store.actions}
		/>
	)}</Observer>
));
export { StudentProvider as AppProvider, sContext as appContext };
export default hot(Student);