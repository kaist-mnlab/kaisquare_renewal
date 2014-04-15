var mongoose = require('mongoose');
var qSchema = require('./Q').QSchema;
var chatSchema = require('./Chat').ChatSchema;
var quizSchema = require('./Quiz').QuizSchema;


// Document schema for polls
exports.LectureSchema = new mongoose.Schema({
	index: Number,
	startTime: {type:Date, default: Date.now, required: true},
	endTime: {type:Date, default: Date.now },
	
	description: { type: String, required: true },
	//File?
	material:[{file: File}],
	
	//
	status: Number,
	
	qs: [qSchema],
	chats: [chatSchema],
	quizs: [quizSchema],
	
	hidden: Boolean,
	meta: {
		votes: Number,
		favs:  Number
		}
});