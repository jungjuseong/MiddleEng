import * as React from 'react';
import * as _ from 'lodash';
import { observer } from 'mobx-react';

import { IStateCtx, IActionsCtx, BTN_DISABLE } from '../t_store';
import { App } from '../../../App';
import * as felsocket from '../../../felsocket';
import { ToggleBtn } from '@common/component/button';
import * as common from '../../common';
import { observable } from 'mobx';
import SendUI from '../../../share/sendui_new';
import { CorrectBar } from '../../../share/Progress_bar';
import { CoverPopup } from '../../../share/CoverPopup';
import * as style from '../../../share/style';

import NItem from '@common/component/NItem';
import { SENDPROG } from '../../student/s_store';
import * as kutil from '@common/util/kutil';
import WrapTextNew from '@common/component/WrapTextNew';
import QuizMCBtn from '../../../share/QuizMCBtn';

import { QuestionItem, IRet } from './_question_item';

const SwiperComponent = require('react-id-swiper').default;

interface IClue {
	view: boolean;
	idx: number;
	questions: common.IQuestion;
	onClosed: () => void;
}

@observer
class CluePopup extends React.Component<IClue> {
	@observable private m_view = false;
	@observable private _swiper: Swiper|null = null;

	// private _jsx: JSX.Element;

	constructor(props: IClue) {
		super(props);
		// const hints = props.questions.hint;
		// this._jsx = parseLine(hints, 'block');
	}

	private _refSwiper = (el: SwiperComponent) => {
		if(this._swiper || !el) return;
		this._swiper = el.swiper;
	}
	private _onClose = () => {
		this.m_view = false;
	}
	public componentDidUpdate(prev: IClue) {
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
        const { view, questions } = this.props;
        const hint = questions.hint;

        return (
            <CoverPopup className="clue_popup" view={this.props.view && this.m_view} onClosed={this.props.onClosed} >
                <span className="title">CLUE</span><ToggleBtn className="btn_close" onClick={this._onClose} />
                <div className="clue_script">
                    <SwiperComponent
                        ref={this._refSwiper}
                        direction="vertical"
                        scrollbar={{ el: '.swiper-scrollbar', draggable: true,}}
                        observer={true}
                        slidesPerView="auto"
                        freeMode={true}						
                    >
                        <div className="clue_question">
                            <div className="icon_question" />
                            {this.props.idx + 1}. {this.props.questions.question}
                        </div>
                        <div className="script">
                            <div className="icon_clue" />
                            {/* {this._jsx} */}
                            <span dangerouslySetInnerHTML={{__html: hint}}/>
                        </div>
                    </SwiperComponent>
                </div>
            </CoverPopup>
        );
	}
}

export default CluePopup;