//WebRTC를 통한 Streaming Session을 생성하기 위한 API 및 Callback Method를 제공하는 Class
//selector: remote video element를 
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
	start: function () {
		this.signaling.emit('create', this.gid);
		return this;
	},
	created: function (socket_id) {
	    console.log('Room is created!');
		this.pcs.socket_id = socket_id;
	},
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
	closed: function (message) {
	    console.log('close ' + message);
	    delete this.pcs[message.sid];
	    !!this.onSessionClosed && this.onSessionClosed({ sid: message.sid, uid: message.uid });
	},
	sendMessage: function (type, dest, msg) {
		message = { type: type, src: this.pcs.socket_id, dest: dest, msg: msg };
		this.signaling.emit('message', message);
	},
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
	log: function (array) {
		console.log.apply(console, array);
	}
};