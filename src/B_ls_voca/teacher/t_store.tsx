import * as React from 'react';
import * as ReactDOM from 'react-dom';
import * as _ from 'lodash';
import { observable, action } from 'mobx';
import { App, IMain } from '../../App';
import * as felsocket from '../../felsocket';
import * as kutil from '@common/util/kutil';
import * as StrUtil from '@common/util/StrUtil';
import * as common from '../common';
import { TeacherContextBase, VIEWDIV, IStateBase, IActionsBase } from '../../share/tcontext';

/*
			this.state.numOfStudent = 0;
			this.state.retCnt = 0;
*/

export type TProg = 'direction'|'list'|'quiz-select'|'grouping'|'timer'|'board'|'quiz';

/** 싱글 퀴즈에서 결과 저장 인터페이스 */
interface ISingleResult extends IQuizSingleResult {
	qtype: common.TypeQuiz;
}


/** 1View 사전학습 데이터 관련 인터페이스 */
interface IValArr {
	avg: number;
	cnt: number;
	sum: number;
	txt: string;
}


/**
 * 싱글 결과물을 복제
 * @param {ISingleResult} obj - 복제될 소스
 * @return {ISingleResult} - 복제 결과물
 */
function _cloneSingleResult(obj: ISingleResult) {
	const ret: ISingleResult = {
		questions: [],
		users: [],
		qtime: 0,
		qtype: '',
	};
	const {questions, users} = obj;

	questions.forEach((val, idx) => {
		ret.questions[idx] = {...val};
	});
	users.forEach((val, idx) => {
		ret.users[idx] = {...val};
	});
	ret.qtime = obj.qtime;
	ret.qtype = obj.qtype;
	return ret;
}
/** 팀형식 퀴즈 결과물 인터페이스 */
interface IGroupResult extends IQuizGroupResult {
	/** 설정된 문제 형식 */
	qtype: common.TypeQuiz;
}


/**
 * 팀 결과물을 복제
 * @param {IGroupResult} obj - 복제될 소스
 * @return {IGroupResult} - 복제 결과물
 */
function _cloneGroupResult(obj: IGroupResult) {
	const ret: IGroupResult = {
		ga_point: obj.ga_point,
		na_point: obj.na_point,
		questions: [],
		users: [],
		qtime: 0,
		qtype: '',
	};
	const {questions, users} = obj;
	
	questions.forEach((val, idx) => {
		ret.questions[idx] = {...val};
	});
	users.forEach((val, idx) => {
		ret.users[idx] = {...val};
	});
	ret.qtime = obj.qtime;
	ret.qtype = obj.qtype;
	return ret;
}

/** 글로벌 상태 */
interface IStateCtx extends IStateBase {
	/** 현재 상태 
	 * 'direction' - 간지 페이지
	 * 'list' - 어휘 리스트 페이지
	 * 'quiz-select' - 퀴즈 형식및 싱글/팀 선택
	 * 'grouping' - 팀 퀴즈에서 학생 분류 
	 * 'timer' - 문제수/시간 설정
	 * 'board' - 팀 퀴즈에서 룰렛
	 * 'quiz' - 문제및 결과
	*/ 
	prog: TProg;
	/** 퀴즈 상태
	 * 'quiz' - 퀴즈 (사운드 재생포함)
	 * 'wait-result' - 타이머 종료시 학생들 결과 return을 기다리고 있는 상태
	 * 'result'	- 결과 표시 
	*/
	quizProg: TypeQuizProg;
	/** 퀴즈 형식  */
	qtype: common.TypeQuiz;
	/** 퀴즈 팀/싱글 여부 */
	isGroup: boolean;
	/** 사전 학습 결과가 있는지 여부 */
	hasPreview: boolean;
	/** 학습 speak에서 오디오 녹음 상태 */
	speak_audio: boolean;
	/** 학습 speak에서 비디오 녹음 상태 */
	speak_video: boolean;

	/** drill popup speaking에서 오디오 녹음 상태 */
	speaking_audio: boolean;
	/** drill popup speaking에서 비디오 녹음 상태 */
	speaking_video: boolean;

	/** 팀 A 학생들 */
	gas: IStudent[];
	/** 팀 B 학생들 */
	nas: IStudent[];
	/** 퀴즈에서 학생들 return 수, 한 문제 시작시 리셋  */
    numOfReturn: number;
    
