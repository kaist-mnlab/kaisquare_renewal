
define(['angular', '/socket.io/socket.io.js'], function(angular) {
	
	angular.module('lapp.ppt', ['security', 'ui.bootstrap', 'lecture.service', 'lapp.service' ])
	
	.controller('PPTCtrl', 
	[ '$scope', '$stateParams', '$location', 'lectureService','socket','security', function($scope,$stateParams,$location, lectureService,socket, security){
		
		$scope.location = $location;
		$scope.lectureId = $stateParams.lectureId;
		$scope.lecture = lectureService.getLecture();
		$scope.user = security.user;
		$scope.socket = socket;
		$scope.stopwatch = lectureService.getStopwatch();
		
	}])

	.directive('lappPresentation', function(){
		return {
			scope:false,
			controller: function($scope, $element){
	
			},
			link: function(scope, element, attrs){
				$("#topwrapper").remove();
				$("div.container").css({margin:0, padding:0});
				
				var url = scope.location;
				var ppt = "http://" + url.$$host + ":" + url.$$port + "/uploads/" + scope.lectureId + "/ppt/";
				
				var fileType = ".png";
	
				var startNumber = 0;
				var maxNumber = 0;
	
	
				var pageNumber = startNumber;
				
				var slide = $(element[0])[0].children[1];
				var canvas = $(element[0])[0].children[2];
				var ctx = canvas.getContext('2d');
				
				var dbPPTWidth = 320;
				var dbPPTHeight = 240;
				
				slide.width = canvas.width = $(window).width();
				slide.height = canvas.height =  $(window).height()-100;
				
				var widthScale = slide.width/dbPPTWidth;
				var heightScale = slide.height/dbPPTHeight;
				
				var slide = $(slide);
				
				var stopwatch = scope.stopwatch;
				var eventTrace = [];
				var penTrace = {};
				
				maxNumber = scope.lecture.ppt_page;
				if (maxNumber === undefined || maxNumber == 0){
					maxNumber = 10;
				}
				
				
				for (var i = startNumber; i < maxNumber; i++){
					penTrace[i] = {};
					penTrace[i].clearPoint = 0;
					penTrace[i].trace = [];
				}
	
				slide.attr('src', ppt + pageNumber + fileType);
				scope.moveLeft = function(){
					if(pageNumber == startNumber){
						pageNumber = maxNumber - 1;
					}else{
						pageNumber -= 1;
					}
	
					pptLog(pageNumber);
					ctx.clearRect(0, 0, canvas.get(0).width, canvas.get(0).height);
					slide.attr('src', ppt + pageNumber + fileType);
					
					drawAll(penTrace[pageNumber]);
				}
				scope.moveRight = function(){
					if(pageNumber == maxNumber - 1){
						pageNumber = startNumber;
					}else{
						pageNumber += 1;
					}
					pptLog(pageNumber);
					
					ctx.clearRect(0, 0, canvas.get(0).width, canvas.get(0).height);
					slide.attr('src', ppt + pageNumber + fileType);
					
					drawAll(penTrace[pageNumber]);
				}
				var canvas = $(canvas);
				var socket = scope.socket;
				
				canvas.css({"margin-top": - canvas.height()});
			
				var isDrawing = false;
				ctx.lineWidth = 1.0;
				ctx.miterLimit = 1.0;
				ctx.strokeStyle = "black";
				
				function getMousePosition(event){
					var x, y;
					if(event.offsetX!==undefined){
						x = event.offsetX;
						y = event.offsetY;
					}else{
						x = event.layerX - event.currentTarget.offsetLeft;
						y = event.layerY - event.currentTarget.offsetTop;
					}
					return {x: x, y: y};
				}
				function draw(stroke){
					penLog(stroke);
					
					ctx.moveTo(stroke.lastX, stroke.lastY);
					ctx.lineTo(stroke.currentX, stroke.currentY);
					ctx.strokeStyle = stroke.strokeStyle;
					ctx.stroke();
				}
				function penLog(stroke){
					if (stopwatch === undefined)
						stopwatch = scope.stopwatch;
					var o = new Object();
					o.type = "stroke";
					o.stroke = stroke;
					
					//stroke scaling
					o.stroke = {lastX: o.stroke.lastX / widthScale, 
							  lastY: o.stroke.lastY / heightScale, 
							  currentX: o.stroke.currentX / widthScale, 
							  currentY: o.stroke.currentY / heightScale,
							  strokeStyle: ctx.strokeStyle};
					
					//o.time = stopwatch.time();
					o.time = -1;
					if (stroke.strokeColor == "clear"){
						penTrace[pageNumber].clearPoint = penTrace[pageNumber].length;
					}
					
					penTrace[pageNumber].trace.push(o);
					
					socket.emit('pptEvent', o);
				}
				function pptLog(page){
					if (stopwatch === undefined)
						stopwatch = scope.stopwatch;
					var o = new Object();
					o.type = "ppt";
					o.page = page;
					//o.time = stopwatch.time();
					o.time = -1;
					eventTrace.push(o);

					// need to optimize
					if (penTrace[page].clearPoint != 0){
						//o.pen = penTrace[page].trace[]
						var t = penTrace[page].trace;
						o.pen = t.slice(t.clearPoint, t.length);
					}else {
						o.pen = penTrace[page].trace;
					}
	
					socket.emit('pptEvent', o);
					delete o.pen;
				}
				function drawAll(strokes){
					for (var i = strokes.clearPoint; i < strokes.length; ++i){
						var stroke = strokes.trace[i].stroke;
						if (stroke.strokeStyle == "clear"){
							ctx.clearRect(0, 0, canvas.get(0).width, canvas.get(0).height);
							continue;
						}
						ctx.beginPath();
						ctx.moveTo(stroke.lastX, stroke.lastY);
						ctx.lineTo(stroke.currentX, stroke.currentY);
						ctx.strokeStyle = stroke.strokeStyle;
						ctx.stroke();
					}
				}
				
				var left = element.offset().left;
				var top = element.offset().top;
				var lastX;
				var lastY;
				scope.presentationPenColor = [{color: 'black'},
				                           {color: 'red'},
				                           {color: 'blue'},
				                           {color: 'green'},
				                           {color: 'white'},
				                           {color: 'clear'}
				                           ];
				scope.presentationSelectColor = function(color){
					if (color == "clear"){
						var stroke = {strokeStyle: color};
						penLog(stroke);
						
						socket.emit('pptEvent', stroke);
						ctx.clearRect(0, 0, canvas.get(0).width, canvas.get(0).height);
					}
					else 
						ctx.strokeStyle = color;
				};
				
				canvas.bind('mousedown', function(event){
					var point = getMousePosition(event);
					lastX = point.x;
					lastY = point.y;
					
					ctx.beginPath();
					
					isDrawing = true;
				});
				canvas.bind('mousemove', function(event){
					var point;
					var currentX, currentY;
					var stroke;
					
					if (isDrawing){
						point = getMousePosition(event);
						currentX = point.x;
						currentY = point.y;
						
						stroke = {lastX: lastX, 
								  lastY: lastY, 
								  currentX: currentX, 
								  currentY: currentY,
								  strokeStyle: ctx.strokeStyle};
						
						draw(stroke);
						lastX = currentX;
						lastY = currentY;
					}
				});
				canvas.bind('mouseup', function(event){
					isDrawing = false;
				});
				canvas.bind('mouseout', function(event){
					isDrawing = false;
				});
				socket.on('connected',function(){
					console.log('KAISquare Lecture connected');
					socket.emit('listenLecture',  scope.lectureId);
			    	
				});
				socket.on('pptEvent', function(event){
					//console.log("pptEvent");
					if (event.type == "stroke"){
						drawTrace(event.stroke);
					}else if (event.type == "ppt"){
						ctx.clearRect(0, 0, canvas.get(0).width, canvas.get(0).height);
						slide.attr('src', ppt + event.page + fileType);
						drawAllTrace(event.pen, event.time);
					}
				});
				
				// for replay
				var traceLog = [];
				var tracer = null;
				var e = 0;
				var starttime = 0;
				var stoptime = 0;
				scope.presentationReplay = function(){
					e = 0;
					starttime = 0;
					stoptime = 0;
					ctx.clearRect(0, 0, canvas.get(0).width, canvas.get(0).height);
					slide.attr('src', ppt + startNumber + fileType);
					
					// timeout based event tracing
					traceLog = [];
					for (var i in penTrace){
						penTrace[i].trace.sort(function(a, b){return a.time - b.time});
						traceLog = traceLog.concat(penTrace[i].trace);
					}
					traceLog = traceLog.concat(eventTrace);
					traceLog.sort(function(a, b){return a.time - b.time});
					
					tracer = setTimeout(startTrace, traceLog[e].time);
					
					starttime = (new Date()).getTime(); 			
					
				}
				
				function startTrace(){
					//console.log(e);
					var event = traceLog[e++];
					if (event.type == "stroke"){
						drawTrace(event.stroke);
					}else if (event.type == "ppt"){
						ctx.clearRect(0, 0, canvas.get(0).width, canvas.get(0).height);
						slide.attr('src', ppt + event.page + fileType);
						drawAllTrace(penTrace[event.page].trace, event.time);
					}
					
					if (e < traceLog.length){
						tracer = setTimeout(startTrace, traceLog[e].time - traceLog[e - 1].time);
					}else{
						console.log("stop trace debug: " + (traceLog.length == e));
						stoptime = (new Date()).getTime();
						console.log("diff: " + traceLog[e - 1].time + " " + (stoptime-starttime));
						clearTimeout(tracer);
					}
				}
				
				function drawTrace (stroke){
					if (stroke.strokeStyle == "clear"){
						ctx.clearRect(0, 0, canvas.get(0).width, canvas.get(0).height);
						return;
					}
					ctx.beginPath();
					ctx.moveTo(stroke.lastX * widthScale, stroke.lastY * heightScale);
					ctx.lineTo(stroke.currentX * widthScale, stroke.currentY * heightScale);
					ctx.strokeStyle = stroke.strokeStyle;
					ctx.stroke();
				}
				function drawAllTrace(strokes, time) {
					for (var i in strokes){
						var stroke = strokes[i].stroke;
						if (strokes[i].time > time) break;
						drawTrace(stroke);
					}
				}
				
				scope.presentationReset = function (){
					eventTrace = [];
					penTrace = {};
					for (var i = startNumber; i < maxNumber; i++){
						penTrace[i] = {};
						penTrace[i].clearPoint = 0;
						penTrace[i].trace = [];
					}
					ctx.clearRect(0, 0, canvas.get(0).width, canvas.get(0).height);
					slide.attr('src', ppt + startNumber + fileType);
					pptLog(startNumber);
				}
				scope.presentationSave = function(){
					var log = {};
					log.penTrace = penTrace;
					log.eventTrace = eventTrace;
					angular.toJson(log);
					
					socket.emit('pptSave', angular.toJson(log));
				}
				
				// vod ppt play
				var pptEvents = [];
				var pptLog;
				var pptPages = maxNumber;
				var p = 0;
				var logTracer;
				
				if(scope.lecture.status == 0){
			    	pptLog = angular.fromJson(scope.lecture.ppt_event_log);
			    	
			    	pptEvents = [];
					for (var i in pptLog.penTrace){
						pptEvents = pptEvents.concat(pptLog.penTrace[i].trace);
					}
					pptEvents = pptEvents.concat(pptLog.eventTrace);
					pptEvents.sort(function(a, b){return a.time - b.time});
					p = 0;
				}
			
				function pptLogTrace(){
					//console.log(p);
					var event = pptEvents[p++];
					if (event.type == "stroke"){
						drawTrace(event.stroke);
					}else if (event.type == "ppt"){
						ctx.clearRect(0, 0, canvas.get(0).width, canvas.get(0).height);
						slide.attr('src', ppt + event.page + fileType);
						drawAllTrace(pptLog.penTrace[event.page].trace, event.time);
					}
					if (p < pptEvents.length){
						logTracer = setTimeout(pptLogTrace, pptEvents[p].time - pptEvents[p - 1].time);
					}else{
						clearTimeout(logTracer);
					}
				}
				scope.pptPlay = function(){
					logTracer = setTimeout(pptLogTrace, pptEvents[p].time - scope.currentTime);
				}
				scope.pptPause = function(){
					clearTimeout(logTracer);
				}
				scope.pptStop = function(){
					clearTimeout(logTracer);
					p = 0;
					ctx.clearRect(0, 0, canvas.get(0).width, canvas.get(0).height);
				}
				scope.pptSeeked = function(){
					p = 0;
					while(pptEvents[p+1].time < scope.currentTime){
						p++;
					}
				}
			}
		}
	});

	;

});