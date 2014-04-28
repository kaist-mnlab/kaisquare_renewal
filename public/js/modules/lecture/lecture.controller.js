'use strict';

/* Controllers */
define(['angular'], function(angular) {
angular.module('lecture.controller', ['security', 'ui.bootstrap' ])
//app
.controller('LectureListCtrl',
['$rootScope', '$scope', 'Lecture','$stateParams', function($rootScope, $scope, Lecture,$stateParams) {
	console.log($stateParams);
	
	$scope.course = { _id: $stateParams.courseId }; 
	$scope.lectures = Lecture.query({courseId: $stateParams.courseId});

	$scope.open = function($event) {
  	    $event.preventDefault();
    	$event.stopPropagation();

    	$scope.opened = true;
    };
	
}]);

//app
angular.module('lecture.controller')
.controller('LectureItemCtrl',
['$scope', '$q', '$location','$stateParams','Lecture','User','lectureId', '$modalInstance', '$modal', function($scope, $q, $location, $stateParams,Lecture,User,lectureId, $modalInstance, $modal) {

	$scope.lecture = Lecture.get({lectureId: lectureId});
	
	$scope.lecture.$promise.then(function() {

		}
	);
	


	$scope.launchEdit = function() {
		//$modalInstance.close();
		
		var dlg = null;
		dlg = $modal.open({
				templateUrl: 'lecture/edit',
				controller: 'LectureEditCtrl',
				resolve: {
					lecture: function() {
						return $scope.lecture;
					}
				}
			});
			
		dlg.result.then(function () {
			$scope.lectures = Lecture.query({course: $scope.courseId});
			
		}, function() {
			console.log("Dismissed");
		});
		
	
	};
	
	$scope.view = function() {

		$modalInstance.close();
		$location.path("/lapp/"+$scope.lecture._id);
   		//$scope.$apply();
	
	}
	
	$scope.deleteLecture = function() {
		$scope.lecture.$delete( {id: $scope.lecture._id} , function(p,resp){

			if(!p.error) {
				// If there is no error, redirect to the main view
				console.log("delete Success!");
				//$location.path('/lectures/');
				$modalInstance.close();
			} else {
				alert('Could not delete lecture');
			}
		});
	};
	
}]);

//app
angular.module('lecture.controller')
.controller('LectureNewCtrl',
['$scope', '$modalInstance', '$location','$stateParams','Lecture', 'course', function($scope, $modalInstance, $location, $stateParams,Lecture, course) {
	//var user = $scope.user;

	$scope.course = course;
	$scope.lecture = {
		title: '',
		description: '',
		status: 0,
		course: course._id
	};

	$scope.createLecture = function() {
		var lecture = $scope.lecture;
		
		console.log($scope.lecture.video);
		console.log($scope.lecture.vod_url);
		
		if(lecture.title.length > 0) {
		
			var newLecture = new Lecture(lecture);
			
			console.log(newLecture.video);
			
			newLecture.$save(function(p, resp) {
				if(!p.error) {
					// If there is no error, redirect to the main view
					$modalInstance.close();
				} else {
					alert('Could not create course');
				}
			});
		} else {
			alert('You must enter a title');
		}

	};

	
	$scope.cancel = function() {
		$modalInstance.dismiss('cancel');
	};
	
}]);


angular.module('lecture.controller')
.controller('LectureEditCtrl',
['$scope', '$modalInstance', '$location','$stateParams','Lecture', 'Course', 'lecture', function($scope, $modalInstance, $location, $stateParams,Lecture, Course, lecture) {
	//var user = $scope.user;

	$scope.lecture = lecture;
	//console.log(lecture);	
	$scope.course = Course.get({courseId: lecture.course});
	
	//console.log($scope.course);
	
	$scope.updateLecture = function() {

		var lecture = $scope.lecture;

		if(lecture.title.length > 0) {
		
			lecture.$save(function(p, resp) {
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

	};
	
	$scope.cancel = function() {
		$modalInstance.dismiss('cancel');
	};
	
}]);

});