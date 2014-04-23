'use strict';

/* Controllers */
define(['angular'], function(angular) {
angular.module('lecture.controller', ['security'])
//app
.controller('LectureListCtrl',
['$rootScope', '$scope', 'Lecture','$stateParams', function($rootScope, $scope, Lecture,$stateParams) {
	console.log($stateParams);
	
	$scope.course = { _id: $stateParams.courseId }; 
	$scope.lectures = Lecture.query({courseId: $stateParams.courseId});
}]);


//app
angular.module('lecture.controller')
.controller('LectureItemCtrl',
['$scope', '$q', '$location','$stateParams','Lecture','User', function($scope, $q, $location, $stateParams,Lecture,User) {

	$scope.lecture = Lecture.get({lectureId: $stateParams.lectureId});
	//$scope.course = delayedValue($scope, deferred, Course.get({courseId: $stateParams.courseId}));

	
	$scope.lecture.$promise.then(function() {
			//$scope.course.usersData = [];
			/*
			for(var u in $scope.course.users) {
				$scope.course.usersData.push( { user: User.get({userId: $scope.course.users[u].user}) , role_bitMask: $scope.course.users[u].role_bitMask});					
			};
			*/
		}
	);


	
	$scope.deleteLecture = function() {
		$scope.lecture.$delete( {id: $scope.lecture._id} , function(p,resp){

			if(!p.error) {
				// If there is no error, redirect to the main view
				console.log("delete Success!");
				$location.path('/lectures/');
			} else {
				alert('Could not delete lecture');
			}
		});
	};
	
}]);

//app
angular.module('lecture.controller')
.controller('LectureNewCtrl',
['$scope', '$location','$stateParams','Lecture', function($scope, $location, $stateParams,Lecture) {
	var user = $scope.user; 
	$scope.lecture = {
			title: '',
			description: '',
			status: number,

		};
	
	//In case of UPDATE
	if($stateParams.lectureId !== undefined) {
		$scope.lecture = Lecture.get({lectureId: $stateParams.lectureId});
	}
	// Define an empty poll model object
	// Validate and save the new poll to the database
	$scope.createLecture = function() {
		var lecture = $scope.lecture;
		
		if(lecture.title.length > 0) {
		
			var newLecture = new Lecture(lecture);
			//console.log(newCourse);
			newLecture.$save(function(p, resp) {
				if(!p.error) {
					// If there is no error, redirect to the main view
					$location.path('/lectures/');
				} else {
					alert('Could not create course');
				}
			});
		} else {
			alert('You must enter a title');
		}

	};
	
	$scope.updateLecture = function() {

		var lecture = $scope.lecture;

		if(lecture.title.length > 0) {
		
			lecture.$save(function(p, resp) {
				if(!p.error) {
					// If there is no error, redirect to the main view
					$location.path('/courses/');
				} else {
					alert('Could not update course');
				}
			});
		} else {
			alert('You must enter a title');
		}

	};
	
}]);


});