import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { observable, action, } from 'mobx';
import { observer } from 'mobx-react';
import * as _ from 'lodash';

import { App } from '../App';


import * as butil from '@common/component/butil';

export type COLOR = 'pink'|'green'|'orange'|'purple';
export const COLORS: COLOR[]  = ['pink', 'green', 'orange', 'purple'];

export type SHEETPAGE = ''|'pentool'|'keyboard';
export type TABLESIZE = '' |'purple'|'green';

export const enum VisualType {
	TYPE_1 = 1,
    TYPE_2,
    TYPE_3,
    TYPE_4,
	TYPE_5,
	TYPE_6,
	TYPE_7,
}
export const enum WarmupType {
	IMAGE = 1,
	VIDEO,
}

export const TYPE_COM_HEADERS = [
	'#A677DC', '#1CC1AD', '#4f7ad1'
];

export const TYPE3_HEADERS = [
	'#b07ae1', '#1cc9af', '#4f7ad1', '#4f7ad1'
];

export interface IMsg {
	msgtype: 'passage_send'|'readaloud_send'|'shadowing_send'|'qna_send'|'qna_return'
			|'focusidx'|'playing'|'paused'|'dialogue_end'|'view_trans'|'view_yourturn'
			|'question_send'|'question_end'|'question_return'
			|'warmup_send'|'warmup_return'
			|'graphic_send'|'graphic_end'|'graphic_return'|'sheet_return'
			|'keyboard_send'|'keyboard_end'
			|'pentool_send'|'pentool_end'
			|'summary_send'|'summary_end'|'summary_return'
			|'v_readaloud_send'|'v_shadowing_send'|'v_dialogue_end'
			|'v_checkup_send'|'v_checkup_end'|'v_checkup_return';
}

export interface IMsgForIdx extends IMsg {
	idx: number;
}

export interface IWarmupReturn {
	id: string;
	color: COLOR;
	thumb: string;
	avatar: string;
	displayMode: '1'|'2';
    msg: string;
}

export interface IWarmupReturnMsg extends IMsg {
	id: string;
	color: COLOR;
	msg: string;
    stime: number;
	etime: number;
}

export interface IQuizReturn {
	answer: number;
	stime: number;
	etime: number;
}

export interface IQuizReturnMsg extends IMsg {
	id: string;
    returns: IQuizReturn[];
}

export interface IQNAMsg extends IMsg {
	id: string;
	returns: number[];
    stime: number;
    etime: number;
    seq: number;
}
export interface IGraphReturn {
	answer: number[];
    correct: boolean;
	stime: number;
	etime: number;
}
export interface IGraphMsg extends IMsg {
	id: string;
    returns: IGraphReturn[];
}
export interface IGraphSheetMsg extends IMsg {
	id: string;
    type: SHEETPAGE;
    stime: number;
    etime: number;
    input: string;
}

export interface IQnaReturn {
	num: number;
	users: string[];
}

interface IMultiLang {
	ko: string;
	ja: string; 
	'zh-Hans': string;
	'zh-Hant': string;
	vi: string;
	id: string;
	es: string;
}

export interface IScript {
	seq: number;
	audio: string;
	dms_speaker: string;
	question_num: number;
	checkup_num: number;
	passage_page: number;
	dms_start: number;
	dms_end: number;
	audio_start: number;
	audio_end: number;	
	dms_eng: string;
	dms_passage: string;
	dms_dict1: string;
	dms_kor: IMultiLang;
	_sort_idx: number; 
	dms_seq: number;
}

export interface IScriptWarmup {
	dms_start: number;
	dms_end: number;
	dms_eng: string;
	dms_kor: IMultiLang;
	dms_seq: number;
}

export interface IWarmup {
	seq: number;
	speaker: string;
	audio: string;	// 추가
	question: string;
	image: string;
}

export interface IPassage {
	page: number;
	start: number;
	end: number;
	image: string;
}
export interface IQuestion extends IInClassStudyProps {
	seq: number;
	question: string;
	audio: string;
	answer: number;
	hint: string;
	choice_1: string;
	choice_2: string;
	choice_3: string;
	choice_4: string;
}

export interface ICheckup extends IInClassStudyProps {
	seq: number;
	question: string;
	answer: number;
	choice_1: string;
	choice_2: string;
}

export interface IDropDown {
	answer: number;
	correct: string;
	choices: string[];
	inputed: string;
}

export interface IGraphicOrganizer extends IInClassStudyProps {
	seq: number;
	title: string;
	question: string;
	answer: number;
	choice_1: string;
	choice_2: string;
	choice_3: string;
	choice_4: string;

