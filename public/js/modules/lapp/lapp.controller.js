'use strict';

/* Controllers */
define(['angular'], function(angular) {
angular.module('lapp.controller', ['security', 'ui.bootstrap' ])
//app
.controller('LectureAppCtrl',
['$rootScope', '$scope', 'Lecture','$stateParams','$sce','socket','security', 'Q', function($rootScope, $scope, Lecture,$stateParams, $sce, socket, security, Q) {
	$scope.user = security.user;
	if($scope.user._id == "")
		$scope.user.username = "No Name";
	$scope.lecture = Lecture.get( {lectureId: $stateParams.lectureId } );
	$scope.chat_log = [];
	$scope.chat_message = "";
	
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
		$scope.send_q = function() {
    		var message = "Q";
    	   	socket.emit('sendMessage', {message: message, type: 'q', src: $scope.user._id});
	    }
	    $scope.send_chat = function() {
    		var message = $scope.chat_message;
    		
    	   	socket.emit('sendMessage', {message: message, type: 'chat', src: $scope.user._id, src_name:$scope.user.username});
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
			console.log(data.message);
			if(data.type == 'chat')
				$scope.chat_log.push({src_name:data.src_name, message:data.message});
			if(data.type == 'q')
				$scope.q_log += 1;
	    });
    });

}]);


});