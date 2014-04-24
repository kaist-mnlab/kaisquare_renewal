var _ =               require('underscore')
    , passport =        require('passport')
    , LocalStrategy =   require('passport-local').Strategy
    , TwitterStrategy = require('passport-twitter').Strategy
    , FacebookStrategy = require('passport-facebook').Strategy
    //, GoogleStrategy = require('passport-google').Strategy
    //, LinkedInStrategy = require('passport-linkedin').Strategy
    , check =           require('validator').check
    , userRoles =       require('../models/accessCfg').userRoles
    , User =			require('../models/User');

var pkginfo 
	= require('../oauth.cfg');

var users = [
    {
        id:         1,
        username:   "user",
        password:   "123",
        role:   userRoles.user
    },
    {
        id:         2,
        username:   "admin",
        password:   "123",
        role:   userRoles.admin
    }
];

module.exports = {
	addUser: function(username, password, role, callback) {
		//console.log(username);

        //if(this.findByUsername(username) !== undefined)  return callback("UserAlreadyExists");
        User.findOne( username, function(err, user){
        	console.log(user);
        
        	if(user !== null) return callback("UserAlreadyExists");
        	else {
				// Clean up when 500 users reached
		        if(users.length > 500) {
		            users = users.slice(0, 2);
		        }
		
		        var user = new User({
		            //id:         _.max(users, function(user) { return user.id; }).id + 1,
		            username:   username,
		            password:   password,
		            role:       role,
		            created: Date.now()
		        });
		        users.push(user);
		        
		        user.save(function(err) {
		            	if(err) {
		            		console.log(err);
		            	} else {
		            		console.log("Saving user ..");
		            		callback(null, user);
		            	}
		            });	   			 
        	}
        });
        

        
    },

	findOrCreateOauthUser: function(profile, done) {

        User.findOne( { oauthID: profile.id }, function(err, user) {
			  	
        	if(err) {
        		console.log(err);
        	} else if(!err && user != null) {

        		done(null, user);
        	} else {
				console.log(userRoles);
	            var user = new User({
	                //id: _.max(users, function(user) { return user.id; }).id + 1,
	                oauthID: profile.id,
	                username: profile.displayName, 
	                provider: profile.provider,
	                created: Date.now(),
	                role: userRoles.user
	                //role_bitMask: userRoles.user.bitMask,
	                //role_title: userRoles.user.title
	            });
	            
	            users.push(user);
	            user.save(function(err) {
	            	if(err) {
	            		console.log(err);
	            	} else {
	            		console.log("Saving user ..");
	            		done(null, user);
	            	}
	            });	     
	        }
	
        });
       
        //var user = module.exports.findByProviderId(provider, providerId);
        
    },

	findAll: function() {
        //return _.map(users, function(user) { return _.clone(user); });
        
        return User.find({},
            function(err, docs) {
            if (!err){ 
               console.log(docs);
               process.exit();
                      }
            else { throw err;}

            });
    },

	findById: function(id) {
        //return _.clone(_.find(users, function(user) { return user.id === id }));
        
        return User.findById( id );
    },

    findByUsername: function(username) {
    //    return _.clone(_.find(users, function(user) { return user.username === username; }));

    	return User.findOne({ username: username });
    },

    findByProviderId: function(provider, id) {
        //return _.find(users, function(user) { return user[provider] === id; });
        return User.findOne({ $and: [ {provider: provider}, {oauthid: id}]});
        
    },

    validate: function(user) {
    
		//Check is dead!!!
        //check(user.username, 'Username must be 1-20 characters long').len(1, 20);
        //check(user.password, 'Password must be 5-60 characters long').len(5, 60);
        //check(user.username, 'Invalid username').not(/((([A-Za-z]{3,9}:(?:\/\/)?)(?:[-;:&=\+\$,\w]+@)?[A-Za-z0-9.-]+|(?:www.|[-;:&=\+\$,\w]+@)[A-Za-z0-9.-]+)((?:\/[\+~%\/.\w-_]*)?\??(?:[-\+=&;%@.\w_]*)#?(?:[\w]*))?)/);
    
        // TODO: Seems node-validator's isIn function doesn't handle Number arrays very well...
        // Till this is rectified Number arrays must be converted to string arrays
        // https://github.com/chriso/node-validator/issues/185
        var stringArr = _.map(_.values(userRoles), function(val) { return val.toString() });
        //check(user.role, 'Invalid user role given').isIn(stringArr);
    },

    localStrategy: new LocalStrategy(
        function(username, password, done) {

            User.findOne({username: username, password: password}, function(err, user) {
				console.log(user);
				console.log(err);
	            if(user === null) {
	                done(null, false, { message: 'Login failed' });
	            }
	            else if(err) {
	                done(null, false, { message: 'Error' });
	            }
	            else {
	                return done(null, user);
	            }
            });

        }
    ),

    twitterStrategy: function() {
        if(!pkginfo.twitter.TWITTER_CONSUMER_KEY)    throw new Error('A Twitter Consumer Key is required if you want to enable login via Twitter.');
        if(!pkginfo.twitter.TWITTER_CONSUMER_SECRET) throw new Error('A Twitter Consumer Secret is required if you want to enable login via Twitter.');
	
        return new TwitterStrategy({
            consumerKey: pkginfo.twitter.TWITTER_CONSUMER_KEY,
            consumerSecret: pkginfo.twitter.TWITTER_CONSUMER_SECRET,
            callbackURL: pkginfo.twitter.callbackURL || 'http://localhost:8000/auth/twitter/callback'
        },
        function(token, tokenSecret, profile, done) {
            module.exports.findOrCreateOauthUser(profile, done);
            
        });
    },

    facebookStrategy: function() {
        if(!pkginfo.facebook.FACEBOOK_APP_ID)     throw new Error('A Facebook App ID is required if you want to enable login via Facebook.');
        if(!pkginfo.facebook.FACEBOOK_APP_SECRET) throw new Error('A Facebook App Secret is required if you want to enable login via Facebook.');

        return new FacebookStrategy({
            clientID: pkginfo.facebook.FACEBOOK_APP_ID,
            clientSecret: pkginfo.facebook.FACEBOOK_APP_SECRET,
            callbackURL: pkginfo.facebook.callbackURL || "http://localhost:8000/auth/facebook/callback"
        },
        function(accessToken, refreshToken, profile, done) {
            module.exports.findOrCreateOauthUser(profile, done);
            //done(null, user);
        });
    },

/*
    googleStrategy: function() {

        return new GoogleStrategy({
            returnURL: pkginfo.google.GOOGLE_RETURN_URL || "http://localhost:8000/auth/google/return",
            realm: pkginfo.google.GOOGLE_REALM || "http://localhost:8000/"
        },
        function(identifier, profile, done) {
            var user = module.exports.findOrCreateOauthUser('google', identifier);
            done(null, user);
        });
    },

    linkedInStrategy: function() {
        if(!pkginfo.linkedin.LINKED_IN_KEY)     throw new Error('A LinkedIn App Key is required if you want to enable login via LinkedIn.');
        if(!pkginfo.linkedin.LINKED_IN_SECRET) throw new Error('A LinkedIn App Secret is required if you want to enable login via LinkedIn.');

        return new LinkedInStrategy({
            consumerKey: pkginfo.linkedin.LINKED_IN_KEY,
            consumerSecret: pkginfo.linkedin.LINKED_IN_SECRET,
            callbackURL: pkginfo.linkedin.LINKED_IN_CALLBACK_URL || "http://localhost:8000/auth/linkedin/callback"
          },
           function(token, tokenSecret, profile, done) {
            var user = module.exports.findOrCreateOauthUser('linkedin', profile.id);
            done(null,user); 
          }
        );
    },
    
*/    
    serializeUser: function(user, done) {
    	console.log('serializeUser: ' + user._id)
        done(null, user._id);
    },

    deserializeUser: function(id, done) {
    /*
        var user = module.exports.findById(id);

        if(user)    { done(null, user); }
        else        { done(null, false); }
        */
        User.findById(id, function(err, user){
	     if(!err) done(null, user);
	     else done(err, null);
 })
    }
};