	answer2: number;
	choice2_1: string;
	choice2_2: string;
	choice2_3: string;
	choice2_4: string;

	answer3: number;
	choice3_1: string;
	choice3_2: string;
	choice3_3: string;
	choice3_4: string;

	answer4: number;
	choice4_1: string;
	choice4_2: string;
	choice4_3: string;
	choice4_4: string;

	app_drops: IDropDown[];
}

export interface ISummarizing extends IInClassStudyProps {
	seq: number;
	image: string;
	question: string;
	script_seq: number;
	answer: number;
	choice_1: string;
	choice_2: string;
	choice_3: string;
}

export interface IScriptSummarizing {
	seq: number;
	summary_seq: number;
	audio_start: number;
	audio_end: number;
	dms_eng: string;
}

export interface ILetstalk {
	sentence: string;			
	audio: string;
	img1: string;
	img2: string;
	sample: string;
	hint: string;
}

export interface IStorybook {
	seq: number;
	image: string;
}

export interface IData {
    video: string;
    video_start: number;
	audio: string;
	visualizing_type: VisualType;
	warmup_type: WarmupType;
    warmup_video: string;
    warmup_video_start: number;
	summary_audio: string;
	scripts: IScript[];
	warmup: IWarmup[];
	warmup_scripts: IScriptWarmup[];
	passage: IPassage[];
	question: IQuestion[];
	checkup: ICheckup[];
	graphic: IGraphicOrganizer[];
	summarizing: ISummarizing[];
	summarizing_scripts: IScriptSummarizing[];
	letstalk: ILetstalk;
	storybook: IStorybook[];

	app_graphic_title: string;
}

function _getDrops(answer: number, c1: string, c2: string, c3: string, c4: string) {
	if(!answer || answer <= 0 || answer > 4) return;
	const ret: IDropDown = {
		answer,
		correct: '',
		choices: [],
		inputed: '',
	};

	if(answer === 1) ret.correct = c1;
	else if(answer === 2) ret.correct = c2;
	else if(answer === 3) ret.correct = c3;
	else if(answer === 4) ret.correct = c4;

	if(!ret.correct || ret.correct === '') return null;

	if(c1 && c1 !== '') ret.choices[0] = c1;
	else return null;

	if(c2 && c2 !== '') ret.choices[1] = c2;
	else return null;

	if(c3 && c3 !== '') ret.choices[2] = c3;
	else return ret;

	if(c4 && c4 !== '') ret.choices[3] = c4;



	return ret;
}
export function initData(data: IData) {
	data.app_graphic_title = data.graphic[0].title;
	data.graphic.shift();

	if(data.visualizing_type === VisualType.TYPE_1) {
		while(data.graphic.length > 4) data.graphic.pop();
	} else if(data.visualizing_type === VisualType.TYPE_4 || data.visualizing_type === VisualType.TYPE_7) {
		while(data.graphic.length > 2) data.graphic.pop();
	} else {
		while(data.graphic.length > 3) data.graphic.pop();
	}

	for(let i = 0; i < data.graphic.length; i++) {
		const grap = data.graphic[i];

		grap.app_drops = [];

		let drop = _getDrops(grap.answer, grap.choice_1, grap.choice_2, grap.choice_3, grap.choice_4);
		if(drop) grap.app_drops[0] = drop;
		else continue;

		drop = _getDrops(grap.answer2, grap.choice2_1, grap.choice2_2, grap.choice2_3, grap.choice2_4);
		if(drop) grap.app_drops[1] = drop;
		else continue;

		drop = _getDrops(grap.answer3, grap.choice3_1, grap.choice3_2, grap.choice3_3, grap.choice3_4);
		if(drop) grap.app_drops[2] = drop;
		else continue;

		drop = _getDrops(grap.answer4, grap.choice4_1, grap.choice4_2, grap.choice4_3, grap.choice4_4);
		if(drop) grap.app_drops[3] = drop;
		else continue;
	}

	return data;
}


interface IRGBA {
	r: number;
	g: number;
	b: number;
	a: number;
}

/*
const _shadowX = 0;
const _shadowY = 6;
const _shadowBlur = 2;
const _shadowColor = _RGBA(0, 0, 0, 0.2);
*/

const _pink = _RGBA(206, 116, 225, 1);
const _green = _RGBA(34,205,172, 1);
const _orange = _RGBA(255, 186, 0, 1);
const _purple = _RGBA(116,113,236, 1);

