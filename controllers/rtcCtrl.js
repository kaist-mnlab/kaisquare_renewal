var http = require('http'); // http module을 추출.

var io; //리턴 받게 될 socket을 저장할 변수 선언.

var url = require("url"),
    path = require("path"),
    fs = require("fs"),
    sys = require('sys'),
    exec = require('child_process').exec;

var session_creator = {}; //강의를 개설한 개설자 정보를 담기 위한 object. {key:강의자가 요청한 gid, value:강의자의 socket id}

module.exports = {
    /**
     * 외부에서 모듈로 추출되어 사용되기 위한 부분이다. socket event들이 등록되어 있다.
     * @param sio 생성 된 socket server를 입력 받음.
     */
	index: function (sio) {
		io = sio;
        /**
         *  client가 연결될때 발생하는 event
         *  @callback  client의 socket 정보를 입력 받음.
         */
		io.sockets.on('connection', function (socket) {
            /**
             * 연결된 client에게  log 정보를 전송.
             */
			function log() {
				var array = [">>> Message from server: "];
				for (var i = 0; i < arguments.length; ++i)
					array.push(arguments[i]);
				socket.emit('log', array);
			}

            /**
             * 특정 socket에게 'message'를 전달.
             */
			socket.on('message', function (message) {
				log('Got message', message);
				io.sockets.socket(message.dest).emit('message', message);
			});

            /**
             * 강의자가 요청한 'create'의 socket event를 처리하기 위한 구문이다.
             * 다음의 'create'의 socket event 구문은 room이 개설되는 두가지 경우를 고려한다.
             * 1.강의자가 gid의 room을 개설하고 난뒤, 그 room 으로 학생이 join하는 경우.
             * 2.학생이 먼저 gid의 room에 join을 요청한 후 room이 생성되고, 후 그 room으로 강의자가 join하는 경우.
             *  강의자가 요청한 gid로 room에 join후 'created'의 socket event 를 발생시킨다. gid의 이름을 가지는 room에 있는 모든
             *  client에게 'created' event를 발생시키는데, 위에서 언급한 1번의 경우에는 해당 room에는 강의자 뿐이므로 강의자가 room이
             *  개설되었음을 확인할 수 있다.  2번의 경우에는 해당 room에는 이미 참여하고 있는 학생과 지금 join한 강의자가 있으므로, 모두에게
             *  'created' event를 발생시킨다. 이를 이용하여 강의자는 room이 개설되었음을 확인하고, 학생은 client의 join_session에서 강의자가 접속
             *  하였음을 확인함과 동시에, join_session에서 다시 'join'의 socket event를 발생시켜 RTC를 위한 사전작업을 시작한다.
             */
			socket.on('create', function (gid) {
				log('Request to create room ' + gid);
				socket.join(gid);
				session_creator[gid] = socket.id;
				io.sockets.in(gid).emit('created', socket.id);
			});

            /**
             * 학생이 이름이 gid인 room에 join 요청을 할때 실행되는 socket event이다. 해당 gid의 room에 join한 후 강의자가 존재 유무를
             * 확인하고, 강의자가 존재하면 학생 client에게 'joined' event를 발생시킨다.
             * 강의자가 아직 없는 경우에 강의자가 없음을 log를 통해 학생 client에게 알린다.
             */
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
            /**
             * 학생의 종료 요청에 대한 socket event를 처리함. 학생의 socket를 해당 room에서 나가게 하고, 해당 room의 강의자에게 학생의 종료
             * 를 알리는 socket event를 발생 시킴.
             */
			socket.on('close', function (msg) {
				socket.leave(msg.gid);
				io.sockets.socket(session_creator[msg.gid]).emit('closed', { sid: socket.id, uid: msg.uid });
			});
            /**
             * 강의자의 강의 record에 대한 event를 처리한다.
             * firefox의 경우에는 audio의 .webm 파일에에 video와 audio정보를 모두 담고 있다.
             * chrome의 경우 audio와 video가  record 시 각각 .wav와 .webm따로 생성되기때문에 이 두 element를 server에서 merge과정이 필요함.
             */
			socket.on('record', function (data) {
				ffmpeg_finished = false;
				var date = new Date();
				var fileName = 'gid_' + data.info.gid + '_uid_' + data.info.uid + '_';
				fileName += date.getFullYear() + '-';
				fileName += ("0" + (date.getMonth() + 1)).slice(-2) + '-';
				fileName += ("0" + date.getDate()).slice(-2) + '_';
				fileName += date.getHours() + '_';
				fileName += date.getMinutes() + '_';
				fileName += date.getSeconds();
				data['videoName'] = fileName + '.webm';
				data['audioName'] = fileName + '.' + data.audio.type.split('/')[1];

				writeToDisk(data.audio.dataURL, fileName + '.' + data.audio.type.split('/')[1]);
                //data.audio.dataURL의 element를 2번째에 있는 argument의 이름으로 저장한다.
                //Chrome의 경우에는 저장되는 파일이 .wav형태로 audio만 담고 있으며, Firefox의 경우에는 .webm의 형태로 video, audio 모두 저장되어 있다.

				//Chrome의 경우에는 Video파일을 저장하기 위한 추가적인 작업이 필요하다.
				if (data.video) {
					writeToDisk(data.video.dataURL, fileName + '.webm');  //해당 주소에 있는 Video파일을 저장한다.
					merge(socket, data); //Chrome의 경우 video와 audio가 따로 저장되는데 이를 merge 하기 위한 함수를 호출한다.
				}
					//Firefox의 경우 video, audio가 한 파일안에 함께 저장되기 때문에 Chrome과 달리 merge 작업이 필요없다. 'merged' event를
                    //통해서 record작업이 완료했음을 알린다.
				else {
					socket.emit('merged', data.audioName);
				}
			});
		});
	}
}

/**
 * Client가 요청한 URL의 data를 fileName이란 이름으로 저장한다.
 * @param dataURL 저장할 data가 있는 URL.
 * @param fileName  저장할 data의 새이름.
 */
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

/**
 * Chrome에서 생성된 video와 audio를 merge한다.
 * @param socket  merge 완료 후, merge를 요청한 client에게 해당 과정이 완료되었음을 알리기 위해서 socket 정보가 인자로 필요.
 * @param data  merge할 audio와 video의 이름을 담고 있음.
 */
function merge(socket, data) {
	// 현재 구동되는 os정보를 확인한다. process.platform이 그 정보를 가지고 있으며 윈도우즈는 win32, mac은 darwin의 값을 갖는다.
	var isWin = !!process.platform.match(/^win/);

	if (isWin) {
		ifWin(socket, data);
	} else {
		ifMac(socket, data);
	}

	//readFfmpeOutput(data.audioName, socket);
}

var ffmpeg_finished = false;

/**
 * 윈도우 환경인경우 video, audio를 merge하기 위한 함수
 * @param socket  merge가 완료 되었음을 알리는 socket event 'merged'를 위한 인자.
 * @param data  merge될 video와 audio data의 이름을 담고 있음.
 */
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

		}
	});
}

/**
 * mac 환경인경우 video, audio를 merge하기 위한 함수
 * @param socket  merge가 완료 되었음을 알리는 socket event 'merged'를 위한 인자.
 * @param data  merge될 video와 audio data의 이름을 담고 있음.
 */
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



