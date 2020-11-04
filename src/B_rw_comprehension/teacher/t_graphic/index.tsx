import * as React from 'react';
import * as _ from 'lodash';
import { observable } from 'mobx';
import { observer } from 'mobx-react';

import { IStateCtx, IActionsCtx, SENDPROG, BTN_DISABLE } from '../t_store';
import { App } from '../../../App';
import * as felsocket from '../../../felsocket';
import { ToggleBtn } from '@common/component/button';

import * as kutil from '@common/util/kutil';
import * as common from '../../common';

import SendUI from '../../../share/sendui_new';
import * as style from '../../../share/style';

import { PentoolSheet } from '../t_pentool_sheet';
import { KeyboardSheet } from '../t_keyborad_sheet';
import TableItem from '../../table-item';

import SheetPopup from './_sheet_popup';
import TablePopup from './_table_popup';

const SwiperComponent = require('react-id-swiper').default;

const m_swiper_option: SwiperOptions = {
	direction: 'vertical',
	observer: true,
	slidesPerView: 'auto',
	freeMode: true,
	mousewheel: true,
	noSwiping: true,
	noSwipingClass: 'swiper-no-swiping',
	followFinger: true,
	scrollbar: { el: '.swiper-scrollbar', draggable: true, hide: false },
};

interface IGraphicOrganizer {
	view: boolean;
	inview: boolean;
	videoPopup: boolean;
	viewStoryBook: boolean;
	data: common.IData;
	state: IStateCtx;
	actions: IActionsCtx;
	onStudy: (studying: BTN_DISABLE) => void;
	onSetNavi: (title: 'Compreshension' | 'SUMMARIZING', tab: 'Question' | 'Summary') => void;
}
@observer
class GraphicOrganizer extends React.Component<IGraphicOrganizer> {
	@observable private _retCnt = 0;
	@observable private _numOfStudent = 0;

	@observable private _numOfStudent_sheet = 0;

	private _returns: string[] = [];

	@observable private _sheet = false;
	@observable private _sheetpage: common.SHEETPAGE = '';

	@observable private _table = '';

	private _table_head_color: string | null = null;
	private _table_graphic!: common.IGraphicOrganizer;

	@observable private _prog = SENDPROG.READY;

	@observable private _renderCnt = 0;

	private m_swiper!: Swiper;
	private _cont!: JSX.Element;

	constructor(props: IGraphicOrganizer) {
		super(props);
		this._table_graphic = props.data.graphic[0];
	}
	private _refSwiper = (el: SwiperComponent) => {
		if (this.m_swiper || !el) return;
		this.m_swiper = el.swiper;

		const _el = this.m_swiper.wrapperEl;
		const _h = _el.children[0].clientHeight;
		const _parent = _el.clientHeight;

		if (_h >= _parent) {
			_el.classList.remove('swiper-no-swiping');
			this.m_swiper.$wrapperEl[0].querySelector('.swiper-slide').classList.remove('swiper-no-swiping');
		} else {
			_el.classList.add('swiper-no-swiping');
			this.m_swiper.$wrapperEl[0].querySelector('.swiper-slide').classList.add('swiper-no-swiping');
		}
	}

	private _clickReturn = () => {
		App.pub_playBtnTab();
		felsocket.startStudentReportProcess($ReportType.JOIN, this._returns);
		// TO DO
	}
	private _onReturn = (msg: common.IGraphMsg) => {
		if (!this.props.inview) return;
		else if (this._prog !== SENDPROG.SENDED) return;

		if (this._returns.indexOf(msg.id) >= 0) return;
		const student = _.find(App.students, { id: msg.id });
		if (!student) return;
		this._returns.push(msg.id);
		felsocket.addStudentForStudentReportType6(msg.id);
		this._retCnt = this._returns.length;
	}

