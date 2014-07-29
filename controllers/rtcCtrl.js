var http = require('http');

var io;

var url = require("url"),
    path = require("path"),
    fs = require("fs"),
    sys = require('sys'),
    exec = require('child_process').exec;

var session_creator = {};

module.exports = {
	index: function (sio) {
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

			socket.on('record', function (data) {
				ffmpeg_finished = false;
				var date = new Date();
				var fileName = 'gid_' + data.info.gid + '_uid_' + data.info.uid + '_' +date.getDate();
				data['videoName'] = fileName + '.webm';
				data['audioName'] = fileName + '.' + data.audio.type.split('/')[1];

				writeToDisk(data.audio.dataURL, fileName + '.' + data.audio.type.split('/')[1]);

				// if it is chrome
				if (data.video) {
					writeToDisk(data.video.dataURL, fileName + '.webm');
					merge(socket, data);
				}
					// if it is firefox or if user is recording only audio
				else {
					socket.emit('merged', data.audioName);
				}
			});
		});
	}
}


function writeToDisk(dataURL, fileName) {
	var fileExtension = fileName.split('.').pop(),
        fileRootNameWithBase = './public/uploads/' + fileName,
        filePath = fileRootNameWithBase,
        fileID = 2,
        fileBuffer;

	while (fs.existsSync(filePath)) {
		filePath = fileRootNameWithBase + '(' + fileID + ').' + fileExtension;
		fileID += 1;
	}

	dataURL = dataURL.split(',').pop();
	fileBuffer = new Buffer(dataURL, 'base64');
	fs.writeFileSync(filePath, fileBuffer);

	console.log('filePath', filePath);
}

function merge(socket, data) {
	// detect the current operating system
	var isWin = !!process.platform.match(/^win/);

	if (isWin) {
		ifWin(socket, data);
	} else {
		ifMac(socket, data);
	}

	//readFfmpeOutput(data.audioName, socket);
}

var ffmpeg_finished = false;

function ifWin(socket, data) {
	// following command tries to merge wav/webm files using ffmpeg
	var audioFile = __dirname + '\\..\\public\\uploads\\' + data.audioName;
	var videoFile = __dirname + '\\..\\public\\uploads\\' + data.videoName;
	var mergedFile = __dirname + '\\..\\public\\uploads\\' + data.audioName.split('.')[0] + '-merged.webm';

	// if a "directory" has space in its name; below command will fail
	// e.g. "c:\\dir name\\uploads" will fail.
	// it must be like this: "c:\\dir-name\\uploads"
	var command = 'ffmpeg.exe -i ' + videoFile + ' -i ' + audioFile + ' ' + mergedFile + ' 1> public/ffmpeg-output/' + data.audioName.split('.')[0] + '.txt 2>&1';

	var cmd = exec(command, function (error) {
		if (error) {
			console.log(error.stack);
			console.log('Error code: ' + error.code);
			console.log('Signal received: ' + error.signal);
		} else {
			ffmpeg_finished = true;
			socket.emit('merged', data.audioName.split('.')[0] + '-merged.webm');

			// removing audio/video files
			fs.unlink(audioFile);
			fs.unlink(videoFile);

			// auto delete file after 1-minute
			//            setTimeout(function () {
			//                fs.unlink(mergedFile);
			//            }, 60 * 1000);
		}
	});
}

function ifMac(socket, data) {
	// its probably *nix, assume ffmpeg is available
	var audioFile = __dirname + '/../public/uploads/' + data.audioName;
	var videoFile = __dirname + '/../public/uploads/' + data.videoName;
	var mergedFile = __dirname + '/../public/uploads/' + data.audioName.split('.')[0] + '-merged.webm';
	var util = require('util'),
        exec = require('child_process').exec;
	//child_process = require('child_process');

	var command = "ffmpeg -i " + videoFile + " -i " + audioFile + " -map 0:0 -map 1:0 " + mergedFile + '  1> ./public/ffmpeg-output/' + data.audioName.split('.')[0] + '.txt 2>&1';

	var child = exec(command, function (error) {
		if (error) {
			console.log(error.stack);
			console.log('Error code: ' + error.code);
			console.log('Signal received: ' + error.signal);

		} else {
			ffmpeg_finished = true;

			socket.emit('merged', data.audioName.split('.')[0] + '-merged.webm');

			// removing audio/video files
			fs.unlink(audioFile);
			fs.unlink(videoFile);

			// auto delete file after 1-minute
			//            setTimeout(function () {
			//                fs.unlink(mergedFile);
			//            }, 60 * 1000);
		}
	});
}

function readFfmpeOutput(fName, socket) {
	if (ffmpeg_finished) return;
	fs.readFile('ffmpeg-output/' + fName.split('.')[0] + '.txt', 'utf8', function (err, content) {
		if (!err && content.match(/Duration: (.*?), start:/)) {
			var duration = 0,
                time = 0,
                progress = 0;
			var resArr = [];
			var matches = (content) ? content.match(/Duration: (.*?), start:/) : [];
			if (matches.length > 0) {
				var rawDuration = matches[1];
				var ar = rawDuration.split(":").reverse();
				duration = parseFloat(ar[0]);
				if (ar[1]) duration += parseInt(ar[1]) * 60;
				if (ar[2]) duration += parseInt(ar[2]) * 60 * 60;
				matches = content.match(/time=(.*?) bitrate/g);
				if (content.match(/time=(.*?) bitrate/g) && matches.length > 0) {
					var rawTime = matches.pop();
					rawTime = rawTime.replace('time=', '').replace(' bitrate', '');
					ar = rawTime.split(":").reverse();
					time = parseFloat(ar[0]);
					if (ar[1]) time += parseInt(ar[1]) * 60;
					if (ar[2]) time += parseInt(ar[2]) * 60 * 60;
					progress = Math.round((time / duration) * 100);
				}

				//socket.emit('ffmpeg-output', progress);
			} else if (content.indexOf('Permission denied') > -1) {
				socket.emit('ffmpeg-error', 'ffmpeg : Permission denied, either for ffmpeg or upload location ...');
			}

			readFfmpeOutput(fName, socket);
		} else setTimeout(function () {
			readFfmpeOutput(fName, socket);
		}, 500);
	});
}



