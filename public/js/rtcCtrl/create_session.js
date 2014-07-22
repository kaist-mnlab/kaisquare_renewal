//WebRTC�� ���� Streaming Session�� ���ϱ� ���� API �� Callback Method�� �����ϴ� Class
//selector: remote video element��
/**
 * 강의자의 홈페이지에서 미디어 스트림 생성이 성공한 경우에 호출된다.
 * @param {object} stream  강의자의 video의 local stream
 * @param {string} option.uid  강의자의 user id(uid)
 * @param {string} option.gid  강의자가 요청한 group ud(gid)
 * @param {number} option.width  강의자가 설정한 강의자 video의 width
 * @param {number} option.height  강의자가 설정한 강의자 video의 height
 * @param {object} option.iceServers  NAT traversal을 위한 turn server의 url
 * @param {function} option.onSessionJoined 학생 session의 join이 발생한 경우 Video element를 생성 후 해당 Stream을 연동하여 html body에 추가하는 handler.
 * @param {function} option.onSessionClosed  학생 session의 close가 발생한 경우 강의자 페이지에 있는 학생의 Video element를 제거하는 handler.
 * @method {function} signaling : 서버에 접속한 뒤, Socket.io connection을 위한 socket를 return한다. default값은 '/'이며, 특정 주소로 연결을 원하는 경우 인자값이 필요하다.
 * @method {function} signaling.on : socket.io에 socket event를 연결한다.
 */
function CreateSession(stream, option) {
	this.localStream = stream;
	this.iceServer = option.iceServers || { 'iceServers': [{ 'url': 'stun:repo.ncl.kaist.ac.kr:3478' }] };
	this.pcs = {};
	this.signaling = io.connect();
	this.signaling.on('created', this.created.bind(this));
	this.signaling.on('joined', this.joined.bind(this));
	this.signaling.on('closed', this.closed.bind(this));
	this.signaling.on('message', this.getMessage.bind(this));
	this.signaling.on('log', this.log.bind(this));
	this.gid = option.gid;
	this.uid = option.uid;
	this.option = option;
};

CreateSession.prototype = {
    /**
     * 강의자가 서버에게 gid의 group id로 room 개설을 요청.
     * @returns {CreateSession}
     */
	start: function () {
		this.signaling.emit('create', this.gid); //이름이 this.gid인 room 생성을 위한 'create' socket event를 발생 시킴.
		return this;
	},
    /**
     * 서버로 부터 room 생성이 성공했음을 확인하고, 강의자 socket의 id를 저장함.
     * @param socket_id 강의자 socket의 id
     */
	created: function (socket_id) {
	    console.log('Room is created!');
		this.pcs.socket_id = socket_id;
	},
    /**
     * 학생이 강의에 참석하여 강의자의 video를 요구하는 socket event이다.
     * 학생에게 Session description을 offer한 후, ICE candidate negotiation loop을 수행한다.
     * @param msg.socket_id 학생의 socket id
     * @param msg.uid 학생의 user id
     */
	joined: function (msg) {
		var session = this;
		var pc = session.pcs[msg.socket_id] = new RTCPeerConnection(session.iceServer);
		pc.socket_id = msg.socket_id;
		pc.onicecandidate = handleIceCandidate;
		pc.onaddstream = handleRemoteStreamAdded;
		pc.addStream(session.localStream);
		pc.createOffer(sdpOffer, function(err) { console.log('createOffer error'); });
		pc.onremovestream = function () {
		    console.log("removed");
		};

		pc.onclose = function () {
		    console.log("close");
		};

		function handleRemoteStreamAdded(event) {
			console.log('Remote stream added.');
			!!session.onSessionJoined && session.onSessionJoined({ socket_id: msg.socket_id, stream: event.stream, uid: msg.uid });
			session.remoteStream = event.stream;
		}

		function handleIceCandidate(event) {
			console.log('handleIceCandidate event: ', event);
			if (event.candidate) {
				session.sendMessage('candidate', pc.socket_id, { label: event.candidate.sdpMLineIndex, id: event.candidate.sdpMid, candidate: event.candidate.candidate });
			} else {
				console.log('End of candidates.');
			}
		};

		function sdpOffer(sdp) {
		    console.log("createOffer");
		    pc.setLocalDescription(sdp, function () {
		        console.log("setLocalDescription");
		        session.sendMessage('offer', pc.socket_id, sdp);
		    });
		};
	},
    /**
     * 학생이 연결을 종료하면 강의자에게 발생하는 socket event이다.
     * pcs의 object에 담고 있던 학생의 socket id 정보를 삭제하고, 강의자 화면에 있던 학생의 Video element 또한 삭제.
     * @param message.sid 종료를 요청한 학생의 socket id
     * @param message.uid 종료를 요청한 학생의 user id
     */
	closed: function (message) {
	    console.log('close ' + message);
	    delete this.pcs[message.sid];
	    !!this.onSessionClosed && this.onSessionClosed({ sid: message.sid, uid: message.uid });
	},
    /**
     * 전달하고자하는 socket id를 가진 목적지에 특정 type 정보를 가지는 메시지를 전달.
     * 메시지는 ICE candidate negotiation을 위한 offer와 candidate 정보, source와 destination정보를 가짐.
     * @param type message의 type (e.g. candidate, offer, answer)
     * @param dest message의 목적지.
     * @param msg 전달달하고자 하는 메시지.
     */
	sendMessage: function (type, dest, msg) {
		message = { type: type, src: this.pcs.socket_id, dest: dest, msg: msg };
		this.signaling.emit('message', message);
	},
    /**
     * 서버로 부터 메시지를 받아서, 메시지의 type에 따른 작업을 수행한다.
     * @param message 분류를 위한 type과, type에 따라 처리 되어야할 데이터를 담고 있음.
     */
	getMessage: function (message) {
		console.log('Client received message:', message);
		
		if (message.type === 'answer') {
		    this.pcs[message.src].setRemoteDescription(new RTCSessionDescription(message.msg), function () {
		        console.log('setRemoteDescription');
		    });
		}
		else if (message.type === 'candidate') {
			var candidate = new RTCIceCandidate({
				sdpMLineIndex: message.msg.label,
				candidate: message.msg.candidate
			});
			this.pcs[message.src].addIceCandidate(candidate, function(){ console.log("ice candidate added!"); }, function(){ console.log("ice candidate add fail!")});
		}
	},
    /**
     * 서버로 부터 오는 로그 정보를 받음. Developer tool을 이용 확인 할 수 있다.
     * @param array 로그 정보를 담고 있음.
     */
	log: function (array) {
		console.log.apply(console, array);
	}
};