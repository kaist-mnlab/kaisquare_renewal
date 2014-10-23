function JoinMCUSession($http, option) {
//	this.localStream = option.stream;
    this.attr = {gid: option.gid, uid: option.uid, username: option.username, role: 'student'};
//	if(typeof(this.localStream) !== 'undefined') {
    this.config = {audio: false, video: true, data: false, videoSize: [option.width, option.height, option.width, option.height], attributes: this.attr};
    this.localStream = Erizo.Stream(this.config);
//	}
    this.option = option;
    this.$http = $http;
};

JoinMCUSession.prototype = {
    start: function () {
        var session = this;

        session.$http.post('/rtc/createJoin', session.attr).success(function (info) {
            var room = session.room = Erizo.Room({token: info.token});
            session.localStream.addEventListener('access-accepted', function () {
                room.addEventListener('room-connected', function (roomEvent) {
                    room.publish(session.localStream, {maxVideoBW: 300});
                    subscribeToStreams(roomEvent.streams);
                });
                room.addEventListener('stream-subscribed', function (streamEvent) {
                    !!session.onSessionJoined && session.onSessionJoined({ stream: streamEvent.stream });
                });
                room.addEventListener('stream-added', function (streamEvent) {
                    var streams = [];
                    streams.push(streamEvent.stream);
                    subscribeToStreams(streams);
                });
                room.addEventListener('stream-removed', function (streamEvent) {
                    !!session.onSessionClosed && session.onSessionClosed({ stream: streamEvent.stream });
                });

                function subscribeToStreams(streams) {
                    for (var index in streams) {
                        var stream = streams[index];
                        if (stream.getAttributes().role === 'lecturer') {
                            room.subscribe(stream);
                        }
                    }
                }

                room.connect();
            });
            session.localStream.init();
        });
        return this;
    },
    streamAttachment: function (stream, $DOM, attr) {
        var attr = stream.getAttributes();
        attr.id = 'stream-' + stream.getID();
        $('<div></div>').addClass('video').attr(attr).appendTo($DOM).css({width: '640px', height: '480px'});
//        stream.show(attr.id);
        stream.play(attr.id);
//	$('#bar_undifined').remove();
    },
    streamDettachment: function (stream) {
        //if (stream.elementID !== undefined) {
        $('#stream-' + stream.getID()).remove();
    },
    close: function () {
//		this.localStream.stop();
        this.localStream.stop();
        this.localStream.close();
        this.room.disconnect();
    }
};