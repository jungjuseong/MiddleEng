import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { observable, action } from 'mobx';
import { observer } from 'mobx-react';
import * as _ from 'lodash';
import { isUndefined } from 'util';

import { ToggleBtn } from '@common/component/button';
import { App } from '../App';
import * as felsocket from '../felsocket';

const SwiperComponent = require('react-id-swiper').default;

async function _wait(time: number) {
	return new Promise<void>((resolve) => {
		setTimeout(resolve, time);
	});
}


@observer
class Student extends React.Component<IStudent> {
	@observable private _dmode: '1'|'2';
	constructor(props: IStudent) {
		super(props);
		this._dmode = props.displayMode;
	}
	public componentDidMount() {
		this._dmode = this.props.displayMode;
	}
	private _toggle = () => {
		this._dmode = this._dmode === '2' ? '1' : '2';
	}
	public render() {
		const forAni = isUndefined(this.props.forAni) ? 0 : this.props.forAni;
		console.log('Student render', forAni, this._dmode);
		return (
			<div className={'student' + (forAni > 0 ? ' on' : '')} onClick={this._toggle}>
				<img src={this._dmode === '2' ? this.props.avatar : this.props.thumb} />
				<br/>
				{this._dmode === '2' ? this.props.nickname : this.props.name}
			</div>
		);
	}
}

interface IGroupBox {
	className: string;
	view: boolean;
	students: IStudent[];
}

@observer
class GroupBox extends React.Component<IGroupBox> {
	private m_num = 0;
	private m_swiper!: Swiper;
	private _refSwiper = (el: SwiperComponent|null) => {
		if(this.m_swiper || !el) return;
		this.m_swiper = el.swiper;
	}

	public componentDidUpdate(prev: IGroupBox) {
		if(this.props.students.length !== this.m_num) {
			this.m_num = this.props.students.length;

			(async () => {
				await _wait(50);
				this.m_swiper.update();
				if(this.m_swiper.scrollbar) this.m_swiper.scrollbar.updateSize();
				this.forceUpdate();
				await _wait(50);
				if(this.m_num <= 9) this.m_swiper.slideTo(0, 0);
				else this.m_swiper.slideTo(1);
			})();
		}
		if(this.props.view !== prev.view) {
			this.m_swiper.slideTo(0, 0);
		}
	}
	public render() {
		
		return (
			<div className={this.props.className}>
				<SwiperComponent 
					ref={this._refSwiper}
					direction="vertical"
					observer={true}
					slidesPerView="auto"
					freeMode={true}
					scrollbar={{el: '.swiper-scrollbar',draggable: true, hide: false}}
				>
					<div className="student-list">{this.props.students.map((val) => (
						<Student key={val.id} {...val}/>
					))}</div>
					<div style={{height: '0px',}}/>
				</SwiperComponent>
			
			</div>
		);
	}
}

@observer
class BtnReSort extends React.Component<{view: boolean, onClick: () => void}> {
	@observable private m_down = false;
	@observable private m_on = false;
	@action private _resortDown = () => {
		if(this.m_on) return;

		this.m_down = true;
	}
	@action private _resortUp = () => {
		if(!this.m_down || this.m_on) return;
		this.m_on = true;
		this.m_down = false;
		this.props.onClick();
	}
	@action private _resortEnd = (evt: React.TransitionEvent<HTMLElement>) => {
		if(!this.m_on) return;
		this.m_on = false;
	}
	@action public componentDidUpdate(prev: {view: boolean}) {
		if(this.props.view !== prev.view) {
			this.m_down = false;
			this.m_on = false;
		}
	}
	public render() {
		const isOn = this.m_down || this.m_on;
		return (
			<div className={'resort' + (isOn ? ' on' : '')}>
				<ToggleBtn 
					className={'btn_resort' + (this.m_on ? ' rotate' : '')} 
					on={isOn} 
					onMouseDown={this._resortDown} 
					onMouseUp={this._resortUp}
					onTransitionEnd={this._resortEnd}
				/>
			</div>
		);
	}
}

interface IGroup {
	mounted: boolean;
	view: boolean;
	groupingComplete: (gas: IStudent[], nas: IStudent[]) => void;
}
@observer
export class Grouping extends React.Component<IGroup> {
	@observable private m_gas: IStudent[] = [];
	@observable private m_nas: IStudent[] = [];


