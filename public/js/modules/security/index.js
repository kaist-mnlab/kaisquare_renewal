'use strict';

/* Controllers */
define(['angular',
        'security/security.service',
        'security/security.controller',
        'security/security.directive'
        
        ], function(angular) {

angular.module('security', [
  'security.service',
  'security.controller',
  'security.directives',
]);

});