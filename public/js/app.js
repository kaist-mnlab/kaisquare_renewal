'use strict';
define(['angular', 'accessCfg'], function(angular, accessCfg) {
	//var app = angular.module('kaisquare', ['ngCookies', 'ui.router', 'ngResource', 'poll', 'security'])
	var app = angular.module('kaisquare', ['ngCookies', 'ui.router', 'ngResource', 'poll'])

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
        .state('public.polls', {
            url: '/polls/',
            templateUrl: 'poll/list',
            controller: 'PollListCtrl'
        })
        .state('public.new', {
            url: '/polls/new/',
            templateUrl: 'poll/new',
            controller: 'PollNewCtrl'
        })
        .state('public.poll', {
            url: '/polls/poll/:pollId',
            templateUrl: 'poll/item',
            controller: 'PollItemCtrl'
        })
        .state('public.courses', {
            url: '/courses/',
            templateUrl: 'course/index',
            controller: 'CourseListCtrl'
        })
        .state('public.course_new', {
            url: '/courses/new/',
            templateUrl: 'course/new',
            controller: 'CourseNewCtrl'
        })
        .state('public.course', {
            url: '/courses/course/:courseId',
            templateUrl: 'course/item',
            controller: 'CourseItemCtrl'
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
        });

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

//.run(['$rootScope', '$state', 'security', function ($rootScope, $state, Auth) {
.run(['$rootScope', '$state', function ($rootScope, $state) {

    $rootScope.$on("$stateChangeStart", function (event, toState, toParams, fromState, fromParams) {
        
    	/*
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
        */
    });

}]);

return app; 

});