'use strict';

define(['angular', 'accessCfg'], function(angular, accessCfg) {
//'ui.bootstrap.dialog'
angular.module('security.service', ['ngResource'])
//.factory('security', ['$http', '$dialog', '$cookieStore', function($http, $dialog, $cookieStore) {
.factory('security', ['$http', '$cookieStore', function($http, $cookieStore) {

    var accessLevels = accessCfg.accessLevels
        , userRoles = accessCfg.userRoles
        , currentUser = $cookieStore.get('user') || { username: '', role: userRoles.public, _id: '' };

    $cookieStore.remove('user');
    
 // Login form dialog stuff
    var loginDialog = null;
    function openLoginDialog() {
      if ( loginDialog ) {
        throw new Error('Trying to open a dialog that is already open!');
      }
      //loginDialog = $dialog.dialog();
      //TODO partial view change
      //loginDialog.open('security/login/form.tpl.html', 'LoginFormController').then(onLoginDialogClose);
    }
    
    function closeLoginDialog(success) {
      if (loginDialog) {
        loginDialog.close(success);
      }
    }
    function onLoginDialogClose(success) {
      loginDialog = null;
      if ( success ) {
        //queue.retryAll();
    	  ;
      } else {
        //queue.cancelAll();
        //redirect();
    	  ;
      }
    }

    function changeUser(user) {
        angular.extend(currentUser, user);
    }

    var service = {
    	showLogin: function() {
    		openLoginDialog();
    	},
        cancelLogin: function() {
            closeLoginDialog(false);
            redirect();
        },
        authorize: function(accessLevel, role) {

            if(role === undefined) {
                role = currentUser.role;
            }
            return accessLevel.bitMask & role.bitMask;
        },
        isLoggedIn: function(user) {
            if(user === undefined) {
                user = currentUser;
            }
            return user.role.title === userRoles.user.title || user.role.title === userRoles.admin.title;
        },
        register: function(user, success, error) {
            $http.post('/register', user).success(function(res) {
                changeUser(res);
                success();
            }).error(error);
        },
        login: function(user, success, error) {
            $http.post('/login', user).success(function(user){
            	console.log(user);
                changeUser(user);
                success(user);
            }).error(error);
        },
        logout: function(success, error) {

            $http.post('/logout').success(function(){
                changeUser({
                    username: '',
                    role: userRoles.public,
                    _id: ''
                });
                success();
            }).error(error);
        },
        accessLevels: accessLevels,
        userRoles: userRoles,
        user: currentUser,
        //isAuthenticated, isAdmin --> deal with userRoles
    };
    
    return service;
}]);

angular.module('security.service')
//app
	.factory('Users', function($http) {
	    return {
	        getAll: function(success, error) {
	            $http.get('/users').success(success).error(error);
	        }
	    };
	});



angular.module('security.service')
//app
	.factory('User', function($resource) {
	    return $resource('/user/:userId', {}, {
			// Use this method for getting a list of polls
			query: { method: 'GET', params: { userId: 'users' }, isArray: true }
		});
	});

});
