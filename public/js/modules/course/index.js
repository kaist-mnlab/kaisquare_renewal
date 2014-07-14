'use strict';

define(['angular',
        'course/course.controller', 'course/course.service','course/course.filter','course/course.directive',
		
        ], function(angular) {

angular.module('course', ['course.controller', 'course.service', 'course.filter','course.directives']);

});
