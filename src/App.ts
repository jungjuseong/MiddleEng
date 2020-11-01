import * as StrUtil from '@common/util/StrUtil';
import * as felsocket from './felsocket';

function _initStudent<T extends IStudent|null>(student: T): T {
	if(!student) return student;
	student.displayMode = ('' + student.displayMode) === '2' ? '2' : '1';
	let thumb = student.thumb ? student.thumb : '';
	if(thumb.startsWith('static/') || thumb === '') {
		if(thumb.endsWith('w.jpg')) thumb = `${_digenglish_lib_}/images/default_member_w.jpg`;
		else thumb = `${_digenglish_lib_}/images/default_member_m.jpg`;
	}
	student.thumb = thumb;
	return student;
}

export interface IMain {
	start: () => void;
	receive: (data: ISocketData) => void;
	uploaded: (url: string) => void;
	notify: (type: string) => void;
	notifyRecorded: (url: string) => void;
    notifyVideoRecord: (url: string) => void;
    notifyTakePicture?: (url: string, src: string) => void;
	setData: (data: any) => void;
}

export class App {
	private static _isMobile = false;
	private static _tempBnd: HTMLDivElement;
	private static _tempEl: HTMLDivElement;


	static get isMobile() {return App._isMobile; }
	static get tempEl() {return App._tempEl;}

