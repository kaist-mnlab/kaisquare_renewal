define(['angular'], function(angular) {
// Angular service module for connecting to JSON APIs
angular.module('course.service', ['ngResource', 'security'])
//app
	.factory('Course', ['$resource', 'security', function($resource, security) {
       	
		var resource = 
			$resource('/courses/courses/:courseId', {courseId:'@courseId'}, {
				// Use this method for getting a list of polls
				query: { method: 'GET', params: { courseId: 'courses' }, isArray: true },
				update: { method: 'PUT' },
			});
			
		resource.authorize = function(accessLevel, role) {
            if(role === undefined) {
                //role = currentUser.role;
                role = {
                	bitMask: 1
                }
                
            }
            return accessLevel.bitMask & role.bitMask;
        }
		
		return resource;	
			
	}])
		.factory('currentCourse', function(){
		var course;
		
		return {
			setCourse: function(c){
				course = c;
			},
			getCourse: function(){
				return course;
			}
		}
		
		
	});
		
});
