/**
 * ...
 * @author sychae@kdmt.com
 */
import * as _ from 'lodash';

let _isDvlp = false;

export function set(isDvlp: boolean) {
	// console.log('felsocket.set', isDvlp, _isDvlp);
	_isDvlp = isDvlp;
}

export function finishContentPage() {
	if (_isDvlp) return;
	try {
		window['tsoc_o']['finishContentPage'](); // tslint:disable-line
	} catch(e) {} 
}

export function startStudentReportProcess(type: $ReportType, students?: string[]|null, viewType?: 'A'|'B'|'C') {
	if (_isDvlp) return;
	try {
		window['tsoc_o']['startStudentReportProcess'](type, students, viewType); // tslint:disable-line
	} catch(e) {} 
}
export function hideStudentReportUI() {
	if (_isDvlp) return;
	try {
		window['tsoc_o']['hideStudentReportUI'](); // tslint:disable-line
	} catch(e) {} 
}
export function showStudentReportUI() {
	if (_isDvlp) return;
	try {
		window['tsoc_o']['showStudentReportUI'](); // tslint:disable-line
	} catch(e) {} 
}
export function showStudentReportListPage() {
	if (_isDvlp) return;
	try {
		window['tsoc_o']['showStudentReportListPage'](); // tslint:disable-line
	} catch(e) {} 
}
export function hideStudentReportListPage() {
	if (_isDvlp) return;
	try {
		window['tsoc_o']['hideStudentReportListPage'](); // tslint:disable-line
	} catch(e) {} 
}
    
export function addStudentForStudentReportType6(studentid: string) {
    if (_isDvlp) return;
	try {window['tsoc_o']['addStudentForStudentReportType6'](studentid);} catch(e) {} // tslint:disable-line 
}

export function uploadStudentReport(type: $ReportType, data: string, option: string) {
	if (_isDvlp) return;
	try {
		window['psoc_o']['uploadStudentReport'](type, data, option); // tslint:disable-line
	} catch(e) {}
}

export function sendLauncher(type: $SocketType, data: any) {
	if (type === $SocketType.TOP_TITLE_HIDE && !_isDvlp) {
		try {
			window['tsoc_o']['hideTitleBar'](); // tslint:disable-line
		} catch(e) {} 
	} else if (type === $SocketType.TOP_TITLE_VIEW && !_isDvlp) {
		try {
			window['tsoc_o']['showTitleBar'](); // tslint:disable-line
		} catch(e) {}
	} else if (type === $SocketType.TOP_TITLE_SET && !_isDvlp) {
		try {
			window['tsoc_o']['setTitleBar'](data); // tslint:disable-line
		} catch(e) {} 
	} else if (type === $SocketType.GOTO_PREV_BOOK) {
		if (_isDvlp) {
			try {
				window.top['tsoc_o']['gotoPrevBook'](); // tslint:disable-line
			} catch(e) {}
		} else {
			try {
				window['tsoc_o']['gotoPrevBook'](); // tslint:disable-line
			} catch(e) {}
		}
	} else if (type === $SocketType.GOTO_NEXT_BOOK) {
		if (_isDvlp) {
			try {
				window.top['tsoc_o']['gotoNextBook'](); // tslint:disable-line
			} catch(e) {}
		} else {
			try {
				window['tsoc_o']['gotoNextBook'](); // tslint:disable-line
			} catch(e) {}
		}
	}
}
	
export function sendPADToID(id: string, type: $SocketType, data: any) {
	const obj = {
		type,
		data,
	};
	if (_isDvlp) {
		try {
			window.top['tsoc_o']['sendPADToID']( id, obj); // tslint:disable-line
		} catch(e) {}
	} else {
		try {
			window['tsoc_o']['sendPADToID'](id, obj); // tslint:disable-line
		} catch(e) {} 
	}
}
	
export function sendPAD(type: $SocketType, data: any) {
	const obj = {
		type,
		data
	};
	if (_isDvlp) {
		try {window.top['tsoc_o']['sendAll'](obj);} catch(e) {} // tslint:disable-line
	} else {
		try {window['tsoc_o']['sendAll'](obj);} catch(e) {} // tslint:disable-line
	}
}
export function disableSoftwareKeyboard() {
	try{ window['psoc_o']['disableSoftwareKeyboard']();} catch(e) {} // tslint:disable-line
}
export function sendTeacher(type: $SocketType, data: any) {
	const obj = {
		type,
		data,
	};
	
	if (_isDvlp) {
		try {window.opener['tsoc_o']['sendTeacher'](obj);} catch(e) {} // tslint:disable-line
	} else {
		try {window['psoc_o']['sendTeacher'](obj);} catch(e) {} // tslint:disable-line
	}
}
	
