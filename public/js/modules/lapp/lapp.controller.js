'use strict';

/* Controllers */
define(['angular'], function(angular) {
angular.module('lapp.controller', ['security', 'ui.bootstrap' ])
//app
.controller('LectureAppCtrl',
['$rootScope', '$scope', 'Lecture','$stateParams','$sce', function($rootScope, $scope, Lecture,$stateParams, $sce) {

	$scope.lecture = Lecture.get( {lectureId: $stateParams.lectureId } );
	$scope.trustSrc = function(src) {
	    return $sce.trustAsResourceUrl(src);
	  }
	$scope.open = function($event) {
  	    $event.preventDefault();
    	$event.stopPropagation();

    	$scope.opened = true;
    };
	
}]);


});