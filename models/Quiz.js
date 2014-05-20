var mongoose = require('mongoose');
var userSchema = require('./User').userSchema;

// Subdocument schema for votes
var voteSchema = new mongoose.Schema({ ip: 'String' });

// Subdocument schema for poll choices
var choiceSchema = new mongoose.Schema({ 
	text: String,
	votes: [voteSchema]
});

exports.QuizSchema = new mongoose.Schema(
{
	userId: {type: mongoose.Schema.Types.ObjectId, ref:'user'},
	lectureId: {type: mongoose.Schema.Types.ObjectId, ref:'lecture'},
	question: String,
	type: String,
	choice: String
}
);

exports.AnswerSchema = new mongoose.Schema(
{
	userId: {type: mongoose.Schema.Types.ObjectId, ref: 'user'},
	quizId: {type: mongoose.Schema.Types.ObjectId, ref: 'quiz'},
	lectureId: {type: mongoose.Schema.Types.ObjectId, ref: 'lecture'},
	type: String,
	answer: String
}
);