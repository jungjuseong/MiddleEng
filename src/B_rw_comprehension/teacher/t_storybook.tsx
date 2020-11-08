import * as React from 'react';
import * as _ from 'lodash';
import { observer } from 'mobx-react';
import { observable, _allowStateChangesInsideComputed } from 'mobx';

import { IStateCtx, IActionsCtx } from './t_store';

import { ToggleBtn } from '@common/component/button';

import { App } from '../../App';
import { CoverPopup } from '../../share/CoverPopup';
import { IData } from '../common';

const _WIDTH = 1280;

interface ITStoryBook {
	view: boolean;
	state: IStateCtx;
	actions: IActionsCtx;
	data: IData;
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
		const { actions,data,view } = this.props;

		if(this.props.view && !prev.view) {
			this.m_view = true;
			this.m_curIdx = 0;
			const storybook = data.storybook;
			
			actions.setNaviView(true);
			actions.setNavi( this.m_curIdx === 0 ? false : true, this.m_curIdx >= storybook.length - 1 ? false : true);
			actions.setNaviFnc(
				() => {
					if(this.m_curIdx === 0) {
						return;
					} else {
						this.m_curIdx--;
						actions.setNavi( this.m_curIdx === 0 ? false : true, this.m_curIdx >= storybook.length - 1 ? false : true);
					}
				},
				() => {
					if(this.m_curIdx >= storybook.length - 1) {
						return;
					} else {
						this.m_curIdx++;
						actions.setNavi( this.m_curIdx === 0 ? false : true, this.m_curIdx >= storybook.length - 1 ? false : true);
					}
				}
			);
		} else if(!view && prev.view) {
			this.m_view = false;
			this.m_curIdx = 0;
		}
	}

	public render() {
		const { view,data,onClosed } = this.props;
		const storybook = data.storybook;
		const left = -1 * this.m_curIdx * _WIDTH;

		return (
			<CoverPopup className="t-storybook" view={view && this.m_view}  onClosed={onClosed}>
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