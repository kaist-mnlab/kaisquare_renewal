var node_static = require('node-static');
var http = require('http');
var file = new (node_static.Server)();

var io;

var session_creator = {};



module.exports = {
	index : function(sio) {
		io = sio; 
		io.sockets.on('connection', function (socket) {

			function log() {
				var array = [">>> Message from server: "];
				for (var i = 0; i < arguments.length; ++i)
					array.push(arguments[i]);
				socket.emit('log', array);
			}
		
		    //send message to destination socket
			socket.on('message', function (message) {
				log('Got message', message);
				io.sockets.socket(message.dest).emit('message', message);
			});
		
		    //session create creation
			socket.on('create', function (gid) {
				log('Request to create room ' + gid);
				socket.join(gid);
				session_creator[gid] = socket.id;
				//socket.emit('created', socket.id);
				io.sockets.in(gid).emit('created', socket.id);
			});
		
		    //session group join
			socket.on('join', function (msg) {
			    socket.join(msg.gid);
			    if (session_creator[msg.gid]) {
			        log('Request to join room ' + msg.gid, 'creator is ' + session_creator[msg.gid]);
			        socket.emit('joined', { create: session_creator[msg.gid], join: socket.id });
			        io.sockets.socket(session_creator[msg.gid]).emit('joined', { socket_id: socket.id, uid: msg.uid });
			    }
			    else {
			        log('Room ' + msg.gid + ' is not created!');
			    }
			});
		
			socket.on('close', function (msg) {
			    socket.leave(msg.gid);
			    io.sockets.socket(session_creator[msg.gid]).emit('closed', { sid: socket.id, uid: msg.uid });
			});
		});
	}
}



