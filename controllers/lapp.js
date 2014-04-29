var io;
var mongoose = require('mongoose');

var LectureSchema = require('../models/Lecture.js').LectureSchema;
var qSchema = require('../models/Q.js').QSchema;

var Lecture = mongoose.model('lectures', LectureSchema);
var Q = mongoose.model('qs', qSchema);

module.exports = {
	index : function(sio) {
		io = sio;
	},
	lecture : function (socket) {
		var socketRoom = {};
		var lectureObj;
		
		socket.emit('connected');
		
		socket.on('requestLecture', function(lectureId) {
			
			console.log(lectureId + " joined");
			socket.join(lectureId);
			socketRoom[socket.id] = lectureId;
			
			socket.emit('joinLecture', lectureId);
			
			Lecture.findById(lectureId, '', {lean:true}, function(err, lecture){
				if(lecture){
					lectureObj = lecture;
					
					console.log(lectureObj);
				}
			});
		});
	
		socket.on('leaveLecture', function(lectureId) {
			console.log(lectureId + " leaved");
			socket.leave(socketRoom[socket.id]);
			
		});
		
		socket.on('sendMessage', function(data){
			console.log('sendMessage!');
			io.sockets.in(socketRoom[socket.id]).emit('receiveMessage', data);
			if(data.type == "q"){
				var qObj = { user: data.src,
							 time: 1,
							 msg: "Q" 
						   };
				var q = new Q(qObj);
				q.save(function(err, doc){
					if(err || !doc){
						throw 'Error';
					}
				});
				console.log(q);
				//lecture 연동 필요
				lectureObj.qs.push(q._id);
			}
    	});
    	
		socket.on('qData', function(){
			var data = {labels: ["1","2","3","4","5","6"],
						datasets:[
						          {data: [1,2,3,4,5,6]}
						          ]
					   };
			
			io.sockets.in(socketRoom[socket.id]).emit('qData', data);
		});
		
		socket.on('disconnect', function(data) {
			console.log('disconnected');
			
			// lecture가 끝나기 전에 지금까지의 q 기록을 DB에 보관
			var lecture = new Lecture(lectureObj);
			lecture.save(function(err, doc){
				if(err || !doc){
					throw 'Error';
				}
			});
			
			var key = socketRoom[socket.id];
			socket.leave(socketRoom[key]);
			io.sockets.in(key).emit('disconnect');
			/*
			var clients = io.sockets.clients(key);
			for (var i = 0; i < clients.length; i++){
				clients[i].leave(key);
        	}
        	*/
		});
		
	} 

}