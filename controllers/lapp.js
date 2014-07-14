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
var lectures = {};
module.exports = {
	index : function(sio) {
		io = sio;
	},
	lecture : function (socket) {
		//var qs = [];
		//var cs = [];

		var lectureObj;
		var duration = 60;
		
		function currentTime(startAt) {
			return (new Date()).getTime() - startAt;
		}
		
		socket.emit('connected');
		
		socket.on('requestLecture', function(Id) {
			var lectureId = Id.lectureId;
			var userId = Id.userId;
			console.log(lectureId + " joined");
			socket.join(lectureId);
			socketRoom[socket.id] = {lectureId: lectureId, userId: userId};
			
			if( lectures[lectureId] === undefined){
				lectures[lectureId] = {startAt: 0, lapTime: 0, isLectureStarted: 'false', attendee: []};
				lectures[lectureId].qs = [];
				lectures[lectureId].cs = [];
			}
			console.log(socketRoom);
			
			socket.emit('joinLecture', Id);
			
			lectures[lectureId].attendee.push(Id);
			io.sockets.in(socketRoom[socket.id].lectureId).emit('lectureAttend', lectures[lectureId].attendee);
			
			Lecture.findById(lectureId, '', {lean:true}, function(error, lecture){
				if(lecture) {
					lectureObj = lecture;
					if(lecture.duration !== undefined) {
						lectures[lectureId].duration = lecture.duration;
					}
				}
			
				while(lectures[lectureId].qs.length > 0) lectures[lectureId].qs.pop();
				Q.find({lecture: lectureId}, {}, {}, function(error, q){
					lectures[lectureId].qs = lectures[lectureId].qs.concat(q);
					//qs = qs.concat(q);
					
					while(lectures[lectureId].cs.length > 0) lectures[lectureId].cs.pop();
					Chat.find({lecture: lectureId}, {}, {}, function(error, c){
						lectures[lectureId].cs = lectures[lectureId].cs.concat(c);
						//console.log(cs);
						socket.emit('initQnChat', qStat(lectures[lectureId].duration, lectures[lectureId].qs), lectures[lectureId].cs);
					});
				});
				
				
				if(lectures[lectureId].isLectureStarted == 'true') {
					console.log("you are late");
					console.log(lectures[lectureId].startAt);
					console.log(currentTime(lectures[lectureId].startAt));
					socket.emit('startLecture', lectures[lectureId].startAt, lectures[lectureId].lapTime);
				}
			}); 
			
			
			
		});
		
		socket.on('startLecture', function(time) {
			
			console.log(time.startAt);
			lectures[socketRoom[socket.id].lectureId].startAt = time.startAt;
			lectures[socketRoom[socket.id].lectureId].lapTime = time.lapTime;
			lectures[socketRoom[socket.id].lectureId].isLectureStarted = 'true';
			
			io.sockets.in(socketRoom[socket.id].lectureId).emit('startLecture', time.startAt, time.lapTime);
		});
		
		socket.on('pauseLecture', function(time) {
			lectures[socketRoom[socket.id].lectureId].lapTime = time.time;
			lectures[socketRoom[socket.id].lectureId].isLectureStarted = 'false'; 
			io.sockets.in(socketRoom[socket.id].lectureId).emit('pauseLecture', time.startAt, time.lapTime);
		});
		
		socket.on('stopLecture', function(time) {
			lectures[socketRoom[socket.id].lectureId].lapTime = time.time;
			lectures[socketRoom[socket.id].lectureId].isLectureStarted = 'false';
			io.sockets.in(socketRoom[socket.id].lectureId).emit('stopLecture', time.startAt, time.lapTime);
			
			//saving
		}); 
		
		socket.on('liveTimeUpdate', function(time){
			//console.log("liveTime: " + time);
			if(socketRoom[socket.id] !== undefined)
				lectures[socketRoom[socket.id].lectureId].duration = time;
		});
		
		socket.on('leaveLecture', function(lectureId) {
			console.log(lectureId + " leaved");
			socket.leave(socketRoom[socket.id].lectureId);
		});
		
		socket.on('sendMessage', function(data){
			console.log('sendMessage!');
			
			if( data.src === ''){
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
				lectures[socketRoom[socket.id].lectureId].qs.push(q);
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
				lectures[socketRoom[socket.id].lectureId].cs.push(chat);
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
						  };
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
			var data = qStat(lectures[socketRoom[socket.id].lectureId].duration, lectures[socketRoom[socket.id].lectureId].qs);
			io.sockets.in(socketRoom[socket.id].lectureId).emit('qData', data);
		});
		
		
		//canvas
		
		socket.on('canvasDraw', function(stroke){
			io.sockets.in(socketRoom[socket.id].lectureId).emit('canvasDraw', stroke);
		});
		
		//ppt
		socket.on('pptEvent', function(event){
			io.sockets.in(socketRoom[socket.id].lectureId).emit('pptEvent', event);
		});
		socket.on('pptSave', function(log){
			lectureObj.ppt_event_log = log;
			
			Lecture.findByIdAndUpdate(lectureObj._id , lectureObj, function(err, doc){
				if(err){
					console.log(err);
				}
			});
		});
		socket.on('disconnect', function(data) {
			console.log('disconnected');
			if (socketRoom[socket.id] !== undefined){
				var key = socketRoom[socket.id];
				
				socket.leave(socketRoom[socket.id]);
				delete socketRoom[socket.id];
				//delete lectures[key].attendee
				
				lectures[key.lectureId].attendee = lectures[key.lectureId].attendee.filter(function(e){
					return e.userId !== key.userId;
				});
				
				io.sockets.in(key.lectureId).emit('disconnect', key.userId);
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
	 * Google column chart
	 */
	 var i = 0;
	 var labels = [];
	 var data = [];
	 var duration = Math.ceil(lDuration / 60.0);
	 console.log(lDuration + " " + duration);
	 if (isNaN(duration)) duration = 10;
	 else if (duration < 10) duration = 10;
	 
	 var columnChart =[['Time (min)', 'Value']];
	 for (i = 0; i<=duration; i++){
		 var d = [];
		 d.push(i.toString());
		 d.push(0);
		 //console.log(d);
		 columnChart.push(d);
	 }
	 console.log(duration);
	 for (i in qs){
		 var time = Math.floor(qs[i].time / 60.0);
		 if (columnChart[time + 1] !== undefined)
			 columnChart[time + 1][1]++;
	 }
	 return columnChart;
}