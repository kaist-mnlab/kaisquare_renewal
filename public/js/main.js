'use strict';
requirejs.config({

	baseUrl:'/js',
	paths:{


		'text': '../lib/require/text', //HTML 데이터를 가져올때 text! 프리픽스를 붙여준다.
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
		'domReady': '../lib/require/domReady'

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
			deps:['angular']
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
		
	}
});


//requireJS를 활용하여 모듈 로드
requirejs( [
		'text', //미리 선언해둔 path, css나 html을 로드하기 위한 requireJS 플러그인
		'jquery', //미리 선언해둔 path, jQuery는 AMD를 지원하기 때문에 이렇게 로드해도 jQuery 또는 $로 호출할 수 있다.
		'angular', //미리 선언해둔 path
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

		//'routes',
		
		'security/index',
		'security/security.controller', 'security/security.directive', 'security/security.service',
		'poll/index',
		'poll/poll.controller', 'poll/poll.service',
		'course/index',
		'course/course.controller', 'course/course.service','course/course.filter','course/course.directive',
		'lecture/index',
		'lecture/lecture.controller', 'lecture/lecture.service','lecture/lecture.filter', 'lecture/lecture.directive',
		'lapp/lapp.controller'
	
	],

	//디펜던시 로드뒤 콜백함수
	function (text, $, angular) {

		'use strict';
		
	     require(['domReady!'], function (document) {
	    	 
	    	 
	     	angular.bootstrap(document, ['kaisquare']);
	     });
		
	}
);
