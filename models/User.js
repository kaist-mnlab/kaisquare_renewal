var mongoose = require('mongoose');
//var db = require('../app').db;

var userSchema = new mongoose.Schema(
	 {
		id: String,
		oauthID: Number,
		email: String,
		username: String,
		password: String, //Need Hash Middleware!
		created: {type:Date, default:Date.now},
		provider: String,
		role: {bitMask:Number, title:String} 
		// user profile picture?
	}
);


var User = mongoose.model('User', userSchema);
 
module.exports = User;
module.exports.userSchema = userSchema;

