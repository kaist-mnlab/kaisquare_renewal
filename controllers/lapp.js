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
		
		socket.emit('connected');
		
		socket.on('requestLecture', function(lectureId) {
			
			console.log(lectureId + " joined");
			socket.join(lectureId);
			socketRoom[socket.id] = lectureId;
			
			socket.emit('joinLecture', lectureId);
		});
	
		socket.on('leaveLecture', function(lectureId) {
			console.log(lectureId + " leaved");
			socket.leave(socketRoom[socket.id]);
			
		});
		
		socket.on('sendMessage', function(data){
			console.log('sendMessage!');
			io.sockets.in(socketRoom[socket.id]).emit('receiveMessage', data);
			
			
    	});
    	
		socket.on('disconnect', function(data) {
			console.log('disconnected');
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