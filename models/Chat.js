var mongoose = require('mongoose');
var userSchema = require('./User').userSchema;

exports.ChatSchema = new mongoose.Schema(
{
	user: {type: mongoose.Schema.Types.ObjectId, ref:'user'},
	date: Date,
	time: Number,
	msg: String
	
	//is Mutual Relation required?
	//Lecture
}
);