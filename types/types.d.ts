
declare interface IPREVIEW_MEMBER_AI {
  BK_KEY_INCLASS: number;
  CLS_IDX: number;
  MEM_IDX: number;
  AVG_PERCENT: number;
  STD_TYPE: number;

}

declare interface ILikeSetMsg {
	id: string;
	on: boolean;
}

declare type LikeAniType = 'love'|'happy'|'normal';
declare interface ILikeSendMsg {
	from : string;
	to : string;
	like : number;
	ani : LikeAniType;
}

declare interface IGroupSelectedMsg {
	ga: string
	na: string;
}

declare interface IStarSetMsg {
	id: string;
	on: boolean;
}

declare interface IStarSendMsg {
	from : string;
	to : string;
	star_content : number;
	star_presenter : number;
}

declare const enum $SocketType {
	PAD_ONSCREEN,				// 0
	PAD_START_DIRECTION,		// 1
	PAD_LOCATION,				// 2
	PAD_END_DIRECTION,			// 3
	PAD_INIT_COMPLETE,			// 4

	TOP_TITLE_HIDE,				// 5
	TOP_TITLE_VIEW,				// 6
	TOP_TITLE_SET,				// 7
	GOTO_PREV_BOOK,				// 8
	GOTO_NEXT_BOOK,				// 9

	MSGTOPAD,					// 10
	MSGTOTEACHER,				// 11
	LIKE_SET,					// 12
	LIKE_SEND,					// 13
	GROUPING,					// 14

	GROUP_SELECTED,				// 15

	LIKE_SOUND_ON,				// 16
  LIKE_SOUND_OFF,				// 17
  
  STAR_SET, // 18
  STAR_SEND, // 19
  PAD_ONSCREEN_FIX, // 20 // 리포트(스텝1) 미제출 학생은 unmount까지 계속 ONSCREEN
}


declare const enum $ReportType {
	DEFAULT = 1,
	TEXT = 2,
	IMAGE = 3,
	AUDIO = 4,
	VIDEO = 5,
	JOIN = 6,
}

declare interface IStudent {
	id: string;
	name: string;
	thumb: string;
	avatar: string;
	nickname: string;
	inited: boolean;
	group?: 'ga'|'na';
	forAni?: number;
	displayMode: '1'|'2';      // '1':실사모드 | '2':아바타모드
}

declare interface ISocketData {
	type: $SocketType;
	data: any;
}

declare interface IMessage<T> {
	msgtype: T;
}

declare interface IForDraw {
	reset: () => void;
	undo: () => void;
	redo: () => void;
	canUndo(): boolean;
	canRedo(): boolean;
}

declare namespace domtoimage{
	function toPng(node:Element, options?: {}):Promise<string>;
	function toSvg(node:Element, options?: {}):Promise<string>;
}

declare type TypeQuizProg = ''|'quiz'|'wait-result'|'result';
declare type TypeGroupProg = ''|'initing'|'inited'|'onquiz'|'complete';

declare type QUIZ_SELECT_TYPE = ''|'all'|'studied'|'ai';
declare type TEAM_SPINDLE_MSG = 'next_quiz'|'start_quiz'|'send_point'|'force_stop'|'end_quiz';
declare type TEAM_GROUPING_MSG = 'grouping'|'pad_gana';
declare type QUIZ_RESULT_MSG = 'quiz_result';

declare interface IMsgGaNa extends IMessage<TEAM_GROUPING_MSG> {
	ga: string;
	na: string;
}

declare interface IMsgQuizIdx extends IMessage<TEAM_SPINDLE_MSG> {
	qidx: number;
	point: number;
}
declare interface IFlipMsg extends IMessage<TEAM_SPINDLE_MSG> {
	idx: number;
}
declare interface IMsgGaNaResult extends IMessage<TEAM_SPINDLE_MSG> {
	ga_point: number;
	na_point: number;
}
declare interface IQuizResultMsg extends IMessage<QUIZ_RESULT_MSG> {
	result: boolean;
	id: string;
	input: string;
	idx: number;
	stime: string;
	etime: string;
}

