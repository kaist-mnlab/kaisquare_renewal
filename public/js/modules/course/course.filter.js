'use strict';

/* Controllers */
define(['angular'], function(angular) {

angular.module('course.filter', [])
.filter('adminFilter', function() {

	return function(input) {
		if(input !== undefined ) {
			var returns = [];
			
			for(var i = input.length; i--;) {
	        	if(input[i].role_bitMask == accessConfig.courseUserRoles.tutor.bitMask) {
	        		returns.push(input[i]);
	          	}
	      	}
	      	
	      	return returns;
				
		}
	}
});

});