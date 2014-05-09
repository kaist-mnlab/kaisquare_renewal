var mongoose = require('mongoose');
var userSchema = require('./User').userSchema;
var lectureSchema = require('./Lecture').lectureSchema;

exports.QSchema = new mongoose.Schema(
{
	user: {type: mongoose.Schema.Types.ObjectId, ref:'user'},
	lecture: {type: mongoose.Schema.Types.ObjectId, ref:'lecture'},
	//date: Date,
	time: Number,
	timestamp: Number,
	message: String
	
	//is Mutual Relation required?
	//Lecture
	//lecture: {type: mongoose.Schema.Types.ObjectId, ref: 'lecture'}
});