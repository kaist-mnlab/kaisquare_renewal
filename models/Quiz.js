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
	user: userSchema,
	date: Date,
	time: Number,
	msg: { type:String, required: true },
	answer: String,
	choices: [choiceSchema]	
	
	//is Mutual Relation required?
	//Lecture
}
);