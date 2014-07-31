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
		'ocLazyLoad': '../lib/ocLazyLoad',
		
		'poll': 'modules/poll',
		'security': 'modules/security',
		'course': 'modules/course',
		'lecture': 'modules/lecture',
		'lapp':	'modules/lapp',
		'rtcCtrl': 'rtcCtrl',
		
		'domReady': '../lib/require/domReady',
		'chart': '../lib/chart/Chart',
		'angular-google-chart': '../lib/angular-google-chart/ng-google-chart',
		'bootstrap': '//netdna.bootstrapcdn.com/bootstrap/3.1.1/js/bootstrap.min',
		
		
		
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
		
		'access-config':{
			deps:['jquery'],
			exports:'accessConfig'
		},
		
		'auth':{
			deps:['angular']
		},
		
		'angular-google-chart':{
			deps: ['angular']
		},
		'bootstrap':{
			deps:['jquery'],
		},
		'jquery-popup': {
			deps: ['jquery'] 
		},
		'ocLazyLoad': ['angular'],
		'app':{
			deps:['ocLazyLoad']
		},
		'lapp': ['course', 'lecture'],
	}
});



requirejs( [
            
		'text', 
		'jquery', 
		'angular', 
		'jquery-ui',
		'app',
		
		'angular-resource',
		'angular-route',
		'angular-cookies',
		'angular-ui-router',
		'angular-ui-bootstrap',
		'angular-file-upload',
		
		'routes',
		'ocLazyLoad',
		'bootstrap',
	
       
	],

	function (text, $, angular) {

		'use strict';
		
	     require(['domReady!'], function (document) {
	    	 try {
	    	     
	    		 angular.bootstrap(document, ['kaisquare']);
	    		 
	    	 }
	    	 catch (e) {
	    	     console.error(e.stack || e.message || e);
	    	 }
	    	 
	     	
	     });
		
	}
);
