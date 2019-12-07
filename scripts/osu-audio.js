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
        self.playbackRate = 1.0;

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
                return self.position;
            } else {
                return self.position + (self.audio.currentTime - self.started) * self.playbackRate;
            }
        };

        this.play = function play(wait = 0) {
            if (self.audio.state == "suspended") {
                window.alert("Audio can't play. Please use Chrome or Firefox.")
            }
            self.source = self.audio.createBufferSource();
            self.source.playbackRate.value = self.playbackRate;
            self.source.buffer = self.decoded;
            self.source.connect(self.gain);
            self.started = self.audio.currentTime;
            if (wait > 0) {
                self.position = -wait/1000;
                window.setTimeout(function(){self.source.start(Math.max(0, self.getPosition()), 0);}, wait / self.playbackRate);
            }
            else {
                self.source.start(0, self.position);
            }
            self.playing = true;
        };

        // return value true: success
        this.pause = function pause() {
            if (!self.playing || self.getPosition()<=0) return false;
            self.position += (self.audio.currentTime - self.started) * self.playbackRate;
            self.source.stop();
            self.playing = false;
            return true;
        };
    }

    return OsuAudio;
});
