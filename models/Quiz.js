var mongoose = require('mongoose');
var userSchema = require('./User').userSchema;

exports.QuizSchema = new mongoose.Schema(
{
	user: userSchema,
	date: Date,
	time: Number,
	msg: String
	
	//is Mutual Relation required?
	//Lecture
}
);