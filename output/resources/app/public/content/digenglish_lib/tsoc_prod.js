(function(comm_o, app_o){
	if(comm_o.isDvlp || window.tsoc_o) return;
	
	var tsoc_o = {};
	
	var _initCallBack = null;
	var _studentsCallBack = null;
	var _previewCallBack = null;
	
	tsoc_o.initComplete = function(callBack){
		_initCallBack = callBack;
		window.parent.postMessage({ from: 'content', type: 'init' }, '*');		
	}
	tsoc_o.getStudents = function(callBack){
		// console.log("tsoc_o.getStudents", callBack);
		_studentsCallBack = callBack;
		window.parent.postMessage({ from: 'content', type: 'getLoginStudentsProfile' }, '*');
	}
	
	tsoc_o.gotoPAD = function(url){

	};
	tsoc_o.sendAll = function(obj){
		if(obj) window.parent.postMessage({ from: 'content', type: 'broadcastMsgToStudents', msg:obj }, '*');
		else window.parent.postMessage({ from: 'content', type: 'broadcastMsgToStudents', msg:{} }, '*');
		//if(obj) alert("tsoc_o.sendAll" + JSON.stringify(obj));
	}
	tsoc_o.sendPADToID = function(id, obj){
		
		// console.log("tsoc_o.sendPADToID", id, obj);
		if(obj) window.parent.postMessage({type: 'sendMsgToStudent', from: 'content', msg:{id:id, data:obj} }, '*');
		else window.parent.postMessage({type: 'sendMsgToStudent', from: 'content', msg:{id:id, data:{}} }, '*');
		//if(obj) alert("tsoc_o.sendAll" + JSON.stringify(obj));
	}
	
	tsoc_o.sendTeacher = function(obj){

	}

	tsoc_o.hideTitleBar = function(){
		window.parent.postMessage({ type: 'hideContentToolTitlebar', from: 'content' }, '*');
	}
	tsoc_o.showTitleBar = function(){
		window.parent.postMessage({ type: 'showContentToolTitlebar', from: 'content' }, '*');
	}	
	tsoc_o.setTitleBar = function(data){}
	tsoc_o.gotoNextBook = function(){
		window.parent.postMessage({ type: 'moveNextContent', from: 'content' }, '*');
	};
	tsoc_o.gotoPrevBook = function(){
		window.parent.postMessage({ type: 'movePrevContent', from: 'content' }, '*');
	};
	
	tsoc_o.getPreviewResult = function(callBack, msg){
		_previewCallBack = callBack;
		try{
			window.parent.postMessage({ type: 'getPreviewResult', from: 'content', msg: msg }, '*');
		}catch(e){
			callBack.call(null, []);
			_previewCallBack = null;
		}
	};
	tsoc_o.getPreviewDmsResult = function(callBack, msg){
		_previewCallBack = callBack;
		try{
			window.parent.postMessage({ type: 'getPreviewDmsResult', from: 'content', msg: msg }, '*');
		}catch(e){
			callBack.call(null, []);
			_previewCallBack = null;
		}
	};
	tsoc_o.getPreviewResultMember = function(callBack, msg){
		_previewCallBack = callBack;
		try{
			window.parent.postMessage({ type: 'getPreviewResultMember', from: 'content', msg: msg }, '*');
		}catch(e){
			callBack.call(null, []);
			_previewCallBack = null;
		}
	};

	tsoc_o.getPreviewResultClass = function(callBack, msg){
		_previewCallBack = callBack;
		try{
			//console.log('=====> tsoc_o.getPreviewResultClass ', msg);
			window.parent.postMessage({ type: 'getPreviewResultClass', from: 'content', msg: msg }, '*');
		}catch(e){
			callBack.call(null, []);
			_previewCallBack = null;
		}
	};

	tsoc_o.startStudentReportProcess = function(nType, students, viewType){
		
		// console.log("mm->tsoc_o.startStudentReportProcess", nType, students);	
		if(viewType) {
			if(students) window.parent.postMessage({ type: 'startStudentReportProcess', msg: { type: nType, viewType: viewType, data : {studentIdList:students} }, from: 'content'}, '*');
			else window.parent.postMessage({ type: 'startStudentReportProcess', msg: { type: nType, viewType: viewType }, from: 'content'}, '*');
		} else {
			if(students) window.parent.postMessage({ type: 'startStudentReportProcess', msg: { type: nType, data : {studentIdList:students} }, from: 'content'}, '*');
			else window.parent.postMessage({ type: 'startStudentReportProcess', msg: { type: nType}, from: 'content'}, '*');

		}


	};

	tsoc_o.showStudentReportListPage = function(){
		window.parent.postMessage({ type: 'showStudentReportListPage', from: 'content'}, '*');
	};
	tsoc_o.hideStudentReportListPage = function(){
		window.parent.postMessage({ type: 'hideStudentReportListPage', from: 'content'}, '*');
	};

	tsoc_o.hideStudentReportUI = function(){
		// console.log("mm->tsoc_o.hideStudentReportUI");	
		window.parent.postMessage({ type: 'hideStudentReportUI', from: 'content'}, '*');
	}
	tsoc_o.showStudentReportUI	= function(){
		// console.log("mm->tsoc_o.hideStudentReportUI");	
		window.parent.postMessage({ type: 'showStudentReportUI', from: 'content'}, '*');
  }
  tsoc_o.uploadInclassReport = function(obj){
		window.parent.postMessage({type: 'uploadInclassReport', msg: obj, from: 'content'}, '*')
	}
	tsoc_o.finishContentPage = function() {
		window.parent.postMessage({ type: 'finishContentPage', from: 'content' }, '*');
	}
	tsoc_o.addStudentForStudentReportType6 = function(studentid){
		window.parent.postMessage({ type: 'addStudentForStudentReportType6',  msg: { studentId: studentid }, from: 'content'}, '*');
    };
    
	window.addEventListener('message', handlePostMessage);
	
	function handlePostMessage(evt) {
		var data = evt.data;
		// console.log("handlePostMessage", data);
		// alert(JSON.stringify(data));
		// console.log(data.from, data.type, JSON.stringify(data));
		if(data.from=="launcher"){
			if(data.type=="notifyStartContent" && _initCallBack){
				var step;
				var lesson;
				if(data.msg){
					step = data.msg.step;
					lesson = data.msg.lesson;
				}
				// console.log("notifyStartContent", step, lesson);
				_initCallBack.call(null, step, lesson);
				_initCallBack = null;
			}else if(data.type=="notifyLoginStudentsProfile" && _studentsCallBack){
				// console.log("handlePostMessage-->notifyLoginStudentsProfile", data);
				_studentsCallBack.call(null, data.msg, true);
				_studentsCallBack = null;
			}else if(data.type=="notifyReceiveMsg"){
				//alert("aaaaaaaa" + app_o + "," + app_o.receive);
				app_o.receive(data.msg);
			}else if(data.type=="notifyPreviewResult" && _previewCallBack){
				//alert("aaaaaaaa" + app_o + "," + app_o.receive);
				//app_o.receive(data.msg);
				// console.log("aaaaaaa", data);
				_previewCallBack.call(null, data.msg);
				_previewCallBack = null;
			}else if(data.type=="notifyPreviewResultClass" && _previewCallBack){
				_previewCallBack.call(null, data.msg);
				_previewCallBack = null;
			}else if(data.type=="notifyPreviewResultMember" && _previewCallBack){
				_previewCallBack.call(null, data.msg);
				_previewCallBack = null;
			}else if(data.type=="notifyPreviewDmsResult" && _previewCallBack){
				//alert("aaaaaaaa" + app_o + "," + app_o.receive);
				//app_o.receive(data.msg);
				// console.log("aaaaaaa", data);
				_previewCallBack.call(null, data.msg);
				_previewCallBack = null;
			}else if(data.type=="notifyStartTeachingTool"){
				app_o.teachingTool(true);
			}else if(data.type=="notifyFinishTeachingTool"){
				app_o.teachingTool(false);
			}else if(data.type=="notifyUploadInclassReportResult"){
				app_o.receive(data.msg);
				// console.log('notifyUploadInclassReportResult: ', data.msg.result)
			}
		}
		/*
		  const data = evt.data;
		  if (handler[data.type]) {
			handler[data.type](data.msg);
		  }
		 */
	}

	window.tsoc_o = tsoc_o;
})(window.comm_o, window.app_o);