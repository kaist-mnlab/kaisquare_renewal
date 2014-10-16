'use strict';

define([
		'app', //생성한 앵귤러 모듈에 루트를 등록하기 위해 임포트
		'access-config',
		
	],

	function (app, accessConfig) {
		//
		return app.config(['$stateProvider', '$urlRouterProvider', '$locationProvider', '$httpProvider', function ($stateProvider, $urlRouterProvider, $locationProvider, $httpProvider) {
		    
	    	var access = accessConfig.accessLevels;
	    	
		    // Public routes
		    $stateProvider
		        .state('public', {
		            abstract: true,
		            template: "<ui-view/>",
		            data: {
		                access: access.public
		            }
		        })
		        .state('public.404', {
		            url2cduw: '/404/',
		            templateUrl: '404'
		        })
		        .state('public.lapp', {
		            url: '/lapp/:lectureId',
		            templateUrl: '/partials/lapp',
		            controller: 'LectureAppCtrl',
		            resolve: {
		            	loadLapp:['$ocLazyLoad',  function($ocLazyLoad) {
		            		return $ocLazyLoad.load({
		            			name: 'lapp',
		            			files: ['/js/modules/lapp/index.js']
		            		});
		            		
		            	}]
		            }
		        })
		        .state('public.home', {
		            url: '/',
		            templateUrl: 'home'
		        })
		        .state('public.introduction', {
		            url: '/introduction',
		            templateUrl: 'introduction',
		        })
		        .state('public.courses', {
		        	abstract: true,
		            url: '/courses/',
		            templateUrl: 'course/layout',
		            //controller: 'CourseListCtrl'
		            resolve: {
		            	loadCourse:['$ocLazyLoad', function($ocLazyLoad) {
		            		return $ocLazyLoad.load({
		            			name: 'course',
		            			files: ['/js/modules/course/index.js','/js/modules/lecture/index.js']
		            		});
		            		
		            	}]
		            }
		        })
		        .state('public.courses.index', {
		            url: '',
		            templateUrl: '/partials/course/index',
		            controller: 'CourseListCtrl',
		            resolve: {
		            	
		            	loadLecture:['$ocLazyLoad', function($ocLazyLoad) {
		            		return $ocLazyLoad.load({
		            			name: 'lecture',
		            			files: ['/js/modules/lecture/index.js']
		            		});
		            		
		            	}],
		            	loadList:['loadLecture', function(loadLecture) {
		            		
		            		
		            	}],
		            	
		            	
		            }
		            	
		        })
		        .state('public.courses.show', {
		            url: 'course/:courseId',
		            templateUrl: '/partials/course/show',
		            controller: 'CourseItemCtrl',
		            
		            resolve: {
		            	
		            	loadLecture:['$ocLazyLoad', function($ocLazyLoad) {
		            		return $ocLazyLoad.load({
		            			name: 'lecture',
		            			files: ['/js/modules/course/index.js', '/js/modules/lecture/index.js']
		            		});
		            		
		            	}],
		            	loadList:['loadLecture', function(loadLecture) {
		            		
		            		
		            	}],
		            	
		            }
		        })
		        .state('public.lectures', {
		        	abstract: true,
		            url: '/lectures/',
		            templateUrl: 'lecture/layout',
		            resolve: {
		            	loadLecture:['$ocLazyLoad', function($ocLazyLoad) {
		            		return $ocLazyLoad.load({
		            			name: 'lecture',
		            			files: ['/js/modules/course/index.js', '/js/modules/lecture/index.js']
		            		});
		            		
		            	}]
		            }
		        })
		        .state('public.lectures.index', {
		            url: '',
		            templateUrl: '/partials/lecture/index',
		            controller: 'LectureListCtrl'
		        })
		        .state('public.lectures.show', {
		            url: '/lectures/lecture/:lectureId',
		            templateUrl: '/partials/lecture/show',
		            controller: 'LectureItemCtrl'
		        })
		   
		        ;
		
		    // Anonymous routes
		    $stateProvider
		        .state('anon', {
		            abstract: true,
		            template: "<ui-view/>",
		            data: {
		                access: access.anon
		            }
		        })
		        .state('anon.login', {
		            url: '/login/',
		            templateUrl: 'login',
		            controller: 'LoginCtrl'
		        })
		        .state('anon.register', {
		            url: '/register/',
		            templateUrl: 'register',
		            controller: 'RegisterCtrl'
		        });
		
		
		    // Regular user routes
		    $stateProvider
		        .state('user', {
		            abstract: true,
		            template: "<ui-view/>",
		            data: {
		                access: access.user
		            }
		        })
		        .state('user.home', {
		            url: '/',
		            templateUrl: 'home'
		        })
		        .state('user.private', {
		            abstract: true,
		            url: '/private/',
		            templateUrl: 'private/layout'
		        })
		        .state('user.private.home', {
		            url: '',
		            templateUrl: 'private/home'
		        })
		        .state('user.private.nested', {
		            url: 'nested/',
		            templateUrl: 'private/nested'
		        })
		        .state('user.private.admin', {
		            url: 'admin/',
		            templateUrl: 'private/nestedAdmin',
		            data: {
		                access: access.admin
		            }
		        })
		        .state('user.courses', {
		        	abstract: true,
		            url: '/courses/',
		            templateUrl: 'course/layout',
		            resolve: {
		            	loadCourse:['$ocLazyLoad', function($ocLazyLoad) {
		            		return $ocLazyLoad.load({
		            			name: 'course',
		            			files: ['/js/modules/course/index.js', '/js/modules/lecture/index.js']
		            		});
		            		
		            	}]
		            }
		        })
		        .state('user.courses.new', {
		            url: 'new/',
		            templateUrl: '/partials/course/new',
		            controller: 'CourseNewCtrl'
		        })
		        .state('user.courses.edit', {
		            url: 'course/:courseId/edit',
		            templateUrl: '/partials/course/edit',
		            controller: 'CourseNewCtrl'
		        })
		        .state('user.lectures', {
		        	abstract: true,
		            url: '/lectures/',
		            //url: '/lectures/new',
		            templateUrl: '/partials/lecture/layout',
		            resolve: {
		            	loadLecture:['$ocLazyLoad', function($ocLazyLoad) {
		            		return $ocLazyLoad.load({
		            			name: 'lecture',
		            			files: ['/js/modules/course/index.js', '/js/modules/lecture/index.js']
		            		});
		            		
		            	}]
		            }
		        })
		        .state('user.lectures.new', {
		            url: 'new/',
		            templateUrl: '/partials/lecture/new',
		            controller: 'LectureNewCtrl'
		        })
		        .state('user.lectures.edit', {
		            url: 'lecture/:lectureId/edit',
		            templateUrl: '/partials/lecture/edit',
		            controller: 'LectureNewCtrl'
		        })
		        .state('user.lapp', {
		            url: '/lapp/:lectureId',
		            templateUrl: '/partials/lapp',
		            controller: 'LectureAppCtrl',
		            resolve: {
		            	loadLapp:['$ocLazyLoad',  function($ocLazyLoad) {
		            		return $ocLazyLoad.load({
		            			name: 'lapp',
		            			files: ['/js/modules/lapp/index.js']
		            		});
		            		
		            	}]
		            }
		        })
		        .state('user.lapp.quiz', {
		        	url: 'lapp/:lectureId',
		        	templateUrl: '/partials/lapp/quiz',
		        	controller: 'QuizQuestionCtrl',
		        	resolve: {
		            	loadLapp:['$ocLazyLoad',  function($ocLazyLoad) {
		            		return $ocLazyLoad.load({
		            			name: 'lapp',
		            			files: ['/js/modules/lapp/index.js']
		            		});
		            		
		            	}]
		            }
		        })
		        .state('user.ppt', {
		        	url: '/ppt/:lectureId',
		        	templateUrl: '/partials/lapp/ppt',
		        	controller: 'PPTCtrl',
		        	resolve: {
		            	loadLapp:['$ocLazyLoad',  function($ocLazyLoad) {
		            		return $ocLazyLoad.load({
		            			name: 'lapp.ppt',
		            			files: ['/js/modules/lapp/lapp.ppt.js', '/js/modules/lecture/lecture.service.js',  '/js/modules/lapp/lapp.service.js', '/js/modules/course/course.service.js',]
		            		});
		            		
		            	}]
		            }
		        })
		        .state('user.lapp.question', {
		        	url: 'lapp/:lectureId',
		        	templateUrl: '/partials/lapp/question',
		        	controller: 'RaiseQuestionCtrl',
		        	resolve: {
		            	loadLapp:['$ocLazyLoad',  function($ocLazyLoad) {
		            		return $ocLazyLoad.load({
		            			name: 'lapp',
		            			files: ['/js/modules/lapp/index.js']
		            		});
		            		
		            	}]
		            }
		        })
		        
		        ;
		
		    // Admin routes
		    $stateProvider
		        .state('admin', {
		            abstract: true,
		            template: "<ui-view/>",
		            data: {
		                access: access.admin
		            }
		        })
		        .state('admin.admin', {
		            url: '/admin/',
		            templateUrl: 'admin',
		            controller: 'AdminCtrl'
		        });
		
		
		    $urlRouterProvider.otherwise('/404');
		
		    // FIX for trailing slashes. Gracefully "borrowed" from https://github.com/angular-ui/ui-router/issues/50
		    $urlRouterProvider.rule(function($injector, $location) {
		        if($location.protocol() === 'file')
		            return;
		
		        var path = $location.path()
		        // Note: misnomer. This returns a query object, not a search string
		            , search = $location.search()
		            , params
		            ;
		
		        // check to see if the path already ends in '/'
		        if (path[path.length - 1] === '/') {
		            return;
		        }
		
		        // If there was no search string / query params, return with a `/`
		        if (Object.keys(search).length === 0) {
		            return path + '/';
		        }
		
		        // Otherwise build the search string and return a `/?` prefix
		        params = [];
		        angular.forEach(search, function(v, k){
		            params.push(k + '=' + v);
		        });
		        return path + '/?' + params.join('&');
		    });
		
		    $locationProvider.html5Mode(true);
		
		    $httpProvider.interceptors.push(function($q, $location) {
		        return {
		            'responseError': function(response) {
		                if(response.status === 401 || response.status === 403) {
		                    $location.path('/login');
		                }
		                return $q.reject(response);
		            }
		        };
		    });

	}])
	.run(['$rootScope', '$state', 'security', function ($rootScope, $state, Auth) {

	    $rootScope.$on("$stateChangeStart", function (event, toState, toParams, fromState, fromParams) {

	        if (!Auth.authorize(toState.data.access)) {
	            $rootScope.error = "Seems like you tried accessing a route you don't have access to...";
	            event.preventDefault();
	            
	            if(fromState.url === '^') {
	                if(Auth.isLoggedIn()) {
	                    $state.go('user.home');
	                } else {
	                    $rootScope.error = null;
	                    $state.go('anon.login');
	                }
	            }
	        }
	        
	    });

	}]);
});