function _RGBA(r: number, g: number, b: number, a: number) {
	return {r, g, b, a};
}
function _rgbaToString(rgba: IRGBA) {
	const {r, g, b, a} = rgba;
	return `rgba(${r}, ${g}, ${b}, ${a})`;
}

export function drawBalloon(
	ctx: CanvasRenderingContext2D, 
	x: number, 
	y: number, 
	w: number, 
	h: number, 
	px: number,
	py: number, 
	r: number,
	color: COLOR,
	shadowX?: number,
	shadowY?: number,
	shadowBlur?: number,
	shadowColor?: IRGBA,
) {
	let vgap;
	if(px < x) vgap = (x - px) * 1.5;
	else vgap = (px - (x + w)) * 1.5;
	if(!shadowX) shadowX = 0;
	if(!shadowY) shadowY = 5;
	if(!shadowBlur) shadowBlur = 2;

	if(!shadowColor) shadowColor = _RGBA(0, 0, 0, 0.2);


	const bShadow = ((
			shadowX > 0 || shadowX < 0 || 
			shadowY > 0 || shadowY < 0 || 
			shadowBlur > 0
		) && shadowColor.a > 0);

	let bgColor;
	if(color === 'green') bgColor = _green;
	else if(color === 'orange') bgColor = _orange;
	else if(color === 'purple') bgColor = _purple;
	else bgColor = _pink;

	bgColor.a = 1;
	ctx.lineCap = 'butt';
	ctx.lineJoin = 'miter';
	ctx.strokeStyle = 'transparent';
	ctx.fillStyle = _rgbaToString(bgColor);

	const gradient_BG = ctx.createLinearGradient(0, 0, 0, h);
	gradient_BG.addColorStop(0, 'rgba(255, 255, 255, 1)');
	gradient_BG.addColorStop(1, 'rgba(255, 255, 255, 0)');

	const gradient = ctx.createLinearGradient(0, 0, 0, h);
	bgColor.a = 0.4;
	gradient.addColorStop(0, _rgbaToString(bgColor));
	bgColor.a = 1;
	gradient.addColorStop(1, _rgbaToString(bgColor));


	ctx.beginPath();
	/* 우측 하단 라운드 */
	ctx.moveTo(x + w, y + h - r);
	if(r > 0) ctx.arc(x + w - r, y + h - r, r, 0, Math.PI / 2);
	
	/* 하단 선, 좌측 하단 라운드 */
	ctx.lineTo(x + r, y + h);
	if (r > 0) ctx.arc(x + r, y + h - r, r, Math.PI / 2, Math.PI);

	/* 좌측 선(꼭지점), 좌측 상단 라운드 */
	if(px < x) {
		ctx.lineTo(x, py + vgap / 2);
		ctx.lineTo(px, py);
		ctx.lineTo(x, py - vgap / 2);
	}
	ctx.lineTo(x, y + r);

	
	if (r > 0) ctx.arc(x + r, y + r, r, Math.PI , 3 * Math.PI / 2);

	/* 상단 선, 우측 상단 라운드 */
	ctx.lineTo(x + w - r, y);
	if (r > 0) ctx.arc(x + w - r, y + r, r, 3 * Math.PI / 2 , 2 * Math.PI);

	if(px > x) {
		ctx.lineTo(x + w, py - vgap / 2);
		ctx.lineTo(px, py);
		ctx.lineTo(x + w, py + vgap / 2);
		ctx.closePath();
	}
	ctx.closePath();
	if (bShadow) {
		ctx.shadowColor = _rgbaToString(shadowColor);
		ctx.shadowBlur = shadowBlur;
		ctx.shadowOffsetX = shadowX;
		ctx.shadowOffsetY = shadowY;
		ctx.fill();

		ctx.globalCompositeOperation = 'destination-out';
		ctx.shadowColor = 'rgba(0, 0, 0, 0)';
		ctx.shadowBlur = 0;
		ctx.shadowOffsetX = 0;
		ctx.shadowOffsetY = 0;
		ctx.fill();

		ctx.globalCompositeOperation = 'source-over';
		ctx.fillStyle = gradient_BG;
		ctx.fill();

		ctx.fillStyle = gradient;
		ctx.fill();
	} else {
		ctx.globalCompositeOperation = 'source-over';
		ctx.fillStyle = gradient_BG;
		ctx.fill();
		ctx.fillStyle = gradient;
		ctx.fill();		
	}
	ctx.globalCompositeOperation = 'source-over';
}