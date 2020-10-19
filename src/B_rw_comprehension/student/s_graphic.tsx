import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { Observer, observer } from 'mobx-react';
import * as _ from 'lodash';

import { IStateCtx, IActionsCtx, SENDPROG } from './s_store';
import * as common from '../common';
import { observable } from 'mobx';
import { App } from '../../App';
import * as felsocket from '../../felsocket';
import { ToggleBtn } from '@common/component/button';
import * as kutil from '@common/util/kutil';

import SendUI from '../../share/sendui_new';
import * as style from '../../share/style';

import TableItem from '../table-item';

import SGraphicResult from './s_graphic_result';
import SPentool from './s_pentool';
import SKeyboard from './s_keyborad';

const SwiperComponent = require('react-id-swiper').default;

const SOPTION: SwiperOptions = {
	direction: 'vertical',
	observer: true,
	slidesPerView: 'auto',
	freeMode: true,
	mousewheel: true,			
	noSwiping: true,
	followFinger: true,
	noSwipingClass: 'swiper-no-swiping',
	scrollbar: {el: '.swiper-scrollbar',draggable: true, hide: false},		
};

interface ISGraphicItem {
	view: boolean;
	graphic: common.IGraphicOrganizer;
	visualizing_type: common.VisualType;
	idx: number;
	onChange: (value: string, idx: number) => void;
}
@observer
class SGraphicItem extends React.Component<ISGraphicItem> {
	private m_swiper!: Swiper;
	private _cont!: JSX.Element;

	private _refSwiper = (el: SwiperComponent) => {
		if(this.m_swiper || !el) return;
		this.m_swiper = el.swiper;
	}
	public componentDidUpdate(prev: ISGraphicItem) {
		if(this.props.view && !prev.view) {
			if(this.m_swiper) {
				this.m_swiper.slideTo(0, 0);
				_.delay(() => {
					if(this.m_swiper) {
						this.m_swiper.update();
						if(this.m_swiper.scrollbar) this.m_swiper.scrollbar.updateSize();

						const _el = this.m_swiper.wrapperEl;
						const _h = _el.children[0].clientHeight;
						const _parent = _el.clientHeight;

						if( _h > _parent ) {
							_el.classList.remove('swiper-no-swiping');
							this.m_swiper.$wrapperEl[0].querySelector('.swiper-slide').classList.remove('swiper-no-swiping');
						} else {
							_el.classList.add('swiper-no-swiping');
							this.m_swiper.$wrapperEl[0].querySelector('.swiper-slide').classList.add('swiper-no-swiping');
						}
					}
				}, 100);
			}
		}
	}

	public render() {
		const { idx, view, graphic, visualizing_type } = this.props;
		let className;
		let headerColor;
		if(visualizing_type === common.VisualType.TYPE_1) {
			headerColor = common.TYPE_COM_HEADERS[idx];
			className = idx === 2 ? headerColor = common.TYPE_COM_HEADERS[1] : '';
			className = idx === 3 ? headerColor = common.TYPE_COM_HEADERS[2] : '';
			className = `type_1 zoom-in ${className}`;
		} else if(visualizing_type === common.VisualType.TYPE_2) {
			className = 'type_2 zoom-in';
			headerColor = common.TYPE_COM_HEADERS[idx];
		} else if(visualizing_type === common.VisualType.TYPE_3) {
            className = 'type_3 zoom-in';
            headerColor = common.TYPE_COM_HEADERS[idx];
        } else if(visualizing_type === common.VisualType.TYPE_4) {
            let cls: string;
            className = 'type_4 zoom-in';
            headerColor = common.TYPE_COM_HEADERS[idx];
		} else if(visualizing_type === common.VisualType.TYPE_5) {
            className = 'type_5 zoom-in';
            headerColor = common.TYPE_COM_HEADERS[idx];
		} else if(visualizing_type === common.VisualType.TYPE_6) {
            className = 'type_6 zoom-in';
		} else if(visualizing_type === common.VisualType.TYPE_7) {
            className = 'type_7 zoom-in';
            headerColor = common.TYPE_COM_HEADERS[idx];
		} else className = '';

		if (visualizing_type === common.VisualType.TYPE_6) {
			this._cont = (
				<div>
					<TableItem 
						inview={view} 
						graphic={graphic} 
						maxWidth={1030}
						className={className}
						headerColor={headerColor}
						optionBoxPosition="bottom"
						onChange={this.props.onChange}
					/>
				</div>
			);
		} else {
			this._cont = (
				<SwiperComponent {...SOPTION} ref={this._refSwiper}>
					<div>
						<TableItem 
							inview={view} 
							graphic={graphic} 
							maxWidth={1030}
							className={className}
							headerColor={headerColor}
							optionBoxPosition="bottom"
							onChange={this.props.onChange}
						/>
					</div>
				</SwiperComponent>
			);
		}		

		return (
			<div key="idx" className="single">
                {/* rw_comprehension 190425 수정사항 p.24,5 스크롤기능 삭제 */}
                {this._cont}
			</div>
		);
	}
}

