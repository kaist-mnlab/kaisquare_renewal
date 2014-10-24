function CreateMCUSession($http, option) {
    this.attr = {gid: option.gid, uid: option.uid, username: option.username, role: 'lecturer'};
    this.config = {audio: true, video: true, data: false, videoSize: [option.width, option.height, option.width, option.height], attributes: this.attr};
    this.localStream = Erizo.Stream(this.config);
    this.option = option;
    this.$http = $http;
    this.room;
    this.recordingId;
};

CreateMCUSession.prototype = {
    start: function () {
        var session = this;

        console.log('CreateMCUsession');
        session.$http.post('/rtc/createJoin', session.attr).success(function (info) {
            var room = session.room = Erizo.Room({token: info.token});
            session.token = info.token;
            session.mcu = info.host;

            session.localStream.addEventListener('access-accepted', function () {
                room.addEventListener('room-connected', function (roomEvent) {
                    room.publish(session.localStream, {maxAudioBW: 500, maxVideoBW: 300});  //Audio quality setting
                    subscribeToStreams(roomEvent.streams);
                });

                /**
                 *  Remote 스트림이 있는 경우 이를 화면에 표시
                 */
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
                        if (session.localStream.getID() !== stream.getID()) {
                            room.subscribe(stream);
                        }
                    }
                }

                room.connect();
                /**
                 * onMediaStream을 호출하여 local stream을 표시한다.
                 */
                !!session.onMediaStream && session.onMediaStream({stream: session.localStream});
            });
            session.localStream.init();
        });//end post

        return session;
    },
    streamAttachment: function (stream, $DOM) {
        var attr = stream.getAttributes();
        attr.id = 'stream-' + stream.getID();
        $('<div></div>').addClass('video').attr(attr).appendTo($DOM).css({width: '240px', height: '180px'});
        stream.play(attr.id);
//        stream.show(attr.id);
//		$('#bar_undifined').remove();
    },
    streamDettachment: function (stream) {
        //if (stream.elementID !== undefined) {
        $('#stream-' + stream.getID()).remove();
    },
    close: function () {
        //this.localStream.stop();
        this.localStream.stop();
        this.localStream.close();
        this.room.disconnect();
    },
    startRecording: function(){
        var session = this;
        console.log('start Recording');
        session.room.startRecording(session.localStream, function (recordingId) {
            session.recordingId = recordingId;
            console.log('Recording Id: ' + recordingId);
        });
    },
    stopRecording: function(){
        var session = this;
        session.room.stopRecording(session.recordingId, function (temp) {
            console.log('Stop recording----> record id: ' + session.recordingId + ' : create_mcu_session.js');

            session.$http.post('/rtc/stopRecording', {mcu:session.mcu, rid:session.recordingId}).success(function () {
                var href = '/record/' + session.recordingId + '.webm';
                console.log('got file ' + href   +'   ----->create_mcu_session.js');
                if(!!session.onRecordCompleted){
                    console.log('Lecture saved');
                    session.onRecordCompleted(href);
                }
            });
        });
    }
};