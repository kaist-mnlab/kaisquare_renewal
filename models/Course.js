var mongoose = require('mongoose');
var userSchema = require('./User').userSchema;
var lecutreSchema = require('./Lecture').LectureSchema;

var assignmentSchema = new mongoose.Schema(
	{
		description: {type:String, required: true},
		deadLine: Date,
		
		materialURL: String,
		submitMaterial: [{user: userSchema, materialURL:String}]
	}
);

var noticeSchema = new mongoose.Schema(
	{
	
		description: {type:String, required: true},
		date: Date,
		
		materialURL: String,
		
	}
);

// Document schema for polls
exports.CourseSchema = new mongoose.Schema({
	title: String,
	code: String,
	startTime: {type:Date, default: Date.now, required: true},
	endTime: {type:Date, default: Date.now },
	abstract: { type: String, required: true },
	description: { type: String, required: true },
	lectures: [lectureSchema],
	users: [{user: userSchema,
			role_bitMask: Number}],
	assignments: [assignmentSchema],
	hidden: Boolean,
	meta: {
		votes: Number,
		favs:  Number
		}
});