	public static pub_init() {
		// JS.setProp(Browser.window, "felsock_o", FELSocket);
		// JS.setProp(Browser.window, "app_o", App);
		const a = navigator.userAgent;
		const r1 = /(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino/i;	
		const r2 = /1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i;
		const r3 = /android/i;
		App._isMobile = r1.test(a) || r2.test(a)  || r3.test(a);

		App._tempBnd = document.createElement('div');
		App._tempBnd.style.display = 'none';
		App._tempEl = document.createElement('div');
		App._tempBnd.appendChild(App._tempEl);
		
		if(document.body === null) {
			document.addEventListener('DOMContentLoaded', (e) => {
				document.body.appendChild(App._tempBnd);
			});
		} else {
			document.body.appendChild(App._tempBnd);
		}
	}

	private static _students: IStudent[] = [];
	private static _students_inited: string[] = [];
	static get students() {return App._students; }
	
	// Pad 에서 사용
	private static _student: IStudent|null = null;
	static get student() {return App._student; }
	
	private static _lang = 'ko';
	static get lang() {return App._lang; }
	private static _isDvlp = false;
	static get isDvlp() {return App._isDvlp; }
	
	private static _data_url = '../data/';
	static get data_url() {return App._data_url; }
	
	private static _lesson = '';
	static get lesson() {return App._lesson; }

	private static _book = '';
	static get book() {return App._book; }

	private static _nextBook = false;
	static get nextBook() {return App._nextBook; }
	
	private static _prevBook = false;
	static get prevBook() {return App._prevBook; }

	private static _start_idx = -1;
	public static isStarted = false;

	public static pub_load(students: IStudent[]|null , student: IStudent|null, book: string, lesson: string, nextBook: boolean, prevBook: boolean) {
		App._lesson = lesson;
		App._book = book;
		// App._initAudio();
		App._nextBook = nextBook;
		App._prevBook = prevBook;

		App._students = [];
		if(students) {
			students.forEach((s, idx) => {
				App._students[idx] = _initStudent(s);
			});
		}
		App._student = _initStudent(student);

	}
	
	public static pub_reloadStudents(callBack: () => void) {
		felsocket.getStudents((students: any[], isOk: boolean) => {
			while (App._students.length > 0) {
				App._students.pop();
			}
			while (App._students_inited.length > 0) {
				App._students_inited.pop();
			}	
			for(let i = 0, len = students.length; i < len; i++) {
				if (App.isDvlp) {
					
					App._students[i] = _initStudent(students[i]);
				} else {
					App._students[i] = _initStudent({
						id : students[i].id,
						name : students[i].name,
						thumb : students[i].defaultThumbnail,
						avatar : students[i].profileThumbnail,
						nickname : students[i].nickName,
						displayMode: students[i].displayMode,
						inited : true,
					});

				}
				App._students_inited.push(students[i].id);
			}
			callBack();
		});
	}

	public static pub_parseStyle(str: string) {
		App._tempEl.style.cssText = str;
		return App._tempEl.style;
	}
	private static _common_audio: HTMLAudioElement;
	private static _ding_audio: HTMLAudioElement|null;
	private static _dingend_audio: HTMLAudioElement|null;
	private static _btn_audio: HTMLAudioElement|null;
	private static _correct_audio: HTMLAudioElement|null;
	private static _wrong_audio: HTMLAudioElement|null;
	private static _topad_audio: HTMLAudioElement|null;
	private static _goodjob_audio: HTMLAudioElement|null;

	private static _btn_back_audio: HTMLAudioElement|null;
	private static _btn_page_audio: HTMLAudioElement|null;
	private static _card_audio: HTMLAudioElement|null;
	private static _popup_audio: HTMLAudioElement|null;

	private static _flips_audio: HTMLAudioElement|null;
	private static _clock_audio: HTMLAudioElement|null;

	private static _write_audio: HTMLAudioElement|null;

	private static _like_bubble_audio: HTMLAudioElement|null;
	private static _all_btn_click_audio: HTMLAudioElement|null;
	
	public static pub_initAudio() {
		App._common_audio = document.getElementById('common_audio') as HTMLAudioElement;

		App._ding_audio  = document.getElementById('ding_audio') as HTMLAudioElement|null;
		App._dingend_audio  = document.getElementById('dingend_audio') as HTMLAudioElement|null;
		App._btn_audio = document.getElementById('btn_audio') as HTMLAudioElement|null;
		
		App._correct_audio = document.getElementById('correct_audio') as HTMLAudioElement|null;
		App._wrong_audio = document.getElementById('wrong_audio') as HTMLAudioElement|null;
		App._topad_audio = document.getElementById('topad_audio') as HTMLAudioElement|null;
		
		App._goodjob_audio = document.getElementById('goodjob_audio') as HTMLAudioElement|null;

		App._btn_back_audio = document.getElementById('btn_back_audio') as HTMLAudioElement|null;
		App._btn_page_audio = document.getElementById('btn_page_audio') as HTMLAudioElement|null;
		App._card_audio = document.getElementById('card_audio') as HTMLAudioElement|null;
		App._popup_audio = document.getElementById('popup_audio') as HTMLAudioElement|null;

		App._flips_audio = document.getElementById('card_flips') as HTMLAudioElement|null;
		App._clock_audio = document.getElementById('clock_audio') as HTMLAudioElement|null;

		App._write_audio = document.getElementById('write_audio') as HTMLAudioElement|null;

		App._like_bubble_audio = document.getElementById('like_bubble') as HTMLAudioElement|null;
    
		App._all_btn_click_audio = document.getElementById('all_btn_click') as HTMLAudioElement|null;
    
  }
  
  public static pub_playAllBtnClick() {
		if (App._all_btn_click_audio) {
			App._all_btn_click_audio.currentTime = 0;
			App._all_btn_click_audio.play();
		}
  }
  
	public static pub_playLikeBubble() {
		if (App._like_bubble_audio) {
			App._like_bubble_audio.currentTime = 0;
			App._like_bubble_audio.play();
		}
	}

	public static pub_playWrite() {
		if (App._write_audio) {
			App._write_audio.currentTime = 0;
			App._write_audio.play();
		}
	}
	public static pub_playClock() {
		if (App._clock_audio) {
			App._clock_audio.currentTime = 4.5;
			App._clock_audio.play();
		}
	}

	public static pub_playFlips() {
		if (App._flips_audio) {
			App._flips_audio.currentTime = 0;
			App._flips_audio.play();
		}
	}

	public static pub_playPopup() {
		if (App._popup_audio) {
			App._popup_audio.currentTime = 0;
			App._popup_audio.play();
		}
	}
	public static pub_playCard() {
		if (App._card_audio) {
			App._card_audio.currentTime = 0;
			App._card_audio.play();
		}
	}

	public static pub_playBtnPage() {
		if (App._btn_page_audio) {
			App._btn_page_audio.currentTime = 0;
			App._btn_page_audio.play();
		}
	}
	public static pub_playBtnBack() {
		if (App._btn_back_audio) {
			App._btn_back_audio.currentTime = 0;
			App._btn_back_audio.play();
		}
	}
	
	public static pub_playGoodjob() {
		if (App._goodjob_audio) {
			App._goodjob_audio.currentTime = 0;
			App._goodjob_audio.play();
		}
	}
	public static pub_playDing() {
		if (App._ding_audio) {
			App._ding_audio.currentTime = 0;
			App._ding_audio.play();
		}
	}
	public static pub_playDingend() {
		if (App._dingend_audio) {
			App._dingend_audio.currentTime = 0;
			App._dingend_audio.play();
		}
	}
	public static pub_playToPad() {
		if (App._topad_audio) {
			App._topad_audio.currentTime = 0;
			App._topad_audio.play();
		}
	}
	
	public static pub_playBtnTab() {
		if (App._btn_audio) {
			App._btn_audio.currentTime = 0;
			App._btn_audio.play();
		}
	}
	public static pub_playCorrect() {
		if (App._correct_audio) {
			App._correct_audio.currentTime = 0;
			App._correct_audio.play();
		}
	}
	public static pub_playWrong() {
		if (App._wrong_audio) {
			App._wrong_audio.currentTime = 0;
			App._wrong_audio.play();
		}
	}

	public static pub_playStudentBubble() {
		const audio = document.getElementById('student_bubble') as HTMLAudioElement|null;
		if(audio) {
			audio.currentTime = 0;
			if(audio.paused) audio.play();			
		}
	}
	
	public static pub_stop() {
		if (App._common_audio.onended != null) {
			// console.log('onended', App._common_audio.src);
			App._common_audio.onended.call(App._common_audio, new Event('ended'));
		}
		App._common_audio.oncanplaythrough = null;
		if (!isNaN(App._common_audio.duration) && !App._common_audio.paused) {
			// console.log('pause', App._common_audio.src);
			App._common_audio.pause();
		}	
	}
	
	public static pub_play(url: string, callBack: (isEnded: boolean) => void) {
		App.pub_stop();
		
		url = StrUtil.nteString(url, '');
		const curSrc = StrUtil.nteString(App._common_audio.getAttribute('src'), '');

		if (url === '' && curSrc === '') {
			if (callBack != null) callBack(true);
			return;
		}
			
		if (url !== '' && curSrc !== url) {
			// console.log('src', url);
			App._common_audio.src = url;
		}

		const _onerror = (e: Event) => {
			
			App._common_audio.onended = null;   // 반복적인 호출로 맨앞으로 이동
			if(callBack !== null) callBack(true);
			
			App._common_audio.removeEventListener('error', _onerror);
		};

		App._common_audio.onended = (e: Event ) => {
			App._common_audio.onended = null;			// 반복적인 호출로 맨앞으로 이동
			if(callBack !== null) callBack(e ? true : false);
			
			App._common_audio.removeEventListener('error', _onerror);
		};

		App._common_audio.addEventListener('error', _onerror);

		
		if (isNaN(App._common_audio.duration)) {
			App._common_audio.oncanplaythrough = (e) => {
				if(App._common_audio.currentTime !== 0) App._common_audio.currentTime = 0;
				App._common_audio.play();
				App._common_audio.oncanplaythrough = null;
			};
			App._common_audio.load();			
		} else {
			if(App._common_audio.currentTime !== 0) App._common_audio.currentTime = 0;
			
			App._common_audio.oncanplaythrough = null;
			App._common_audio.play();
		}
	}

	public static pub_set(data: any, isDvlp: boolean, lang: string) {
		App._isDvlp = isDvlp;
		App._lang = lang;
		felsocket.set(isDvlp);
	}
	
	public static pub_addInitedStudent(student: IStudent) {
		let bAdd = true;

		for (let i = 0, len = App._students_inited.length; i < len; i++) {
			const chk = App._students_inited[i];
			if (chk === student.id) {
				bAdd = false;
			}
		}
		if (bAdd) {
			App._students_inited.push(student.id);
		}
		
		const ret = (	App._start_idx > 0 && 
						App._students.length > 0 && 
						App._students_inited.length >= App._students.length
					);
		if (ret) {
			window.clearTimeout(App._start_idx);
			App._start_idx = -1;
		}
		return ret;
	}
	
	public static pub_start(callBack: () => void) {
		if (App._students.length === 0 || App._students_inited.length >= App._students.length) {
			callBack();
		} else {
			App._start_idx = window.setTimeout(callBack, 2000);
		}
	}

	public static pub_clear() {
		while (App._students.length > 0) {
			App._students.pop();
		}
		while (App._students_inited.length > 0) {
			App._students_inited.pop();
		}		
	}

}
