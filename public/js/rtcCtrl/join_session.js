
/**
 * 학생의 홈페이지에서 미디어 스트림 생성이 성공한 경우에 호출된다.
 * @param {string} option.gid  학생이 접속하고 하는 강의의 group id.
 * @param {string} option.uid 학생의 user id.
 * @param {object} option.stream  학생의 video의 local stream.
 * @param {object} option.iceServers  NAT traversal을 위한 turn server의 url.
 * @param {function} option.onSessionJoined   강의자의 session의 join이 발생한 경우 Video element를 생성 후 해당 Stream을 연동하여 html body에 추가하는 handler.
 * @method {function} signaling  서버에 접속한 뒤, Socket.io connection을 위한 socket를 return한다. default값은 '/'이며, 특정 주소로 연결을 원하는 경우 인자값이 필요하다.
 * @method {function} signaling.on  socket.io에 socket event를 연결한다.
 */

 function JoinSession(option) {
 	this.localStream = option.stream;
 	this.pc = null;
 	this.iceServer = option.iceServers || { 'iceServers': [{ 'url': 'stun:repo.ncl.kaist.ac.kr:3478' }] };
 	this.signaling = io.connect();
 	this.signaling.session = this;
 	this.signaling.on('joined', this.joined);
 	this.signaling.on('created', this.created);
 	this.signaling.on('close_lecturer', this.close_lecturer);
 	this.signaling.on('message', this.getMessage);
 	this.signaling.on('log', this.log);
 	this.uid = option.uid;
 	this.gid = option.gid;
 	this.option = option;
 };

 JoinSession.prototype = {
    /**
     * 학생이 서버에게 gid의 name를 가지는 room에 join을 요청.
     * @returns {JoinSession}
     */
     start: function () {
     	this.signaling.emit('join', { gid: this.gid, uid: this.uid });
     	return this;
     },
    /**
     * 학생이 gid를 가지는 room의 join 요청에 대한 socket event
     * @param socket_id.create  room 개설자 (강의자)의 socket id.
     * @param socket_id.join  학생의 socket id.
     */
     joined: function (socket_id) {
     	var session = this.session;
     	var pc = session.pc = new RTCPeerConnection(session.iceServer);
     	pc.socket_id = socket_id;
     	if (typeof session.localStream != 'undefined')
     		pc.addStream(session.localStream);
     	pc.onaddstream = handleRemoteStreamAdded;
     	pc.onicecandidate = handleIceCandidate;
     	pc.onremovestream = null;
     	pc.onremovestream = function () {
     		console.log("removed");
     	};

     	pc.onclose = function () {
     		console.log("close");
     	};
     	function handleRemoteStreamAdded(event) {
     		console.log('Remote stream added.', session);
     		!!session.onSessionJoined && session.onSessionJoined({ stream: event.stream });
     		session.remoteStream = event.stream;
     	}

     	function handleIceCandidate(event) {
     		console.log('handleIceCandidate event: ', event);

     		if (event.candidate) {
     			session.sendMessage('candidate', { label: event.candidate.sdpMLineIndex, id: event.candidate.sdpMid, candidate: event.candidate.candidate });
     		} else {
     			console.log('End of candidates.');
     		}
     	};
     },
    /**
     * 학생이 특정 gid의 room에 강의자보다 먼저 join한 경우, 강의자가 join했을때 room에 있던 학생에게 강의자가 join했음을 알리는 socket event이다.
     * @param creator_sid 강의자의 socket id.
     */
     created: function (creator_sid) {
     	var session = this.session;
     	console.log('Room is created! ', creator_sid);
     	session.signaling.emit('join', { gid: session.gid, uid: session.uid });
     },

     close_lecturer: function (message) {
     	var session = this.session;
     	console.log('close ', message);
     	session.pc.close();
     	!!session.onSessionClosed && session.onSessionClosed({ sid: message.sid, uid: message.uid });
     },
    /**
     * 전달하고자하는 메시지에 source, destination, type 정보를 붙여 socket의 'message' event를 발생 시킴.
     * @param type 메시지의 타입 (e.g. candidate, offer, answer)
     * @param msg 전달하고자하는 메시지
     */
     sendMessage: function (type, msg) {
     	message = { type: type, src: this.pc.socket_id.join, dest: this.pc.socket_id.create, msg: msg };
     	this.signaling.emit('message', message);
     },
    /**
     * 서버로 부터 메시지를 받아서, 메시지의 type에 따른 작업을 수행한다.
     * @param message 분류를 위한 type과, type에 따라 처리 되어야할 데이터를 담고 있음.
     */
     getMessage: function (message) {
     	console.log('Client received message:', message);
     	var session = this.session;
     	var pc = session.pc;
     	if (message.type === 'offer') {
     		console.log('get offerd');
     		pc.setRemoteDescription(new RTCSessionDescription(message.msg), function() {
     			console.log("setRemoteDescription and creating answer");
     			pc.createAnswer(function (sdp) {
     				pc.setLocalDescription(sdp, function() {
     					console.log("created Answer and setLocalDescription");
     					session.sendMessage('answer', sdp);
     				});
     			}, function (error) {});
     		});
     	}
     	else if (message.type === 'candidate') {
     		var candidate = new RTCIceCandidate({
     			sdpMLineIndex: message.msg.label,
     			candidate: message.msg.candidate
     		});
     		pc.addIceCandidate(candidate, function(){ console.log("ice candidate added!"); }, function(){ console.log("ice candidate add fail!")});
     	}
     },
    /**
     * 서버로 부터 오는 로그 정보를 받음. Developer tool을 이용 확인 할 수 있다.
     * @param array 로그 정보를 담고 있음.
     */
     log: function (array) {
     	console.log.apply(console, array);
     },
    /**
     * 학생의 세션 종료시, 서버에게 알리는 socket event 'close'를 발생시키고 socket을 닫음.
     */
     close: function () {
     	console.log('close_student', this.signaling);
          // this.signaling.removeAllListeners('joined');
          // this.signaling.removeAllListeners('created');
          // this.signaling.oremoveAllListenersn('close_lecturer');
          // this.signaling.removeAllListeners('message');
          // this.signaling.removeAllListeners('log');
          this.signaling.emit('close_student', { gid: this.gid, uid: this.uid });
          if (typeof this.localStream != 'undefined') {
          	this.localStream.stop();
          }
          this.pc.close();
          delete this.pc;
      }
  };