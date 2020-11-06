(function(app_o, comm_o, tsoc_o){
	if(window.my_o) return;
	

	var href = document.location.href;
	var ns = href.indexOf("/", 10);
	href = href.substring(ns);
	
	var ne = href.indexOf("?");
	if(ne>=0)  href = href.substring(0, ne);
	var arr = href.split("/");
	
	arr.pop();
	arr.pop();
	arr.push("data");
	arr.push("dbook");
	arr.push("");
	window.e_absURL = arr.join("/");

	var _lang = comm_o.getQuery("lang");
	if(_lang==null || _lang == "") _lang = "ko";
	var _isDvlp = comm_o.isDvlp;
	app_o.clear();
	app_o.set(_data, _isDvlp, _lang);

	if(_isDvlp && tsoc_o){
		var padurl = window.location.href;
		var ne = padurl.lastIndexOf("/");	
		padurl = padurl.substring(0, ne);
		ne = padurl.lastIndexOf("/");
		padurl = padurl.substring(0, ne);
		padurl = padurl + "/student/index.html";
		tsoc_o.gotoPAD(padurl);
	}
	var my_o = {};
	var _control = null;
	function _load(){
		return new Promise(function(resolve, reject){
			app_o.importLink('/content/digenglish_lib/B/ls_writing/teacher/import.html').then(
				function(doc){
					var links = doc.querySelectorAll('link[rel=stylesheet]');
					for(var i=0; i<links.length; i++){
						document.head.appendChild(links.item(i));
					}

					var el = doc.body.removeChild(doc.body.firstElementChild);
					document.body.appendChild(el);	
					
					setTimeout(resolve, 100);
					/*
					var cnt = 2;
					app_o.importHTML('/content/digenglish_lib/BASIC/voca/common/ball.svg').then(
						function(el){
							cnt--;
							var page_quiz = document.getElementById("page_quiz");
							var quiz_meaning = page_quiz.querySelector(":scope .quiz_meaning");
							if(quiz_meaning.firstChild) quiz_meaning.insertBefore(el, quiz_meaning.firstChild);
							else quiz_meaning.appendChild(el);	
							if(cnt==0) setTimeout(resolve, 100);
						}
					,	function(err){
							reject(err);
						}
					);	
					app_o.importHTML('/content/digenglish_lib/BASIC/voca/common/egg.svg').then(
						function(el){
							cnt--;
							var page_quiz = document.getElementById("page_quiz");
							var quiz_sound = page_quiz.querySelector(":scope .quiz_sound");
							
							var mc_1 = el;
							var mc_2 = el.cloneNode(true);
							var mc_3 = el.cloneNode(true);
							mc_1.classList.add("mc_1");
							mc_2.classList.add("mc_2");
							mc_3.classList.add("mc_3");
							quiz_sound.appendChild(mc_1);
							quiz_sound.appendChild(mc_2);
							quiz_sound.appendChild(mc_3);
							if(cnt==0) setTimeout(resolve, 100);
						}
					,	function(err){
							reject(err);
						}
					);
					*/
				}
			,	function(err){
					reject(err);
				}
			);
		});
	};
	my_o.player = null;
	my_o.scriptBox = null;
	my_o.init = function(){
		
		_load().then(
			function(){
				app_o.render();

				var chkPopup = null;
				chkPopup = function(t){
					var students = [];
					

					if(_isDvlp){
						
						if(tsoc_o){
							
							tsoc_o.getStudents(function(arr, isOk){
									// console.log(arr, isOk);
								if(isOk){
									app_o.init(arr, "어휘", "연습", true, true);
									app_o.start();
									
								}else{
									//console.log("chkPopup - wait");
									window.requestAnimationFrame(chkPopup);
								}
									
							});
							/*
							for(var i=0; i<tsoc_o.popups.length; i++){
								var popup = tsoc_o.popups[i];
								if(!popup.psoc_o){
									window.requestAnimationFrame(chkPopup);
									return;
								}else if(!popup.psoc_o.isInited){
									window.requestAnimationFrame(chkPopup);
									return;								
								}
								students[i] = tsoc_o.getStudent(i);
							}
							*/
						}else{
							app_o.init(students, "어휘", "연습", true, true);
							app_o.start();
						}
						
					}else{
						/*
						tsoc_o.getPreviewResult(function(data){
							// console.log(data);	
						});
						*/
						tsoc_o.getStudents(function(arr, isOk){
							for(var i=0; i<arr.length;i++){
								var data = arr[i];
								students[i] = {
									id : data.id
								,	name : data.name
								,	thumb : data.defaultThumbnail
								,	avatar : data.profileThumbnail
								,	nickname : data.nickName
								,	displayMode: data.displayMode
								};									
								
							}
								
							tsoc_o.initComplete(
								function(step, lesson){
									if(!lesson || lesson=="") lesson = "어휘";
									if(!step || step=="") step = "연습";
									
									app_o.init(students, step, lesson, true, true);
									app_o.start();
								}
							);
						});
					}
				}

				setTimeout(chkPopup, 300);
			}
		,	function(){
			
			}
		);
	};
	window.my_o = my_o;	
})(app_o, comm_o, (comm_o.isDvlp)?window.top.tsoc_o:window.tsoc_o);

document.addEventListener("DOMContentLoaded", function(event) {	
	my_o.init();
});
function _movePrev(){
	//window.parent.postMessage({ from: 'content', type: 'movePrevContent' }, '*');
}