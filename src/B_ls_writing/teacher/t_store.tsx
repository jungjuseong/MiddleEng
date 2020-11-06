import * as React from 'react';
import * as ReactDOM from 'react-dom';
import * as _ from 'lodash';
import { observable, action } from 'mobx';
import { App, IMain } from '../../App';
import * as felsocket from '../../felsocket';
import { IMsg } from '../common';
import { TeacherContextBase, VIEWDIV, IStateBase, IActionsBase } from '../../share/tcontext';



/*
			this.state.numOfStudent = 0;
			this.state.retCnt = 0;
*/
interface IStateCtx extends IStateBase {

}
interface IActionsCtx extends IActionsBase {

}

class TeacherContext extends TeacherContextBase {
	@observable public state!: IStateCtx;
	public actions!: IActionsCtx;


	private m_quizs: IGaNaResult[] = [];
	constructor() {
		super();

		// console.log(this.state, this.actions);
	}
	

	@action protected _setViewDiv(viewDiv: VIEWDIV) {
		super._setViewDiv(viewDiv);
	}

	public receive(data: ISocketData) {
		super.receive(data);
	}
	public setData(data: any) {
		//
	}
}


const tContext = new TeacherContext();
const  { Provider: TProvider, Consumer: TeacherConsumer } = React.createContext( tContext );
class TeacherProvider extends React.Component<{}> {
	public render() {
		return (
			<TProvider value={tContext}>
				{this.props.children}
			</TProvider>
		);
	}
}

function useTeacher(WrappedComponent: any) {
	return function UseAnother(props: any) {
		return (
			<TeacherConsumer>{(store: TeacherContext) => (
					<WrappedComponent
						{...store}
					/>
			)}</TeacherConsumer>
		);
	};
}

export {
	TeacherContext,
	TeacherProvider,
	TeacherConsumer,
	tContext,
	useTeacher,
	IStateCtx,
	IActionsCtx,
};