define(['angular'], function(angular) {
// Angular service module for connecting to JSON APIs
angular.module('lecture.service', ['ngResource', 'security'])
//app
	.factory('Lecture', function($resource) {
		
		var resource = 
			$resource('/lectures/lectures/:lectureId', { lectureID:'@lectureId'}, {
				// Use this method for getting a list of polls
				query: { method: 'GET', params: { lectureId: 'lectures' }, isArray: true },
				update: { method: 'PUT' }
			});
				
		return resource;	
	
		
		
	});
	
	
	
});
