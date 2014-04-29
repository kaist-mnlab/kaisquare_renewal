/*jshint node:true*/
var express = require('express.io'),
	routes = require('./routes'),
	http = require('http'),
	path = require('path'),
	fs = require('fs'),
	redis = require('redis'),
	session = require('express-session'),
	cookieParser = require('cookie-parser'),
	RedisStore = require('connect-redis')(session),
	
	passport = require('passport');
	
// Connect to MongoDB using Mongoose
var mongoose = require('mongoose');
var db;
if (process.env.VCAP_SERVICES) {
   var env = JSON.parse(process.env.VCAP_SERVICES);
   //db = mongoose.createConnection(env['mongodb-2.2'][0].credentials.url);
   db = mongoose.connect(env['mongodb-2.2'][0].credentials.url);
} else {
   db = mongoose.connect('localhost', 'kaisquare');
}
exports.db = db;
	
//Auth Routing
var Auth = require('./routes/authentication.js'),
	pollCtrl = require('./controllers/pollCtrl.js');


var	secret = exports.secret = 'kaistmnlab';

var app = exports.app = express();
var port = exports.port = +process.argv[2] || process.env.PORT || 6789; 
var server = http.createServer(app);
var io = require('socket.io');
var lapp = require('./controllers/lapp');

if (process.env.REDISTOGO_URL) {
  var rtg   = require('url').parse(process.env.REDISTOGO_URL);
  var client = exports.client  = redis.createClient(rtg.port, rtg.hostname);
  client.auth(rtg.auth.split(':')[1]); // auth 1st part is username and 2nd is password separated by ":"
} else {
  var client = exports.client  = redis.createClient();
  var prefix = '';
}

var sessionStore = exports.sessionStore = new RedisStore({client: client, prefix: prefix});
var serviceSessionKey = exports.serviceSessionKey = "JSESSIONID";
var sessionKey = exports.sessionKey = "kaisquare";


var app = exports.app = express();
var port = exports.port = +process.argv[2] || process.env.PORT || 6789; 

app.configure(function() {
	app.set('port', port);
	app.set('views', path.join(__dirname, 'views'));
	app.set('view engine', 'jade');
	app.use(express.favicon());
	app.use(express.logger('dev'));
	app.use(cookieParser());
	app.use(express.bodyParser({uploadDir: __dirname + '/tmp'}));
	app.use(express.methodOverride());
	app.use(express.session({
	    key: sessionKey,
	    secret: secret,
	    store: sessionStore,
	    cookie: { secure: true }
  	}));

	
    app.use(express.csrf());
    app.use(function(req, res, next) {
        res.cookie('XSRF-TOKEN', req.csrfToken());
        res.locals.csrftoken = req.csrfToken();
        
        next();
    });

    //passport 
	app.use(passport.initialize());
	app.use(passport.session());
	
	passport.use(Auth.localStrategy);
	
	var twitterStrategy = Auth.twitterStrategy();
	if(twitterStrategy !== null)
		passport.use(twitterStrategy);  // Comment out this line if you don't want to enable login via Twitter
	var facebookStrategy = Auth.facebookStrategy();
	if(facebookStrategy !== null)
		passport.use(facebookStrategy); // Comment out this line if you don't want to enable login via Facebook
	//passport.use(Auth.googleStrategy());   // Comment out this line if you don't want to enable login via Google
	//passport.use(Auth.linkedInStrategy()); // Comment out this line if you don't want to enable login via LinkedIn
	
	passport.serializeUser(Auth.serializeUser);
	passport.deserializeUser(Auth.deserializeUser);
	
	
	
	app.use(express.static(path.join(__dirname, 'public')));
	app.use(app.router);
	

	
	// Handle Errors gracefully
	app.use(function(err, req, res, next) {
		if(!err) return next();
		console.log(err.stack);
		res.json({error: true});
	});
  
	app.use(express.cookieParser(secret));
	app.use(express.session({
    	key: sessionKey,
    	secret: secret,
    	store: sessionStore
	}));
  
});



routes.main(app);

server = exports.server = http.createServer(app).listen(app.get('port'), function() {
  console.log('KAISquare started on port %d', app.get('port'));
});

var sio = module.exports.io = io.listen(server);

lapp.index(sio);
sio.sockets.on('connection', lapp.lecture);
sio.sockets.on('connection', pollCtrl.vote);
