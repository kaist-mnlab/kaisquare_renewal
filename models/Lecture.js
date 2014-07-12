var mongoose = require('mongoose');
var filePluginLib = require('mongoose-file');
var path = require('path');
var filePlugin = filePluginLib.filePlugin;
var make_upload_to_model = filePluginLib.make_upload_to_model;
var qSchema = require('./Q').QSchema;
var chatSchema = require('./Chat').ChatSchema;
var quizSchema = require('./Quiz').QuizSchema;

var uploads_base = path.join(__dirname, "uploads");
var uploads = path.join(uploads_base, "u");

// Document schema for polls
var LectureSchema = exports.LectureSchema = new mongoose.Schema({
	index: Number,
	date: {type:Date, default: Date.now, required: true},
	startTime: {type:Date, default: Date.now, required: true},
	endTime: {type:Date, default: Date.now },
	duration: Number,
	title: { type: String, required: true },
	description: { type: String, required: true },
	vod_url: String,
	//File?
	presentation_url: String,
	material_url:[{url: String}],
	course: {type: mongoose.Schema.Types.ObjectId, ref:'course'},
	
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

LectureSchema.plugin( filePlugin, {
	name: "video",
	upload_to: make_upload_to_model(uploads, "videos"),
	relative_to: uploads_base
});