	private _onSend = () => {
		if (!this.props.inview) return;
		else if (this._prog !== SENDPROG.READY) return;

		this._prog = SENDPROG.SENDING;
		this._sheetpage = '';
		while (this._returns.length > 0) this._returns.pop();

		App.pub_playToPad();
		const msg: common.IMsg = {
			msgtype: 'graphic_send',
		};
		felsocket.sendPAD($SocketType.MSGTOPAD, msg);

		this.props.actions.setGraphFnc(this._onReturn);
		this.props.onStudy('ex_video');

		App.pub_reloadStudents(async () => {
			if (!this.props.inview) return;
			else if (this._prog !== SENDPROG.SENDING) return;
			this._retCnt = 0;
			this._numOfStudent = App.students.length;

			await kutil.wait(600);
			if (!this.props.inview) return;
			else if (this._prog !== SENDPROG.SENDING) return;
			this._prog = SENDPROG.SENDED;
			this.props.actions.setNavi(false, false);
		});
	}
	private _done: string = '';
	private _onAnswer = () => {
		if (!this.props.inview) return;
		else if (this._prog !== SENDPROG.SENDED) return;
		App.pub_playBtnTab();
		this._prog = SENDPROG.COMPLETE;
		this.props.actions.setGraphFnc(null);
		this.props.onStudy('');
		const msg: common.IMsg = {
			msgtype: 'graphic_end'
		};
		felsocket.sendPAD($SocketType.MSGTOPAD, msg);
		this._done = ' done';
		this.props.actions.setNavi(true, true);
	}

	private _onSendSheet = (sheetpage: common.SHEETPAGE) => {
		if (!this.props.inview) return;
		// else if(this._prog !== SENDPROG.COMPLETE) return;
		else if (this._sheetpage !== '') return;

		this.props.onStudy('');
		const msg: common.IMsg = {
			msgtype: sheetpage === 'keyboard' ? 'keyboard_send' : 'pentool_send',
		};
		felsocket.startStudentReportProcess(
			sheetpage === 'keyboard' ? $ReportType.TEXT : $ReportType.IMAGE,
			null,
			'C'
		);
		felsocket.sendPAD($SocketType.MSGTOPAD, msg);

		this._sheetpage = sheetpage;
		this._sheet = false;

		App.pub_reloadStudents(() => {
			this._numOfStudent_sheet = App.students.length;
		});
	}
	private _clickSheet = () => {
		App.pub_playBtnTab();
		this._sheet = !this._sheet;
		if (this._sheet) this.props.actions.setNavi(false, false);
	}
	private _offSheet = () => {
		this._sheet = false;
		this.props.actions.setNavi(true, true);
	}