    returnUsers: string[];
}
/** 글로벌 액션 */
interface IActionsCtx extends IActionsBase {
	/** @returns {common.IWordData[]} 전체 어휘 array  */
	getWords: () => common.IWordData[];
	/** timer에서 설정된 문제및 시간 팀여부 셋팅
	 * @param {number[]} idxs - 문제들 인덱스 array
	 * @param {number} qtime - 제한시간
	 * @param {boolean} isGroup - 팀-싱글 여부
	*/
	setQuizInfo: (idxs:  number[], qtime: number, isGroup: boolean) => void;
	
	getGroupInfo: () => IGroupResult;
	getSingleInfo: () => ISingleResult;

	waitResult: () => void;

	prepareGroupResult: () => void;
	prepareSingleResult: () => void;


	getQuizResult: (type: common.TypeQuiz) => {single: ISingleResult|null, group: IGroupResult|null};
	gotoQuizResult: (type: common.TypeQuiz, isGroup: boolean) => boolean;
	gotoQuizSelect: () => void;

	setQIdx: (idx: number) => void;
	setQuizProg: (prog: TypeQuizProg) => void;
}

class TeacherContext extends TeacherContextBase {
	@observable public state!: IStateCtx;
	public actions!: IActionsCtx;
	private _data!: common.IData;
	private _qidx: number = 0;

	private _r_sound: {single: ISingleResult|null, group: IGroupResult|null};
	private _r_meaning: {single: ISingleResult|null, group: IGroupResult|null};
	private _r_spelling: {single: ISingleResult|null, group: IGroupResult|null};
	private _r_sentence: {single: ISingleResult|null, group: IGroupResult|null};

	private _r_single: ISingleResult = {
		questions: [],
		users: [],
		qtime: 0,
		qtype: '',
	};
	private _r_group: IGroupResult = {
		questions: [],
		users: [],
		ga_point: 0,
		na_point: 0,
		qtime: 0,
		qtype: '',
	};

