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
	user: {type: mongoose.Schema.Types.ObjectId, ref:'user'},
	date: Date,
	time: Number,
	msg: { type:String, required: true },
		
	//is Mutual Relation required?
	//Lecture
}
);

exports.AnswerSchema = new mongoose.Schema(
{
	
}
);