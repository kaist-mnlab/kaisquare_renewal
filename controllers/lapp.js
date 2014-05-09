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
		var qs = [];
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
						     lecture: data.lecture,
							 time: data.time,
							 timestamp: data.timestamp,
							 msg: data.message 
						   };
				var q = new Q(qObj);
				q.save(function(err, doc){
					if(err || !doc){
						throw 'Error';
					}
				});
				qs.push(q);
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