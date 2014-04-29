'use strict';

/* Controllers */
define(['angular'], function(angular) {
angular.module('lecture.controller', ['security', 'ui.bootstrap' , 'angularFileUpload'])
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
['$scope', '$modalInstance', '$location','$stateParams','Lecture', 'course', '$fileUploader','XSRF_TOKEN',  function($scope, $modalInstance, $location, $stateParams, Lecture, course, $fileUploader, csrf_token) {
	//var user = $scope.user;

	$scope.course = course;
	$scope.lecture = {
		title: '',
		description: '',
		status: 0,
		course: course._id
	};
	

	var uploader = $scope.uploader = $fileUploader.create({
        scope: $scope,                          // to automatically update the html. Default: $rootScope
        url: '/fileUpload',
        formData: [
            { key: 'value' }
        ],
        headers: 
                  {'X-CSRF-TOKEN': csrf_token
        },
       
        filters: [
            function (item) {                    // first user filter
                console.info('filter1');
                return true;
            }
        ]
    });
	
	uploader.bind('afteraddingfile', function (event, item) {
        console.info('After adding a file', item);
    });

    uploader.bind('whenaddingfilefailed', function (event, item) {
        console.info('When adding a file failed', item);
    });

    uploader.bind('afteraddingall', function (event, items) {
        console.info('After adding all files', items);
    });

    uploader.bind('beforeupload', function (event, item) {
        console.info('Before upload', item);
    });

    uploader.bind('progress', function (event, item, progress) {
        console.info('Progress: ' + progress, item);
    });

    uploader.bind('success', function (event, xhr, item, response) {
        console.info('Success', xhr, item, response);
    });

    uploader.bind('cancel', function (event, xhr, item) {
        console.info('Cancel', xhr, item);
    });

    uploader.bind('error', function (event, xhr, item, response) {
        console.info('Error', xhr, item, response);
    });

    uploader.bind('complete', function (event, xhr, item, response) {
        console.info('Complete', xhr, item, response);
        console.log(item.file.name);
        console.log($location);
        $scope.lecture.vod_url = $location.$$absUrl.replace($location.$$url, "") + "/uploads/" + item.file.name;
        console.log($scope.lecture.vod_url);
    });

    uploader.bind('progressall', function (event, progress) {
        console.info('Total progress: ' + progress);
    });

    

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