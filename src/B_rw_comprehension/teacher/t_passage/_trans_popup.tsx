import * as React from 'react';
import * as _ from 'lodash';
import { observer } from 'mobx-react';

import { App } from '../../../App';
import { ToggleBtn } from '@common/component/button';
import * as common from '../../common';
import { observable } from 'mobx';
import { CoverPopup } from '../../../share/CoverPopup';

const SwiperComponent = require('react-id-swiper').default;

interface ITrans {
	view: boolean;
	scripts: common.IScript[];
	onClosed: () => void;
}

@observer
class TransPopup extends React.Component<ITrans> {
	@observable private m_view = false;
	@observable private _swiper: Swiper|null = null;

	private _refSwiper = (el: SwiperComponent) => {
		if(this._swiper || !el) return;
		this._swiper = el.swiper;
	}
	private _onClose = () => {
		App.pub_playBtnTab();
		this.m_view = false;
	}
	public componentDidUpdate(prev: ITrans) {
		if (this.props.view && !prev.view) {
			this.m_view = true;
			if(this._swiper) {
				this._swiper.slideTo(0, 0);
			}
			_.delay(() => {
				if(this._swiper) {
					this._swiper.update();
					if(this._swiper.scrollbar) this._swiper.scrollbar.updateSize();
					this._swiper.slideTo(0, 0);
				}
			}, 500);
		} else if (!this.props.view && prev.view) {
			this.m_view = false;
		}
	}
	public render() {
		const { view, scripts } = this.props;
		return (
			<CoverPopup className="trans_popup" view={this.props.view && this.m_view} onClosed={this.props.onClosed} >
				<span className="title">TRANSLATION</span><ToggleBtn className="btn_close" onClick={this._onClose} />
				<div className="trans_script">
					<SwiperComponent
						ref={this._refSwiper}
						direction="vertical"
						scrollbar={{ el: '.swiper-scrollbar', draggable: true,}}
						observer={true}
						slidesPerView="auto"
						freeMode={true}						
					>
						{scripts.map((script, idx) => {
							return (
							<div key={idx} className="script_eng">
								{script.dms_eng}
								<div>{script.dms_kor.ko}</div>
							</div>
							);
						})}
					</SwiperComponent>
				</div>
			</CoverPopup>
		);
	}
}

export default TransPopup;