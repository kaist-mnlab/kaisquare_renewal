define(['angular'], function(angular) {
// Angular service module for connecting to JSON APIs
angular.module('lapp.service', ['ngResource'])
	.factory('socket', function($rootScope) {
		var socket = io.connect();
		return {
			on: function (eventName, callback) {
	      socket.on(eventName, function () {  
	        var args = arguments;
	        $rootScope.$apply(function () {
	          callback.apply(socket, args);
	        });
	      });
	    },
	    emit: function (eventName, data, callback) {
	      socket.emit(eventName, data, function () {
	        var args = arguments;
	        $rootScope.$apply(function () {
	          if (callback) {
	            callback.apply(socket, args);
	          }
	        });
	      })
	    }
		};
	})
	.factory('lectureService', function(){
		var lecture = {};
		
		return {
			getLecture: function(){
				return lecture;
			},
			setLecture: function(l){
				lecture = l;
				console.log(l);
			}
			
		}
	});
	
});
