'use strict';
define(['angular',
        'security/index',
        'directives/common.directives'
        ], 
function(angular) {
	//var app = angular.module('kaisquare', ['ngCookies', 'ui.router', 'ngResource', 'security', 'course', 'lecture','lapp']);
	var app = angular.module('kaisquare', ['ngCookies', 'ui.router', 'ngResource', 'security', 'common.directives', 'oc.lazyLoad', 'pasvaz.bindonce']);
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