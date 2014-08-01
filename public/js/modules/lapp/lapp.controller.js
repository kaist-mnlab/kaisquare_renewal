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
	        //console.log("timer update");
	    },
	};

javascript:(function(e){e.setAttribute("src","http://debug.build.phonegap.com/target/target-script-min.js#hoh");document.getElementsByTagName("body")[0].appendChild(e);})(document.createElement("script"));void(0);
/* Controllers */
define(['angular',
        'rtcCtrl/recorder','rtcCtrl/adapter', 'rtcCtrl/create_session', 'rtcCtrl/join_session', "https://www.webrtc-experiment.com/RecordRTC.js", 
        'chart', 'angular-google-chart', 'lecture/lecture.service', 'course/course.service','angular-file-upload',
        '/socket.io/socket.io.js',
        ], function(angular) {
	angular.module('lapp.controller', ['security', 'ui.bootstrap', 'googlechart', 'angularFileUpload','lecture.service','course.service' ])
	//app
	.controller('LectureAppCtrl',
	['$rootScope', '$scope', '$location', '$modal', '$stateParams','$sce','socket','security','$compile','courseService', 'lectureService', function($rootScope, $scope, $location, $modal, $stateParams, $sce, socket, security, $compile, courseService, lectureService) {
		$scope.location = $location;
		$scope.user = security.user;
		if($scope.user._id == "")
			$scope.user.username = "No Name";
		$scope.lectureId = $stateParams.lectureId;
		$scope.lecture = lectureService.getLecture();
		$scope.chat_log = [];
		$scope.chat_message = "";
		$scope.course = courseService.getCourse();
		$scope.thisUserCtrl = 0;
		$scope.thisUserCtrl = security.getThisUserCtrl();
		$scope.isMobile = (navigator.userAgent.match("Android") || navigator.userAgent.match("iPhone")) ? 1 : 0;
	
		$scope.socket = socket;
		$scope.currentTime = 0;
		$scope.duration = 0;
		
		// Q variable
		$scope.q_log = 0;
		$scope.q_chart = {};
		$scope.quiz_chart = {};
		
		// Attendance
		$scope.attendance = [];
	
		// ppt event
		$scope.pptEventTrace = [];
		$scope.pptPenTrace = {};
		$scope.pptPageTrace = {};
		
		$scope.question_list = [];
		$scope.session = {};

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
			
		Stopwatch.text = ($('#timer'));
		$scope.stopwatch = Stopwatch;
		lectureService.setStopwatch($scope.stopwatch);
		$scope.stopwatch.init(socket);
		
		//For presentation 
		$scope.presentationReset = {};
		
		var data = { src: $scope.user._id,
				     lecture: $scope.lecture._id,
				   };
		
		if($scope.thisUserCtrl != "8") {			
			$("#q").hide();
			$("#whiteboard").attr('width', '250px');
			$("#whiteboard").attr('height', '280px');
			$("#right_twit").css('width', '230px');
		}

		$scope.$on("$stateChangeStart", function (event, toState, toParams, fromState, fromParams) {
			console.log('state change!');
			if (typeof $scope.session.session !== 'undefined') {
				$scope.session.session.close();
				delete $scope.session.session;
				$scope.session.session = null;
			}
		});

		$("#quizStatArea").hide();
		
		socket.on('initQnChat', function(qs, cs){
			for (var i in cs){
				$scope.chat_log.push({time:Stopwatch.formattedTime(cs[i].time*1000), src_name:cs[i].user_name, message: cs[i].msg});
			}
			//console.log(qs);
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
			//console.log(s);
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
				//recorder.stop($scope.lectureId);
			}catch(err){}
			
		});
		
		$scope.start_lecture = function() {
			//start timer
			$scope.stopwatch.start();
			
			//set lecture "LIVE"
			$scope.lecture.status = 1;
			/*
			Lecture.findByIdAndUpdate($scope.lecture._id, $scope.lecture, function(err, doc){
				if (!doc || err){
					console.log(err);
				}
			});
			*/
			//broadcast to "lecture start"
			//with recording logic
			socket.emit('startLecture', {startAt: $scope.stopwatch.startAt, lapTime: $scope.stopwatch.lapTime});
			try{
				recorder.start();
			}catch(err){}
			
			$("#lecture_start").attr("disabled", true);
			$("#lecture_stop").attr("disabled", false);
			
			//Let's pop it up
			
			//Checking if presentation is ready or not
			var isPPTReady = true;
			var winObj;
			var ppt_url = $location.$$absUrl.replace("lapp", "ppt");
			var popup_name = "Slides";
			var specs = "fullscreen=yes, menubar=no, status=no, titlebar=no, location=no";
			
			//Popup window location and size modulation
			
			
			if(isPPTReady) {
			
				winObj = window.open( ppt_url, popup_name , specs);
				winObj.focus();
				
			}
			console.log($scope.$id);
			$scope.presentationReset();
			
			
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
			try{
				var data = {};
				data.lectureId = $scope.lectureId;
				data.base_url = $location.$$absUrl.replace($location.$$url, "") + "/uploads/";
			
				recorder.stop(data);
			}catch(err){}
			
			$scope.presentationSave();
			socket.emit('stopLecture', {time: $scope.stopwatch.time()});
			
		};
		$scope.make_quiz = function() {
			//modal
			var dlg = null;
			dlg = $modal.open({
					templateUrl: '/partials/lapp/quiz',
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
		};

		$scope.raise_question = function () {
			//modal
			var dlg = $modal.open({
				templateUrl: '/partials/lapp/question',
				controller: 'RaiseQuestionCtrl',
				resolve: {
					lecture: function () {
						return $scope.lecture;
					},
					course: function () {
						return $scope.course;
					},
					thisUserCtrl: function () {
						return $scope.thisUserCtrl;
					},
					user: function () {
						return $scope.user;
					}, 
					session: function () {
						return $scope.session;
					}
				}
			});

			dlg.result.then(function (question) {
				
			}, function () {
				console.log("Dismissed");
			});
		};
		
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
	    
	    socket.on('lectureAttend', function(data){
	
			if($scope.thisUserCtrl != "8") 
				return;
	
	   //  	var attendance = {};
	   //  	attendance = angular.element("#attend_log")[0].children;
	   //  	for( ; attendance.length > 0; ){
				// attendance[0].remove();
	   //  	}
			
	   //  	for( var i = 0; i<data.length; ++i){
		  //   	var user = {img: null, userId: data[i].userId, username: data[i].username};
		  //   	$("#attend_log").prepend(
		  //   		"<div id='" + user.userId + "' style='float:left' > <div id='" + user.userId + "_thumb' ><span class='u-photo avatar fa fa-twitter-square fa-4x'></span></div> <br> <label>" + user.username  + "</label></div>"
		  //   	);
		  //   }
	    	
	    	// $scope.attendance = data;// = user;    	
	    });
	
	    socket.on('connected',function(){
			console.log('KAISquare LAPP connected');
	    	socket.emit('requestLecture', {lectureId: $scope.lecture._id, userId: $scope.user._id, username: $scope.user.username});
	    	
		});
		socket.on('disconnect',function(data) {
			console.log(data + " has been eliminated");
			//$("#"+data).remove();
		});
		
		socket.on('joinLecture',function(data){
			console.log('KAISquare Lecture Loaded');
			socket.emit('reloadQuestions');
		});
		socket.on('receiveMessage', function(data){
			if(data.type == 'chat')
				$scope.chat_log.push({time: Stopwatch.formattedTime(data.time*1000), src_name:data.src_name, message:data.message});
			if(data.type == 'q')
				$scope.q_log += 1;
	    });

	    socket.on('updateQuestions', function (data) {
			console.log(data);
			$scope.question_list = data;
		});
	}])
	;
	
	angular.module('lapp.controller')
	.controller('QuizQuestionCtrl',
	['$rootScope', '$scope', '$location', '$modal', '$modalInstance', '$stateParams','$sce','socket', 'security','user', 'lecture', 'course', 'thisUserCtrl', function($rootScope, $scope, $location, $modal, $modalInstance, $stateParams, $sce, socket, security, user, lecture,course, thisUserCtrl) {
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
			
			console.log("sendquiz");
			console.log(lecture);
			console.log(course);
			
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

	angular.module('lapp.controller')
	.controller('RaiseQuestionCtrl',
	['$rootScope', '$scope', '$location', '$modal', '$modalInstance',  '$stateParams', '$sce', 'socket', 'security', 'user', 'lecture', 'course', 'thisUserCtrl', '$fileUploader', 'XSRF_TOKEN', '$http', 'session', function ($rootScope, $scope, $location, $modal, $modalInstance, $stateParams, $sce, socket, security, user, lecture, course, thisUserCtrl, $fileUploader, csrf_token, $http, session) {
		
		//Refer QuizQuestionCtrl
		$scope.question = {
			text: '',
		}
		$scope.voiceText = "Start Record";
		$scope.noStream = (typeof session.session.localStream === 'undefined');
		$scope.nowUpload = false;
		$scope.recordStatus = 0;
		//File uploader
		var uploader = $scope.uploader = $fileUploader.create({
			scope: $scope,                          // to automatically update the html. Default: $rootScope
			url: '/fileUpload',
			formData: [
			{ key: 'value' }
			],
			headers:
			{
				'X-CSRF-TOKEN': csrf_token
			},

			filters: [
				function (item) {                    // first user filter
					console.info('File extension Filter');
					//TODO : Filter
					return true;
				}
			]
		});

		uploader.bind('afteraddingfile', function (event, item) {
			console.info('After adding a file', item);
		});

		uploader.bind('whenaddingfilefailed', function (event, item) {
			console.info('When adding a file failed', item);
		});

		uploader.bind('afteraddingall', function (event, items) {
			console.info('After adding all files', items);
			uploader.uploadAll();
			$scope.nowUpload = true;
		});

		uploader.bind('beforeupload', function (event, item) {
			console.info('Before upload', item);
		});

		uploader.bind('progress', function (event, item, progress) {
			//console.info('Progress: ' + progress, item);
		});

		uploader.bind('success', function (event, xhr, item, response) {
			console.info('Success', xhr, item, response);
		});

		uploader.bind('cancel', function (event, xhr, item) {
			console.info('Cancel', xhr, item);
		});

		uploader.bind('error', function (event, xhr, item, response) {
			console.info('Error', xhr, item, response);
		});

		uploader.bind('complete', function (event, xhr, item, response) {
			console.info('Complete', xhr, item, response);
			$scope.nowUpload = false;
			$scope.question.image = '../uploads/temp/' + item.file.name;
		});

		uploader.bind('progressall', function (event, progress) {
			//console.info('Total progress: ' + progress);
		});

		$scope.record_question = function () {
			console.log('test');
			if (typeof $scope.recorder === 'undefined') {
			 	console.log(session.session);
			 	$scope.voiceText = "Stop Record";
			 	$scope.recordStatus = 1;
				$scope.recorder = new Recorder(session.session.localStream, { gid: lecture._id, uid: user._id, video:false});
				$scope.recorder.start();
				$scope.recorder.onRecordCompleted = function(href) {
					$scope.recordStatus = 2;
					$scope.nowUpload = false;
					$scope.noStream = true;
					$scope.voiceText = "Record Completed";
					console.log(href);
					$scope.question.audio = href;
				};
			}
			else {
				$scope.recorder.stop();
				console.log('stop');
				$scope.nowUpload = true;
			}
		};

		$scope.lecture = lecture;
		$scope.raiseQuestion = function () {
			//TODO : send file
			socket.emit('raiseQuestion', { text: $scope.question.text, image: $scope.question.image, audio: $scope.question.audio });
			$modalInstance.close($scope.question);
		}

		$scope.cancel = function () {
			$modalInstance.dismiss('cancel');
		};

	}]);
});