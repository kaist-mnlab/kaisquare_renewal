'use strict';
define(['angular',
        'security/index',
        ], 
function(angular) {
	//var app = angular.module('kaisquare', ['ngCookies', 'ui.router', 'ngResource', 'security', 'course', 'lecture','lapp']);
	var app = angular.module('kaisquare', ['ngCookies', 'ui.router', 'ngResource', 'security', 'oc.lazyLoad']);
	app.config(['$ocLazyLoadProvider', function($ocLazyLoadProvider) {
		$ocLazyLoadProvider.config({
			loadedModules: ['kaisquare'],
			jsLoader: requirejs,
			debug: true
		});
	}]);
	
	
	app.constant("XSRF_TOKEN", $('meta[name="csrf-token"]').attr('content') );
	
	
	return app; 

});