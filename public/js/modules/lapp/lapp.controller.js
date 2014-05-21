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
angular.module('lapp.controller', ['security', 'ui.bootstrap' ])
//app
.controller('LectureAppCtrl',
['$rootScope', '$scope', '$location', '$modal', 'Course', 'Lecture','$stateParams','$sce','socket','security', function($rootScope, $scope, $location, $modal, Course, Lecture,$stateParams, $sce, socket, security) {
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

	
	$scope.currentTime = 0;
	$scope.duration = 0;
	
	// Q variable
	$scope.q_log = 0;

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
		
	// graph initialization
	var ctx = $("#chart").get(0).getContext("2d");
	var chart = new Chart(ctx);
	
	// quiz answer statistics graph
	var ctx2 = $("#quizChart").get(0).getContext("2d");
	var quizStatChart = new Chart(ctx2);
	var barOption = {
			
			//Boolean - If we show the scale above the chart data			
			scaleOverlay : true,
			
			//Boolean - If we want to override with a hard coded scale
			scaleOverride : false,
			
			//** Required if scaleOverride is true **
			//Number - The number of steps in a hard coded scale
			scaleSteps : null,
			//Number - The value jump in the hard coded scale
			scaleStepWidth : null,
			//Number - The scale starting value
			scaleStartValue : null,

			//String - Colour of the scale line	
			scaleLineColor : "rgba(0,0,0,.1)",
			
			//Number - Pixel width of the scale line	
			scaleLineWidth : 0.5,

			//Boolean - Whether to show labels on the scale	
			scaleShowLabels : false,
			
			//Interpolated JS string - can access value
			scaleLabel : "<%=value%>",
			
			//String - Scale label font declaration for the scale label
			scaleFontFamily : "'Arial'",
			
			//Number - Scale label font size in pixels	
			scaleFontSize : 8,
			
			//String - Scale label font weight style	
			scaleFontStyle : "normal",
			
			//String - Scale label font colour	
			scaleFontColor : "#666",	
			
			///Boolean - Whether grid lines are shown across the chart
			scaleShowGridLines : false,
			
			//String - Colour of the grid lines
			scaleGridLineColor : "rgba(0,0,0,.05)",
			
			//Number - Width of the grid lines
			scaleGridLineWidth : 0.5,	

			//Boolean - If there is a stroke on each bar	
			barShowStroke : true,
			
			//Number - Pixel width of the bar stroke	
			barStrokeWidth : 0.5,
			
			//Number - Spacing between each of the X value sets
			barValueSpacing : 0.5,
			
			//Number - Spacing between data sets within X values
			barDatasetSpacing : 0.5,
			
			//Boolean - Whether to animate the chart
			animation : true,

			//Number - Number of animation steps
			animationSteps : 60,
			
			//String - Animation easing effect
			animationEasing : "easeOutQuart",

			//Function - Fires when the animation is complete
			onAnimationComplete : null
		}

	
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
			console.log(barOption);
			chart.Bar(qs, barOption);
		});

		socket.on('qData', function(data){		
			console.log(data);
			chart.Bar(data, barOption);
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
				
			dlg.result.then(function () {
				var stat = [];
				stat[0] = {value: 0, color: "#F38630"};
				stat[1] = {value: 0, color: "#E0E4CC"};
				stat[2] = {value: 0, color: "#69D2E7"};
				stat[3] = {value: 0, color: "#4D5360"};
				$scope.quizStat = stat; 
				
				$("#quizStatArea").show();
				$("#chatArea").css('height', '300px');
			}, function() {
				console.log("Dismissed");
			});
		}
		
		socket.on('receiveQuiz', function(data){
			console.log(data);
			$scope.quiz = data;
		});
		socket.on('receiveAns', function(data){
			console.log('receiveAns');
			
			var quizStat = $scope.quizStat;
			quizStat[data.answer-1].value = quizStat[data.answer-1].value + 1;
			var pieOption = {
					//Boolean - Whether we should show a stroke on each segment
					segmentShowStroke : true,
					
					//String - The colour of each segment stroke
					segmentStrokeColor : "#fff",
					
					//Number - The width of each segment stroke
					segmentStrokeWidth : 2,
					
					//Boolean - Whether we should animate the chart	
					animation : true,
					
					//Number - Amount of animation steps
					animationSteps : 100,
					
					//String - Animation easing effect
					animationEasing : "easeOutBounce",
					
					//Boolean - Whether we animate the rotation of the Pie
					animateRotate : true,

					//Boolean - Whether we animate scaling the Pie from the centre
					animateScale : false,
					
					//Function - Will fire on animation completion.
					onAnimationComplete : null
				}
			quizStatChart.Pie(quizStat, pieOption);
		});
		
		$scope.quiz_ans_send = function(answer){
			var data = $scope.quiz;
			var target = data.src;
			console.log(target);
			data.answer = answer;
			data.src = $scope.user._id;
			socket.emit('sendQuizAns', {target: target, data: data});
			$scope.quiz = {};
		}
		
		$scope.send_q = function() {
    		data.type = 'q';
    		data.message = 'Q';
    		data.time = $scope.currentTime = $scope.stopwatch.time()* 0.001;
			data.timestamp = Date.now();
    		socket.emit('sendMessage', data);
    	   	socket.emit('qData');
	    }
		
	    $scope.send_chat = function() {
	    	data.type = 'chat';
	    	data.message = $scope.chat_message;
	    	data.src_name = $scope.user.username;
    		data.time = $scope.currentTime = $scope.stopwatch.time()* 0.001;
			data.timestamp = Date.now();
			
    	   	socket.emit('sendMessage', data);
    	   	$scope.chat_message = "";
	    }
	    
	    socket.emit('requestLecture', {lectureId: $scope.lecture._id, userId: $scope.user._id});
		    
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
		console.log($scope);
		data.src = user._id;
		data.lectureId = lecture._id;
		data.courseId = course._id;
		$modalInstance.close();
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