var mongoose = require('mongoose');
var qSchema = require('./Q').QSchema;
var chatSchema = require('./Chat').ChatSchema;
var quizSchema = require('./Quiz').QuizSchema;


// Document schema for polls
exports.LectureSchema = new mongoose.Schema({
	index: Number,
	date: {type:Date, default: Date.now, required: true},
	startTime: {type:Date, default: Date.now, required: true},
	endTime: {type:Date, default: Date.now },
	duration: Number,
	title: { type: String, required: true },
	description: { type: String, required: true },
	vod_url: String,
	//File?
	materialURL:[{url: String}],
	course: {type: mongoose.Schema.Types.ObjectId, ref:'course'},
	
	//
	status: Number,
	
	qs: [{type: mongoose.Schema.Types.ObjectId, ref:'q'}],
	chats: [{type: mongoose.Schema.Types.ObjectId, ref:'chat'}],
	quizs: [{type: mongoose.Schema.Types.ObjectId, ref:'quiz'}],
	
	hidden: Boolean,
	meta: {
		votes: Number,
		favs:  Number
		}
});