'use strict';

/* Controllers */
define(['angular', 'angular-file-upload'], function(angular) {
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
['$scope', '$q', '$location','$stateParams','Lecture','User','lectureId', '$modalInstance', '$modal','lectureService', function($scope, $q, $location, $stateParams,Lecture,User,lectureId, $modalInstance, $modal,lectureService) {

	$scope.lecture = Lecture.get({lectureId: lectureId});
	
	$scope.lecture.$promise.then(function() {
		lectureService.setLecture($scope.lecture);
		$scope.lecture.presentationFile = $scope.lecture.presentation_url.replace(/^.*[\\\/]/, '');
		$scope.lecture.materialFiles = {};
	
		for( var i in $scope.lecture.material_url) {
			$scope.lecture.materialFiles[i] = { 
					fileName : $scope.lecture.material_url[i].url.replace(/^.*[\\\/]/, ''),
					url : $scope.lecture.material_url[i].url,
			
			};
			
		}
		
	});

	$scope.launchEdit = function() {
		//$modalInstance.close();
		
		var dlg = null;
		dlg = $modal.open({
				templateUrl: '/partials/lecture/edit',
				controller: 'LectureEditCtrl',
				backdrop: 'static',
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
['$scope', '$modalInstance', '$location','$stateParams','Lecture', 'course', 'FileUploader','XSRF_TOKEN', '$http',  function($scope, $modalInstance, $location, $stateParams, Lecture, course, FileUploader, csrf_token, $http) {
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
		duration: 0,
		ppt_page: 0,
		ppt_event_log: "",
		course: course._id,
		vod_url: '',
		material_url: [],
		presentation_url: ''
	};
	console.info("fileupload: debug");
	
	$scope.open = function($event) {
		
  	    $event.preventDefault();
    	$event.stopPropagation();
    	
    	$scope.opened = true;
    };
    
	// VoD upload
	var uploader = $scope.uploader = new FileUploader({
        scope: $scope,                          // to automatically update the html. Default: $rootScope
        url: '/fileUpload',
        formData: [
            { key: 'value' }
        ],
        headers: 
                  {'X-CSRF-TOKEN': csrf_token
        },
       
    });
	
	console.log(uploader);
	
	uploader.filters.push({
		name: "videoExtensionFilter",
		fn: function (item) {                    // first user filter
           
        	if(item.type.indexOf("video/mp4")> -1 || item.type.indexOf("video/webm")> -1 || item.type.indexOf("video/ogg")> -1)
        		return true;
        	else
        		return false;
        }
	});
	
	uploader.filters.push({
		name: "pptExtensionFilter",
		fn: function (item) {                    // first user filter
           
         
        	if(item.type.indexOf("presentation")> -1 || item.type.indexOf("pdf") > -1)
        		return true;
        	else
        		return false;
        }
	});
	uploader.filters.push({
		name: "etcExtensionFilter",
		fn: function (item) {                    // first user filter
           return true;
        }
	});
	
	uploader.onAfterAddingFile = function(item) {
		$("#sBtn").attr("disabled",true);
		
	}; 
	

    uploader.onWhenAddingFileFailed = function (item,filter,option) {
        if ($scope.fileUploadFlag == 1)
        	alert("Video Files Only!");
        else if($scope.fileUploadFlag == 2)
        	alert("Presentation Files Only!");
    };

    uploader.onCompleteItem = function (item, response, status, headers) {
        var base_url = $location.$$absUrl.replace($location.$$url, "") + "/uploads/temp/";
        //$scope.lecture.vod_url = $location.$$absUrl.replace($location.$$url, "") + "/uploads/temp/" + item.file.name;
        //console.log($location.$$absUrl + " " + $loca
        ;
        
        var vod = "";
        if ($scope.lecture.status == 0){
        	vod = $("#lectureVoDFile").val().replace(/^.*[\\\/]/, '');
        }
	
        var presentation = "";
        try{
        	presentation = $("#lecturePresentationFile").val().replace(/^.*[\\\/]/, '');
        }catch(err){
        	
        }
        
        if (vod == item.file.name){
        	$scope.lecture.vod_url = base_url + item.file.name.replace(new RegExp(" ", 'g'), "_");
	        var videoPreview = $('#videoPreview'); 
	        videoPreview.attr("src",$scope.lecture.vod_url);
	        videoPreview.get(0).load();
	        videoPreview.get(0).play();
	        videoPreview.show();
	        
	        videoPreview.bind('loadeddata', function(e) {
	        	console.log(e.target.duration);
	        	$scope.lecture.duration = e.target.duration;
	        });
        }
        else if (presentation == item.file.name){
        	$scope.lecture.presentation_url = base_url + item.file.name.replace(new RegExp(" ", 'g'), "_");
        }
        else {
        	var supply_url = base_url + item.file.name.replace(new RegExp(" ", 'g'), "_");
        	$scope.lecture.material_url.push({url: supply_url});
        }
        console.log($scope.lecture);
    };
    
    uploader.onCompleteAll = function() {
    	$("#sBtn").attr("disabled",false);
    };


	$scope.createLecture = function() {
		var lecture = $scope.lecture;
		
		//uploader
		
		if(lecture.title.length > 0) {
		
			var newLecture = new Lecture(lecture);
			
			newLecture.$save(function(p, resp) {
				if(!p.error) {
					// If there is no error, redirect to the main view
					console.log("p");
					console.log(p);
					var url_data = {_id: p._id, status: p.status, vod_url: p.vod_url, presentation_url: p.presentation_url, material_url: p.material_url};
					
					$http.post('/createLecture', url_data).success(function(resp){
						try{
							var base_url = $location.$$absUrl.replace($location.$$url, "") + "/uploads/" + p._id + "/";
							if (p.status == 0)
								p.vod_url = base_url + p.vod_url.replace(/^.*[\\\/]/, '');
							p.presentation_url = base_url + p.presentation_url.replace(/^.*[\\\/]/, '');
							for (var i in p.material_url){
								p.material_url[i].url = base_url + p.material_url[i].url.replace(/^.*[\\\/]/, '');
							}
							p.$save(function(q, resp){
								if(!q.error){
									console.log("q");
									$modalInstance.close();
								}
								else{
									alert('Could not create course');
								}
							});
						}catch(err){
							$modalInstance.close();
						}
					});
					
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

	$scope.lecture = lecture;
	$scope.course = Course.get({courseId: lecture.course});
	
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
