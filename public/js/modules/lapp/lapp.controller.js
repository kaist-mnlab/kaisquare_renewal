'use strict';

var Stopwatch = {
		//var text;
		text: null,
		// Private vars
		startAt: 0,	// Time of last start / resume. (0 if not running)
		lapTime: 0,	// Time on the clock when last stopped in milliseconds
		timer: null,
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
	    },
	};


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
	
	$scope.streamingPort = 55555;
	$scope.streamingHost = $location.$$host; 
	$scope.streamingURL = "http://" + $scope.streamingHost + ":" + $scope.streamingPort + "/";

	$scope.socket = socket;
	$scope.currentTime = 0;
	$scope.duration = 0;
	
	// Q variable
	$scope.q_log = 0;
	$scope.q_chart = {};
	$scope.quiz_chart = {};
	
	// Attendance
	$scope.attendance = [];
	
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
			}
			$("#quizStatArea").hide();
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
		});
		
		$scope.start_lecture = function() {
			//start timer
			$scope.stopwatch.start();	
			//set lecture "LIVE"
			
			
			//broadcast to "lecture start"
			//with recording logic
			socket.emit('startLecture', {startAt: $scope.stopwatch.startAt, lapTime: $scope.stopwatch.lapTime});
			
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
			
			//broadcast to "lecture stop"
			//with stopping recording logic and storing
			socket.emit('stopLecture', {time: $scope.stopwatch.time()});
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
	    socket.emit('requestLecture', {lectureId: $scope.lecture._id, userId: $scope.user._id, username: $scope.user.username});

	    // attendance (joinLecture에 넣을지 따로 할지는 조금 생각)
	    socket.on('lectureAttend', function(data){
	    	console.log("lectureAttend");
	    	console.log(data);
	    	var user = {img: null, userId: data.userId, username: data.username};
	    	$scope.attendance = data;// = user;
	    	
	    });

	    socket.on('connected',function(){
			console.log('KAISquare Lecture connected');
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
			console.log($(element[0])[0].firstChild);
			var canvas = $(element[0])[0].firstChild;
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
			                           {color: 'white'}
			                           ];
			scope.selectColor = function(color){
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
});

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