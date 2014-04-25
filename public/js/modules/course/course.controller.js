'use strict';

/* Controllers */
define(['angular'], function(angular) {
angular.module('course.controller', ['security', 'lecture','ui.bootstrap'])
//app
.controller('CourseListCtrl',
[ '$scope', 'Course', '$modal', function( $scope, Course, $modal) {

	$scope.courses = Course.query();
	$scope.launch = function(which){
		
		var dlg = null;
		
		switch(which){
		case 'newCourse':
			dlg = $modal.open({
				templateUrl: 'course/new',
				controller: 'CourseNewCtrl',
				resolve: {
					user: function() {
						return $scope.user;
					}
				}
			});
			
			dlg.result.then(function () {
				$scope.courses = Course.query();
			}, function() {
				console.log("Dismissed");
			});
			
			break;
		};
	
	};
		
	
}]);


//app
angular.module('course.controller')
.controller('CourseItemCtrl',
['$scope', '$q', '$location','$stateParams','Course','User','$http','Lecture','$modal', function($scope, $q, $location, $stateParams,Course,User, $http, Lecture, $modal) {

	$scope.course = Course.get({courseId: $stateParams.courseId});
	//$scope.course = delayedValue($scope, deferred, Course.get({courseId: $stateParams.courseId}));
	
	$scope.lectureURL = $location.$$absUrl + '/lectures';
	$scope.lectureContent;

	$scope.courseId = $scope.course._id;
	//$scope.lectures = Lecture.query();
	$scope.lectures = Lecture.query({course: $scope.courseId});
	
	$scope.lectures.$promise.then(function() {
		$scope.launchLecture = function(id){
				var dlg = null;
				dlg = $modal.open({
						templateUrl: 'lecture/show',
						controller: 'LectureItemCtrl',
						resolve: {
							lectureId: function() {
								
								return id;
							}
						}
					});
					
				dlg.result.then(function () {
					$scope.lectures = Lecture.query({course: $scope.courseId});
					
				}, function() {
					console.log("Dismissed");
				});
			}
	});
	$scope.open = function($event) {
  	    $event.preventDefault();
    	$event.stopPropagation();

    	$scope.opened = true;
    };
	
	$scope.launch = function(which){
		
		var dlg = null;
		
		switch(which){
		case 'newLecture':
			
			dlg = $modal.open({
				templateUrl: 'lecture/new',
				controller: 'LectureNewCtrl',
				resolve: {
					user: function() {
						return $scope.user;
					},
					course: function() {
						return $scope.course;
					}
				}
			});
			
			dlg.result.then(function () {
				$scope.lectures = Lecture.query({courseId: $stateParams.courseId});
			}, function() {
				console.log("Dismissed");
			});
			
			break;
		case 'editCourse':
				dlg = $modal.open({
					templateUrl: 'course/edit',
					controller: 'CourseNewCtrl',
					resolve: {
						user: function() {
							return $scope.user;
						},
						course: function() {
							return $scope.course;					
						}
					}
				});
				
				dlg.result.then(function () {
					console.log("success");
					$scope.course = Course.get({courseId: $stateParams.courseId});
				}, function() {
					console.log("Dismissed");
				});
				
				break;
			};
		};
	
	$scope.course.$promise.then(function() {
			$scope.course.usersData = [];
			
			for(var u in $scope.course.users) {
				$scope.course.usersData.push( { user: User.get({userId: $scope.course.users[u].user}) , role_bitMask: $scope.course.users[u].role_bitMask});					
			};
			
			
		}
	);
	
	
	$scope.deleteCourse = function() {
		$scope.course.$delete( {id: $scope.course._id} , function(p,resp){

			if(!p.error) {
				// If there is no error, redirect to the main view
				console.log("delete Success!");
				$location.path('/courses/');
			} else {
				alert('Could not delete course');
			}
		});
	};
	
	
}]);

//app
angular.module('course.controller')
.controller('CourseNewCtrl',
['$scope', '$modalInstance','$location','$stateParams','Course', 'user', function($scope, $modalInstance, $location, $stateParams,Course, user) {

	$scope.user = user;
	
	$scope.course = {
			title: '',
			abstract: '',
			description: '',
			hidden: false,
			users: [ {user: user._id , role_bitMask: 7}],

		};
	
	if($stateParams.courseId !== undefined) {
		$scope.course = Course.get({courseId: $stateParams.courseId});
	}
	// Define an empty poll model object
	// Validate and save the new poll to the database
	
	$scope.createCourse = function() {
		var course = $scope.course;
		// Check that a question was provided
		if(course.title.length > 0) {
		
			var newCourse = new Course(course);
			//console.log(newCourse);
			newCourse.$save(function(p, resp) {
				if(!p.error) {
					$modalInstance.close();
				} else {
					alert('Could not create course');
				}
			});
		} else {
			
			alert('You must enter a title');
		}

	};
	
	$scope.updateCourse = function() {
		var course = $scope.course;
		
		// Check that a question was provided
		if(course.title.length > 0) {
		
			course.$save(function(p, resp) {
				if(!p.error) {
					// If there is no error, redirect to the main view
					$modalInstance.close();
				} else {
					alert('Could not update course');
				}
			});
		} else {
			alert('You must enter a title');
		}
/*
			// Loop through the choices, make sure at least two provided
			for(var i = 0, ln = poll.choices.length; i < ln; i++) {
				var choice = poll.choices[i];
				
				if(choice.text.length > 0) {
					choiceCount++
				}
			}
		
			if(choiceCount > 1) {
				// Create a new poll from the model
				var newPoll = new Poll(poll);
				
				// Call API to save poll to the database
				newPoll.$save(function(p, resp) {
					if(!p.error) {
						// If there is no error, redirect to the main view
						//$location.path('/polls');
						$location.path('/polls');
					} else {
						alert('Could not create poll');
					}
				});
			} else {
				alert('You must enter at least two choices');
			}
		} else {
			alert('You must enter a question');
		}
*/
	};
	
	$scope.cancel = function() {
		$modalInstance.dismiss('cancel');
	};
	
}]);


});