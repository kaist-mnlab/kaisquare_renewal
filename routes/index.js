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
var lectureCtrl = require('../controllers/lectureCtrl');
var fs = require('fs');

var LectureSchema = require('../models/Lecture.js').LectureSchema;
var Lecture = mongoose.model('lectures', LectureSchema);

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
    
    // Course List
    {
        path: '/courses/courses/courses',
        httpMethod: 'GET',
        middleware: [courseCtrl.list],
  
    },
    
    // Course
    {
        path: '/courses/courses/:id',
        httpMethod: 'GET',
        middleware: [courseCtrl.course],
  
    },
    
    // create course
    {
        path: '/courses/courses',
        httpMethod: 'POST',
        middleware: [courseCtrl.create],
  
    },
    // delete course
    {
        path: '/courses/courses?:id',
        httpMethod: 'DELETE',
        middleware: [courseCtrl.delete],
  
    },

    // Lecture List
    {
        path: '/lectures/lectures/lectures',
        httpMethod: 'GET',
        middleware: [lectureCtrl.list],
  
    },
    
    // Lecture
    {
        path: '/lectures/lectures/:id',
        httpMethod: 'GET',
        middleware: [lectureCtrl.lecture],
  
    },
    
    // create Lecture
    {
        path: '/lectures/lectures',
        httpMethod: 'POST',
        middleware: [lectureCtrl.create],
  
    },
    // delete Lecture
    {
        path: '/lectures/lectures?:id',
        httpMethod: 'DELETE',
        middleware: [lectureCtrl.delete],
  
    },
 
   
 
    {
    	path: '/fileUpload',
    	httpMethod: 'POST',
    	middleware: [function( req, res) {
    		console.log("File Upload");
    		console.log(req.files.file);
    		var url = move_uploaded_file(req.files.file);
    		
    		res.json({success:true, url: url});
    	}],
    	
    },
    
    {
    	path: '/createLecture',
    	httpMethod: 'POST',
    	middleware: [function(req, res){
    		console.log("POST: CREATELECTURE");
    		//console.log(req.body);
    		move_lecture_files(req.body);
    		res.json({success:true});
    		console.log("POST: CREATELECTURE END")
    	}],
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

function move_uploaded_file(file) {
	var tmp_path = file.path;
    var target_path = __dirname + '/../public/uploads/temp/';
    
    file_mkdir(target_path);
        
    target_path = target_path + file.name;
    
    file_move(tmp_path, target_path, function(err){
    	if(!err){
    		return file.name;
    	}
    });
    /*
    console.log('->> tmp_path: ' + tmp_path );
    console.log('->> target_path: ' + target_path );
      
    fs.rename(tmp_path, target_path, function(err){
        if(err) {
        	console.log(err);
        }
        
        console.log('->> file_path: ' + file.name)
        console.log('->> upload done');
        
        return file.name;
    });
    */	
}

function move_lecture_files(info) {
	var tmp_path = __dirname + '/../public/uploads/temp/'
    var target_path = __dirname + '/../public/uploads/' + info._id + '/';

    file_mkdir(target_path);
    
    // vod
    if (info.status == 0){
    	var vod_file = info.vod_url.replace(/^.*[\\\/]/, '');
    	if (vod_file != ''){
    		console.log("vod");
    		file_move(tmp_path + vod_file, target_path + vod_file, function(err){});
    	}
    }
    
    // material
    for(var i in info.material_url){
    	var material_file = info.material_url[i].url.replace(/^.*[\\\/]/, '');
    	file_move(tmp_path + material_file, target_path + material_file, function(err){});
    }

    // presentation
    var presentation_file = info.presentation_url.replace(/^.*[\\\/]/, '');
    console.log("presentation_file: " + presentation_file);
    
    var isPPT = (presentation_file != '');
    if (isPPT)
    	file_move(tmp_path + presentation_file, target_path + presentation_file, function(err){});
    
    var ppt_file = target_path + presentation_file;
    var file = presentation_file;
    var isWin = !!process.platform.match(/^win/);
    
    // convert ppt to images
    if (!isWin && isPPT){
	    // probably *nix, assume "unoconv", "convert (from "imagemagick")"
    	// apt-get install unoconv & imagemagick
    	
    	file_mkdir(target_path + "ppt/");
	    var exec = require('child_process').exec;
	    
	    var command = "unoconv -f pdf " + ppt_file + " && convert " + target_path + file.substring(0, file.lastIndexOf(".")) + ".pdf " + target_path + "ppt/" + "%d.png";
	    console.log(command);
	    var encode_finished = false;
	    var child = exec(command, function (error){
	    				encode_finished = true;
	    				if(error){
	    		            console.log(error.stack);
	    		            console.log('Error code: ' + error.code);
	    		            console.log('Signal received: ' + error.signal);
	    		            
	    				} else {
	    					console.log("ppt conversion is finished");
	    				    
	    					fs.readdir(__dirname + "/../public/uploads/" + info._id + "/ppt/", function(error, files){
	    						if (!error){
	    							var n = files.length;
	    							Lecture.findByIdAndUpdate(info._id, {ppt_page: n}, function(err, doc){
	    								if(err || !doc) {
	    									console.log(err);
	    								} else {
	    									console.log("update the # of ppt_page");
	    								}	
	    							});
	    						}else{
	    							console.log(error);
	    						}
	    					});
	    				}
	    			});
    }
}
function file_mkdir(path, callback){
    fs.mkdir(path, function(e){
    	if(!e || (e && e.code == 'EEXIST')){
    		
    	}else{
    		console.log("mkdir fail")
    	}
    });
}
function file_move(origin_path, target_path, callback){
    console.log('->> origin_path: ' + origin_path );
    console.log('->> target_path: ' + target_path );
      
    fs.rename(origin_path, target_path, function(err){
        if(err) {
        	console.log("file_move: err");
        	console.log(err);
        }
        console.log('->> move done');
        callback(err);
    });
}
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
	
    if(!(accessLevel.bitMask & role.bitMask)) return res.send(403);
    return next();
}