	constructor() {
		super();
		this.state.prog = 'direction';
		this.state.qtype = '';
		this.state.isGroup = false;
		this.state.quizProg = '';
		this.state.speak_audio = false;
		this.state.speak_video = false;

		this.state.speaking_audio = false;
		this.state.speaking_video = false;

		this.state.gas = [];
		this.state.nas = [];

		this._r_sound = {single: null, group: null,};
		this._r_meaning = {single: null, group: null,};
		this._r_spelling = {single: null, group: null,};
		this._r_sentence = {single: null, group: null,};
		
		this.state.returnUsers = [];

		this.actions.getWords = () => this._data.page1.words;

		this.actions.setQuizInfo = (idxs:  number[], qtime: number, isGroup: boolean) => {
			const words = this._data.page1.words;
			let tmp: IUserResult[];
			if(isGroup) {
				const { questions, users } = this._r_group;
				tmp = users;
				while(questions.length > 0) questions.pop();	
				this._r_group.ga_point = 0;
				this._r_group.na_point = 0;
				this._r_group.qtime = qtime;
				this._r_group.qtype = this.state.qtype;

				idxs.forEach((val, idx) => {
					questions[idx] = {
							qidx: val,
							point: 0,
							ga_correct: 0,
							na_correct: 0,
							returnUsers: [],
						};
				});
			} else {
				const { questions, users } = this._r_single;
				tmp = users;
				while(questions.length > 0) questions.pop();
				

				this._r_single.qtime = qtime;
				this._r_single.qtype = this.state.qtype;

				const qtype = this.state.qtype;
				const hasPreview = this.state.hasPreview;
				idxs.forEach((val, idx) => {
					const word = words[val];
					let preview = 0;
					if(hasPreview) {
						switch(qtype) {
						case 'sound': preview = word.app_sound;break;
						case 'meaning': preview = word.app_meaning; break;
						case 'spelling': preview = word.app_spelling; break;
						case 'usage': preview = word.app_sentence; break;				
						default:
							break;
						}
					}
					questions[idx] = {
						qidx: val,
						numOfCorrect: 0,
						name: word.entry,
						preview,
					};
				});
			} 
			while(tmp.length > 0) tmp.pop();

			if(idxs.length > 0) {
				const students = App.students;
				students.forEach((student, idx) => {
					const result: boolean[] = [];
					const inputs: string[] = [];
					const stimes: string[] = [];
					const etimes: string[] = [];
					idxs.forEach((val, aidx) => {
						result[aidx] = false;
						inputs[aidx] = '';
						stimes[aidx] = '';
						etimes[aidx] = '';
					});	
					let ga_na: undefined | 'ga' | 'na';
					if(isGroup) {
						let find = _.findIndex(this.state.nas, {id: student.id});
						if(find < 0) ga_na = 'ga';
						else ga_na = 'na';
					}
					tmp[idx] = {
						id: student.id,
						result,
						inputs,
						stimes,
						etimes,
						name: student.name,
						numOfCorrect: 0,
						ga_na,
						grade: 0,
					};
				});
			} else {
				this.actions.setQuizProg('');
				while(this.state.gas.length > 0) this.state.gas.pop();
				while(this.state.nas.length > 0) this.state.nas.pop();
			}
			this.state.numOfReturn = 0;
			this.state.isGroup = isGroup;
		};
		this.actions.getGroupInfo = () => this._r_group;
		this.actions.getSingleInfo = () => this._r_single;

		this.actions.waitResult = async () => {
			// console.log('this.actions.waitResult this.state.quizProg=' + this.state.quizProg);
			
			let quizProg = this.state.quizProg;

			if(quizProg !== 'quiz') return;


			this.actions.setQuizProg('wait-result');
			await kutil.wait(5000);
			quizProg = this.state.quizProg;
			if(quizProg !== 'wait-result') return;
			this.actions.prepareSingleResult();
			this.actions.setQuizProg('result');
		};

		const prepareUserResult = (users: IUserResult[]) => {
			users.forEach((user, idx) => {
				let numOfCorrect = 0;
				user.result.forEach((isCorrect) => {
					if(isCorrect) numOfCorrect++;
				});
				user.numOfCorrect = numOfCorrect;
			});
			let arr = users.sort((a, b) => {
				if(a.numOfCorrect > b.numOfCorrect) return -1;
				else if(a.numOfCorrect < b.numOfCorrect) return 1;
				else return 0;
			});

			// while(users.length > 0) users.pop();
			let grade: number = 0;
			let prevCnt: number = -1;
			arr.forEach((user, idx) => {
				if (prevCnt !== user.numOfCorrect) {
					grade++;
				}
				user.grade = grade;
				prevCnt = user.numOfCorrect;

				users[idx] = user;
			});		
		};

		this.actions.prepareGroupResult = () => {
			const {users, questions} = this._r_group;
			prepareUserResult(users);

			switch(this.state.qtype) {
				case 'sound': 
					this._r_sound.group = _cloneGroupResult(this._r_group);
					break;
				case 'meaning': 
					this._r_meaning.group = _cloneGroupResult(this._r_group);
					break;
				case 'spelling': 
					this._r_spelling.group = _cloneGroupResult(this._r_group);
					break;
				case 'usage': 
					this._r_sentence.group = _cloneGroupResult(this._r_group);
					break;
				default: break;
			}
			this._uploadInclassReport(users, questions);
		
		};

		this.actions.prepareSingleResult = () => {
			const {users, questions} = this._r_single;
			prepareUserResult(users);

			switch(this.state.qtype) {
			case 'sound': 
				this._r_sound.single = _cloneSingleResult(this._r_single);
				break;
			case 'meaning': 
				this._r_meaning.single = _cloneSingleResult(this._r_single);
				break;
			case 'spelling': 
				this._r_spelling.single = _cloneSingleResult(this._r_single);
				break;
			case 'usage': 
				this._r_sentence.single = _cloneSingleResult(this._r_single);
				break;
			default: break;
			}

			this._uploadInclassReport(users, questions);
			// console.log(this._r_single.users);
		};
		this.actions.getQuizResult = (type: common.TypeQuiz) => {
			switch(type) {
			case 'sound': return this._r_sound;
			case 'meaning': return this._r_meaning;
			case 'spelling': return this._r_spelling;
			case 'usage': return this._r_sentence;
			default: return {single: null, group: null,};
			}
		};
		this.actions.gotoQuizResult = (type: common.TypeQuiz, isGroup: boolean) => {
			let ret = false;
			let result: {single: ISingleResult|null, group: IGroupResult|null}|null = null;
			switch(type) {
				case 'sound': result = this._r_sound; break;
				case 'meaning': result = this._r_meaning; break;
				case 'spelling': result = this._r_spelling; break;
				case 'usage': result = this._r_sentence; break;
				default: break;
			}
			
			let qtype: common.TypeQuiz = '';
			if(result) {
				if(isGroup && result.group) {
					while(this.state.gas.length > 0) this.state.gas.pop();
					while(this.state.nas.length > 0) this.state.nas.pop();
					this._r_group = _cloneGroupResult(result.group);

					const students = App.students;
					const users = this._r_group.users;
					for(const u of users) {
						const s = _.find(students, {id: u.id});
						if(u.ga_na === 'ga' && s) {
							this.state.gas.push(s);
						} else if(u.ga_na === 'na' && s) {
							this.state.nas.push(s);
						}
					}
					qtype = this._r_group.qtype;
					ret = true;
				} else if(!isGroup && result.single) {
					while(this.state.gas.length > 0) this.state.gas.pop();
					while(this.state.nas.length > 0) this.state.nas.pop();
					this._r_single = _cloneSingleResult(result.single);
					
					qtype = this._r_single.qtype;
					ret = true;
				}
			}
			if(ret) {

				this.state.qtype = qtype;
				this.actions.setQuizProg('result');
				this.state.isGroup = isGroup;
				this.state.prog = 'quiz';

			
			}
			return ret;	
		};


		this.actions.gotoQuizSelect = () => {
			this.state.prog = 'quiz-select';

			/*
			await kutil.wait(3000);
			// console.log('reset');
			if(this.state.prog === 'quiz-select') this._reset();
			*/
		};
		this.actions.setQIdx = (idx: number) => {
			
			let qlen = 0;
			if(this.state.isGroup) qlen = this._r_group.questions.length;
			else qlen = this._r_single.questions.length;

			// console.log('setQIdx idx=' + idx, 'qlen = ' + qlen, 'this.state.quizProg = ' + this.state.quizProg);
			if(idx < 0 || idx >= qlen) return;

			this._qidx = idx;
			this.state.numOfReturn = 0;
		};
		this.actions.setQuizProg = (prog: TypeQuizProg) => {
			this.state.quizProg = prog;
		};
	}
	private _reset() {
		this.state.qtype = '';
		this.actions.setQuizProg('');
		this.state.speak_audio = false;
		this.state.speak_video = false;
		this.state.speaking_audio = false;
		this.state.speaking_video = false;

		this.state.numOfReturn = 0;
		while(this.state.gas.length > 0) this.state.gas.pop();
		while(this.state.nas.length > 0) this.state.nas.pop();
		while(this.state.returnUsers.length > 0) this.state.returnUsers.pop();
	}

