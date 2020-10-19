import * as _ from 'lodash';

export interface IMsg {
	msgtype: 	'quiz_send'|'quiz_end'|'quiz_return'|
				'script_send'|'dialogue_send'|
				'roll_send'|'shadowing_send'|'dialogue_end'|
				'qna_send'|'qna_return'|'qna_end'|
				'view_clue'|'hide_clue'|
				'focusidx'|'playing'|'paused';
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
}


export interface IRollMsg extends IMsg {
	roll: 'A'|'B';
}
export interface IFocusMsg extends IMsg {
	idx: number;
}

export interface IReturn {
	num: number;
	users: string[];
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
interface ISpeaker {
	name: string; 
	image_s: string;
	image_l: string;
}
interface IScCod {
	codType: string;
	codSeq: string;
}
export interface IScript {
	readonly seq: number;
	readonly dms_speaker: string;
	readonly dms_start: number;
	readonly dms_end: number;
	readonly dms_eng: string;
	readonly dms_kor: IMultiLang;
	readonly _sort_idx: number; 
	readonly dms_seq: number;
	qnums: number[]|undefined;
	roll: 'A' | 'B' | 'C' | 'D' |'E';
	app_preview: number;
	sc_COD: IScCod[];
}

export interface IQuiz extends IInClassStudyProps {
	question: string;
	answer: number;
	audio: string;
	choice_1: string;
	choice_2: string;
	choice_3: string;

	app_question: JSX.Element;
	app_preview: number;
}
export interface ILetstalk {
	sentence: string;			
	audio: string;
	img1: string;
	img2: string;
	sample: string;
	hint: string;
}
export interface IData {
    video: string;
    video_start: number;
	speakerA: ISpeaker;
	speakerB: ISpeaker;
	speakerC: ISpeaker;
	speakerD: ISpeaker;
	speakerE: ISpeaker;
	quizs: IQuiz[];
	scripts: IScript[];
	letstalk: ILetstalk;
}

interface IRGBA {
	r: number;
	g: number;
	b: number;
	a: number;
}

function _RGBA(r: number, g: number, b: number, a: number) {
	return {r, g, b, a};
}
function _rgbaToString(rgba: IRGBA) {
	const {r, g, b, a} = rgba;
	return `rgba(${r}, ${g}, ${b}, ${a})`;
}

