'use strict';

/* Controllers */
define(['angular'], function(angular) {
angular.module('security.controller', [])
//app
.controller('NavCtrl', ['$rootScope', '$scope', '$location', 'security', function($rootScope, $scope, $location, security) {
    $scope.user = security.user;
    $scope.userRoles = security.userRoles;
    $scope.accessLevels = security.accessLevels;
    
    $scope.logout = function() {
        security.logout(function(res) {
            $location.path('/login');
        }, function(err) {
            $rootScope.error = "Failed to logout";
        });
    };
}]);

angular.module('security.controller')
.controller('LoginCtrl',
		['$rootScope', '$scope', '$location', '$window', 'security', function($rootScope, $scope, $location, $window, security) {

		    $scope.rememberme = true;
		    $scope.login = function() {
		        security.login({
		                username: $scope.username,
		                password: $scope.password,
		                rememberme: $scope.rememberme
		            },
		            function(res) {
		                $location.path('/');
		            },
		            function(err) {
		                $rootScope.error = "Failed to login";
		            });
		    };
		    $scope.cancelLogin = function() {
		        security.cancelLogin();
		      };
		    $scope.loginOauth = function(provider) {
		        $window.location.href = '/auth/' + provider;
		    };
		}]);


angular.module('security.controller')
//app
.controller('RegisterCtrl',
['$rootScope', '$scope', '$location', 'security', function($rootScope, $scope, $location, security) {
    $scope.role = security.userRoles.user;
    $scope.userRoles = security.userRoles;

    $scope.register = function() {
        security.register({
                username: $scope.username,
                password: $scope.password,
                role: $scope.role
            },
            function() {
                $location.path('/');
            },
            function(err) {
                $rootScope.error = err;
            });
    };
}]);

angular.module('security.controller')
//app
.controller('AdminCtrl',
['$rootScope', '$scope', 'Users', 'security', function($rootScope, $scope, Users, security) {
    $scope.loading = true;
    $scope.userRoles = security.userRoles;

    Users.getAll(function(res) {
        $scope.users = res;
        $scope.loading = false;
    }, function(err) {
        $rootScope.error = "Failed to fetch users.";
        $scope.loading = false;
    });

}]);

});
