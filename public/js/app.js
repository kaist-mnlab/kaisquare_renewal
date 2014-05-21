'use strict';
define(['angular', 'accessCfg'], function(angular, accessCfg) {
	var app = angular.module('kaisquare', ['ngCookies', 'ui.router', 'ngResource', 'poll', 'security', 'course', 'lecture','lapp'])

    .config(['$stateProvider', '$urlRouterProvider', '$locationProvider', '$httpProvider', function ($stateProvider, $urlRouterProvider, $locationProvider, $httpProvider) {

    var access = accessCfg.accessLevels;

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
            url: '/404/',
            templateUrl: '404'
        })
        .state('public.lapp', {
            url: '/lapp/:lectureId',
            templateUrl: 'lapp',
            controller: 'LectureAppCtrl'
        })
        .state('public.introduction', {
            url: '/introduction',
            templateUrl: 'introduction',
        })
        .state('public.polls', {
            url: '/polls/',
            templateUrl: 'poll/list',
            controller: 'PollListCtrl'
        })
        .state('public.new', {
            url: '/polls/new',
            templateUrl: 'poll/new',
            controller: 'PollNewCtrl'
        })
        .state('public.poll', {
            url: '/polls/poll/:pollId',
            templateUrl: 'poll/item',
            controller: 'PollItemCtrl'
        })
        .state('public.courses', {
        	abstract: true,
            url: '/courses/',
            templateUrl: 'course/layout',
            //controller: 'CourseListCtrl'
        })
        .state('public.courses.index', {
            url: '',
            templateUrl: 'course/index',
            controller: 'CourseListCtrl'
        })
        .state('public.courses.show', {
            url: 'course/:courseId',
            templateUrl: 'course/show',
            controller: 'CourseItemCtrl'
        })
        .state('public.lectures', {
        	abstract: true,
            url: '/lectures/',
            templateUrl: 'lecture/layout',
            //controller: 'CourseListCtrl'
        })
        .state('public.lectures.index', {
            url: '',
            templateUrl: 'lecture/index',
            controller: 'LectureListCtrl'
        })
        .state('public.lectures.show', {
            url: '/lectures/lecture/:lectureId',
            templateUrl: 'lecture/show',
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
            //controller: 'CourseListCtrl'
        })
        .state('user.courses.new', {
            url: 'new/',
            templateUrl: 'course/new',
            controller: 'CourseNewCtrl'
        })
        .state('user.courses.edit', {
            url: 'course/:courseId/edit',
            templateUrl: 'course/edit',
            controller: 'CourseNewCtrl'
        })
        .state('user.lectures', {
        	abstract: true,
            url: '/lectures/',
            //url: '/lectures/new',
            templateUrl: 'lecture/layout',
            //controller: 'CourseListCtrl'
        })
        .state('user.lectures.new', {
            url: 'new/',
            templateUrl: 'lecture/new',
            controller: 'LectureNewCtrl'
        })
        .state('user.lectures.edit', {
            url: 'lecture/:lectureId/edit',
            templateUrl: 'lecture/edit',
            controller: 'LectureNewCtrl'
        })
        .state('user.lapp.quiz', {
        	url: 'lapp/:lectureId',
        	templateUrl: 'lapp/quiz',
        	controller: 'QuizQuestionCtrl'
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

	app.constant("XSRF_TOKEN", $('meta[name="csrf-token"]').attr('content') );
	
	
return app; 

});