declare interface IUserResult {
	id: string;
	result: boolean[];
	stimes: string[];
	etimes: string[];
	inputs: string[];
	name: string;
	numOfCorrect: number;
	ga_na?: 'ga'|'na';
	grade?: number;
} 

declare interface IQusetionResult {
	qidx: number;
	numOfCorrect: number;
	name: string;
	preview: number;
}

declare interface IGaNaResult {
	qidx: number;
	point: number;
	ga_correct: number;
	na_correct: number;
	returnUsers: string[];
}


/** 팀형식 퀴즈 결과물 인터페이스 */
declare interface IQuizGroupResult {
	/** 문제 정보 array */
	readonly questions: IGaNaResult[];
	/** 학생 정보 array */
	users: IUserResult[];
	/** 팀A 포인트 */
	ga_point: number;
	/** 팀B 포인트 */
	na_point: number;
	/** 설정된 시간 */
	qtime: number;
}

/** 싱글 퀴즈에서 결과 저장 인터페이스 */
declare interface IQuizSingleResult {
	/** 문제 결과 정보 array */
	readonly questions: IQusetionResult[];
	/** 학생 결과 정보 array */
	readonly users: IUserResult[];
	/** 설정된 시간 */
	qtime: number;
}

declare interface IQuizPageProps<T> {
	view: boolean;
	on: boolean;
	idx: number;
	isTeacher: boolean;
	isGroup: boolean;
	quizProg: TypeQuizProg;
	hasPreview: boolean;
	percent: number;
	group?: 'A' | 'B';
	quiz: T;
	onItemChange?: (idx: number, input: string) => void;
	onComplete?: (idx: number, correct: boolean) => void;
	onSoundComplete: (idx: number) => void;
}

interface IStudentQuizInfo {
	qidxs: number[];
	points: number[];
	qtime: number;
}

interface IShareQuizData {
	app_idx: number;
	app_result: boolean;
}

declare type PREVIEW_EVAL = 'C01'|'C02'|'C03'|'C04'|
							'C0101'|'C0102'|'C0103'|'C0104'|
							'C0201'|'C0202'|'C0203'|
							'C0301'|'C0302'|'C0303'|'C0304'|'C0305'|
							'C0401'|'C0402'|'C0403';

declare interface IPreviewTextMsg {
	textvalue: string;
	eval: PREVIEW_EVAL;
}

declare interface IPreviewTextResult {
	divCode?: string;
	dmsSeq?: number;
	pageSeq?: number;
	percentage: number;
}

declare interface IPreviewDmsResult {
	divCode?: string;
	dmsSeq?: number;
	pageSeq?: number;
	percentage: number;
}


declare interface IPreviewDmsMsg {
	dms_seq: number;
	eval: PREVIEW_EVAL;
}


declare interface IPreviewClassMsg {
    evalCode: string;
    vsFromData: string;
	vsFromSeq: number;
}// 사전 학습을 위해 추가 2020_07_07

declare interface IPreviewMemberMsg {
    memIdx: number;
    vsFromData: string;
    vsFromSeq: number;
    evalCode: string;
}// 사전 학습을 위해 추가 2020_07_07

declare interface IPreviewResultClassMember {
    textValue: string;
    evalCode: string;
    avgPercent: number
    mttSeq: number;
}// 사전 학습을 위해 추가 2020_07_07


declare interface IInClassStudyProps {
	SC_DIV1?: string;
	SC_DIV2?: string;
	SC_DIV3?: string;
	SC_DIV4?: string;
	SC_SAVE?: boolean;
	tmq_seq?: number;
}
declare interface IInClassReport {
	std_cont_seq: number;
	studentId: string;
	ans_tf: '0'|'1';
	ans_submit: string;
	ans_starttime: string;
	ans_endtime: string;	
	sc_div1: string;
	sc_div2: string;
	sc_div3: string;
	sc_div4: string;
	files: string[]|null;
	ans_correct: string;
	tab_index: string;
}





