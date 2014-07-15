'use strict';
define(['angular',
        'security/index',
        'course/index',
        'lecture/index',
        'lapp/index'
        ], 
function(angular) {
	var app = angular.module('kaisquare', ['ngCookies', 'ui.router', 'ngResource', 'security', 'course', 'lecture','lapp']);

	app.constant("XSRF_TOKEN", $('meta[name="csrf-token"]').attr('content') );
	
	
	return app; 

});