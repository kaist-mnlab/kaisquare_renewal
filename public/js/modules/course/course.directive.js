'use strict';
define(['angular'], function(angular) {

angular.module('course.directives', [])
//app
.directive('courseAccessLevel', ['Course', function(course) {
    return {
		scope: true,
        restrict: 'A',
        link: function($scope, element, attrs) {
            var prevDisp = element.css('display')
                , courseUserRole
                , courseAccessLevel;

            $scope.$watch('user', function(user) {

                if(user.courseUserRole)
                    courseUserRole = user.courseUserRole;
                updateCSS();
            }, true);

            attrs.$observe('courseAccessLevel', function(al) {
                if(al) courseAccessLevel = $scope.$eval(al);
                updateCSS();
            });

            function updateCSS() {

                if(courseUserRole && courseAccessLevel) {
                    if(!course.authorize(courseAccessLevel, courseUserRole)) {
                        element.css('display', 'none');
                    }    
                    else {
                        element.css('display', prevDisp);
                    }
                }
            }
        }
    };
}]);




});