import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { observable, action, } from 'mobx';
import { observer } from 'mobx-react';
import * as _ from 'lodash';

import { App } from '../App';

export interface IQuizPage extends IQuizPageProps<IWordData> {
}

export type TypeQuiz = ''|'sound'|'meaning'|'spelling'|'usage';
export type TypePuzzles = string[];

type MYMSGTYPE =  'spelling'|'spelling_return'|'speak_audio'|'speak_video'|'speaking_audio'|'speaking_video'|
								'recorded_return'|'quiz'|
								QUIZ_RESULT_MSG|TEAM_GROUPING_MSG|TEAM_SPINDLE_MSG;

export interface IPzSrc {
	idx: number;
	char: string;
	disabled: boolean;
	isTeacher: boolean;
	quizProg: TypeQuizProg;
	onMountSrc: (src: any, idx: number) => void;
	onDown: (src: any) => void;
}

export interface IPzTgt {
	idx: number;
	char: string;
	isTeacher: boolean;
	quizProg: TypeQuizProg;
	onMountTgt: (tgt: any, idx: number) => void;
}

export interface IMsg extends IMessage<MYMSGTYPE> {

}

export interface IDrillMsg extends IMsg {
	word_idx: string;
}

export interface IQuizMsg extends IMsg {
	qidxs: number[];
	qtime: number;
	qtype: TypeQuiz;
	isGroup: boolean;
}

export interface IRecordedMsg extends IMsg {
	id: string;
	url: string;
	stime: number;
	etime: number;
	word_idx: string;
}

export interface ISpellingReturnMsg extends IMsg {
	id: string;
	isCorrect: boolean;
	stime: number;
	etime: number;
	word_idx: string;
	user_input: string;
}

interface IQuizSound extends IInClassStudyProps {
	idx: string;
	entry: string;
	correct: number;
	audio: string;
	choice1: string;
	choice2: string;
	choice3: string;
	choice4: string;	
}
interface IQuizMeaning extends IInClassStudyProps {
	idx: string;
	entry: string;
	correct: number;
	audio: string;
	choice1: string;
	choice2: string;
	choice3: string;	
}
interface IQuizUsage extends IInClassStudyProps {
	idx: string;
	entry: string;
	correct: number;
	image: string;
	sentence: string;
	choice1: string;
	choice2: string;
	choice3: string;
}

interface IQuizSpelling extends IInClassStudyProps {
	idx: string;
	entry: string;
}
interface ITmqCOD {
	codType: string;
	codSeq: number;
}
export interface IWordData extends IShareQuizData, IInClassStudyProps {
	idx: string;
	entry: string;
	pumsa: string;
	meaning: string;
	image: string;
	thumbnail: string;
	image_pad: string;
	audio: string;
	meaning_eng: string;
	meaning_audio: string;
	sentence: string;
	sentence_audio: string;
	video: string;
	sound_start: number;
	sound_end: number;
	meaning_start: number;
	meaning_end: number;
	sentence_start: number;
	sentence_end: number;
	usage_video: string;
	usage_start: number;
	usage_end: number;
	usage_script: string;
	topic: boolean;
	
	app_checked: boolean;
	app_studied: boolean;
	app_sound: number;
	app_meaning: number;
	app_spelling: number;
	app_sentence: number;

	// for pre-view result class
	tmq_COD: ITmqCOD;
	avgPercent: number;// 한 단어에 대한 반 전체 평균

	quiz_sound: IQuizSound;
	quiz_meaning: IQuizMeaning;
	quiz_usage: IQuizUsage;
	quiz_spelling?: IQuizSpelling;
}

interface IPage1Data {
	words: IWordData[];
	quiz_sounds: IQuizSound[];
	quiz_meanings: IQuizMeaning[];
	quiz_usages: IQuizUsage[];
	quiz_spellings?: IQuizSpelling[];
}
interface IPage2Data {

}
export interface IData {
	page1: IPage1Data;
	page2: IPage2Data;
}

export function initData(data: IData) {
	const words = data.page1.words;
	const quiz_sounds = data.page1.quiz_sounds;
	const quiz_meanings = data.page1.quiz_meanings;
	const quiz_usages = data.page1.quiz_usages;

	const quiz_spellings = data.page1.quiz_spellings;

	words.forEach( (word) => {
		quiz_sounds.some( (sound) => {
			if(sound.idx === word.idx) {
				word.quiz_sound = sound;
				return true;
			} else return false;
		});
		quiz_meanings.some( (meaning) => {
			if(meaning.idx === word.idx) {
				word.quiz_meaning = meaning;
				return true;
			} else return false;
		});
		quiz_usages.some( (sentence) => {
			if(sentence.idx === word.idx) {
				word.quiz_usage = sentence;
				return true;
			} else return false;
		});

		if(quiz_spellings) {
			quiz_spellings.some( (sentence) => {
				if(sentence.idx === word.idx) {
					word.quiz_spelling = sentence;
					return true;
				} else return false;
			});
		}
	});
	return data;
}

/*
export function playSpinddle() {
	const audio = document.getElementById('spindle') as HTMLMediaElement;
	if (audio) {
		audio.currentTime = 0;
		audio.play();
	}
}
export function playGroupPoint() {
	const audio = document.getElementById('group_point') as HTMLMediaElement;
	if (audio) {
		audio.currentTime = 0;
		audio.play();
	}
}
export function playGroupWin() {
	const audio = document.getElementById('group_win') as HTMLMediaElement;
	if (audio) {
		audio.currentTime = 0;
		audio.play();
	}
}
export function playQpointPopup() {
	const audio = document.getElementById('qpoint_popup') as HTMLMediaElement;
	if (audio) {
		audio.currentTime = 0;
		audio.play();
	}
}


export function playAllZero() {
	const audio = document.getElementById('all_zero') as HTMLMediaElement;
	if (audio) {
		audio.currentTime = 0;
		audio.play();
	}
}
*/