	private _closeKeyboard = () => {
		App.pub_playBtnTab();
		this._sheetpage = '';
		this.props.actions.setGraphFnc(null);
		if (this._prog === SENDPROG.COMPLETE) {
			const msg: common.IMsg = {
				msgtype: 'keyboard_end',
			};
			felsocket.sendPAD($SocketType.MSGTOPAD, msg);
		} else {
			felsocket.sendPAD($SocketType.PAD_ONSCREEN, null);
		}
	}
	private _closePentool = () => {
		App.pub_playBtnTab();
		this._sheetpage = '';
		this.props.actions.setGraphFnc(null);

		if (this._prog === SENDPROG.COMPLETE) {
			const msg: common.IMsg = {
				msgtype: 'pentool_end',
			};
			felsocket.sendPAD($SocketType.MSGTOPAD, msg);
		} else {
			felsocket.sendPAD($SocketType.PAD_ONSCREEN, null);
		}
	}
	private _setNavi() {
		this.props.actions.setNaviView(true);
		if (this._prog === SENDPROG.SENDING || this._prog === SENDPROG.SENDED) this.props.actions.setNavi(false, false);
		else this.props.actions.setNavi(true, true);

		this.props.actions.setNaviFnc(
			() => {
				this.props.state.isNaviBack = true;
				this.props.onSetNavi('Compreshension', 'Question');
			},
			() => {
				this.props.onSetNavi('SUMMARIZING', 'Summary');
			}
		);
	}
	private _init() {
		if (this.m_swiper) {
			this.m_swiper.slideTo(0, 0);
			_.delay(() => {
				if (this.m_swiper) {
					this.m_swiper.update();
					if (this.m_swiper.scrollbar) this.m_swiper.scrollbar.updateSize();

					const _el = this.m_swiper.wrapperEl;
					const _h = _el.children[0].clientHeight;
					const _parent = _el.clientHeight;

					if (_h > _parent) {
						_el.classList.remove('swiper-no-swiping');
						this.m_swiper.$wrapperEl[0].querySelector('.swiper-slide').classList.remove('swiper-no-swiping');
					} else {
						_el.classList.add('swiper-no-swiping');
						this.m_swiper.$wrapperEl[0].querySelector('.swiper-slide').classList.add('swiper-no-swiping');
					}
				}
			}, 100);
		}

		if (this._prog !== SENDPROG.COMPLETE) {
			this._prog = SENDPROG.READY;
			this._retCnt = 0;
			this._numOfStudent = 0;
			this._table = '';
			this._table_head_color = null;
			this._done = '';

			this.props.data.graphic.forEach((gr) => {
				gr.app_drops.forEach((drop) => {
					drop.inputed = '';
				});
			});
		}

		this._sheet = false;
		this._sheetpage = '';

		this.props.actions.setGraphFnc(null);
		felsocket.sendPAD($SocketType.PAD_ONSCREEN, null);
	}
	public componentDidUpdate(prev: IGraphicOrganizer) {
		if (this.props.videoPopup && !prev.videoPopup) {
			if (this.props.state.isVideoStudied) this.props.state.isVideoStudied = false;
		} else if (!this.props.videoPopup && prev.videoPopup) {
			if (this.props.state.isVideoStudied && this._prog < SENDPROG.COMPLETE) this._init();
		}
		if (this.props.inview && !prev.inview) {
			this._init();
			this._setNavi();
		} else if (!this.props.inview && prev.inview) {
			this.props.actions.setGraphFnc(null);
			// this._prog = SENDPROG.READY;
			// this._table = '';

			// this.props.data.graphic.forEach((gr) => {
			// 	gr.app_drops.forEach((drop) => {
			// 		drop.inputed = '';
			// 	});
			// });
		}

		if (this.props.inview && prev.inview) {
			if (!this.props.videoPopup && prev.videoPopup) this._setNavi();
			else if (!this.props.viewStoryBook && prev.viewStoryBook) this._setNavi();
		}
	}
	private _clickZoom = (graphic: common.IGraphicOrganizer, className: string, head_color: string | null) => {
		this._table_head_color = head_color;
		this._table_graphic = graphic;
		this._table = className;

		this.props.actions.setNaviView(false);
		this._renderCnt++;
	}
	private _tableClosed = () => {
		this._table = '';
		this.props.actions.setNaviView(true);
		this._renderCnt++;
	}

	private _popupChange = (value: string, idx: number) => {
		this._renderCnt++;
	}



