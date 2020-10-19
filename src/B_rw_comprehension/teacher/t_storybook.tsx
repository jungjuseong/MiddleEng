import * as React from 'react';
import * as ReactDOM from 'react-dom';
import * as _ from 'lodash';
import { observer, Observer } from 'mobx-react';
import { observable, observe, _allowStateChangesInsideComputed } from 'mobx';

import { IStateCtx, IActionsCtx } from './t_store';

import { ToggleBtn } from '@common/component/button';

import { App } from '../../App';
import { CoverPopup } from '../../share/CoverPopup';

import * as common from '../common';

const _WIDTH = 1280;

interface ITStoryBook {
	view: boolean;
	state: IStateCtx;
	actions: IActionsCtx;
	data: common.IData;
	onClosed: () => void;
}
@observer
class TStoryBook extends React.Component<ITStoryBook> {
	@observable private m_view = false;
	@observable private m_curIdx = 0;

	private _onClose = () => {
		App.pub_playBtnTab();
		this.m_view = false;
		this.m_curIdx = 0;
		this.props.onClosed();
	}
	public componentDidUpdate(prev: ITStoryBook) {
		if(this.props.view && !prev.view) {
			this.m_view = true;
			this.m_curIdx = 0;
			const storybook = this.props.data.storybook;
			
			this.props.actions.setNaviView(true);
			this.props.actions.setNavi( this.m_curIdx === 0 ? false : true, this.m_curIdx >= storybook.length - 1 ? false : true);
			this.props.actions.setNaviFnc(
				() => {
					if(this.m_curIdx === 0) {
						return;
					} else {
						this.m_curIdx--;
						this.props.actions.setNavi( this.m_curIdx === 0 ? false : true, this.m_curIdx >= storybook.length - 1 ? false : true);
					}
				},
				() => {
					if(this.m_curIdx >= storybook.length - 1) {
						return;
					} else {
						this.m_curIdx++;
						this.props.actions.setNavi( this.m_curIdx === 0 ? false : true, this.m_curIdx >= storybook.length - 1 ? false : true);
					}
				}
			);
		} else if(!this.props.view && prev.view) {
			this.m_view = false;
			this.m_curIdx = 0;
		}
	}

	public render() {
		const { view, data } = this.props;
		const storybook = data.storybook;

		const left = -1 * this.m_curIdx * _WIDTH;

		return (
			<CoverPopup className="t-storybook" view={view && this.m_view}  onClosed={this.props.onClosed}>
				<div className="page-wrapper" style={{left: left + 'px'}}>
					{storybook.map((page, idx) => {
						return (
							<div key={idx}>
								<div className="page">
									<img src={App.data_url + page.image} />
								</div>
							</div>
						);
					})}
				</div>
				<ToggleBtn className="btn_back" onClick={this._onClose}/>
			</CoverPopup>
		);
	}
}

export default TStoryBook;