export function startVoiceRecord() {
	try {window['psoc_o']['startVoiceRecord']();} catch(e) {} // tslint:disable-line

}
export function stopVoiceRecord() {
	try {window['psoc_o']['stopVoiceRecord']();} catch(e) {} // tslint:disable-line
}
export function uploadFileToServer(deviceUrl: string) {
	try {window['psoc_o']['uploadFileToServer'](deviceUrl);} catch(e) {} // tslint:disable-line
}
export function uploadImageToServer(base64: string) {
	try {window['psoc_o']['uploadImageToServer'](base64);} catch(e) {} // tslint:disable-line 
}
	
export function getStudents(callBack: (arr: any[], isOk: boolean) => void) {
	if (_isDvlp) {
		if(window.top['tsoc_o']) {    // tslint:disable-line
			try {
				window.top['tsoc_o']['getStudents'](callBack); // tslint:disable-line
			} catch(e) {} 
			
		} else {
			callBack([], false);
		}
	} else {
		try {window['tsoc_o']['getStudents'](callBack);} catch(e) {} // tslint:disable-line
	}
}

export function startCamera() {
	if (_isDvlp) return;
	try {
		window['psoc_o']['startCamera'](); // tslint:disable-line
	} catch(e) {}
}
export function startCustomCamera(rect: {top: number, left: number, width: number, height: number}) {
	if (_isDvlp) return;
	try {
		window['psoc_o']['startCustomCamera'](rect); // tslint:disable-line
	} catch(e) {}
}

export function stopCamera() {
	if (_isDvlp) return;
	try {
		window['psoc_o']['stopCamera'](); // tslint:disable-line
	} catch(e) {}
}
export function switchCamera() {
	if (_isDvlp) return;
	try {
		window['psoc_o']['switchCamera'](); // tslint:disable-line
	} catch(e) {}
}
export function startVideoRecord() {
	if (_isDvlp) return;
	try {
		window['psoc_o']['startVideoRecord'](); // tslint:disable-line
	} catch(e) {}
}
export function stopVideoRecord() {
	if (_isDvlp) return;
	try {
		window['psoc_o']['stopVideoRecord'](); // tslint:disable-line
	} catch(e) {}
}
export function uploadInclassReport(obj: any[]) {
	if (_isDvlp) return;
	try {
		window['tsoc_o']['uploadInclassReport'](obj); // tslint:disable-line
	} catch(e) {} 
}

export async function getPreviewResult(data: IPreviewTextMsg[]) {
	return new Promise<IPreviewTextResult[]>((resolve) => {
		
		if (_isDvlp) {
			resolve([]);
		} else {
			let isEnd = false;
			const callBack = (msg: IPreviewTextResult[]) => {
				if(!isEnd) {
					isEnd = true;
					resolve(msg);
				}
			};

			window['tsoc_o']['getPreviewResult'](callBack, data); // tslint:disable-line
			_.delay(() => {
				if(!isEnd) {
					isEnd = true;
					resolve([]);
				}				
			}, 5000);
		}
	});
}

export async function getPreviewDmsResult(data: IPreviewDmsMsg[]) {
	return new Promise<IPreviewTextResult[]>((resolve) => {
		if (_isDvlp) {
			resolve([]);
		} else {
			let isEnd = false;
			const callBack = (msg: IPreviewTextResult[]) => {
				if(!isEnd) {
					isEnd = true;
					resolve(msg);
				}
			};

			window['tsoc_o']['getPreviewDmsResult'](callBack, data); // tslint:disable-line
			_.delay(() => {
				if(!isEnd) {
					isEnd = true;
					resolve([]);
				}				
			}, 5000);
		}
	});
}

export async function getPreviewResultClass(data: IPreviewClassMsg[]) {
	return new Promise<IPreviewResultClassMember[]>((resolve) => {
		if (_isDvlp) {
			resolve([]);
		} else {
			let isEnd = false;
			const callBack = (msg: IPreviewResultClassMember[]) => {
				// console.log('getPreviewResultClass msg', msg);
				if(!isEnd) {
					isEnd = true;
					resolve(msg);
				}
			};

			window['tsoc_o']['getPreviewResultClass'](callBack, data); // tslint:disable-line
			_.delay(() => {
				if(!isEnd) {
					isEnd = true;
					resolve([]);
				}				
			}, 5000);
		}
	});
}

export async function getPreviewResultMember(data: IPreviewMemberMsg[]) {
	return new Promise<IPreviewResultClassMember[]>((resolve) => {
		if (_isDvlp) {
			resolve([]);
		} else {
			let isEnd = false;
			const callBack = (msg: IPreviewResultClassMember[]) => {
				if(!isEnd) {
					isEnd = true;
					resolve(msg);
				}
			};

			window['tsoc_o']['getPreviewResultMember'](callBack, data); // tslint:disable-line
			_.delay(() => {
				if(!isEnd) {
					isEnd = true;
					resolve([]);
				}				
			}, 5000);
		}
	});
}