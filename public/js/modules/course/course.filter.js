'use strict';

/* Controllers */
define(['angular'], function(angular) {

angular.module('course.filter', [])
.filter('adminFilter', function() {

	return function(input) {
		if(input !== undefined ) {
			if(input[0].role_bitMask == 7) {
				return input;
			} else {
				return;
			}
		}
	}
});

});