	private m_resortKey = -1;
	@observable private m_resorted = false;
	@action private async _resort(key: number) {
		if(!this.props.view) return;

		const students = App.students;

		// console.log('_resort', students.length, students);

/*
		const students: IStudent[] = [
			{id: '1', name: '아무1', thumb: '/content/sample/thumb0.jpg', avatar: '/content/sample/avatar0.png', nickname: '지현1', inited: true},
			{id: '2', name: '아무2', thumb: '/content/sample/thumb1.jpg', avatar: '/content/sample/avatar1.png', nickname: '지현2', inited: true},
			{id: '3', name: '아무3', thumb: '/content/sample/thumb2.jpg', avatar: '/content/sample/avatar2.png', nickname: '지현3', inited: true},
			{id: '4', name: '아무4', thumb: '/content/sample/thumb3.jpg', avatar: '/content/sample/avatar3.png', nickname: '지현4', inited: true},
			{id: '5', name: '아무5', thumb: '/content/sample/thumb4.jpg', avatar: '/content/sample/avatar4.png', nickname: '지현5', inited: true},
			{id: '6', name: '아무6', thumb: '/content/sample/thumb5.jpg', avatar: '/content/sample/avatar5.png', nickname: '지현6', inited: true},
			{id: '7', name: '아무7', thumb: '/content/sample/thumb6.jpg', avatar: '/content/sample/avatar6.png', nickname: '지현7', inited: true},
			{id: '8', name: '아무8', thumb: '/content/sample/thumb7.jpg', avatar: '/content/sample/avatar7.png', nickname: '지현8', inited: true},
			{id: '9', name: '아무9', thumb: '/content/sample/thumb8.jpg', avatar: '/content/sample/avatar8.png', nickname: '지현9', inited: true},
			{id: '10', name: '아10', thumb: '/content/sample/thumb9.jpg', avatar: '/content/sample/avatar9.png', nickname: '지현3', inited: true},
			{id: '11', name: '아11', thumb: '/content/sample/thumb10.jpg', avatar: '/content/sample/avatar10.png', nickname: '지현4', inited: true},
			{id: '12', name: '아12', thumb: '/content/sample/thumb11.jpg', avatar: '/content/sample/avatar11.png', nickname: '지현5', inited: true},
			{id: '13', name: '아13', thumb: '/content/sample/thumb12.jpg', avatar: '/content/sample/avatar12.png', nickname: '지현6', inited: true},
			{id: '14', name: '아14', thumb: '/content/sample/thumb13.jpg', avatar: '/content/sample/avatar13.png', nickname: '지현7', inited: true},
			{id: '15', name: '아15', thumb: '/content/sample/thumb14.jpg', avatar: '/content/sample/avatar14.png', nickname: '지현8', inited: true},
			{id: '16', name: '아16', thumb: '/content/sample/thumb15.jpg', avatar: '/content/sample/avatar15.png', nickname: '지현9', inited: true},
			{id: '17', name: '아17', thumb: '/content/sample/thumb12.jpg', avatar: '/content/sample/avatar12.png', nickname: '지현6', inited: true},
			{id: '18', name: '아18', thumb: '/content/sample/thumb13.jpg', avatar: '/content/sample/avatar13.png', nickname: '지현7', inited: true},
			{id: '19', name: '아19', thumb: '/content/sample/thumb14.jpg', avatar: '/content/sample/avatar14.png', nickname: '지현8', inited: true},
			{id: '20', name: '아20', thumb: '/content/sample/thumb15.jpg', avatar: '/content/sample/avatar15.png', nickname: '지현9', inited: true},

			{id: '21', name: '아무1', thumb: '/content/sample/thumb0.jpg', avatar: '/content/sample/avatar0.png', nickname: '지현1', inited: true},
			{id: '22', name: '아무2', thumb: '/content/sample/thumb1.jpg', avatar: '/content/sample/avatar1.png', nickname: '지현2', inited: true},
			{id: '23', name: '아무3', thumb: '/content/sample/thumb2.jpg', avatar: '/content/sample/avatar2.png', nickname: '지현3', inited: true},
			{id: '24', name: '아무4', thumb: '/content/sample/thumb3.jpg', avatar: '/content/sample/avatar3.png', nickname: '지현4', inited: true},
			{id: '25', name: '아무5', thumb: '/content/sample/thumb4.jpg', avatar: '/content/sample/avatar4.png', nickname: '지현5', inited: true},
			{id: '26', name: '아무6', thumb: '/content/sample/thumb5.jpg', avatar: '/content/sample/avatar5.png', nickname: '지현6', inited: true},
			{id: '27', name: '아무7', thumb: '/content/sample/thumb6.jpg', avatar: '/content/sample/avatar6.png', nickname: '지현7', inited: true},
			{id: '28', name: '아무8', thumb: '/content/sample/thumb7.jpg', avatar: '/content/sample/avatar7.png', nickname: '지현8', inited: true},
			{id: '29', name: '아무9', thumb: '/content/sample/thumb8.jpg', avatar: '/content/sample/avatar8.png', nickname: '지현9', inited: true},
			{id: '30', name: '아10', thumb: '/content/sample/thumb9.jpg', avatar: '/content/sample/avatar9.png', nickname: '지현3', inited: true},
			{id: '31', name: '아11', thumb: '/content/sample/thumb10.jpg', avatar: '/content/sample/avatar10.png', nickname: '지현4', inited: true},
			{id: '32', name: '아12', thumb: '/content/sample/thumb11.jpg', avatar: '/content/sample/avatar11.png', nickname: '지현5', inited: true},
			{id: '33', name: '아13', thumb: '/content/sample/thumb12.jpg', avatar: '/content/sample/avatar12.png', nickname: '지현6', inited: true},
			{id: '34', name: '아14', thumb: '/content/sample/thumb13.jpg', avatar: '/content/sample/avatar13.png', nickname: '지현7', inited: true},
			{id: '35', name: '아15', thumb: '/content/sample/thumb14.jpg', avatar: '/content/sample/avatar14.png', nickname: '지현8', inited: true},
			{id: '36', name: '아16', thumb: '/content/sample/thumb15.jpg', avatar: '/content/sample/avatar15.png', nickname: '지현9', inited: true},
			{id: '37', name: '아17', thumb: '/content/sample/thumb12.jpg', avatar: '/content/sample/avatar12.png', nickname: '지현6', inited: true},
			{id: '38', name: '아18', thumb: '/content/sample/thumb13.jpg', avatar: '/content/sample/avatar13.png', nickname: '지현7', inited: true},
			{id: '39', name: '아19', thumb: '/content/sample/thumb14.jpg', avatar: '/content/sample/avatar14.png', nickname: '지현8', inited: true},
			{id: '40', name: '아20', thumb: '/content/sample/thumb15.jpg', avatar: '/content/sample/avatar15.png', nickname: '지현9', inited: true},

		];
*/
		while(this.m_gas.length > 0) this.m_gas.pop();
		while(this.m_nas.length > 0) this.m_nas.pop();

		const studentLen = students.length;
		if(studentLen === 0) return;

		
		let ga_num: number;
		if(studentLen % 2 === 0) ga_num = studentLen / 2;
		else if(Math.random() < 0.5) ga_num = Math.floor(studentLen / 2);
		else ga_num = Math.ceil(studentLen / 2);
		
		const gaIdxs: number[] = [];
		while(gaIdxs.length < ga_num) {
			const idx = Math.floor(Math.random() * studentLen);
			if( gaIdxs.indexOf(idx) < 0) gaIdxs.push(idx);
		}
		const gas: IStudent[] = [];
		const nas: IStudent[] = [];

		students.forEach((val, idx) => {
			if(gaIdxs.indexOf(idx) >= 0) {
				val.group = 'ga';
				val.forAni = 0;
				gas.push({...val});
			} else {
				val.group = 'na';
				val.forAni = 0;
				nas.push({...val});
			}
		});

		felsocket.sendPAD($SocketType.GROUPING, null);

		for(let i = 0; i < gas.length || i < nas.length; i++) {
			await _wait(400);
			if(!this.props.mounted || !this.props.view || key !== this.m_resortKey) return;

			const msggana: IGroupSelectedMsg = {
				ga: '',
				na: '',
			};
			App.pub_playStudentBubble();
			// PVETStore.playStudentBubble(); TO DO
			if(i < gas.length) {
				this.m_gas[i] = gas[i];
				msggana.ga = this.m_gas[i].id;
			}
			if(i < nas.length) {
				this.m_nas[i] = nas[i];
				msggana.na = this.m_nas[i].id;
			}


			// console.log(msggana);
			felsocket.sendPAD($SocketType.GROUP_SELECTED, msggana);

			await _wait(100);
			if(this.m_gas[i]) this.m_gas[i].forAni = 1;
			if(this.m_nas[i]) this.m_nas[i].forAni = 1;
		}
		this.m_resorted = true;
	}
	private _resortClick = () => {
		this.m_resorted = false;
		App.pub_playBtnTab();
		App.pub_reloadStudents(() => {
			this.m_resortKey++;
			this._resort(this.m_resortKey);
		});
	}
	private _startClick = () => {
		if(!this.m_resorted) return;
		App.pub_playBtnTab();
		this.props.groupingComplete(this.m_gas, this.m_nas);
	}

	public componentDidUpdate(prev: IGroup) {
		if(this.props.mounted !== prev.mounted) {
			while(this.m_gas.length > 0) this.m_gas.pop();
			while(this.m_nas.length > 0) this.m_nas.pop();
		}
		if(this.props.view && !prev.view) {
			/*
			const store = (Common.store as PVETStore);
			store.navistate.setView(true);
			store.navistate.set(false, false);

			this.m_resorted = false;
			App.pub_reloadStudents(() => {
				if(!this.props.view) return;
				this.m_resortKey++;
				this._resort(this.m_resortKey);
			});
			*/
		}
	}
	public render() {
		const { view, } = this.props; 
		const style: React.CSSProperties = {};
		
		if(!view) {
			style.zIndex = -1;
			style.opacity = 0;
			style.pointerEvents = 'none';
		}
		return (
			<div className="grouping-box" style={style} >
				<div className="grouping" >
					<BtnReSort view={view} onClick={this._resortClick}/>
					<GroupBox className="groupbox ga" view={view} students={this.m_gas}/>
					<GroupBox className="groupbox na" view={view} students={this.m_nas}/>
					<ToggleBtn className="btn_start" disabled={!this.m_resorted} onClick={this._startClick}/>
				</div>
			</div>
		);
	}
}