	public render() {
		const { view, inview, data, actions } = this.props;
		const graphics = data.graphic;
		let tableClass;
		let jsx;
		if (data.visualizing_type === common.VisualType.TYPE_1) {
			tableClass = 'type_1';
			jsx = (
				<>
					<div className="top">
						<TableItem
							viewCorrect={this._prog === SENDPROG.COMPLETE}
							disableSelect={this._prog === SENDPROG.COMPLETE}
							inview={inview}
							graphic={graphics[0]}
							maxWidth={1080}
							className="type_1"
							headerColor={common.TYPE_COM_HEADERS[0]}
							optionBoxPosition="bottom"
							viewBtn={true}
							renderCnt={this._renderCnt}
							onClickBtn={() => this._clickZoom(graphics[0], 'purple', common.TYPE_COM_HEADERS[0])}
							isStudent={false}
							idx={1}
						/>
					</div>
					<span className="link_line" />
					<div className="middle">
						<div>
							<TableItem
								viewCorrect={this._prog === SENDPROG.COMPLETE}
								disableSelect={this._prog === SENDPROG.COMPLETE}
								inview={inview}
								graphic={graphics[1]}
								maxWidth={530}
								className="type_1"
								headerColor={common.TYPE_COM_HEADERS[1]}
								optionBoxPosition="bottom"
								viewBtn={true}
								renderCnt={this._renderCnt}
								onClickBtn={() => this._clickZoom(graphics[1], 'green', common.TYPE_COM_HEADERS[1])}
								isStudent={false}
								idx={2}
							/>
						</div>
						<div>
							<TableItem
								viewCorrect={this._prog === SENDPROG.COMPLETE}
								disableSelect={this._prog === SENDPROG.COMPLETE}
								inview={inview}
								graphic={graphics[2]}
								maxWidth={530}
								className="type_1"
								headerColor={common.TYPE_COM_HEADERS[1]}
								optionBoxPosition="bottom"
								viewBtn={true}
								renderCnt={this._renderCnt}
								onClickBtn={() => this._clickZoom(graphics[2], 'green', common.TYPE_COM_HEADERS[1])}
								isStudent={false}
								idx={3}
							/>
						</div>
					</div>
					<span className="link_line_down" />
					<div className="bottom">
						<TableItem
							viewCorrect={this._prog === SENDPROG.COMPLETE}
							disableSelect={this._prog === SENDPROG.COMPLETE}
							inview={inview}
							graphic={graphics[3]}
							className="type_1"
							headerColor={common.TYPE_COM_HEADERS[2]}
							maxWidth={1080}
							optionBoxPosition="top"
							viewBtn={true}
							renderCnt={this._renderCnt}
							onClickBtn={() => this._clickZoom(graphics[3], 'purple', common.TYPE_COM_HEADERS[2])}
							isStudent={false}
							idx={4}
						/>
					</div>
				</>
			);
		} else if (data.visualizing_type === common.VisualType.TYPE_2) {
			tableClass = 'type_2';
			jsx = (
				<>
					<div className="top">
						<div className="top_left">
							<TableItem
								viewCorrect={this._prog === SENDPROG.COMPLETE}
								disableSelect={this._prog === SENDPROG.COMPLETE}
								inview={inview}
								graphic={graphics[0]}
								className="type_2"
								headerColor={common.TYPE_COM_HEADERS[0]}
								maxWidth={500}
								optionBoxPosition="bottom"
								viewBtn={true}
								renderCnt={this._renderCnt}
								onClickBtn={() => this._clickZoom(graphics[0], 'type_2', common.TYPE_COM_HEADERS[0])}
								isStudent={false}
								idx={1}
							/>
						</div>
						<div className="icon_arrow" />
						<div className="top_right">
							<TableItem
								viewCorrect={this._prog === SENDPROG.COMPLETE}
								disableSelect={this._prog === SENDPROG.COMPLETE}
								inview={inview}
								graphic={graphics[1]}
								className="type_2"
								headerColor={common.TYPE_COM_HEADERS[1]}
								maxWidth={500}
								optionBoxPosition="bottom"
								viewBtn={true}
								renderCnt={this._renderCnt}
								onClickBtn={() => this._clickZoom(graphics[1], 'type_2', common.TYPE_COM_HEADERS[1])}
								isStudent={false}
								idx={2}
							/>
						</div>
					</div>
					<span className="link_line" />
					<div className="middle">
						<div>
							<TableItem
								viewCorrect={this._prog === SENDPROG.COMPLETE}
								disableSelect={this._prog === SENDPROG.COMPLETE}
								inview={inview}
								graphic={graphics[2]}
								className="type_2"
								headerColor={common.TYPE_COM_HEADERS[2]}
								maxWidth={700}
								optionBoxPosition="bottom"
								viewBtn={true}
								renderCnt={this._renderCnt}
								onClickBtn={() => this._clickZoom(graphics[2], 'type_2', common.TYPE_COM_HEADERS[2])}
								isStudent={false}
								idx={3}
							/>
						</div>
					</div>
				</>
			);
		} else if (data.visualizing_type === common.VisualType.TYPE_3) {
			tableClass = 'type_3';
			jsx = (
				<>
					<div className="top">
						<div>
							<TableItem
								viewCorrect={this._prog === SENDPROG.COMPLETE}
								disableSelect={this._prog === SENDPROG.COMPLETE}
								inview={inview}
								graphic={graphics[0]}
								className="type_3"
								headerColor={common.TYPE_COM_HEADERS[0]}
								maxWidth={361}
								optionBoxPosition="bottom"
								viewBtn={true}
								renderCnt={this._renderCnt}
								onClickBtn={() => this._clickZoom(graphics[0], 'type_3', common.TYPE_COM_HEADERS[0])}
								isStudent={false}
								idx={1}
							/>
						</div>
						<div>
							<TableItem
								viewCorrect={this._prog === SENDPROG.COMPLETE}
								disableSelect={this._prog === SENDPROG.COMPLETE}
								inview={inview}
								graphic={graphics[1]}
								className="type_3"
								headerColor={common.TYPE_COM_HEADERS[1]}
								maxWidth={361}
								optionBoxPosition="bottom"
								viewBtn={true}
								renderCnt={this._renderCnt}
								onClickBtn={() => this._clickZoom(graphics[1], 'type_3', common.TYPE_COM_HEADERS[1])}
								isStudent={false}
								idx={2}
							/>
						</div>
						<div>
							<TableItem
								viewCorrect={this._prog === SENDPROG.COMPLETE}
								disableSelect={this._prog === SENDPROG.COMPLETE}
								inview={inview}
								graphic={graphics[2]}
								className="type_3"
								headerColor={common.TYPE_COM_HEADERS[2]}
								maxWidth={361}
								optionBoxPosition="bottom"
								viewBtn={true}
								renderCnt={this._renderCnt}
								onClickBtn={() => this._clickZoom(graphics[2], 'type_3', common.TYPE_COM_HEADERS[2])}
								isStudent={false}
								idx={3}
							/>
						</div>
					</div>
				</>
			);
		} else if (data.visualizing_type === common.VisualType.TYPE_4) {
			tableClass = 'type_4';
			jsx = (
				<>
					<div className="top">
						<TableItem
							viewCorrect={this._prog === SENDPROG.COMPLETE}
							disableSelect={this._prog === SENDPROG.COMPLETE}
							inview={inview}
							graphic={graphics[0]}
							className="type_4"
							headerColor={common.TYPE_COM_HEADERS[0]}
							maxWidth={1109}
							optionBoxPosition="bottom"
							viewBtn={true}
							renderCnt={this._renderCnt}
							onClickBtn={() => this._clickZoom(graphics[0], 'type_4', common.TYPE_COM_HEADERS[0])}
							isStudent={false}
							idx={1}
						/>
						<TableItem
							viewCorrect={this._prog === SENDPROG.COMPLETE}
							disableSelect={this._prog === SENDPROG.COMPLETE}
							inview={inview}
							graphic={graphics[1]}
							className="type_4"
							headerColor={common.TYPE_COM_HEADERS[1]}
							maxWidth={1109}
							optionBoxPosition="bottom"
							viewBtn={true}
							renderCnt={this._renderCnt}
							onClickBtn={() => this._clickZoom(graphics[1], 'type_4', common.TYPE_COM_HEADERS[1])}
							isStudent={false}
							idx={2}
						/>
					</div>
				</>
			);
		} else if (data.visualizing_type === common.VisualType.TYPE_5) {
			tableClass = 'type_5';
			jsx = (
				<>
					<div className="top">
						<TableItem
							viewCorrect={this._prog === SENDPROG.COMPLETE}
							disableSelect={this._prog === SENDPROG.COMPLETE}
							inview={inview}
							graphic={graphics[0]}
							className="type_5"
							headerColor={common.TYPE_COM_HEADERS[0]}
							maxWidth={1109}
							optionBoxPosition="bottom"
							viewBtn={true}
							renderCnt={this._renderCnt}
							onClickBtn={() => this._clickZoom(graphics[0], 'type_5', common.TYPE_COM_HEADERS[0])}
							isStudent={false}
							idx={1}
						/>
						<TableItem
							viewCorrect={this._prog === SENDPROG.COMPLETE}
							disableSelect={this._prog === SENDPROG.COMPLETE}
							inview={inview}
							graphic={graphics[1]}
							className="type_5"
							headerColor={common.TYPE_COM_HEADERS[1]}
							maxWidth={1109}
							optionBoxPosition="bottom"
							viewBtn={true}
							renderCnt={this._renderCnt}
							onClickBtn={() => this._clickZoom(graphics[1], 'type_5', common.TYPE_COM_HEADERS[1])}
							isStudent={false}
							idx={2}
						/>
						<TableItem
							viewCorrect={this._prog === SENDPROG.COMPLETE}
							disableSelect={this._prog === SENDPROG.COMPLETE}
							inview={inview}
							graphic={graphics[2]}
							className="type_5"
							headerColor={common.TYPE_COM_HEADERS[2]}
							maxWidth={1109}
							optionBoxPosition="bottom"
							viewBtn={true}
							renderCnt={this._renderCnt}
							onClickBtn={() => this._clickZoom(graphics[2], 'type_5', common.TYPE_COM_HEADERS[2])}
							isStudent={false}
							idx={3}
						/>
					</div>
				</>
			);
		} else if (data.visualizing_type === common.VisualType.TYPE_6) {
			tableClass = 'type_6';
			jsx = (
				<>
					<div className="top">
						<div>
							<TableItem
								viewCorrect={this._prog === SENDPROG.COMPLETE}
								disableSelect={this._prog === SENDPROG.COMPLETE}
								inview={inview}
								graphic={graphics[0]}
								className="type_6"
								maxWidth={300}
								optionBoxPosition="bottom"
								viewBtn={false}
								renderCnt={this._renderCnt}
								onClickBtn={() => this._clickZoom(graphics[0], 'type_6', common.TYPE_COM_HEADERS[0])}
								isStudent={false}
								idx={1}
							/>
						</div>
						<div>
							<TableItem
								viewCorrect={this._prog === SENDPROG.COMPLETE}
								disableSelect={this._prog === SENDPROG.COMPLETE}
								inview={inview}
								graphic={graphics[1]}
								className="type_6"
								maxWidth={300}
								optionBoxPosition="bottom"
								viewBtn={false}
								renderCnt={this._renderCnt}
								onClickBtn={() => this._clickZoom(graphics[1], 'type_6', common.TYPE_COM_HEADERS[1])}
								isStudent={false}
								idx={2}
							/>
						</div>
						<div>
							<TableItem
								viewCorrect={this._prog === SENDPROG.COMPLETE}
								disableSelect={this._prog === SENDPROG.COMPLETE}
								inview={inview}
								graphic={graphics[2]}
								className="type_6"
								maxWidth={300}
								optionBoxPosition="bottom"
								viewBtn={false}
								renderCnt={this._renderCnt}
								onClickBtn={() => this._clickZoom(graphics[2], 'type_6', common.TYPE_COM_HEADERS[2])}
								isStudent={false}
								idx={3}
							/>
						</div>
					</div>
				</>
			);
		} else if (data.visualizing_type === common.VisualType.TYPE_7) {
			tableClass = 'type_7';
			jsx = (
				<>
					<div className="top">
						<div>
							<TableItem
								viewCorrect={this._prog === SENDPROG.COMPLETE}
								disableSelect={this._prog === SENDPROG.COMPLETE}
								inview={inview}
								graphic={graphics[0]}
								className="type_7"
								headerColor={common.TYPE_COM_HEADERS[0]}
								maxWidth={470}/* p1 수정 요청 사항 2020_06_30 성준*/
								optionBoxPosition="bottom"
								viewBtn={true}
								renderCnt={this._renderCnt}
								onClickBtn={() => this._clickZoom(graphics[0], 'type_7', common.TYPE_COM_HEADERS[0])}
								isStudent={false}
								idx={1}
							/>
						</div>
						<div>
							<TableItem
								viewCorrect={this._prog === SENDPROG.COMPLETE}
								disableSelect={this._prog === SENDPROG.COMPLETE}
								inview={inview}
								graphic={graphics[1]}
								className="type_7"
								headerColor={common.TYPE_COM_HEADERS[1]}
								maxWidth={470}/* p1 수정 요청 사항 2020_06_30 성준*/
								optionBoxPosition="bottom"
								viewBtn={true}
								renderCnt={this._renderCnt}
								onClickBtn={() => this._clickZoom(graphics[1], 'type_7', common.TYPE_COM_HEADERS[1])}
								isStudent={false}
								idx={2}
							/>
						</div>
					</div>
				</>
			);
		}

		let tableView = this._sheetpage !== 'keyboard' && this._sheetpage !== 'pentool' ? false : true;
		if (tableClass === 'type_3' || tableClass === 'type_6' || tableClass === 'type_7') {
			this._cont = (
				<div className={'table_box ' + tableClass} hidden={tableView}>{jsx}</div>
			);
		} else {
			this._cont = (
				<SwiperComponent id="table-container" {...m_swiper_option} ref={this._refSwiper}>
					<div className={'table_box ' + tableClass} hidden={tableView}>{jsx}</div>
				</SwiperComponent>
			);
		}

		let graphicTitle = data.app_graphic_title;
		let isTitle = <div className="title">{graphicTitle}</div>;
		if (!graphicTitle.trim()) isTitle = <></>;

		return (
			<div className={'GraphicOrganizer ' + this._sheetpage + this._done} style={inview ? undefined : style.NONE}>
				<div className="nav">
					{isTitle}
					<ToggleBtn className="btn_sheet" on={this._sheet} disabled={this._prog === SENDPROG.SENDED} onClick={this._clickSheet} />
					<div className="right" style={{ display: this._prog >= SENDPROG.SENDED ? '' : 'none' }}>
						<div className="return_cnt_box white" onClick={this._clickReturn}>
							<div>{this._retCnt}/{this._numOfStudent}</div>
						</div>
						<ToggleBtn className="btn_answer" on={this._prog >= SENDPROG.COMPLETE} onClick={this._onAnswer} />
					</div>
				</div>
				{this._cont}

				<TablePopup
					className={this._table}
					headerColor={this._table_head_color}
					prog={this._prog}
					graphic={this._table_graphic}
					renderCnt={this._renderCnt}
					onClosed={this._tableClosed}
					onChange={this._popupChange}
				/>
				<SheetPopup
					view={this._sheet}
					onClosed={this._offSheet}
					onSend={this._onSendSheet}
				/>

				<div className="pentool">
					<PentoolSheet
						view={this._sheetpage === 'pentool'}
						numOfStudent={this._numOfStudent_sheet}
						actions={actions}
						onBack={this._closePentool}
					/>
				</div>

				<div className="keyboard">
					<KeyboardSheet
						view={this._sheetpage === 'keyboard'}
						numOfStudent={this._numOfStudent_sheet}
						actions={actions}
						onBack={this._closeKeyboard}
					/>
				</div>

				<SendUI
					view={
						inview &&
						this._prog <= SENDPROG.SENDING &&
						!this.props.state.videoPopup &&
						this._table === '' &&
						!this._sheet &&
						this._sheetpage === ''

					}
					type={'teacher'}
					sended={false}
					originY={0}
					onSend={this._onSend}
				/>
			</div>
		);
	}
}

export default GraphicOrganizer;