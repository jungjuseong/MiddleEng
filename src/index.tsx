import { setConfig } from 'react-hot-loader';
import * as React from 'react';
import * as ReactDOM from 'react-dom';

import { App, IMain } from './App';
import * as felsocket from './felsocket';

import * as importer from '@common/net/importer';

setConfig({
	ErrorOverlay: (errors) => <div/>,
});


const app_o = {
	clear: App.pub_clear,
	importLink: importer.importLink,
	importHTML: importer.importHTML,
};




let _require: any;
let _isTeacher = true;

if(p_base_template_t) {
	_require =  require('./p_base_template/teacher');
} else if(p_base_template_s) {
	_require =  require('./p_base_template/student');
	_isTeacher = false;
} else if(b_rw_comprehension_t) {
	_require =  require('./b_rw_comprehension/teacher');
} else if(b_rw_comprehension_s) {
	_require =  require('./b_rw_comprehension/student');
	_isTeacher = false;
} else if(b_ls_comprehension_t) {
	_require =  require('./b_ls_comprehension/teacher');
} else if(b_ls_comprehension_s) {
	_require =  require('./b_ls_comprehension/student');
	_isTeacher = false;
} else if(b_ls_voca_t) {
	_require =  require('./b_ls_voca/teacher');
} else if(b_ls_voca_s) {
	
	_require =  require('./b_ls_voca/student');
	_isTeacher = false;
}


interface IMoudule {
	default: IMain;
	AppProvider: any;
	appContext: IMain;
/*
	start: () => void;
	getStore: () => any;
	receive: (data: ISocketData) => void;
	uploaded: (url: string) => void;
*/
}

// console.log(window.navigator.userAgent);

let _started = false;
const _module = _require as IMoudule;
const AppComp: any = _module.default;
const AppProvider = _module.AppProvider;
const appContext = _module.appContext;
// console.log('*****************************************************************');
app_o['set'] = (data: any, isDvlp: boolean, lang: string) => { // tslint:disable-line
	App.pub_set(data, isDvlp, lang);
	appContext.setData(data);
};

app_o['render'] = () => { // tslint:disable-line
	App.pub_initAudio();
	
	ReactDOM.render(
		<AppProvider><AppComp /></AppProvider>,
		document.getElementById('wrap') as HTMLElement
	);

};

if(_isTeacher) { // *********************** 전자칠판 ***********************
	app_o['init'] = (students: IStudent[], book: string, lesson: string, nextBook :boolean, prevBook: boolean) => {    // tslint:disable-line
		App.pub_load(students, null, book, lesson, nextBook, prevBook);
	};

	app_o['start'] = () => {  // tslint:disable-line
		// console.log('start  App.isStarted', App.isStarted, '_started', _started);
		_started = true;
		setTimeout(() => appContext.start(), 500);

	};
	
	app_o['receive'] = (obj: ISocketData) => {  // tslint:disable-line
		// console.log('teacher app_o.receive', obj);
		if (obj.type === $SocketType.PAD_INIT_COMPLETE) {
			const student = obj.data as IStudent;

			// console.log('receive  $SocketType.PAD_INIT_COMPLETE App.isStarted', App.isStarted, '_started', _started);
			if (_started) {
				if (student && student.id && student.id !== '') {
					if(App.isStarted) {
						felsocket.sendPADToID(student.id, $SocketType.PAD_ONSCREEN, null);
					} else {
						felsocket.sendPADToID(student.id, $SocketType.PAD_START_DIRECTION, null);
					}
				}
			} else {
				if ( App.pub_addInitedStudent(student) ) {					
					if (!_started) {
						_started = true;
						appContext.start();
	
					}
				}
			}
		} else {
			appContext.receive(obj);
		}
	};
	
	app_o['teachingTool'] = (started: boolean) => { // tslint:disable-line
		//
	};
} else {   // *********************** PAD 시작 ***********************
	app_o['init'] = (student: IStudent, book: string, lesson: string, nextBook :boolean, prevBook: boolean) => {    // tslint:disable-line
		// console.log(_isTeacher, 'app_o.init', student);
		if(b_ls_voca_s || b_rw_comprehension_s ) {
			felsocket.disableSoftwareKeyboard();
		}
		App.pub_load(null, student, book, lesson, nextBook, prevBook);
		felsocket.sendTeacher($SocketType.PAD_INIT_COMPLETE, student);
	};

	app_o['receive'] = (obj: ISocketData) => {  // tslint:disable-line
		if (App.student == null) return;
		appContext.receive(obj);
	};
    
    app_o['notifyUploadToServerResult'] = (url: string) => { // tslint:disable-line
        console.log("app_o['notifyUploadToServerResult']")
		appContext.uploaded(url);
	};

	app_o['notify'] = (type: string) => { // tslint:disable-line
		appContext.notify(type);
	};
	app_o['notifyVideoRecord'] = (url: string) => { // tslint:disable-line
		appContext.notifyVideoRecord(url);
	};

	app_o['notifyStartVoice'] = () => { // tslint:disable-line
		appContext.notify('notifyStartVoice');
	};
	
	app_o['notifyVoiceRecordResult'] = (url: string) => { // tslint:disable-line
		appContext.notifyRecorded(url);
	};

    app_o['notifyTakePicture'] = (url: string, src: string) => {
		if(!appContext.notifyTakePicture) return;
		appContext.notifyTakePicture(url, src);
	}
} // *********************** PAD 종료 ***********************

import './index.scss';
(global as any)['app_o'] = app_o;  // tslint:disable-line

