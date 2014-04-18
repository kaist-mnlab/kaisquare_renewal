define(['angular'], function(angular) {
// Angular service module for connecting to JSON APIs
angular.module('course.service', ['ngResource', 'security'])
//app
	.factory('Course', function($resource) {
		
		var resource = 
			$resource('/courses/courses/:courseId', {courseId:'@courseId'}, {
				// Use this method for getting a list of polls
				query: { method: 'GET', params: { courseId: 'courses' }, isArray: true },
				update: { method: 'PUT' }
			});
		
			
			
		return resource;	
	
		
		
	});
	
	
	
});
