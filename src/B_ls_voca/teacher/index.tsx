import * as React from 'react';
import { observer } from 'mobx-react';
import { hot } from 'react-hot-loader';
import * as _ from 'lodash';

import '../../font.scss';
import './index.scss';
import { SVGBg, } from '../../share/svg_object';
import { Navi } from '../../share/navi';

import { tContext, TeacherContext, TeacherProvider, useTeacher, IStateCtx, IActionsCtx } from './t_store';
import ContentBox from './t_contentbox';

interface ITeacher {
	state: IStateCtx;
	actions: IActionsCtx;
}

@observer
class TeacherComponent extends React.Component<ITeacher> {

	public componentDidUpdate() {
		this.props.state.hasPreview = true; // pre-class 초록색그래프 사전 학습 원상복구 
	}
	public render() {
		const { state, actions } = this.props;
		return (
			<>
				<div id="preload_hidden">
					<span>가나다라abcdefg</span><span style={{fontWeight: 'bold'}}>가나다라</span>
					<span className="set" /> <span className="unlimit" /> <span className="start" />
					<span className="time1" /><span className="time2" /> <span className="time3" />
				</div>
				<SVGBg className="bg_svg" data="/content/digenglish_lib/images/theme0_bg.svg" {...state.svg_bg}/>
				<ContentBox prog={state.prog} state={state} actions={actions}/>
				<Navi {...state.navi} onLeftClick={actions.naviLeft} onRightClick={actions.naviRight}/>				
			</>
		);
	}
}

const Teacher = useTeacher((store: TeacherContext) => <TeacherComponent state={store.state} actions={store.actions}/>);

export { TeacherProvider as AppProvider, tContext as appContext };
export default hot(module)(Teacher);
