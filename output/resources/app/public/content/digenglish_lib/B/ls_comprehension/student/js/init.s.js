(function(app_o, psoc_o){
	if(window.my_o) return;
	var _lang = comm_o.getQuery("lang");
	if(_lang==null || _lang == "") _lang = "ko";
	var _isDvlp = comm_o.isDvlp;
	app_o.set(_data, _isDvlp, _lang);

	function _load(){
		return new Promise(function(resolve, reject){
			app_o.importLink('/content/digenglish_lib/B/ls_comprehension/student/import.html').then(
				function(doc){
					// console.log(doc);

					var links = doc.querySelectorAll('link[rel=stylesheet]');
					for(var i=0; i<links.length; i++){
						document.head.appendChild(links.item(i));
					}

					var el = doc.body.removeChild(doc.body.firstElementChild);
					document.body.appendChild(el);	
					
					setTimeout(resolve, 100);					
				}
			,	function(err){
					// console.log(err);
					reject(err);
				}
			);
		});
	};
	
	var my_o = {};
	my_o.init = function(){
		_load().then(
			
			function(){
				
				app_o.render();
				if(_isDvlp){
					var student = {
						id : window.name
					,	name : window.name
					,	thumb : ""
					,	displayMode: comm_o.displayMode
					};
					
					
					if(psoc_o.popupIdx<0){
						window.requestAnimationFrame(chkFnc);
						return;	
					}
					
					app_o.init(student, "WORD LEARNING", "Lesson 1");
					psoc_o.initCompleted();
				}else{
					psoc_o.myProfile(function(data){
						var student = {
							id : data.id
						,	name : data.name
						,	thumb : data.defaultThumbnail
						,	avatar : data.profileThumbnail
						,	nickname : data.nickName
						,	displayMode: data.displayMode
						}
						var point = 90;
						psoc_o.initCompleted(
							function(step, lesson){
								if(!lesson || lesson=="") lesson = "Lesson 1";
								if(!step || step=="") step = "WORD LEARNING";
								app_o.init(student, step, lesson);
							}
						);
					});							
					
				}
			}
		,	function(){
			
			}
		);
	};
	window.my_o = my_o;	
})(app_o, psoc_o);
document.addEventListener("DOMContentLoaded", function(event) {
	my_o.init();
});