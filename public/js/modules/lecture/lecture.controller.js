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
			console.log($scope.courseId);
			$scope.lectures = Lecture.query({course: $scope.course._id});
			
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
	
	$scope.fileUploadFlag = 0;
	$scope.updateFlag = function(flag){
		$scope.fileUploadFlag = flag;
	}
	$scope.course = course;
	$scope.lecture = {
		title: '',
		description: '',
		status: 0,
		course: course._id,
		vod_url: '',
		material_url: []
	};
	console.info("fileupload: debug");
	
	// VoD upload
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
                console.info('File extension Filter');
                if(item.type.indexOf("video/mp4")> -1 || item.type.indexOf("video/webm")> -1 || item.type.indexOf("video/ogg")> -1)
                	return true;
                if($scope.fileUploadFlag != 1)
                	return false;
                else {
                	return false;
                }
            }
        ]
    });
	
	uploader.bind('afteraddingfile', function (event, item) {
        console.info('After adding a file', item);
    });

    uploader.bind('whenaddingfilefailed', function (event, item) {
        console.info('When adding a file failed', item);
        //alert("Video Files Only!");
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
        $scope.lecture.vod_url = $location.$$absUrl.replace($location.$$url, "") + "/uploads/" + item.file.name;
        
        var videoPreview = $('#videoPreview'); 
        videoPreview.attr("src",$scope.lecture.vod_url);
        videoPreview.get(0).load();
        videoPreview.get(0).play();
        videoPreview.show();
        
        videoPreview.bind('loadeddata', function(e) {
        	console.log(e.target.duration);
        	$scope.lecture.duration = e.target.duration;
        });

    });

    uploader.bind('progressall', function (event, progress) {
        console.info('Total progress: ' + progress);
    });

    // Presentation file upload
    var presentFileUploader = $scope.presentFileUploader = $fileUploader.create({
        scope: $scope,                          // to automatically update the html. Default: $rootScope
        url: '/pptFileUpload',
        formData: [
            { key: 'value' }
        ],
        headers: 
                  {'X-CSRF-TOKEN': csrf_token
        },
       
        filters: [
            function (item) {                    // first user filter
                console.info('File extension Filter');
                console.info(item.type);
                if($scope.fileUploadFlag != 2)
                	return false;
                if(item.type.indexOf("presentation")> -1)
                	return true;
                else {
                	return false;
                }
            }
        ]
    });
	
    presentFileUploader.bind('afteraddingfile', function (event, item) {
        console.info('After adding a file', item);
    });

    presentFileUploader.bind('whenaddingfilefailed', function (event, item) {
        console.info('When adding a file failed', item);
        //alert('PPT/PPTX only!')
    });

    presentFileUploader.bind('afteraddingall', function (event, items) {
        console.info('After adding all files', items);
    });

    presentFileUploader.bind('beforeupload', function (event, item) {
        console.info('Before upload', item);
    });

    presentFileUploader.bind('progress', function (event, item, progress) {
        console.info('Progress: ' + progress, item);
    });

    presentFileUploader.bind('success', function (event, xhr, item, response) {
        console.info('Success', xhr, item, response);
    });

    presentFileUploader.bind('cancel', function (event, xhr, item) {
        console.info('Cancel', xhr, item);
    });

    presentFileUploader.bind('error', function (event, xhr, item, response) {
        console.info('Error', xhr, item, response);
    });

    presentFileUploader.bind('complete', function (event, xhr, item, response) {
        console.info('Complete', xhr, item, response);
        $scope.lecture.presentation_url = $location.$$absUrl.replace($location.$$url, "") + "/uploads/" + item.file.name;
    });
    presentFileUploader.bind('progressall', function (event, progress) {
        console.info('Total progress: ' + progress);
    });
    
    // Lecture file upload
    var lecFileUploader = $scope.lecFileUploader = $fileUploader.create({
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
            	console.log(item);
                console.info('File extension Filter');
                console.info(item.type);
                
                if($scope.fileUploadFlag != 3)
                	return false;
                if(item.type.indexOf("presentation")> -1)
                	return true;
                else {
                	return true;
                }
            }
        ]
    });
	
    lecFileUploader.bind('afteraddingfile', function (event, item) {
        console.info('After adding a file', item);
    });

    lecFileUploader.bind('whenaddingfilefailed', function (event, item) {
        console.info('When adding a file failed', item);
        //alert('PPT/PPTX only!')
    });

    lecFileUploader.bind('afteraddingall', function (event, items) {
        console.info('After adding all files', items);
    });

    lecFileUploader.bind('beforeupload', function (event, item) {
        console.info('Before upload', item);
    });

    lecFileUploader.bind('progress', function (event, item, progress) {
        console.info('Progress: ' + progress, item);
    });

    lecFileUploader.bind('success', function (event, xhr, item, response) {
        console.info('Success', xhr, item, response);
    });

    lecFileUploader.bind('cancel', function (event, xhr, item) {
        console.info('Cancel', xhr, item);
    });

    lecFileUploader.bind('error', function (event, xhr, item, response) {
        console.info('Error', xhr, item, response);
    });

    lecFileUploader.bind('complete', function (event, xhr, item, response) {
        console.info('Complete', xhr, item, response);
        $scope.lecture.material_url.push($location.$$absUrl.replace($location.$$url, "") + "/uploads/" + item.file.name);
    });
    lecFileUploader.bind('progressall', function (event, progress) {
        console.info('Total progress: ' + progress);
    });
    // END: supplyment file upload
    
	$scope.createLecture = function() {
		var lecture = $scope.lecture;
		
		if(lecture.title.length > 0) {
		
			var newLecture = new Lecture(lecture);
				
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