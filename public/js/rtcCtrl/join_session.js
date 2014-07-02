function JoinSession(option) {
	this.localStream = option.stream;
	this.pc = null;
	this.iceServer = option.iceServers || { 'iceServers': [{ 'url': 'stun:repo.ncl.kaist.ac.kr:3478' }] };
	this.signaling = io.connect();
	this.signaling.session = this;
	this.signaling.on('joined', this.joined);
	this.signaling.on('created', this.created);
	this.signaling.on('message', this.getMessage);
	this.signaling.on('log', this.log);
	this.uid = option.uid;
	this.gid = option.gid;
	this.option = option;
};

JoinSession.prototype = {
    start: function () {    	
		this.signaling.emit('join', { gid: this.gid, uid: this.uid });
		return this;
	},
	joined: function (socket_id) {
		var session = this.session;
		var pc = session.pc = new RTCPeerConnection(session.iceServer);
		pc.socket_id = socket_id;
		if (typeof session.localStream != 'undefined')
		    pc.addStream(session.localStream);
		pc.onaddstream = handleRemoteStreamAdded;
		pc.onicecandidate = handleIceCandidate;
		pc.onremovestream = null;

		function handleRemoteStreamAdded(event) {
		    console.log('Remote stream added.');
		    session.onSessionJoined({ stream: event.stream });
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
	created: function (creator_sid) {
	    console.log('Room is created! ' + creator_sid);
	    this.emit('join', { gid: this.session.gid, uid: this.session.uid });
	},
	sendMessage: function (type, msg) {
		message = { type: type, src: this.pc.socket_id.join, dest: this.pc.socket_id.create, msg: msg };
		this.signaling.emit('message', message);
	},
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
			pc.addIceCandidate(candidate);
		}
	},
	log: function (array) {
		console.log.apply(console, array);
	},
	close: function () {
	    this.signaling.emit('close', { gid: this.gid, uid: this.uid });
	    this.signaling.disconnect();
	}
};