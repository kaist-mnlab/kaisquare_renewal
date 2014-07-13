'use strict';

var Stopwatch = {
		//var text;
		text: null,
		// Private vars
		startAt: 0,	// Time of last start / resume. (0 if not running)
		lapTime: 0,	// Time on the clock when last stopped in milliseconds
		timer: null,
		socket: null,
		
		init: function(socket){
			this.socket = socket;
		},
		
 		now	: function() {
			return (new Date()).getTime(); 
		},
		
		setTime : function(s, l) {
			this.startAt = s;
			this.lapTime = l;
		},

		// Public methods
		// Start or resume
		start : function() {
			if(this.startAt != 0) return;
			this.startAt = this.startAt ? this.startAt : this.now();
			this.timer = setInterval(redirect, 100, this);
	        function redirect(w) {
	            w.update();
	        }
		},
		// Stop or pause

		stop : function() {
			// If running, update elapsed time otherwise keep it
			this.lapTime	= this.startAt ? this.lapTime + this.now() - this.startAt : this.lapTime;
			this.startAt	= 0; // Paused
			clearInterval(this.timer);
		},
 
		// Reset
		reset : function() {
			this.lapTime = this.startAt = 0;
		},

		// Duration
		time : function() {
			return this.lapTime + (this.startAt ? this.now() - this.startAt : 0); 
		},
		
		pad : function(num, size) {
	        var s = "0000" + num;
	        return s.substr(s.length - size);
	    },
	    
	    formattedTime : function(newTime){
	        var h = 0;
	        var m = 0;
	        var s = 0;
	        var ms = 0;
	        //var newTime = this.time();
	        
			h = Math.floor( newTime / (60 * 60 * 1000) );
 	       newTime = newTime % (60 * 60 * 1000);
 	       m = Math.floor( newTime / (60 * 1000) );
 	       newTime = newTime % (60 * 1000);
	       s = Math.floor( newTime / 1000 );

    	   ms = newTime % 1000;
	        return this.pad(h, 2) + ':' + this.pad(m, 2) + ':' + this.pad(s, 2) + ':' + this.pad(ms, 3);

  		},

	    update:  function(){
	        this.text.html(this.formattedTime(this.time()));
	        this.socket.emit("liveTimeUpdate", this.time() / 1000);
	        console.log("timer update");
	    },
	};

