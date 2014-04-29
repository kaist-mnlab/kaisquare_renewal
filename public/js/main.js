'use strict';
requirejs.config({

	baseUrl:'/js',
	paths:{


		'text': '../lib/require/text', //HTML �곗씠�곕� 媛�졇�щ븣 text! �꾨━�쎌뒪瑜�遺숈뿬以�떎.
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
		'chart': '../lib/chart/chart'
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


//requireJS瑜��쒖슜�섏뿬 紐⑤뱢 濡쒕뱶
requirejs( [
		'text', //誘몃━ �좎뼵�대몦 path, css��html��濡쒕뱶�섍린 �꾪븳 requireJS �뚮윭洹몄씤
		'jquery', //誘몃━ �좎뼵�대몦 path, jQuery��AMD瑜�吏�썝�섍린 �뚮Ц���대젃寃�濡쒕뱶�대룄 jQuery �먮뒗 $濡��몄텧�����덈떎.
		'angular', //誘몃━ �좎뼵�대몦 path
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
		'chart',
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

	//�뷀렂�섏떆 濡쒕뱶��肄쒕갚�⑥닔
	function (text, $, angular) {

		'use strict';
		
	     require(['domReady!'], function (document) {
	    	 
	    	 
	     	angular.bootstrap(document, ['kaisquare']);
	     });
		
	}
);
