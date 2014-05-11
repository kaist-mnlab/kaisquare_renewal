var mongoose = require('mongoose');
var userSchema = require('./User').userSchema;
var LectureSchema = require('./Lecture').lectureSchema;

exports.ChatSchema = new mongoose.Schema(
{
	user: {type: mongoose.Schema.Types.ObjectId, ref:'user'},
	user_name: String,
	lecture: {type: mongoose.Schema.Types.ObjectId, ref:'lecture'},
	//date: Date,
	time: Number,
	timestamp: Number,
	msg: String

});