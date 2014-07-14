'use strict';

define(['angular',
        'lecture/lecture.controller', 'lecture/lecture.service','lecture/lecture.filter', 'lecture/lecture.directive',
		], function(angular) {

angular.module('lecture', ['lecture.controller', 'lecture.service', 'lecture.filter','lecture.directives']);

});
