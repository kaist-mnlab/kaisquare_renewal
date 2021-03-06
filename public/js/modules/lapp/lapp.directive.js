'use strict';

define(['angular'], function(angular) {

	angular.module('lapp.directives', [])
	.directive('panelBody', function(){
		return {
			restrict:'C',
			scope: false,
			link: function(scope, iElement, iAttrs, controller) { 
				iElement.css({"padding": 0});
			},
		}
	})
	.directive('lappRtclecture', function($http){
		// http://stackoverflow.com/questions/22164969/angularjs-two-way-binding-videos-currenttime-with-directive
		// currentTime of Video 
		return {
			scope:false,

			controller: function($scope, $element){

			},
			link: function(scope, element, attrs){
				var parentScope = scope.$parent.$parent.$parent;

                var session;

//                console.log('gid:' + parentScope.lectureId + 'uid:' + parentScope.user._id);
                parentScope.session.session = session = new CreateMCUSession($http, { gid: parentScope.lectureId, uid: parentScope.user._id, username: parentScope.user.username, width: 640, height: 480 });
                session.onMediaStream = onMediaStream;
                session.onSessionJoined = onSessionJoined;
                session.onSessionClosed = onSessionClosed;
                session.onRecordCompleted = onRecordCompleted;
                session.start();
//                parentScope.session.myRecorder = {message: "hello"};

                function onMediaStream(event) {
//                    event.stream.show('local')
                    event.stream.play('local'); //element ID for localStream
                };

                function onSessionJoined(event) {
                    session.streamAttachment(event.stream, $('#attend_log'));
                };

                function onSessionClosed(event) {
                    session.streamDettachment(event.stream);
                };


                function onRecordCompleted(href) {
                    console.log('onRecordCompleted', href);
                    //Turn it to VOD
                    var lecture = parentScope.lecture;
                    if(typeof lecture !== 'undefined') {
                    	//lecture.duration = parentScope.stopwatch.time();
                    	lecture.status = 0;
                    	lecture.vod_url = href;

                    	lecture.$save(function(p, resp) {
                    		if(!p.error) {
	                            // If there is no error, redirect to the main view
	                            console.log("lecture update complete!");
	                            alert("Lecture Record Completed");
	                            $location.path("/lapp/"+lecture._id);
	                            //window.href =
	                            // $state.go('public.courses.show', { courseId : parentScope.course._id});
                        	} else {
	                        	alert('Could not create course');
	                        }
                    	});
                    }
                    else {
                    	alert('lecture scope problem');
                    }
                };

        }//end link

        }//end return
	})
    .directive('lappRtcstudent', function($http){
		// http://stackoverflow.com/questions/22164969/angularjs-two-way-binding-videos-currenttime-with-directive
		// currentTime of Video 
		return {
			scope: false,
			controller: function($scope, $element){
				
			},
			link: function(scope, element, attrs){
				console.log("LINK!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!");
				var parentScope = scope.$parent.$parent.$parent;
                var session;
                parentScope.session.session = session = new JoinMCUSession($http, { gid: parentScope.lectureId, uid: parentScope.user._id, username: parentScope.user.username, width: 160, height: 120 });

                session.onSessionJoined = onSessionJoined;
                session.onSessionClosed = onSessionClosed;
                session.start();

                function onSessionJoined(event) {
					console.log('----------------------------> Lecture joined');
                    session.streamAttachment(event.stream, $('#remote'));
                };

                function onSessionClosed(event) {
					console.log('----------------------------> Lecture finished');
                    session.streamDettachment(event.stream);
                };

            } //end link
		}
	})
.directive('lappCanvas', function(){
	return {
		scope: false,
		restrict: 'A',
		link: function(scope, element, attrs){
				//console.log($(element[0])[0].children[1]);
				var parentScope = scope.$parent.$parent.$parent;
				var canvas = $(element[0])[0].children[1];
				var ctx = canvas.getContext('2d');
				canvas = $(canvas);
				var socket = scope.socket;

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
					ctx.moveTo(stroke.lastX, stroke.lastY);
					ctx.lineTo(stroke.currentX, stroke.currentY);
					ctx.strokeStyle = stroke.strokeStyle;
					ctx.stroke();
				}
				var left = element.offset().left;
				var top = element.offset().top;
				var lastX;
				var lastY;
				parentScope.canvasStrokeColor = [{color: 'black'},
				{color: 'red'},
				{color: 'blue'},
				{color: 'green'},
				{color: 'white'},
				{color: 'clear'}
				];
				scope.selectColor = function(color){
					console.log(color);
					if (color == "clear"){
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
							socket.emit('canvasDraw', stroke);
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
				
				socket.on('canvasDraw', function(stroke){
					draw(stroke);
				});
			}
		}
	})
.directive('lappPresentation', function(){
	return {
		restrict: 'A',
		scope: false,
		link: function(scope, element, attrs){
			var parentScope = scope.$parent.$parent.$parent;
			
			
			var url = scope.location;
			var ppt = "http://" + url.$$host + ":" + url.$$port + "/uploads/" + scope.lectureId + "/ppt/";

			var fileType = ".png";

			var startNumber = 0;
			var maxNumber = 0;


			var pageNumber = startNumber;

			var slide = $(element[0])[0].children[1];
			var canvas = $(element[0])[0].children[2];
			var ctx = canvas.getContext('2d');

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
			parentScope.moveLeft = function(){
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
			parentScope.moveRight = function(){
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
				o.time = stopwatch.time();
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
				o.time = stopwatch.time();
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
				parentScope.presentationPenColor = [{color: 'black'},
				{color: 'red'},
				{color: 'blue'},
				{color: 'green'},
				{color: 'white'},
				{color: 'clear'}
				];
				parentScope.presentationSelectColor = function(color){
					if (color == "clear"){
						var stroke = {strokeStyle: color};
						penLog(stroke);
						//socket.emit('pptEvent', stroke);
						ctx.clearRect(0, 0, canvas.get(0).width, canvas.get(0).height);
					}
					else 
						ctx.strokeStyle = color;
				};
				
				canvas.bind('mousedown', function(event){
					
					// blocking
					if (parentScope.thisUserCtrl != 8)
						return;
					if (!parentScope.stopwatch.isOn())
						return;
					// end
					
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
				
				socket.on('pptEvent', function(event){
					
					if (event.type == "stroke"){
						drawTrace(event.stroke);						
						if(parentScope.thisUserCtrl == 8){
							var l = penTrace[pageNumber].trace.length - 1;
							if (event.time != penTrace[pageNumber].trace[l].time)
								penTrace[pageNumber].trace.push(event);
						}
					}else if (event.type == "ppt"){
						ctx.clearRect(0, 0, canvas.get(0).width, canvas.get(0).height);
						slide.attr('src', ppt + event.page + fileType);
						drawAllTrace(event.pen, event.time);
						
						if (parentScope.thisUserCtrl == 8)
							var l = eventTrace.length - 1;
							if (event.time != eventTrace[l].time)
								eventTrace.push(event);
					}
				});
				
				// for replay
				var traceLog = [];
				var tracer = null;
				var e = 0;
				var starttime = 0;
				var stoptime = 0;
				parentScope.presentationReplay = function(){
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
					ctx.moveTo(stroke.lastX, stroke.lastY);
					ctx.lineTo(stroke.currentX, stroke.currentY);
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
				
				parentScope.presentationReset = function (){
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
				parentScope.presentationSave = function(){
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
					if(scope.lecture.ppt_event_log !== "")
						pptLog = angular.fromJson(scope.lecture.ppt_event_log);
					else
						pptLog = { penTrace: {}};


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
				parentScope.pptPlay = function(){
                    try {
                        logTracer = setTimeout(pptLogTrace, pptEvents[p].time - scope.currentTime);
                    }catch(err){
                        console.log(err.message);
                    }
				}
				parentScope.pptPause = function(){
					clearTimeout(logTracer);
				}
				parentScope.pptStop = function(){
					clearTimeout(logTracer);
					p = 0;
					ctx.clearRect(0, 0, canvas.get(0).width, canvas.get(0).height);
				}
				parentScope.pptSeeked = function(){
					p = 0;
					while(pptEvents[p+1].time < scope.currentTime){
						p++;
					}
				}
			}
		}
	})
.directive('lappVideo', function(){
		// http://stackoverflow.com/questions/22164969/angularjs-two-way-binding-videos-currenttime-with-directive
		// currentTime of Video 
		return {
			controller: function($scope, $element){
				var s = $scope.$parent.$parent.$parent;
				s.duration = $element[0].duration;
				s.vodElement = $element[0];
				s.onTimeUpdate = function(){
					// using $parent to access $scope in controller
					s.currentTime = $element[0].currentTime * 1000;
					$scope.$apply();
				}
			},
			link: function(scope, element, attrs){
				element.bind('timeupdate', scope.onTimeUpdate);
				element.bind('play', scope.pptPlay);
				element.bind('pause',scope.pptPause);
				element.bind('stop', scope.pptStop);
				element.bind('seeked', scope.pptSeeked);
			}
		}
	})
;



	/*
	.directive('pptPopup', function(){
		return {
			restirct: 'EA',
			link: function($scope, $element, attr){
				$element.on('$destroy', function(){
					$scope.window.close();
				});
			},
			controller: function($scope, $element){
				var ppt_url = $location.$$absUrl.replace("lapp", "ppt");
				$scope.window = $window.open(ppt_url, '_blank');
				angular.element($scope.window.document.body)
					   .append($compile($element.contents())($scope));
			}
		}
	})
*/

});