interface ISGraphic {
	view: boolean;
	state: IStateCtx;
	actions: IActionsCtx;
}
@observer
class SGraphic extends React.Component<ISGraphic> {
    @observable private _curIdx = 0;
    @observable private _inputed: boolean[] = []; 
    @observable private _returns: common.IGraphReturn[] = []; 

    private _graps: common.IGraphicOrganizer[];

	constructor(props: ISGraphic) {
		super(props);
		this._graps = props.actions.getData().graphic;
		for(let i = 0; i < this._graps.length; i++) {
			this._inputed[i] = false;
			this._returns[i] = {
                answer: [],
                correct: false,
                stime: i === 0 ? Date.now() : 0,
                etime: 0
            };
		}
	}

	private _onNext = () => {
		const state = this.props.state;
		if(state.graphicProg !== SENDPROG.READY) return;
		else if(this._curIdx >= this._graps.length - 1) return;
		else if(!this._inputed[this._curIdx]) return;

		App.pub_playBtnTab();
		this._curIdx++;
		
		if(this._returns[this._curIdx]) {
			this._returns[this._curIdx].stime = Date.now();
		}
	}
	private _onSend = async () => {
		const { state, actions } = this.props;
		if(!App.student) return;
		else if(!this.props.view) return;
		else if(state.graphicProg !== SENDPROG.READY) return;
		else if(this._curIdx !== this._inputed.length - 1) return;
		else if(!this._inputed[this._curIdx]) return;

		state.graphicProg = SENDPROG.SENDING;
		App.pub_playToPad();
		
		const returns: common.IGraphReturn[] = [];
		this._returns.forEach((val, idx) => {
            returns.push({
				answer: val.answer.slice(0),
				correct: val.correct,
				stime: val.stime,
				etime: val.etime,				
			});     
		});

		const msg: common.IGraphMsg = {
			msgtype: 'graphic_return',
			id: App.student.id,
			returns,
		};
		felsocket.sendTeacher($SocketType.MSGTOTEACHER, msg);
		await kutil.wait(500);

		if(!this.props.view) return;
		else if(state.graphicProg !== SENDPROG.SENDING) return;

		App.pub_playGoodjob();
		this.props.actions.startGoodJob();

		await kutil.wait(1500);
		if(!this.props.view) return;
		else if(state.graphicProg !== SENDPROG.SENDING) return;

		const vtype = actions.getData().visualizing_type;
		if(vtype == 6 && state.isTableItemSwapped == true ) {
			actions.swapGraphicData();
			actions.setIsTableItemSwapped();
		}
		state.graphicProg = SENDPROG.SENDED;

	}
	private _onChange = (value: string, idx: number) => {
		if(this.props.state.graphicProg !== SENDPROG.READY) return;

		if(this._curIdx < this._inputed.length) {
			const grap = this._graps[this._curIdx];
			let inputed = true;
			for(let i = 0; i < grap.app_drops.length; i++) {
				if(grap.app_drops[i].inputed === '') {
					inputed = false;
					break;
				}
			}
			this._inputed[this._curIdx] = inputed;
			
			if(this._returns[this._curIdx]) {
				if(this._graps[this._curIdx].app_drops.length !== this._returns[this._curIdx].answer.length) {
                    for(let i = 0; i < this._graps[this._curIdx].app_drops.length; i++) {
                        this._returns[this._curIdx].answer[i] = 0;
                    }
				}

				this._graps[this._curIdx].app_drops[idx].choices.forEach((val, gidx) => {
					if(val === value) this._returns[this._curIdx].answer[idx] = (gidx + 1);
				});

				let correct = true;
				this._graps[this._curIdx].app_drops.forEach((drop, didx) => {
					if(drop.inputed !== drop.correct) correct = false;
				});
				this._returns[this._curIdx].correct = correct;
				this._returns[this._curIdx].etime = Date.now();
            }
		}
	}

