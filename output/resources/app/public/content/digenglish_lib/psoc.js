(function(comm_o, app_o){
	if(window.psoc_o) return;
	
	var psoc_o = {};
	
	psoc_o.isInited = false;
	psoc_o.popupIdx = -1;
	

		
	if(comm_o.isDvlp){
		psoc_o.initCompleted = function(){
			psoc_o.isInited  =true;
		};
		psoc_o.disableSoftwareKeyboard = function(){

		};
		
		psoc_o.startVoiceRecord = function(){
			app_o.notifyStartVoice();			
		};
		
		var _sampleIdx = 0;
		psoc_o.stopVoiceRecord = function(){
			var idx = _sampleIdx%3;
			app_o.notifyVoiceRecordResult("/content/sample/sample_"+idx+".mp3");	
			
			_sampleIdx++;
		};
		
		psoc_o.uploadFileToServer = function(deviceUrl){
			app_o.notifyUploadToServerResult(deviceUrl);
        };
        psoc_o.uploadImageToServer = function(base64){
			app_o.notifyUploadToServerResult(base64);
		};
		
		var _openerDoc = null;
		var _openerUnload = null;
		var _checkOpener = null;
		_openerUnload = function(){
			window.opener.removeEventListener("beforeunload", _openerUnload);
			window.requestAnimationFrame(_checkOpener);
		};
		
		_checkOpener = function(t){
			if(window.opener==null || window.opener.closed){
				window.close();
				return;
			}else{
				var odoc = window.opener.document;
				
				
				if(odoc && _openerDoc!=odoc && (odoc.readyState=="interactive" || odoc.readyState=="complete")){
					
					_openerDoc = odoc;
					var opr = window.opener;
					
					
					if(opr.tsoc_o){
						opr.tsoc_o.addPopup(window);
						psoc_o.popupIdx = opr.tsoc_o.getPopupIdx(window);
					}else{
						if(!opr.pads) opr.pads=[];
								
						if(opr.pads.indexOf(window)<0){
							opr.pads.push(window);
						}
					}
					window.opener.addEventListener("beforeunload", _openerUnload);
					return;
				}
			}
			window.requestAnimationFrame(_checkOpener);
		};
		window.requestAnimationFrame(_checkOpener);
		
		window.addEventListener("beforeunload", function(){
			if(window.opener){
				window.opener.removeEventListener("beforeunload", _openerUnload);	
			}
		});
		window.addEventListener("unload", function(){
			if(window.opener){
				window.opener.removeEventListener("beforeunload", _openerUnload);	
			}
		});
	}else{
		var _initCallBack = null;
		var _myProfileCallBack = null;
		psoc_o.disableSoftwareKeyboard = function(){
			window.parent.postMessage({ from: 'content', type: 'disableSoftwareKeyboard' }, '*');
		};
		
		psoc_o.initCompleted = function(callBack){
			_initCallBack = callBack;
			
			window.parent.postMessage({ from: 'content', type: 'init' }, '*');
		};
		psoc_o.myProfile = function(callBack){
			_myProfileCallBack = callBack;
			
			window.parent.postMessage({ from: 'content', type: 'getMyProfile' }, '*');
		};
		psoc_o.sendTeacher = function(obj){
			// console.log("psoc_o.sendTeacher", obj);
			// console.log("sendTeacher", JSON.stringify(obj));
			window.parent.postMessage({ from: 'content', type: 'sendMsgToTeacher', msg:obj }, '*');
		};
		psoc_o.startVoiceRecord = function(){
			// console.log("psoc_o.startVoiceRecord");
			window.parent.postMessage({ from: 'content', type: 'startVoiceRecord'}, '*');			
		};
		psoc_o.stopVoiceRecord = function(){
			// console.log("psoc_o.stopVoiceRecord");
			window.parent.postMessage({ from: 'content', type: 'stopVoiceRecord'}, '*');			
		};
		
		psoc_o.uploadFileToServer = function(deviceUrl){
			// console.log("psoc_o.uploadFileToServer");
			window.parent.postMessage({ from: 'content', type: 'uploadFileToServer', msg : {url : deviceUrl}}, '*');		
		};
		psoc_o.uploadImageToServer = function(base64){
			// console.log("psoc_o.uploadFileToServer");
			window.parent.postMessage({ from: 'content', type: 'uploadImageToServer', msg : {src : base64}}, '*');		
		};
		
		psoc_o.uploadStudentReport = function(nType, sData, sOption){
			// console.log("psoc_o.uploadStudentReport", nType, sData, sOption);
			window.parent.postMessage({ type: 'uploadStudentReport', msg: { type: nType, data: {value: sData, option: sOption} }, from: 'content' }, '*');
		};

		psoc_o.startCamera = function(){
			window.parent.postMessage({ from: 'content', type: 'startCamera' }, '*');
		};

		psoc_o.startCustomCamera = function(rect){
			window.parent.postMessage({ from: 'content', type: 'startCustomCamera', msg: rect }, '*');
		};

		psoc_o.stopCamera = function(){
			window.parent.postMessage({ from: 'content', type: 'stopCamera' }, '*');
		};

		psoc_o.switchCamera = function(){
			window.parent.postMessage({ from: 'content', type: 'switchCamera' }, '*');
		};
		psoc_o.startVideoRecord = function() {
			window.parent.postMessage({ from: 'content', type: 'startVideoRecord' }, '*');
		};
		psoc_o.stopVideoRecord = function() {
			window.parent.postMessage({ from: 'content', type: 'stopVideoRecord' }, '*');
		};
		
		window.addEventListener('message', handlePostMessage);
		
		function handlePostMessage(evt) {
			var data = evt.data;
			console.log("handlePostMessage", data.type, data.msg);
			if(data.from=="launcher"){
				if(data.type=="notifyStartContent" && _initCallBack){
					var step;
					var lesson;
					if(data.msg){
						step = data.msg.step;
						lesson = data.msg.lesson;
					}
					_initCallBack.call(null, step, lesson);
					_initCallBack = null;
				}else if(data.type=="notifyMyProfile" && _myProfileCallBack){
					_myProfileCallBack.call(null, data.msg);
					_myProfileCallBack = null;
				}else if(data.type=="notifyReceiveMsg"){
					app_o.receive(data.msg);
				}else if(data.type=="notifyStartVoice"){
					// console.log("notifyStartVoice" + JSON.stringify(data.msg));
					if(data.msg && data.msg.result=="success") app_o.notifyStartVoice();
				}else if(data.type=="notifyVoiceRecordResult"){
					// console.log("notifyVoiceRecordResult" + JSON.stringify(data.msg));
					if(data.msg && data.msg.result=="success"){
						app_o.notifyVoiceRecordResult(data.msg.url);
					}else{
						app_o.notifyVoiceRecordResult(null);
					}
				}else if(data.type=="notifyUploadToServerResult"){
					// console.log("notifyUploadToServerResult" + JSON.stringify(data.msg));
					if(data.msg && data.msg.result=="success"){
						app_o.notifyUploadToServerResult(data.msg.url);
					}else{
						app_o.notifyUploadToServerResult(null);
					}					
				}else if(
					data.type=="notifyStartCamera" || 
					data.type=="notifyStopCamera" || 
					data.type=="notifySwitchCamera" || 
					data.type=="notifyStartVideoRecord" || 
					data.type=="notifyVideoRecordCanceled"
				){
					app_o.notify(data.type);
				}else if(data.type=="notifyVideoRecordResult"){
					// console.log("notifyVideoRecordResult" + JSON.stringify(data.msg));
					if(data.msg && data.msg.result=="success"){
						// console.log("=========================>app_o.notifyVideoRecord", data.msg.url);
						app_o.notifyVideoRecord(data.msg.url);
					}else{
						app_o.notify('notifyStopVideoRecord');
					}
				}
			}
			/*
			  const data = evt.data;
			  if (handler[data.type]) {
				handler[data.type](data.msg);
			  }
			 */
		}
	}
	window.psoc_o = psoc_o;
})(window.comm_o, window.app_o);