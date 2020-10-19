import * as React from 'react';
import * as ReactDOM from 'react-dom';

import { observable, action } from 'mobx';
import { observer } from 'mobx-react';

import * as _ from 'lodash';

import { App } from '../App';
import * as felsocket from '../felsocket';

import { ToggleBtn } from '@common/component/button';
import { isUndefined } from 'util';

import * as kutil from '@common/util/kutil';
const SwiperComponent = require('react-id-swiper').default;



function _init() {
	let audio = document.getElementById('student_bubble') as HTMLMediaElement;
	if(!audio) {
		audio = document.createElement('audio');
		audio.id = 'student_bubble';
		audio.preload = 'true';
		audio.src = `${_digenglish_lib_}mp3/student_bubble.mp3`;
		document.body.appendChild(audio);
	}
}

function _playStudentBubble() {
	const audio = document.getElementById('student_bubble') as HTMLMediaElement;
	if (audio) {
		audio.currentTime = 0;
		audio.play();
	}
}

interface IGroup {
	view: boolean;
	gas: IStudent[];
	nas: IStudent[];
	onStart: () => void;
	onBack: () => void;
}

@observer
class BtnReSort extends React.Component<IGroup&{onClick: () => void}> {
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
	@action public componentDidUpdate(prev: IGroup) {
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

interface IStudentThumb extends IStudent {
	idx: number;
	onStart: (idx: number) => void;
}
@observer
class Student extends React.Component<IStudentThumb> {
	@observable private _dmode: '1'|'2';
	constructor(props: IStudentThumb) {
		super(props);
		this._dmode = props.displayMode;
	}
	public componentDidUpdate(prev: IStudentThumb) {
		// console.log('componentDidUpdate', this.props.forAni, prev.forAni);
		if(this.props.forAni !== prev.forAni) {
			const forAni = isUndefined(this.props.forAni) ? 0 : this.props.forAni;

			if(forAni > 0) this.props.onStart(this.props.idx);
		}
	}
	public componentDidMount() {
		this._dmode = this.props.displayMode;
	}
	private _toggle = () => {
		this._dmode = this._dmode === '2' ? '1' : '2';
	}

	public render() {
		const forAni = isUndefined(this.props.forAni) ? 0 : this.props.forAni;
		// console.log('Student render', forAni);
		return (
			<div className={'student' + (forAni > 0 ? ' on' : '')} onClick={this._toggle}>
				<img src={this._dmode === '2' ? this.props.avatar : this.props.thumb} draggable={false}/>
				<br/>
				{this._dmode === '2' ? this.props.nickname : this.props.name}
			</div>
		);
	}




}

interface IGroupBox extends IGroup {
	className: string;
	students: IStudent[];
}
@observer
class GroupBox extends React.Component<IGroupBox> {
	private _option: SwiperOptions = {
		direction: 'vertical',
		observer: true,
		freeMode: true,
		slidesPerView: 'auto',
		scrollbar: {el: '.swiper-scrollbar',draggable: true, hide: false},
	};
	private _swiper: Swiper|null = null;

	@observable private _noSwiping = true;

	private _ref = (el: SwiperComponent) => {
		if(this._swiper || !el) return;
		this._swiper = el.swiper;
	}

	public componentDidUpdate(prev: IGroupBox) {
		if(this.props.view) {
			let bUpdate = false;

			if(!prev.view) {
				this._noSwiping = true;
				bUpdate = true;
			}
			
			if(this._swiper && bUpdate) {
				if(this._swiper.scrollbar) this._swiper.scrollbar.updateSize();
				this._swiper.update();
			}
		} else this._noSwiping = true;
		
	}
	public _onStart = (idx: number) => {
		this._noSwiping = idx <= 8;
		if(this._swiper) {
			if(this._swiper.scrollbar) this._swiper.scrollbar.updateSize();
			this._swiper.update();
			this.forceUpdate();
			if(idx >= 8 ) this._swiper.slideNext();
		}
	}
	public render() {
		let jsx;
		if(this.props.students.length > 0) {
			jsx = this.props.students.map((val, idx) => {
				// console.log('GroupBox.render', val, val.forAni);
				return <Student key={val.id} idx={idx} onStart={this._onStart} {...val}/>;
			});
		} else jsx = '';

		return (
			<div className={this.props.className + (this._noSwiping ? ' no-swiping' : '')}>
				<SwiperComponent ref={this._ref} {...this._option}>
					<div className={'student-list' + (this._noSwiping ? ' swiper-no-swiping' : '')}>{jsx}</div>
				</SwiperComponent>
			
			</div>
		);
	}
}

@observer
class TeamGrouping extends React.Component<IGroup> {
	private m_resortKey = -1;
	@observable private m_resorted = false;

	public constructor(props: IGroup) {
		super(props);
		_init();
	}

	@action private async _resort(key: number) {
		if(!this.props.view) return;

		// const state = this.props.state;
		// const students = store.students;
		// console.log('_resort', students.length, students);

		const students = App.students;

		while(this.props.gas.length > 0) this.props.gas.pop();
		while(this.props.nas.length > 0) this.props.nas.pop();

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
		// let gas: IStudent[] = [];
		// let nas: IStudent[] = [];

		students.forEach((val, idx) => {
			if(gaIdxs.indexOf(idx) >= 0) {
				val.group = 'ga';
				val.forAni = 0;
				this.props.gas.push({...val});
			} else {
				val.group = 'na';
				val.forAni = 0;
				this.props.nas.push({...val});
			}
		});

		// console.log(group.gas, group.nas);
		const msg: IMessage<TEAM_GROUPING_MSG> = {
			msgtype: 'grouping'
		};
		felsocket.sendPAD($SocketType.MSGTOPAD, msg);

		for(let i = 0; i < this.props.gas.length || i < this.props.nas.length; i++) {
			await kutil.wait(500);
			if(! this.props.view || key !== this.m_resortKey) return;

			const msggana: IMsgGaNa = {
				msgtype: 'pad_gana',
				ga: '',
				na: '',
			};
			_playStudentBubble();
			if(i < this.props.gas.length) {
				this.props.gas[i].forAni = 1;
				msggana.ga = this.props.gas[i].id;
			}
			if(i < this.props.nas.length) {
				this.props.nas[i].forAni = 1;
				msggana.na = this.props.nas[i].id;
			}
			// console.log(msggana);
			felsocket.sendPAD($SocketType.MSGTOPAD, msggana);
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

	private _onStart = () => {
		if(!this.m_resorted) return;
		this.props.onStart();
	}

	public componentDidUpdate(prev: IGroup) {
		if(this.props.view && !prev.view) {
			this.m_resorted = false;
			App.pub_reloadStudents(() => {
				if(!this.props.view) return;
				this.m_resortKey++;
				this._resort(this.m_resortKey);
			});
		}
	}

	public render() {

		return (
			<>
				<BtnReSort {...this.props} onClick={this._resortClick}/>
				<GroupBox className="groupbox ga" {...this.props} students={this.props.gas}/>
				<GroupBox className="groupbox na" {...this.props} students={this.props.nas}/>
				<ToggleBtn className="btn_start" disabled={!this.m_resorted} onClick={this._onStart}/>
				<ToggleBtn className="btn_back"  onClick={this.props.onBack}/>
			</>
		);
	}
}

export default TeamGrouping;