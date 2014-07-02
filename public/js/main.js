'use strict';
requirejs.config({

	baseUrl:'/js',
	paths:{


		'text': '../lib/require/text', 
		'jquery': '../lib/jquery/jquery',
		'jquery-ui': '../lib/jquery/jquery-ui-1.10.2.min',
		'angular': '../lib/angular/angular',
		'angular-resource': '../lib/angular/angular-resource',
		'angular-route': '../lib/angular/angular-route',
		'angular-cookies':'../lib/angular/angular-cookies',
		'angular-ui-router':'../lib/angular/angular-ui-router.min',
		'angular-ui-bootstrap':'../lib/angular/ui-bootstrap-tpls-0.10.0.min',
		'angular-file-upload':'../lib/angular/angular-file-upload.min',
		'library': '../lib',
		'poll': 'modules/poll',
		'security': 'modules/security',
		'course': 'modules/course',
		'lecture': 'modules/lecture',
		'lapp':	'modules/lapp',
		'domReady': '../lib/require/domReady',
		'chart': '../lib/chart/chart',
		'angular-google-chart': '../lib/angular-google-chart/ng-google-chart',
		'bootstrap': '//netdna.bootstrapcdn.com/bootstrap/3.1.1/js/bootstrap.min',
		'rtcCtrl': 'rtcCtrl'
		
	},

	shim:{
		'angular':{
			deps:['jquery'],
			exports:'angular'
		},
		'jquery-ui': {
			deps: ['jquery'] 
		},
		'angular-resource':{
			deps:['angular']
		},
		'angular-route':{
			deps:['angular']
		},
		'angular-cookies':{
			deps:['angular']
		},
		'angular-ui-router':{
			deps:['angular']
		},
		'angular-ui-bootstrap':{
			deps:['angular', 'jquery']
		},
		
		'angular-file-upload':{
			deps:['angular']
		},
		
		'accessCfg':{
			deps:['jquery'],
			exports:'accessCfg'
		},
		'app':{
			deps:['angular', 'accessCfg', 'security/index', 'poll/index', 'lecture/index']
		},
		'auth':{
			deps:['angular']
		},
		'routes':{
			deps:['angular']
		},

		'poll/index':{
			deps:['angular', 'poll/poll.controller', 'poll/poll.service']
		},
		'security/index':{
			deps:['angular', 'security/security.controller', 'security/security.directive', 'security/security.service']
		},
		'course/index':{
			deps:['angular', 'angular-ui-bootstrap', 'course/course.controller', 'course/course.service','course/course.filter', 'lecture/index']
		},
		'course/directive':{
			deps:['angular', 'security/index']
		},
		'lecture/index':{
			deps:['angular', 'lecture/lecture.controller', 'lecture/lecture.service','lecture/lecture.filter','lecture/lecture.directive']
		},
		'lapp/index':{
			deps: ['angular', 'lapp/lapp.controller', 'lapp/lapp.directive', 'chart', 'angular-google-chart','rtcCtrl/adapter', 'rtcCtrl/create_session', 'rtcCtrl/join_session']
		},
		'angular-google-chart':{
			deps: ['angular']
		},
		'bootstrap':{
			deps:['jquery'],
		},
	}
});



requirejs( [
		'text', 
		'jquery', 
		'angular', 
		'jquery-ui',
		'/socket.io/socket.io.js',
		'angular-resource',
		'angular-route',
		'angular-cookies',
		'angular-ui-router',
		'angular-ui-bootstrap',
		'angular-file-upload',
		'app',
		'accessCfg',
		'chart', 'angular-google-chart',
		//'routes',
		
		'security/index',
		'security/security.controller', 'security/security.directive', 'security/security.service',
		'poll/index',
		'poll/poll.controller', 'poll/poll.service',
		'course/index',
		'course/course.controller', 'course/course.service','course/course.filter','course/course.directive',
		'lecture/index',
		'lecture/lecture.controller', 'lecture/lecture.service','lecture/lecture.filter', 'lecture/lecture.directive',
		'lapp/index',
		'lapp/lapp.controller', 'lapp/lapp.directive',
		'bootstrap',
		
		'rtcCtrl/adapter', 'rtcCtrl/create_session', 'rtcCtrl/join_session',
		//  'rtcCtrl/record' 
	],

	function (text, $, angular) {

		'use strict';
		
	     require(['domReady!'], function (document) {
	    	 
	    	 
	     	angular.bootstrap(document, ['kaisquare']);
	     });
		
	}
);
