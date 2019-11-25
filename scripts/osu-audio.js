define([], function() {
    function syncStream(node) { // https://stackoverflow.com/questions/10365335/decodeaudiodata-returning-a-null-error
        var buf8 = new Uint8Array(node.buf); 
        buf8.indexOf = Array.prototype.indexOf;
        var i = node.sync, b = buf8;
        while (1) {
            node.retry++;
            i = b.indexOf(0xFF,i);
            if (i ==- 1 || (b[i+1] & 0xE0 == 0xE0 ))
                break;
            i++;
        }
        if (i != -1) {
            var tmp = node.buf.slice(i);
            delete(node.buf);
            node.buf = null;
            node.buf = tmp;
            node.sync = i;
            return true;
        }
        return false;
    }

    function OsuAudio(buffer, callback) {
        var self = this;
        self.decoded = null;
        self.source = null;
        self.started = 0;
        self.position = 0;
        self.playing = false;
        self.audio = new AudioContext();
        self.gain = self.audio.createGain();
        self.gain.connect(self.audio.destination);
        self.wait = 0;

        function decode(node) {
            self.audio.decodeAudioData(node.buf, function(decoded) {
                self.decoded = decoded;
                console.log("Song decoded");
                if (typeof callback !== "undefined") {
                    callback(self);
                }
            }, function (err) {
                console.log("Error");
                if (syncStream(node)) {
                    console.log("Attempting again");
                    decode(node);
                }
            });
        }
        decode({ buf: buffer, sync: 0, retry: 0 });

        this.getPosition = function getPosition() {
            if (!self.playing) {
                return self.position - self.wait/1000;
            } else {
                return self.audio.currentTime - self.started - self.wait/1000;
            }
        };

        this.play = function play(offset, wait) {
            self.source = self.audio.createBufferSource();
            self.source.buffer = self.decoded;
            self.source.connect(self.gain);
            self.started = self.audio.currentTime;
            this.wait = wait;
            if (typeof offset !== "undefined") {
                if (wait > 0) {
                    this.wait = wait;
                    var intervalId;
                    var start;
                    var checktime = function() {
                        let time = new Date().getTime() - start;
                        if (time >= wait) {
                            self.source.start(self.audio.currentTime, 0);
                            window.clearInterval(intervalId);
                        }
                    }
                    start = new Date().getTime();
                    intervalId = window.setInterval(checktime, 1);
                }
                else {
                    self.source.start(self.audio.currentTime, offset / 1000);
                }
            } else {
                self.source.start(self.audio.currentTime, self.position);
            }
            self.playing = true;
        };

        this.pause = function pause() {
            self.position = self.audio.currentTime - self.started;
            self.source.stop();
            self.playing = false;
        };
    }

    return OsuAudio;
});
