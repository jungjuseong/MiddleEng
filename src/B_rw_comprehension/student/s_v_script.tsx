import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { Observer, observer } from 'mobx-react';

import { IStateCtx, IActionsCtx, QnaProg } from './s_store';
import * as common from '../common';
import { observable } from 'mobx';
import { ToggleBtn } from '@common/component/button';
import * as kutil from '@common/util/kutil';
import * as butil from '@common/component/butil';
import SendUI from '../../share/sendui_new';
import * as style from '../../share/style';
import * as _ from 'lodash';
import { App } from '../../App';
import * as felsocket from '../../felsocket';

const SwiperComponent = require('react-id-swiper').default;

interface IScript {
	idx: number;
	script: common.IScript;
	focusIdx: number;
	viewSctiprFocusBG: boolean;
}
class Script extends React.Component<IScript> {
	private _jsx: JSX.Element[];
	constructor(props: IScript) {
		super(props);
		this._jsx = butil.sentence2jsx(props.script.dms_eng, 'closure', undefined, false, 'word');
	}

	public render() {
		const {script, focusIdx, viewSctiprFocusBG, idx } = this.props;
		const arr: string[] = ['eng'];
		if(focusIdx === idx) {
			arr.push('on');
			if(viewSctiprFocusBG) arr.push('bg-on');
			
		}
		return (
			<div className={arr.join(' ')} >{this._jsx}</div>
		);
	}
}

interface ISVScript {
	view: boolean;
	focusIdx: number;
	state: IStateCtx;
	actions: IActionsCtx;
}
@observer
class SVScript extends React.Component<ISVScript> {
	@observable private _swiper: Swiper|null = null;

	private _refSwiper = (el: SwiperComponent) => {
		if(this._swiper || !el) return;
		this._swiper = el.swiper;
	}

	public componentWillReceiveProps(next: ISVScript) {
		if(next.view && !this.props.view) {
			/* */
		}
	}
	private async _updateSwiper() {
		await kutil.wait(100);
		if(this._swiper) {
			this._swiper.update();
			if(this._swiper.scrollbar) this._swiper.scrollbar.updateSize();

			this._swiper.slideTo(0);
		}
	}
	public componentDidUpdate(prev: ISVScript) {
		if(this.props.view && !prev.view) {
			this._updateSwiper();
		}
		if(this.props.focusIdx >= 0 && this.props.focusIdx !== prev.focusIdx) {
			if(this._swiper) {
				const scritps = this.props.actions.getData().scripts;
				let sidx = this.props.focusIdx;

				if(sidx >= 1) this._swiper.slideTo(sidx - 1);
				else if(sidx >= 0) this._swiper.slideTo(0);
			}
		}
	}

	public render() {
		const { view,  state, actions, focusIdx} = this.props;

		const data = actions.getData();

		return (
			<div className="s_v_script" style={view ? undefined : style.HIDE}>
				<div className={'page ' + (state.isPlay_v ? 'swiper-no-swiping' : '')}>
					<SwiperComponent
						ref={this._refSwiper}
						direction="vertical"
						scrollbar={{ el: '.swiper-scrollbar', draggable: true,}}
						observer={true}
						slidesPerView="auto"
						freeMode={true}						
					>
					{data.scripts.map((script, idx) => {
						return (
							<div key={idx} className="script">
								<Script 
									idx={idx}
									focusIdx={focusIdx}
									viewSctiprFocusBG={state.viewSctiprFocusBG}
									script={script}
								/>
							</div>
						);
					})}	
					</SwiperComponent>
				</div>
			</div>
		);
	}
}
export default SVScript;


