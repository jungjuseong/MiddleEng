import * as React from 'react';
import * as ReactDOM from 'react-dom';
import * as _ from 'lodash';
import { observable, action } from 'mobx';
import { App, IMain } from '../../App';
import * as felsocket from '../../felsocket';
import { IData, IMsg, } from '../common';
import { StudentContextBase, IActionsBase, IStateBase, VIEWDIV } from '../../share/scontext';


const enum PAGE1PROG {
	UNMOUNT,
	ON_GROUPING,
	ON_QUIZ,
	ON_SENDING,
	ON_SENDED,
	ON_QUIZ_RESULT,
	ON_RESULT,
}
interface IStateCtx extends IStateBase {

}
interface IActionsCtx extends IActionsBase {

}

class StudentContext extends StudentContextBase {
	@observable public state!: IStateCtx;
	public actions!: IActionsCtx;

	constructor() {
		super();
	}

	@action protected _setViewDiv(viewDiv: VIEWDIV) {
		const state = this.state;
		if(state.viewDiv !== viewDiv) {
			//
		}
		super._setViewDiv(viewDiv);
	}
	@action public receive(data: ISocketData) {
		super.receive(data);
	}
	public uploaded = (url: string) => {
		//
	}
	@action public notify = (type: string) => {
		//
	}
	@action public notifyRecorded = (url: string) => {
		//
	}

	public setData(data: any) {
		//
	}
}

const sContext = new StudentContext();
const  { Provider: SProvider, Consumer: StudentConsumer } = React.createContext( sContext );
class StudentProvider extends React.Component<{}> {
	public render() {
		return (
			<SProvider value={sContext}>
				{this.props.children}
			</SProvider>
		);
	}
}
function useStudent(WrappedComponent: any) {
	return function UseAnother(props: any) {
		return (
			<StudentConsumer>{(store: StudentContext) => (
					<WrappedComponent
						{...store}
					/>
			)}</StudentConsumer>
		);
	};
}

export {
	sContext,
	StudentProvider,
	StudentConsumer,
	StudentContext,
	useStudent,
	PAGE1PROG,
	IStateCtx,
	IActionsCtx,
};