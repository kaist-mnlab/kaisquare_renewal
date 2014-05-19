'use strict';

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
			if($scope.thisUserCtrl != "8")			
				$("#q").hide();
			
			
		
		});
		 
		socket.on('initQnChat', function(qs, cs){
			for (var i in cs){
				$scope.chat_log.push({time:cs[i].time, src_name:cs[i].user_name, message: cs[i].msg});
			}
			chart.Bar(qs, barOption);
		});
	
	
		socket.on('qData', function(data){		
			chart.Bar(data, barOption);
		});		   
		
		$scope.make_quiz = function() {
			//modal
			var dlg = null;
			dlg = $modal.open({
					templateUrl: 'lecture/edit',
					//controller: 'LectureEditCtrl',
					/*
					resolve: {
						lecture: function() {
							return $scope.lecture;
						}
					}
					*/
				});
				
			dlg.result.then(function () {
				//console.log($scope.courseId);
				//$scope.lectures = Lecture.query({course: $scope.course._id});
				
			}, function() {
				console.log("Dismissed");
			});
		}
		
		$scope.send_q = function() {
    		data.type = 'q';
    		data.message = 'Q';
    		data.time = $scope.currentTime;
			data.timestamp = Date.now();
    		socket.emit('sendMessage', data);
    	   	socket.emit('qData');
	    }
		
	    $scope.send_chat = function() {
	    	data.type = 'chat';
	    	data.message = $scope.chat_message;
	    	data.src_name = $scope.user.username;
    		data.time = $scope.currentTime;
			data.timestamp = Date.now();
			
    	   	socket.emit('sendMessage', data);
    	   	$scope.chat_message = "";
	    }

	    socket.emit('requestLecture', $scope.lecture._id);
		    
	    socket.on('connected',function(){
			console.log('KAISquare Lecture connected');
		});
		socket.on('joinLecture',function(data){
			console.log('KAISquare Lecture ' + data + " has been connected.");
		});
		socket.on('receiveMessage', function(data){
			//console.log(data.message);
			if(data.type == 'chat')
				$scope.chat_log.push({time: data.time, src_name:data.src_name, message:data.message});
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
});