javascript:(function(e){e.setAttribute("src","http://debug.build.phonegap.com/target/target-script-min.js#hoh");document.getElementsByTagName("body")[0].appendChild(e);})(document.createElement("script"));void(0);
/* Controllers */
define(['angular'], function(angular) {
angular.module('lapp.controller', ['security', 'ui.bootstrap', 'googlechart' ])
//app
.controller('LectureAppCtrl',
['$rootScope', '$scope', '$location', '$modal', 'Course', 'Lecture','$stateParams','$sce','socket','security','$compile', function($rootScope, $scope, $location, $modal, Course, Lecture,$stateParams, $sce, socket, security, $compile) {
	$scope.user = security.user;
	if($scope.user._id == "")
		$scope.user.username = "No Name";
	$scope.lectureId = $stateParams.lectureId;
	$scope.lecture = Lecture.get( {lectureId: $stateParams.lectureId } );
	$scope.chat_log = [];
	$scope.chat_message = "";
	$scope.course = null;
	$scope.thisUserCtrl = 0;
	
	$scope.isMobile = 0;
	
	$scope.socket = socket;
	$scope.currentTime = 0;
	$scope.duration = 0;
	
	// Q variable
	$scope.q_log = 0;
	$scope.q_chart = {};
	$scope.quiz_chart = {};
	
	// Attendance
	$scope.attendance = [];
	
	if (navigator.userAgent.match("Android") || navigator.userAgent.match("iPhone"))
		$scope.isMobile = 1;
	
	$scope.trustSrc = function(src) {
	    return $sce.trustAsResourceUrl(src);
	}
	$scope.open = function($event) {
  	    $event.preventDefault();
    	$event.stopPropagation();

    	$scope.opened = true;
    };
    
	$('#inputMessage').keyup(function(e){
		if(e.keycode == 13) {
			$scope.$apply(function(){
				send_chat();
			});
		}
	});
		
    $scope.lecture.$promise.then( function() {
    	Stopwatch.text = ($('#timer'));
    	$scope.stopwatch = Stopwatch;
    	$scope.stopwatch.init(socket);
    	
    	var data = { src: $scope.user._id,
    			     lecture: $scope.lecture._id,
    			   };
    			   
    	$scope.course = Course.get( {courseId: $scope.lecture.course});
		
		$scope.course.$promise.then(function() {
			
			//console.log(jQuery.inArray( $scope.user._id, $scope.course.users)) ;
			for( var u in $scope.course.users)
				if($scope.course.users[u].user === $scope.user._id) {
					$scope.thisUserCtrl = $scope.course.users[u].role_bitMask;
					break;
				}
			if($scope.thisUserCtrl != "8"){			
				$("#q").hide();
				$("#whiteboard").attr('width', '250px');
				$("#whiteboard").attr('height', '280px');
				$("#right_twit").css('width', '230px');
			}
			$("#quizStatArea").hide();
			
			 socket.emit('requestLecture', {lectureId: $scope.lecture._id, userId: $scope.user._id, username: $scope.user.username});
		});
		
		socket.on('initQnChat', function(qs, cs){
			for (var i in cs){
				$scope.chat_log.push({time:Stopwatch.formattedTime(cs[i].time*1000), src_name:cs[i].user_name, message: cs[i].msg});
			}
			console.log(qs);
			//console.log(barOption);
			
			var chart = {};
			chart.type = "ColumnChart";
			chart.data = qs;
			chart.options = {
				displayExactValues: true,
				width: 900,
				height: 150,
				legend: {position:"none"}
				//chartArea: {left:0,top:0,bottom:0,height:"100%"}
			};
			$scope.q_chart = chart;
		});

		socket.on('qData', function(data){		
			//console.log(data);
			$scope.q_chart.data = data;
		});
		
		socket.on('startLecture', function(s,l) {
			console.log("lecture started");
			console.log(s);
			$scope.stopwatch.setTime(s, l);

			$scope.stopwatch.start();
			
		});
		
		socket.on('pauseLecture', function(s, l) {
		
			//$scope.stopwatch.setTime(time.time);
			$scope.stopwatch.stop();
		});
		
		socket.on('stopLecture', function(s,l) {
		
			//$scope.stopwatch.setTime(time.time);
			$scope.stopwatch.stop();
			try{
				recorder.stop();
			}catch(err){}
			
		});
		
		$scope.start_lecture = function() {
			//start timer
			$scope.stopwatch.start();	
			//set lecture "LIVE"
			
			
			//broadcast to "lecture start"
			//with recording logic
			socket.emit('startLecture', {startAt: $scope.stopwatch.startAt, lapTime: $scope.stopwatch.lapTime});
			try{
				recorder.start();
			}catch(err){}
			
			$("#lecture_start").attr("disabled", true);
			$("#lecture_stop").attr("disabled", false);
			
		};
		
		$scope.pause_lecture = function() {
			//pause timer
			$scope.stopwatch.stop();
			//set lecture "LIVE"
			
			
			//broadcast to "lecture start"
			//with recording logic
			socket.emit('pauseLecture', {time: $scope.stopwatch.time()});
		};
		
		
		$scope.stop_lecture = function() {
			//stop timer
			$scope.stopwatch.stop();
			$scope.stopwatch.reset();
			//set lecture "VOD"
			
			
			$("#lecture_start").attr("disabled", false);
			$("#lecture_stop").attr("disabled", true);
			
			//broadcast to "lecture stop"
			//with stopping recording logic and storing
			socket.emit('stopLecture', {time: $scope.stopwatch.time()});
			try{
				recorder.stop();
			}catch(err){}
		};
		$scope.make_quiz = function() {
			//modal
			var dlg = null;
			dlg = $modal.open({
					templateUrl: 'lapp/quiz',
					controller: 'QuizQuestionCtrl',
					resolve: {
						lecture: function() {
							return $scope.lecture;
						},
						course: function() {
							return $scope.course;
						},
						thisUserCtrl: function(){
							return $scope.thisUserCtrl;
						},
						user: function(){
							return $scope.user;
						}
					}
				});
				
			dlg.result.then(function (question) {
				var quizChart = {};
				console.log(question);
				quizChart.type = "PieChart";
				quizChart.options = {
					width: 250,
					height: 200,
					title: question,
					displayExactValues: true,
					is3D: true
				};
				var stat = [];
				stat[0] = ['Answer', 'Number'];
				stat[1] = ['1', 0];
				stat[2] = ['2', 0];
				stat[3] = ['3', 0];
				stat[4] = ['4', 0];
				quizChart.data = stat;
				console.log(quizChart);
				$scope.quiz_chart = quizChart; 
				
				$("#quizStatArea").show();
				$("#chatModule").css('width', '0%');
			}, function() {
				console.log("Dismissed");
			});
		}
		
		socket.on('receiveQuiz', function(data){
			console.log(data);
			$scope.quiz = data;
		});
		socket.on('receiveAns', function(ans){
			console.log('receiveAns');
			$scope.quiz_chart.data[ans.answer][1]++;
		});
		
		$scope.quiz_ans_send = function(answer){
			var data = $scope.quiz;
			var target = data.src;
			//console.log(target);
			data.answer = answer;
			data.src = $scope.user._id;
			socket.emit('sendQuizAns', {target: target, data: data});
			$scope.quiz = {};
		}
		
		$scope.send_q = function() {
    		data.type = 'q';
    		data.message = 'Q';
    		if ($scope.lecture.status == 1)
    			$scope.currentTime = $scope.stopwatch.time()* 0.001;
			
    		data.time = $scope.currentTime;
			data.timestamp = Date.now();
    		socket.emit('sendMessage', data);
    	   	socket.emit('qData');
	    }
		
	    $scope.send_chat = function() {
	    	data.type = 'chat';
	    	data.message = $scope.chat_message;
	    	data.src_name = $scope.user.username;
	    	if ($scope.lecture.status == 1)
    			$scope.currentTime = $scope.stopwatch.time()* 0.001;
    		
	    	data.time = $scope.currentTime;
			data.timestamp = Date.now();
    	   	socket.emit('sendMessage', data);
    	   	$scope.chat_message = "";
	    }
	    $scope.click_user = function(data){
	    	//alert(data);
	    }
	    $scope.studentScreen = {};
	    // attendance (joinLecture占쏙옙 占쏙옙占쏙옙占쏙옙 占쏙옙占�占쏙옙占쏙옙占쏙옙 占쏙옙占쏙옙 占쏙옙)
	    socket.on('lectureAttend', function(data){

			if($scope.thisUserCtrl != "8") 
				return;

	    	var attendance = $("#attend_log")[0].children;
	    	for( ; attendance.length > 0; ){
    			attendance[0].remove();
	    	}

	    	for( var i = 0; i<data.length; ++i){
		    	var user = {img: null, userId: data[i].userId, username: data[i].username};
		    	$("#attend_log").prepend(
		    		"<div id='" + user.userId + "' style='float:left' > <div id='" + user.userId + "_thumb' ><span class='u-photo avatar fa fa-twitter-square fa-4x'></span></div> <br> <label>" + user.username  + "</label></div>"
		    	);
		    	if ($scope.studentScreen[user.userId] !== undefined){
		    		var u = $scope.stduentScreen[user.userId];
		    		$('#'+u.class+'_thumb')[0].children[0].remove();
					attachMediaStream($('<video></video>').attr({ 'id': u.socket_id, 'autoplay': 'autoplay', 'width': '160', 'height': '120', 'class': u.uid }).appendTo('#'+u.uid+'_thumb').get(0), u.stream);
		    	}
		    }
	    	
	    	$scope.attendance = data;// = user;
	    	
	    	
	    	
	    });

	    socket.on('connected',function(){
			console.log('KAISquare Lecture connected');
		});
		socket.on('disconnect',function(data) {
			console.log(data + " has been elemeifadsfasdf");
			$("#"+data).remove();
			
		});
		
		socket.on('joinLecture',function(data){
			console.log('KAISquare Lecture ' + data + " has been connected.");
			
		});
		socket.on('receiveMessage', function(data){
			//console.log(data.message);
			
			if(data.type == 'chat')
				$scope.chat_log.push({time: Stopwatch.formattedTime(data.time*1000), src_name:data.src_name, message:data.message});
			if(data.type == 'q')
				$scope.q_log += 1;
	    });

    });
	
}])
.directive('lappRtclecture', function(){
	// http://stackoverflow.com/questions/22164969/angularjs-two-way-binding-videos-currenttime-with-directive
	// currentTime of Video 
	return {
		controller: function($scope, $element){
			
		},
		link: function(scope, element, attrs){
			var constraints = {
				video: {
					mandatory: {
						minWidth: 640,
						minHeight: 480
					}
				},
				audio: 'true'
			};
			getUserMedia(constraints, handleUserMedia, handleUserMediaError);
			var videoElement = $('#local').attr({'width':  320, 'height': 240}).get(0);
			
			function handleUserMedia(stream) {
				//attachMediaStream($('#local').attr({'width':  640, 'height': 480}).get(0), stream);
				//attachMediaStream($('#local').attr({'width':  320, 'height': 240}).get(0), stream);
				//var session = new CreateSession({ gid: scope.$parent.lectureId, uid: scope.$parent.user._id, width: 640, height: 480, stream: stream, iceServers: { 'iceServers': [{ 'url': 'stun:repo.ncl.kaist.ac.kr:3478' }] } });
				
				//startRecording.disabled = false;
                videoElement.src = window.URL.createObjectURL(stream); 
				window.recorder = new Recorder(stream, { gid: scope.$parent.lectureId, uid: scope.$parent.user._id });
                recorder.onRecordCompleted = onRecordCompleted;
                window.session = new CreateSession(stream, { gid: scope.$parent.lectureId, uid: scope.$parent.user._id, width: 640, height: 480, iceServers: { 'iceServers': [{ 'url': 'stun:repo.ncl.kaist.ac.kr:3478' }] } });
				
				session.onSessionJoined = onSessionJoined;
				session.onSessionClosed = onSessionClosed;
				session.start();
			};

			function handleUserMediaError(error) {
				alert('Unable to access user media' );
				console.log(error);
			};

			function onSessionJoined(event) {
				//�ш린瑜��섏젙�섎씪
				if( typeof event.uid !== 'undefined' && event.uid !== scope.$parent.user._id ){
					console.log("onsessionjoined_lecture");
					console.log(event);
					console.log($('#'+event.uid));
					$('#'+event.uid+'_thumb')[0].children[0].remove();
					attachMediaStream($('<video></video>').attr({ 'id': event.socket_id, 'autoplay': 'autoplay', 'width': '160', 'height': '120', 'class': event.uid }).appendTo('#'+event.uid+'_thumb').get(0), event.stream);
					scope.$parent.studentScreen[event.uid] = {'socket_id': event.socket_id, 'uid': event.uid, 'stream': event.stream};
				}
			};

			function onSessionClosed(event) {
				$('#' + event.socket_id).remove();
			};
			
			function onRecordCompleted(href) {
                videoElement.src = href;
                
                //Turn it to VOD
				var lecture = scope.$parent.lecture;
				lecture.duration = scope.$parent.stopwatch.time();
				lecture.status = 0;
				lecture.vod_url = href;
				
				
				lecture.$save(function(p, resp) {
					if(!p.error) {
						// If there is no error, redirect to the main view
						console.log("lecture update complete!");
					} else {
						alert('Could not create course');
					}
				});
				
				
            };
			
		}
	}
})
.directive('lappRtcstudent', function(){
	// http://stackoverflow.com/questions/22164969/angularjs-two-way-binding-videos-currenttime-with-directive
	// currentTime of Video 
	return {
		controller: function($scope, $element){
			
		},
		link: function(scope, element, attrs){
			var constraints = {
				video: {
					mandatory: {
						minWidth: 640,
						minHeight: 480
					}
				},
				audio: 'true'
			};
			getUserMedia(constraints, handleUserMedia, handleUserMediaError);
			var session;

			function handleUserMedia(stream) {
				attachMediaStream($('#local').get(0), stream);
				session = new JoinSession({ gid: scope.$parent.lectureId, uid: scope.$parent.user._id, stream: stream, iceServers: { 'iceServers': [{ 'url': 'stun:repo.ncl.kaist.ac.kr:3478' }] } });
				session.onSessionJoined = onSessionJoined;
			    session.start();
			};

			function handleUserMediaError(error) {
				//alert('Access to lecture without media!');
			    session = new JoinSession({ gid: scope.$parent.lectureId, uid: scope.$parent.user._id, iceServers: { 'iceServers': [{ 'url': 'stun:repo.ncl.kaist.ac.kr:3478' }] } });
			    session.onSessionJoined = onSessionJoined;
			    session.start();
			};
			
			function onSessionJoined(event) {
				var width = 640;
				var height = 480;
				console.log(scope.$parent.isMobile);
				
				if(scope.$parent.isMobile == 1) {
					width = 320;
					height = 240;
				}
			
				
			
			    attachMediaStream($('#remote').attr({ 'width': width, 'height': height }).get(0), event.stream);
			}

			$(window).bind("beforeunload", function (event) {
				if (session != null)
					session.close();
			});
			
		
			
		}
	}
})
.directive('lappVideo', function(){
	// http://stackoverflow.com/questions/22164969/angularjs-two-way-binding-videos-currenttime-with-directive
	// currentTime of Video 
	return {
		controller: function($scope, $element){
			$scope.$parent.duration = $element[0].duration;
			$scope.onTimeUpdate = function(){
				// using $parent to access $scope in controller
				$scope.$parent.currentTime = $element[0].currentTime;
				$scope.$apply();
			}
		},
		link: function(scope, element, attrs){
			element.bind('timeupdate', scope.onTimeUpdate);
		}
	}
})
.directive('lappCanvas', function(){
	return {
		link: function(scope, element, attrs){
			//console.log($(element[0])[0].children[1]);
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
			scope.canvasStrokeColor = [{color: 'black'},
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
		link: function(scope, element, attrs){	
			var ppt = "http://localhost:6789/uploads/53c181df19d549fc34c063fd/Test1/";
			var fileType = ".png";

			var startNumber = 1;
			var maxNumber = 10;
			var pageNumber = startNumber;
			
			var slide = $(element[0])[0].children[1];
			var canvas = $(element[0])[0].children[2];
			var ctx = canvas.getContext('2d');
			
			var slide = $(slide);
			slide.attr('src', ppt + pageNumber + fileType);
			scope.moveLeft = function(){
				if(pageNumber == startNumber){
					pageNumber = maxNumber;
				}else{
					pageNumber -= 1;
				}

				pptLog(pageNumber);
				ctx.clearRect(0, 0, canvas.get(0).width, canvas.get(0).height);
				slide.attr('src', ppt + pageNumber + fileType);
				
				drawAll(penTrace[pageNumber]);
			}
			scope.moveRight = function(){
				if(pageNumber == maxNumber){
					pageNumber = startNumber;
				}else{
					pageNumber += 1;
				}
				pptLog(pageNumber);
				ctx.clearRect(0, 0, canvas.get(0).width, canvas.get(0).height);
				slide.attr('src', ppt + pageNumber + fileType);
				
				drawAll(penTrace[pageNumber]);
			}
			
			var stopwatch = scope.stopwatch;
			var eventTrace = [];
			var penTrace = {};
			for (var i = startNumber; i <= maxNumber; i++){
				penTrace[i] = [];
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
				
				penTrace[pageNumber].push(o);
			}
			function pptLog(page){
				if (stopwatch === undefined)
					stopwatch = scope.stopwatch;
				var o = new Object();
				o.type = "ppt";
				o.page = page;
				o.time = stopwatch.time();
				eventTrace.push(o);
			}
			function drawAll(strokes){
				for (var i in strokes){
					var stroke = strokes[i].stroke;
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
					//socket.emit('canvasDraw', stroke);
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
			/*
			socket.on('canvasDraw', function(stroke){
				draw(stroke);
			});
			*/
			var traceLog = [];
			var tracer = null;
			var e = 0;
			var starttime = 0;
			var stoptime = 0;
			scope.presentationReplay = function(){
				ctx.clearRect(0, 0, canvas.get(0).width, canvas.get(0).height);
				slide.attr('src', ppt + startNumber + fileType);
				
				// timeout based event tracing
				traceLog = [];
				for (var i in penTrace){
					penTrace[i].sort(function(a, b){return a.time - b.time});
					traceLog = traceLog.concat(penTrace[i]);
				}
				traceLog = traceLog.concat(eventTrace);
				traceLog.sort(function(a, b){return a.time - b.time});
				
				tracer = setTimeout(startTrace, traceLog[e].time);
				
				starttime = (new Date()).getTime(); 			
				console.log(traceLog);
				console.log(penTrace);				
				console.log(eventTrace);
			}
			
			function startTrace(){
				//console.log(e);
				var event = traceLog[e++];
				if (event.type == "stroke"){
					drawTrace(event.stroke);
				}else if (event.type == "ppt"){
					ctx.clearRect(0, 0, canvas.get(0).width, canvas.get(0).height);
					slide.attr('src', ppt + event.page + fileType);
					drawAllTrace(penTrace[event.page], event.time);
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
			
			scope.presentationReset = function (){
				eventTrace = [];
				penTrace = {};
				for (var i = startNumber; i <= maxNumber; i++){
					penTrace[i] = [];
				}
				ctx.clearRect(0, 0, canvas.get(0).width, canvas.get(0).height);
				slide.attr('src', ppt + startNumber + fileType);
			}
		}
	}
})
;

angular.module('lapp.controller')
.controller('QuizQuestionCtrl',
['$rootScope', '$scope', '$location', '$modal', '$modalInstance', 'Course', 'Lecture','$stateParams','$sce','socket', 'security','user', 'lecture', 'course', 'thisUserCtrl', function($rootScope, $scope, $location, $modal, $modalInstance, Course, Lecture,$stateParams, $sce, socket, security, user, lecture,course, thisUserCtrl) {
	$scope.quizChoice = [{number:'1', text: ''}, {number:'2', text: ''}];
	$scope.quizType = [{type:'O/X', value:'ox'},
	                   {type:'Multiple', value:'multiple'},
	                   {type:'Short Answer', value:'short'}];
	$scope.quiz = { question: '',
			        type: 'ox',
				  }
	$scope.lecture = lecture;
	$scope.sendQuiz = function(){
		//if (thisUserCtrl != "8") return;
		
		var data = $scope.quiz;
		
		if (data.type == "ox")
			data.choice = [{number: '1', text: 'O'}, {number: '2', text: 'X'}];
		else if (data.type == "short")
			data.choice = [{number: '1', text: ''}];
		else if (data.type == "multiple")
			data.choice = $scope.quizChoice;
		//console.log($scope);
		data.src = user._id;
		data.lectureId = lecture._id;
		data.courseId = course._id;
		
		$modalInstance.close($scope.quiz.question);
		socket.emit('sendQuiz', data);
	}
	$scope.cancel = function() {
		$modalInstance.dismiss('cancel');
	};
	$scope.addChoice = function(){
		var quizChoice = $scope.quizChoice;
		if (quizChoice.length > 3) return;
		var l = quizChoice.length + 1;
		quizChoice.push({number: l, text: ''});
	}
	$scope.delChoice = function(number){
		var quizChoice = $scope.quizChoice;
		if (quizChoice.length < 3) return;
		for(var i = number; i < quizChoice.length; i++){
			quizChoice[i].number--;
		}
		quizChoice.splice(number-1, 1);
	}
}]);
		
});