	private _uploadInclassReport(users: IUserResult[], questions: Array<{qidx: number,}>) {
		
		const userReports: IInClassReport[] = [];
		questions.forEach((q, idx) => {
			const word = this._data.page1.words[q.qidx];
			if(word) {
				let studyProps: IInClassStudyProps|undefined;
				let ans_correct: string|undefined;
				switch(this.state.qtype) {
					case 'sound':
						studyProps = word.quiz_sound;
						ans_correct = word.quiz_sound.correct.toString();
						break;
					case 'meaning': 
						studyProps = word.quiz_meaning;
						ans_correct = word.quiz_meaning.correct.toString();
						break;
					case 'spelling': 
						studyProps = word.quiz_spelling;
						ans_correct = word.quiz_spelling ? word.quiz_spelling.entry : undefined;
						break;
					case 'usage': 
						studyProps = word.quiz_usage;
						ans_correct = word.quiz_usage.correct.toString();
						break;
					default: break;
				}
				if(studyProps && studyProps.tmq_seq) {
					users.forEach((user, uidx) => {
						studyProps = studyProps!;
						studyProps.tmq_seq = studyProps.tmq_seq!;
						ans_correct = ans_correct!;
						userReports.push({
							std_cont_seq: studyProps.tmq_seq,
							studentId: user.id,
							ans_tf: user.result[idx] ? '1' : '0',
							ans_submit: user.inputs[idx] ? user.inputs[idx] : '',
							ans_starttime: user.stimes[idx] ? user.stimes[idx] : '',
							ans_endtime: user.etimes[idx] ? user.etimes[idx] : '',
							sc_div1: studyProps.SC_DIV1 ? studyProps.SC_DIV1 : '',
							sc_div2: studyProps.SC_DIV2 ? studyProps.SC_DIV2 : '',
							sc_div3: studyProps.SC_DIV3 ? studyProps.SC_DIV3 : '',
							sc_div4: studyProps.SC_DIV4 ? studyProps.SC_DIV4 : '',
							files: null,
							ans_correct,
							tab_index: ''
						});				
					});
				}
			}
		});
		if(userReports.length > 0) {
            console.log('inclassReport(LogFromContentTeacher): ', userReports); // 비상요청 사항                        
            felsocket.uploadInclassReport(userReports);
        }
	}

