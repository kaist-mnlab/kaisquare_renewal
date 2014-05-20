var io;
var mongoose = require('mongoose');

var LectureSchema = require('../models/Lecture.js').LectureSchema;
var qSchema = require('../models/Q.js').QSchema;
var chatSchema = require('../models/Chat.js').ChatSchema;
var quizSchema = require('../models/Quiz.js').QuizSchema;
var answerSchema = require('../models/Quiz.js').AnswerSchema;

var Lecture = mongoose.model('lectures', LectureSchema);
var Q = mongoose.model('qs', qSchema);
var Chat = mongoose.model('chats', chatSchema);
var Quiz = mongoose.model('quizs', quizSchema);
var Answer = mongoose.model('answers', answerSchema);

var socketRoom = {};
module.exports = {
	index : function(sio) {
		io = sio;
	},
	lecture : function (socket) {

		var qs = [];
		var cs = [];
		var lectureObj;
		var duration = 60;
		socket.emit('connected');
		
		socket.on('requestLecture', function(Id) {
			var lectureId = Id.lectureId;
			var userId = Id.userId;
			console.log(lectureId + " joined");
			socket.join(lectureId);
			socketRoom[socket.id] = {lectureId: lectureId, userId: userId};
			console.log(socketRoom);
			socket.emit('joinLecture', lectureId);
			
			Lecture.findById(lectureId, '', {lean:true}, function(error, lecture){
				if(lecture) {
					lectureObj = lecture;
					duration = lecture.duration;
				}
			}); 
			
			Q.find({lecture: lectureId}, {}, {}, function(error, q){
				qs = qs.concat(q);
				Chat.find({lecture: lectureId}, {}, {}, function(error, c){
					cs = cs.concat(c);
					//console.log(cs);
					socket.emit('initQnChat', qStat(duration, qs), cs);
				});
			});
		});
	
		socket.on('leaveLecture', function(lectureId) {
			console.log(lectureId + " leaved");
			socket.leave(socketRoom[socket.id].lectureId);
		});
		
		socket.on('sendMessage', function(data){
			console.log('sendMessage!');
			
			if( data.src === '') {
//				console.log("Ketyeo");
				return;
			}
			io.sockets.in(socketRoom[socket.id].lectureId).emit('receiveMessage', data);
			var object = { user: data.src,
				     	   lecture: data.lecture,
					       time: data.time,
					       timestamp: data.timestamp,
					       msg: data.message 
				         };
			if(data.type == "q"){
				var q = new Q(object);
				q.save(function(err, doc){
					if(err || !doc){
						throw err;
					}
				});
				qs.push(q);
			}
			else if (data.type == "chat"){
				//console.log("chat ");
				object.user_name = data.src_name;
				var chat = new Chat(object);
				chat.save(function(err,doc){
					if (err || !doc){
						throw 'Error';
					}
				});
				cs.push(chat);
			}
    	});
    	
		socket.on('sendQuiz', function(data){
			console.log('sendQuiz!');
			
			//quiz DB
			// src, lectureId, question, type
			var quizObj = { userId: data.src,
							lectureId: data.lectureId,
							question: data.question,
							type: data.type,
							choice: data.choice
						  }
			var quiz = new Quiz(quizObj);
			quiz.save(function(err,doc){
				if (err || !doc){
					throw 'Error';
				}
				data.quizId = doc._id;
				console.log(doc._id);
				io.sockets.in(socketRoom[socket.id].lectureId).emit('receiveQuiz', data);
			});
		});
		
		socket.on('sendQuizAns', function(answer){
			console.log('sendQuizAns!');
			console.log(answer);
			for (var key in socketRoom){
				if (socketRoom[key].userId == answer.target){
					io.sockets.socket(key).emit('receiveAns', answer.data);
				}
			}
			
			var answerObj = { userId: answer.src,
							  quizId: answer.quizId,
							  lectureId: answer.lectureId,
							  type: answer.type,
							  answer: answer.data
							}
			var ans = new Answer(answerObj);
			ans.save(function(err,doc){
				if (err || !doc){
					throw 'Error';
				}
			});
		});
		
		socket.on('qData', function(){
			var data = qStat(duration, qs);
			io.sockets.in(socketRoom[socket.id].lectureId).emit('qData', data);
		});
		
		socket.on('disconnect', function(data) {
			console.log('disconnected');
			if (socketRoom[socket.id] !== undefined){
				var key = socketRoom[socket.id].lectureId;
				socket.leave(socketRoom[socket.id]);
				delete socketRoom[socket.id];
				io.sockets.in(key).emit('disconnect');
			}
			/*
			var clients = io.sockets.clients(key);
			for (var i = 0; i < clients.length; i++){
				clients[i].leave(key);
        	}
        	*/
		});
		
	} 

}

function qStat(lDuration, qs){
	/*
	 * { labels: []
	 *   datasets: [{data:[]}]
	 * }
	 */
	 var i = 0;
	 var labels = [];
	 var data = [];
	 for (i = 0; i<=lDuration; i++){
		 labels.push(i.toString());
		 data[i] = 0;
	 }
	 for (i in qs){
		 data[Math.floor(qs[i].time)]++;
	 }
	 var graph = { labels: labels,
			       datasets: [
			                  {data: data}
			                 ]
	 			 };

	 return graph;
}