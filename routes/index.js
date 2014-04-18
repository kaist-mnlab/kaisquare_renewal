var _ =           require('underscore')
    , path =      require('path')
    , passport =  require('passport')
    , AuthCtrl =  require('../controllers/auth')
    , UserCtrl =  require('../controllers/user')
    
//    , User =      require('../models/User.js')
    , userRoles = require('../models/accessCfg').userRoles
    , accessLevels = require('../models/accessCfg').accessLevels
	, mongoose = require('mongoose');
	
var pollCtrl = require('../controllers/pollCtrl');
var courseCtrl = require('../controllers/courseCtrl');

// Main application view
index = function(req, res) {
	res.render('index');
};





var routes = [

    // Views
    {
        path: '/partials/*',
        httpMethod: 'GET',
        middleware: [function (req, res) {
            var requestedView = path.join('./', req.url);
            res.render(requestedView);
        }]
    },

    // OAUTH
    {
        path: '/auth/twitter',
        httpMethod: 'GET',
        middleware: [passport.authenticate('twitter')]
    },
    {
        path: '/auth/twitter/callback',
        httpMethod: 'GET',
        middleware: [passport.authenticate('twitter', {
            successRedirect: '/',
            failureRedirect: '/login'
        })]
    },
    {
        path: '/auth/facebook',
        httpMethod: 'GET',
        middleware: [passport.authenticate('facebook')]
    },
    {
        path: '/auth/facebook/callback',
        httpMethod: 'GET',
        middleware: [passport.authenticate('facebook', {
            successRedirect: '/',
            failureRedirect: '/login'
        })]
    },
    {
        path: '/auth/google',
        httpMethod: 'GET',
        middleware: [passport.authenticate('google')]
    },
    {
        path: '/auth/google/return',
        httpMethod: 'GET',
        middleware: [passport.authenticate('google', {
            successRedirect: '/',
            failureRedirect: '/login'
        })]
    },
    {
        path: '/auth/linkedin',
        httpMethod: 'GET',
        middleware: [passport.authenticate('linkedin')]
    },
    {
        path: '/auth/linkedin/callback',
        httpMethod: 'GET',
        middleware: [passport.authenticate('linkedin', {
            successRedirect: '/',
            failureRedirect: '/login'
        })]
    },

    // Local Auth
    {
        path: '/register',
        httpMethod: 'POST',
        middleware: [AuthCtrl.register]
    },
    {
        path: '/login',
        httpMethod: 'POST',
        middleware: [AuthCtrl.login]
    },
    {
        path: '/logout',
        httpMethod: 'POST',
        middleware: [AuthCtrl.logout]
    },

    // User resource
    {
        path: '/users',
        httpMethod: 'GET',
        middleware: [UserCtrl.index],
        accessLevel: accessLevels.admin
    },
    
    // User resource
    {
        path: '/user/:userId',
        httpMethod: 'GET',
        middleware: [UserCtrl.user],
    },
    
    // List
    {
        path: '/polls/polls/polls',
        httpMethod: 'GET',
        middleware: [pollCtrl.list],
  
    },
    
    // Poll
    {
        path: '/polls/polls/:id',
        httpMethod: 'GET',
        middleware: [pollCtrl.poll],
  
    },
    
    // create_poll
    {
        path: '/polls/polls',
        httpMethod: 'POST',
        middleware: [pollCtrl.create],
  
    },
    
        // vote
    {
        path: '/polls/vote',
        httpMethod: 'POST',
        middleware: [pollCtrl.vote],
  
    },
    
    // List
    {
        path: '/courses/courses/courses',
        httpMethod: 'GET',
        middleware: [courseCtrl.list],
  
    },
    
    // Poll
    {
        path: '/courses/courses/:id',
        httpMethod: 'GET',
        middleware: [courseCtrl.course],
  
    },
    
    // create_poll
    {
        path: '/courses/courses',
        httpMethod: 'POST',
        middleware: [courseCtrl.create],
  
    },
    // edit course
    {
        path: '/courses/courses?:id',
        httpMethod: 'DELETE',
        middleware: [courseCtrl.delete],
  
    },
    

    // All other get requests should be handled by AngularJS's client-side routing system
    {
        path: '/*',
        httpMethod: 'GET',
        middleware: [ function(req, res) {
            var role = userRoles.public, username = '', _id = '';
            if(req.user) {
                role = req.user.role;
                username = req.user.username;
                _id = req.user._id;
            }
            res.cookie('user', JSON.stringify({
                'username': username,
                'role': role,
                '_id': _id
            }));
            res.render('index');
        }]
    }
];

module.exports.main = 

	function(app) {
		
	    _.each(routes, function(route) {
	        route.middleware.unshift(ensureAuthorized);
	        var args = _.flatten([route.path, route.middleware]);
	
	        switch(route.httpMethod.toUpperCase()) {
	            case 'GET':
	                app.get.apply(app, args);
	                break;
	            case 'POST':
	                app.post.apply(app, args);
	                break;
	            case 'PUT':
	                app.put.apply(app, args);
	                break;
	            case 'DELETE':
	                app.delete.apply(app, args);
	                break;
	            default:
	                throw new Error('Invalid HTTP method specified for route ' + route.path);
	                break;
	        }
	    });
	};
	
	//vote: function(socket){ vote(socket);}


function ensureAuthorized(req, res, next) {
    var role = {};
    if(!req.user) role = userRoles.public;
    else {
              role = req.user.role;
    }
    

    var accessLevel = _.findWhere(routes, { path: req.route.path }).accessLevel || accessLevels.public;
	console.log(role);
    if(!(accessLevel.bitMask & role.bitMask)) return res.send(403);
    return next();
}