	@action protected _setViewDiv(viewDiv: VIEWDIV) {
		super._setViewDiv(viewDiv);
		if(viewDiv === 'direction') {
			this.state.prog = 'direction';
		} else {
			this.state.prog = 'list';
		}
		this._reset();
	}

	public receive(data: ISocketData) {
		super.receive(data);
		if(data.type === $SocketType.MSGTOTEACHER && data.data) {
			const msg = data.data as common.IMsg;
			if(msg.msgtype === 'quiz_result') {
				if(this.state.prog !== 'quiz' && this.state.prog !== 'board') return;
				
				const qmsg = msg as IQuizResultMsg;
				if(this.state.isGroup) {
					const { questions, users } = this._r_group;
					if(qmsg.idx >= 0 && qmsg.idx < questions.length) {
						const user = _.find(users, {id: qmsg.id});
						if(user) {
							if(qmsg.idx >= 0 && qmsg.idx < user.result.length) {
								user.result[qmsg.idx] = qmsg.result;
								user.inputs[qmsg.idx] = qmsg.input;
								user.stimes[qmsg.idx] = qmsg.stime;
								user.etimes[qmsg.idx] = qmsg.etime;
							}
						}
						let ga_correct = 0;
						let na_correct = 0;
						for(const u of users) {
							if(u.result[qmsg.idx]) {
								if(u.ga_na === 'na') na_correct++;
								else ga_correct++;
							}
						}
						questions[qmsg.idx].ga_correct = ga_correct;
						questions[qmsg.idx].na_correct = na_correct;

						if(qmsg.idx === this._qidx) {
							this.state.numOfReturn++;
						}
					}
				} else {
					const { questions, users } = this._r_single;
					if(qmsg.idx >= 0 && qmsg.idx < questions.length) {
						const user = _.find(users, {id: qmsg.id});
						if(user) {
							if(qmsg.idx >= 0 && qmsg.idx < user.result.length) {
								user.result[qmsg.idx] = qmsg.result;
								user.inputs[qmsg.idx] = qmsg.input;
								user.stimes[qmsg.idx] = qmsg.stime;
								user.etimes[qmsg.idx] = qmsg.etime;
							}
						}
						let numOfCorrect = 0;
						for(const u of users) {
							if(u.result[qmsg.idx]) numOfCorrect++;
						}
						questions[qmsg.idx].numOfCorrect = numOfCorrect;


						if(qmsg.idx === this._qidx) {
							let tmp = this.state.numOfReturn + 1;
							if(
								this._qidx === questions.length - 1 &&
								tmp === users.length
							) {
								this.actions.prepareSingleResult();
								
								if(this.state.quizProg === 'wait-result') {
									this.actions.setQuizProg('result');
								} else if(this.state.quizProg === 'quiz') {
									(async () => {
										await kutil.wait(100);
										let quizProg = this.state.quizProg;
										if(quizProg === 'quiz') this.actions.setQuizProg('wait-result');
										else if(quizProg !== 'wait-result') return;

										await kutil.wait(600);
										quizProg = this.state.quizProg;
										if(quizProg !== 'wait-result') return;

										this.actions.setQuizProg('result');
									})();
								}
							}
							this.state.numOfReturn = tmp;
						}
					}					
				}
				
				// console.log('this.state.quizProp=' + this.state.quizProg, 'this.state.numOfReturn=' + this.state.numOfReturn);
			} else if(msg.msgtype === 'recorded_return') {
				if(this.state.prog === 'list' && 
					(this.state.speak_video || this.state.speak_audio || this.state.speaking_audio || this.state.speaking_video)
				) { 
					this.actions.setRetCnt(this.state.retCnt + 1);

					const rmsg = msg as common.IRecordedMsg;
					const word = _.find(this._data.page1.words, {idx: rmsg.word_idx});
					if(!word) return;

					let ans_submit = '';
					let tab_index = '';
					if(this.state.speak_video) {
						ans_submit = 'vid;' + word.entry; 
						tab_index = '1';
					} else if (this.state.speak_audio ) {
						ans_submit = 'aud;' + word.entry; 
						tab_index = '2';
					} else if(this.state.speaking_video) {
						ans_submit = 'vid;' + word.entry; 
						tab_index = '11';
					} else if (this.state.speaking_audio) {
						ans_submit = 'aud;' + word.entry; 
						tab_index = '12';
					} 
					
					let files: string[] = [];
					files.push(rmsg.url);
	
					const stime = StrUtil._toStringTimestamp(new Date(rmsg.stime));
					const etime = StrUtil._toStringTimestamp(new Date(rmsg.etime));
	
					let userReports: IInClassReport[] = [];
					userReports.push({
						std_cont_seq: 0,
						studentId: rmsg.id,
						ans_tf: '1',
						ans_submit,
						ans_starttime: stime ? stime : '',
						ans_endtime: etime ? etime : '',
						sc_div1: '',
						sc_div2: '',
						sc_div3: '',
						sc_div4: '',
						files,
						ans_correct: word.entry,
						tab_index,
					});	
					if(userReports.length > 0) {
                        console.log('inclassReport(LogFromContentTeacher): ', userReports); // 비상요청 사항                        
                        felsocket.uploadInclassReport(userReports);
                    }
				} 
			} else if(msg.msgtype === 'spelling_return') {
				const rmsg = msg as common.ISpellingReturnMsg;
				const ridx = this.state.returnUsers.indexOf(rmsg.id);
				if(ridx < 0) {
                    this.state.returnUsers.push(rmsg.id);
                    felsocket.addStudentForStudentReportType6(rmsg.id);
                    this.actions.setRetCnt(this.state.returnUsers.length);
				}
				
				const word = _.find(this._data.page1.words, {idx: rmsg.word_idx});
				if(!word) return;

				const ans_submit = 'typ;' + rmsg.user_input; 
				const tab_index = '4';

				const stime = StrUtil._toStringTimestamp(new Date(rmsg.stime));
				const etime = StrUtil._toStringTimestamp(new Date(rmsg.etime));

				let userReports: IInClassReport[] = [];
				userReports.push({
					std_cont_seq: 0,
					studentId: rmsg.id,
					ans_tf: '1',
					ans_submit,
					ans_starttime: stime ? stime : '',
					ans_endtime: etime ? etime : '',
					sc_div1: '',
					sc_div2: '',
					sc_div3: '',
					sc_div4: '',
					files: null,
					ans_correct: word.entry,
					tab_index,
				});	
				if(userReports.length > 0) {
					console.log('inclassReport(LogFromContentTeacher): ', userReports); // 비상요청 사항
					felsocket.uploadInclassReport(userReports);
                }
			}
		}
	}
	public async setData(data: common.IData) {
		data = common.initData(data);

		this._data = data;
		this.state.hasPreview = true;
		const words = data.page1.words;
	
		function _initAvgPercent(text_arr: string[], val_arr: any[], preview_data: IPreviewResultClassMember[]) {
		
			for(let i = 0; i < preview_data.length;i++) {
				if(!text_arr.includes(preview_data[i].textValue)) {
					text_arr.push(preview_data[i].textValue);
					val_arr.push({sum: 0, cnt: 0, avg: 0, txt: ''});
				}
			}
			for(let i = 0; i < preview_data.length;i++) {
				let txt = preview_data[i].textValue;
				let val = preview_data[i].avgPercent;
				let idx = text_arr.findIndex((item) => {
					return (item === txt);	
				});
				val_arr[idx].sum += val;
				val_arr[idx].cnt += 1;
				val_arr[idx].avg = Math.round(val_arr[idx].sum / val_arr[idx].cnt);
				val_arr[idx].txt = txt;
			
			}
		}// 사전 학습 관련 데이터 셋팅 을 위한 함수 




		const previewMsg: IPreviewClassMsg[] = [];

		for(let i = 0; i < words.length; i++) {
			const word = words[i];
			word.app_idx = i;
			word.app_checked = false;
			word.app_studied = false;
			word.app_result = false;

			if(!App.isDvlp && word.tmq_COD && word.tmq_COD[0] !== undefined) {
				previewMsg.push({evalCode: '1',vsFromData: word.tmq_COD[0].codType,vsFromSeq: Number(word.tmq_COD[0].codSeq)});
				
			}

			
		}
		console.log('previewMsg~~~', previewMsg.length, previewMsg);
		let previewResult;
		let len = 0;
		let sound_result;
		let meaning_result;
		let spelling_result;
		let usage_result;

		let text_arr_sound: string[] = [];
		let val_arr_sound: IValArr[] = [];

		let text_arr_spelling: string[] = [];
		let val_arr_spelling: IValArr[] = [];

		let text_arr_meaning: string[] = [];
		let val_arr_meaning: IValArr[] = [];

		let text_arr_usage: string[] = [];
		let val_arr_usage: IValArr[] = [];

		if(!App.isDvlp && App.lang === 'ko') {
			previewResult =  await felsocket.getPreviewResultClass(previewMsg);
			len = previewResult.length;
			if(len > 0) {

			
				sound_result = previewResult.filter((item,idx) => {
					return item.mttSeq === 6;
				});
				meaning_result = previewResult.filter((item,idx) => {
					return item.mttSeq === 7;
				});
				spelling_result = previewResult.filter((item,idx) => {
					return item.mttSeq === 8;
				});
				usage_result = previewResult.filter((item,idx) => {
					return item.mttSeq === 9;
				});

				_initAvgPercent(text_arr_sound,val_arr_sound,sound_result);
				console.log('text_arr', text_arr_sound, 'val_arr', val_arr_sound);
				_initAvgPercent(text_arr_spelling,val_arr_spelling,spelling_result);
				console.log('text_arr', text_arr_spelling, 'val_arr', val_arr_spelling);
				_initAvgPercent(text_arr_meaning,val_arr_meaning,meaning_result);
				console.log('text_arr', text_arr_meaning, 'val_arr', val_arr_meaning);
				_initAvgPercent(text_arr_usage,val_arr_usage,usage_result);
				console.log('text_arr', text_arr_usage, 'val_arr', val_arr_usage);
		
				for(let i = 0; i < val_arr_sound.length; i++) {
					let idx = words.findIndex((item) => {
						return item.entry === val_arr_sound[i].txt;
					});
					words[idx].app_sound = val_arr_sound[i].avg;
				}
		
				for(let i = 0; i < val_arr_spelling.length; i++) {
					let idx = words.findIndex((item) => {
						return item.entry === val_arr_spelling[i].txt;
					});
					words[idx].app_spelling = val_arr_spelling[i].avg;
				}

				for(let i = 0; i < val_arr_meaning.length; i++) {
					let idx = words.findIndex((item) => {
						return item.entry === val_arr_meaning[i].txt;
					});
					words[idx].app_meaning = val_arr_meaning[i].avg;
				}

				for(let i = 0; i < val_arr_usage.length; i++) {
					let idx = words.findIndex((item) => {
						return item.entry === val_arr_usage[i].txt;
					});
					words[idx].app_sentence = val_arr_usage[i].avg;
				}
			} else {
				for(let i = 0; i < words.length; i++) {
					words[i].app_sound = -1;
					words[i].app_meaning = -1;
					words[i].app_spelling = -1;
					words[i].app_sentence = -1;
				}
			}
		} else {// 개발자 모드이거나 국내 런처가 아닌경우
			for(let i = 0; i < words.length; i++) {
				const word = words[i];
				const test_sound = [10, 20, 30, 40, 50, 60, 70, 80, 90, 100];
				const test_meaning = [10, 20, 30, 40, 50, 60, 70, 80, 90, 100];
				const test_spelling = [10, 20, 30, 40, 50, 60, 70, 80, 90, 100];
				const test_sentence = [10, 20, 30, 40, 50, 60, 70, 80, 90, 100];
				word.app_sound = test_sound[i];
				word.app_meaning = test_meaning[i];
				word.app_spelling = test_spelling[i];
				word.app_sentence = test_sentence[i];
			}
		}
	}
}


const tContext = new TeacherContext();
const  { Provider: TProvider, Consumer: TeacherConsumer } = React.createContext( tContext );
class TeacherProvider extends React.Component<{}> {
	public render() {
		return (
			<TProvider value={tContext}>
				{this.props.children}
			</TProvider>
		);
	}
}

function useTeacher(WrappedComponent: any) {
	return function UseAnother(props: any) {
		return (
			<TeacherConsumer>{(store: TeacherContext) => (
					<WrappedComponent
						{...store}
					/>
			)}</TeacherConsumer>
		);
	};
}

export {
	TeacherContext,
	TeacherProvider,
	TeacherConsumer,
	tContext,
	useTeacher,
	IStateCtx,
	IActionsCtx,
};