define(['angular'], function(angular) {
// Angular service module for connecting to JSON APIs
angular.module('lecture.service', ['ngResource', 'security'])
//app
	.factory('Lecture', function($resource) {
		
		var resource = 
			$resource('/lectures/lectures/:lectureId', { lectureID:'@lectureId'}, {
				// Use this method for getting a list of polls
				query: { method: 'GET', params: { lectureId: 'lectures', courseId:'@courseId' }, isArray: true },
				update: { method: 'PUT' }
			});
				
		return resource;	
	
		
		
	})
	.factory('lectureService', ['$cookieStore',function($cookieStore){
		var lecture = $cookieStore.get('currentLecture') || {};
		var stopwatch = $cookieStore.get('stopwatch') || {};
		//$cookieStore.remove('currentLecture');
		return {
			setLecture: function(l){
				lecture = l;
				$cookieStore.put('currentLecture', lecture);
			},
			getLecture: function(){
				return lecture;
			},
			setStopwatch: function(s){
				stopwatch = s;
				//$cookieStore.put('stopwatch', stopwatch);
			},
			getStopwatch: function(){
				return stopwatch;
			}
		}
		
		
	}]);
	
	
	
});
