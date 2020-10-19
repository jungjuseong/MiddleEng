import * as React from 'react';
import * as ReactDOM from 'react-dom';

import { observable, action } from 'mobx';
import { Observer, observer } from 'mobx-react';

import * as _ from 'lodash';

import { ToggleBtn } from '@common/component/button';

import * as StrUtil from '@common/util/StrUtil';
import * as kutil from '@common/util/kutil';

@observer
export class CoverPopup extends React.Component<{className: string, view: boolean, onClosed: () => void}> {
	@observable private m_state: 'opening'|'open'|'closing'|'closed' = 'closed';

	private _open = async () => {
		if(this.m_state === 'closed') {
			this.m_state = 'opening';
			await kutil.wait(100);
			this.m_state = 'open';
		}
	}
	private _close = async () => {
		if(this.m_state === 'open') {
			this.m_state = 'closing';
			await kutil.wait(400);
			this.props.onClosed();
			this.m_state = 'closed';
		}
	}
	public componentDidUpdate(prev: {view: boolean}) {
		if(this.props.view !== prev.view) {
			if(this.props.view) this._open();
			else this._close();
		}
	}
	public render() {
		return (
			<div className={this.props.className + ' ' + this.m_state}>
				{this.props.children}
			</div>
		);
	}
}

