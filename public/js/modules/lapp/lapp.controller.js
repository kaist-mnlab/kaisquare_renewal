'use strict';

/* Controllers */
define(['angular'], function(angular) {
angular.module('lapp.controller', ['security', 'ui.bootstrap' ])
//app
.controller('LectureAppCtrl',
['$rootScope', '$scope', 'Lecture','$stateParams','$sce','socket','security', function($rootScope, $scope, Lecture,$stateParams, $sce, socket, security) {
	$scope.user = security.user;
	if($scope.user._id == "")
		$scope.user.username = "No Name";
	$scope.lecture = Lecture.get( {lectureId: $stateParams.lectureId } );
	$scope.chat_log = [];
	$scope.chat_message = "";
	$scope.time = 1;
	
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
	
	
    $scope.lecture.$promise.then( function() {
    	var data = { src: $scope.user._id,
    			     lecture: $scope.lecture._id,
    			   };
		$scope.send_q = function() {
			data.time = $scope.time;
			data.timestamp = Date.now();
    		data.type = 'q';
    		data.message = 'Q';
    	   	
    		socket.emit('sendMessage', data);
    	   	socket.emit('qData');
	    }
		
	    $scope.send_chat = function() {
	    	data.time = $scope.time;
			data.timestamp = Date.now();
	    	data.type = 'chat';
	    	data.message = $scope.chat_message;
	    	data.src_name = $scope.user.username;
	    	
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
				$scope.chat_log.push({src_name:data.src_name, message:data.message});
			if(data.type == 'q')
				$scope.q_log += 1;
	    });
		
		socket.on('initQnChat', function(qs, cs){
			//console.log(cs);
			for (var i in cs){
				$scope.chat_log.push({src_name:cs[i].user_name, message: cs[i].msg});
			}
			//$scope.chat_log = $scope.chat_log.concat(cs);
			
			chart.Bar(qs, barOption);
		});
		
		// graph initialization
		var ctx = $("#chart").get(0).getContext("2d");
		var chart = new Chart(ctx);
		var barOption = {
				
				//Boolean - If we show the scale above the chart data			
				scaleOverlay : false,
				
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
				scaleLineWidth : 1,

				//Boolean - Whether to show labels on the scale	
				scaleShowLabels : false,
				
				//Interpolated JS string - can access value
				scaleLabel : "<%=value%>",
				
				//String - Scale label font declaration for the scale label
				scaleFontFamily : "'Arial'",
				
				//Number - Scale label font size in pixels	
				scaleFontSize : 12,
				
				//String - Scale label font weight style	
				scaleFontStyle : "normal",
				
				//String - Scale label font colour	
				scaleFontColor : "#666",	
				
				///Boolean - Whether grid lines are shown across the chart
				scaleShowGridLines : false,
				
				//String - Colour of the grid lines
				scaleGridLineColor : "rgba(0,0,0,.05)",
				
				//Number - Width of the grid lines
				scaleGridLineWidth : 1,	

				//Boolean - If there is a stroke on each bar	
				barShowStroke : true,
				
				//Number - Pixel width of the bar stroke	
				barStrokeWidth : 2,
				
				//Number - Spacing between each of the X value sets
				barValueSpacing : 5,
				
				//Number - Spacing between data sets within X values
				barDatasetSpacing : 1,
				
				//Boolean - Whether to animate the chart
				animation : true,

				//Number - Number of animation steps
				animationSteps : 60,
				
				//String - Animation easing effect
				animationEasing : "easeOutQuart",

				//Function - Fires when the animation is complete
				onAnimationComplete : null
				
			}
		socket.on('qData', function(data){
 			
			chart.Bar(data, barOption);
		});
		
    });

}]);


});