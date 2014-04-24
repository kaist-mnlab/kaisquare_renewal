'use strict';

/* Controllers */
define(['angular'], function(angular) {

angular.module('lecture.directives', [])
//app
.directive('lectureNav', ['$location', '$http', function($location, $http) {

    return {

        templateUrl: 'lecture/index',
        link: function(scope, element, attrs) {
            scope.location = $location;

        },

    };


}]);

});