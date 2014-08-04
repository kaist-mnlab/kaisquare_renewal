
function Recorder(stream, option) {
    this.stream = stream;
    this.option = option;
    this.recordVideoSeparately = !!navigator.webkitGetUserMedia;
    this.socketio = io.connect();
    this.socketio.on('merged', this.merged.bind(this));
};

Recorder.prototype = {
    start: function () {
        var recorder = this;

        recorder.recordAudio = RecordRTC(recorder.stream, {
            onAudioProcessStarted: function () {
                recorder.recordVideoSeparately && recorder.option.video && recorder.recordVideo.startRecording();
            }
        });

        recorder.recordVideo = RecordRTC(recorder.stream, {
            type: 'video'
        });

        recorder.recordAudio.startRecording();
    },
    stop: function () {
        // stop audio recorder
        var recorder = this;
        recorder.recordVideoSeparately && recorder.option.video && recorder.recordAudio.stopRecording(function () {
            // stop video recorder
            recorder.recordVideo.stopRecording(function () {
                // get audio data-URL
                recorder.recordAudio.getDataURL(function (audioDataURL) {
                    // get video data-URL
                    recorder.recordVideo.getDataURL(function (videoDataURL) {
                        var files = {
                            audio: {
                                type: recorder.recordAudio.getBlob().type || 'audio/wav',
                                dataURL: audioDataURL
                            },
                            video: {
                                type: recorder.recordVideo.getBlob().type || 'video/webm',
                                dataURL: videoDataURL
                            },
                            info: {
                                gid: recorder.option.gid,
                                uid: recorder.option.uid
                            }
                        };

                        recorder.socketio.emit('record', files);
                    });

                });
            });
        });

        // if firefox or if you want to record only audio
        // // stop audio recorder
        (!this.recordVideoSeparately || !recorder.option.video) && recorder.recordAudio.stopRecording(function () {
            // get audio data-URL
            recorder.recordAudio.getDataURL(function (audioDataURL) {
                var files = {
                    audio: {
                        type: recorder.recordAudio.getBlob().type || 'video/webm',
                        dataURL: audioDataURL
                    },
                    info: {
                        gid: recorder.option.gid,
                        uid: recorder.option.uid
                    }
                };

                recorder.socketio.emit('record', files);
            });
        });
    },
    merged: function (fileName) {
        //When the procedure for merging audio and video is successful, The url of video is returned.
        //var href = (location.href.split('/').pop().length
        //         ? location.href.replace(location.href.split('/').pop(), '')
        //         : location.href
        //     );
        var href = '../uploads/' + fileName;
        console.log('got file ' + href);
        !!this.onRecordCompleted && this.onRecordCompleted(href);
    }
};