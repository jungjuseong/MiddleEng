import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { Observer } from 'mobx-react';

import { StudentContext, useStudent, IStateCtx, IActionsCtx } from './s_store';

class Comp extends React.Component<{state: IStateCtx, actions: IActionsCtx}> {
	public render() {
		const {state, actions} = this.props;
		return (
			<div hidden={state.viewDiv === 'direction'}>Sample</div>
		);
	}
}


const Sample = useStudent((store: StudentContext) => (
	<Observer>{() => (
		<Comp state={{...store.state}} actions={store.actions}/>
	)}</Observer>
));

export { Sample };


