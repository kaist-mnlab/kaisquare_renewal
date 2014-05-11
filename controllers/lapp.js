var io;
var mongoose = require('mongoose');

var LectureSchema = require('../models/Lecture.js').LectureSchema;
var qSchema = require('../models/Q.js').QSchema;
var chatSchema = require('../models/Chat.js').ChatSchema;

var Lecture = mongoose.model('lectures', LectureSchema);
var Q = mongoose.model('qs', qSchema);
var Chat = mongoose.model('chats', chatSchema);

module.exports = {
	index : function(sio) {
		io = sio;
	},
	lecture : function (socket) {
		var socketRoom = {};
		var qs = [];
		var cs = [];
		var lectureObj;
		socket.emit('connected');
		
		socket.on('requestLecture', function(lectureId) {
			
			console.log(lectureId + " joined");
			socket.join(lectureId);
			socketRoom[socket.id] = lectureId;
			
			socket.emit('joinLecture', lectureId);
			
			Lecture.findById(lectureId, '', {lean:true}, function(error, lecture){
				if(lecture)
					lectureObj = lecture;
			}); 
			
			Q.find({lecture: lectureId}, {}, {}, function(error, q){
				qs = qs.concat(q);
				Chat.find({lecture: lectureId}, {}, {}, function(error, c){
					cs = cs.concat(c);
					console.log(cs);
					socket.emit('initQnChat', qStat(20, qs), cs);
				});
			});
		});
	
		socket.on('leaveLecture', function(lectureId) {
			console.log(lectureId + " leaved");
			socket.leave(socketRoom[socket.id]);
			
		});
		
		socket.on('sendMessage', function(data){
			console.log('sendMessage!');
			io.sockets.in(socketRoom[socket.id]).emit('receiveMessage', data);
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
						throw 'Error';
					}
				});
				qs.push(q);
			}
			else if (data.type == "chat"){
				console.log("chat ");
				object.user_name = data.src_name;
				var chat = new Chat(object);
				chat.save(function(err,doc){
					if (err || !doc){
						throw 'Error';
					}
				});
				cs.push(chat);
				console.log(cs);
			}
    	});
    	
		socket.on('qData', function(){
			var data = qStat(20, qs);
			io.sockets.in(socketRoom[socket.id]).emit('qData', data);
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
		 data[qs[i].time]++;
	 }
	 var graph = { labels: labels,
			       datasets: [
			                  {data: data}
			                 ]
	 			 };

	 return graph;
}