	public componentDidUpdate(prev: ISGraphic) {
		if(!this.props.view && prev.view) {
			const stime = Date.now();
			for(let i = 0; i < this._inputed.length; i++) {
				this._inputed[i] = false;
				this._returns[i].answer = [];
				this._returns[i].correct = false;
				this._returns[i].stime = stime;
				this._returns[i].etime = 0;
			}
			this._curIdx = 0;

			this._graps.forEach((grap) => {
				grap.app_drops.forEach((drop) => {
					drop.inputed = '';
				});
			});
		}
	}

	public render() {
		const { view, state, actions} = this.props;
		const data = actions.getData();

		const graphics = data.graphic;
		const vtype = data.visualizing_type;

		let curIdx = this._curIdx;
		if(state.graphicProg >= SENDPROG.SENDED) curIdx = this._inputed.length;
		
		const isResult =  curIdx === this._inputed.length;
		const isLast =  curIdx === (this._inputed.length - 1);

		let inputed;
		if(curIdx < this._inputed.length) inputed = this._inputed[curIdx];
		else inputed = false;

		const btnNextView = inputed && curIdx < this._inputed.length - 1 && state.graphicProg === SENDPROG.READY;
		const sendView = inputed && isLast && state.graphicProg <= SENDPROG.SENDING;

		/*
	inview: boolean;
	graphic: common.IGraphicOrganizer;
	maxWidth: number;
	className: string;
	optionBoxPosition: 'top'|'bottom';
		*/
		return (
			<div className="s_graphic" style={view ? undefined : style.HIDE}>
				<div className="btn_page_box" style={isResult || state.graphicSheet !== '' ? style.NONE : undefined}>
					{graphics.map((graphic, idx) => {
						return <span key={idx} className={curIdx === idx ? 'on' : ''}>{idx + 1}</span>;
					})}
				</div>
				<div className="table-container" style={state.graphicSheet === '' ? undefined : style.HIDE}>
					<div className="table-wrapper" style={{left: -1280 * curIdx}}>
						{graphics.map((graphic, idx) => {
							return (
								<SGraphicItem
									key={idx}
									idx={idx}
									visualizing_type={vtype}
									graphic={graphic}
									view={view}
									onChange={this._onChange}
								/>
							);
						})}
						<div className="s_graphic_result" >
							<SGraphicResult 
								view={view} 
								on={isResult}
								graphics={graphics} 
								state={state}
								actions={actions}
							/>
						</div>
					</div>
				</div>
				<ToggleBtn className="btn_next" view={btnNextView} onClick={this._onNext}/>
				<SendUI
					view={sendView}
					type={'pad'}
					originY={0}
					sended={false}
					onSend={this._onSend}
				/>
				<SPentool view={view && state.graphicSheet === 'pentool'} actions={actions}/>
				<SKeyboard view={view && state.graphicSheet === 'keyboard'} actions={actions}/>
			</div>
		);
	}
}

export default SGraphic;


