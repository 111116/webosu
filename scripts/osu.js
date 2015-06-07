define(["underscore", "osu-audio"], function(_, OsuAudio) {
    var HIT_TYPE_CIRCLE = 1,
        HIT_TYPE_SLIDER = 2,
        HIT_TYPE_NEWCOMBO = 4,
        HIT_TYPE_SPINNER = 8;

    function Track(zip, track) {
        var self = this;
        this.track = track;
        this.zip = zip;

        this.ondecoded = null;

        this.general = {};
        this.metadata = {};
        this.difficulty = {};
        this.colors = [];
        this.events = [];
        this.hitObjects = [];

        this.decode = _.bind(function decode() {
            // Decodes a .osu file
            var lines = self.track.replace("\r", "").split("\n");
            if (lines[0] != "osu file format v13") {
                // TODO: Do we care?
            }
            var section = null;
            var combo = 0, index = 1;
            for (var i = 0; i < lines.length; i++) {
                var line = lines[i].trim();
                if (line === "") continue;
                if (line.indexOf("//") === 0) continue;
                if (line.indexOf("[") === 0) {
                    console.log("Section " + line);
                    section = line;
                    continue;
                }
                switch (section) {
                    case "[General]":
                        var parts = line.split(":");
                        value = parts[1].trim();
                        if (isNaN(value)) {
                            self.general[parts[0]] = value;
                        } else {
                            self.general[parts[0]] = (+value);
                        }
                        break;
                    case "[Metadata]":
                        var parts = line.split(":");
                        var value = parts[1].trim();
                        if (isNaN(value)) {
                            self.metadata[parts[0]] = value;
                        } else {
                            self.metadata[parts[0]] = (+value);
                        }
                        break;
                    case "[Events]":
                        self.events.push(line.split(","));
                        break;
                    case "[Difficulty]":
                        var parts = line.split(":");
                        var value = parts[1].trim();
                        if (isNaN(value)) {
                            self.difficulty[parts[0]] = value;
                        } else {
                            self.difficulty[parts[0]] = (+value);
                        }
                        break;
                    case "[Colours]":
                        var parts = line.split(":");
                        var value = parts[1].trim();
                        self.colors.push(value.split(','));
                        break;
                    case "[HitObjects]":
                        var parts = line.split(",");
                        var hit = {
                            x: (+parts[0]) / 512,
                            y: (+parts[1]) / 384,
                            time: +parts[2],
                            type: +parts[3],
                            hitSound: +parts[4]
                        };
                        // Handle combos
                        if ((hit.type & HIT_TYPE_NEWCOMBO) > 0) {
                            combo++;
                            index = 0;
                        }
                        hit.combo = combo;
                        hit.index = index++;

                        // Decode specific hit object type
                        if ((hit.type & HIT_TYPE_CIRCLE) > 0) {
                            hit.type = "circle";
                        } else if ((hit.type & HIT_TYPE_SLIDER) > 0) {
                            hit.type = "slider";
                            var sliderKeys = parts[5].split("|");
                            hit.sliderType = sliderKeys[0];
                            hit.keyFrames = [];
                            for (var j = 1; j < sliderKeys.length; j++) {
                                var p = sliderKeys[j].split(":");
                                hit.keyFrames.push({ x: (+p[0]) / 512, y: (+p[1]) / 384 });
                            }
                            hit.repeat = +parts[6];
                            hit.pixelLength = +parts[7];
                            hit.edgeHitSound = +parts[8];
                        } else if ((hit.type & HIT_TYPE_SPINNER) > 0) {
                            hit.type = "spinner";
                        } else {
                            console.log("Attempted to decode unknown hit object type " + hit.type + ": " + line);
                        }
                        self.hitObjects.push(hit);
                        break;
                }
            }
            // Make some corrections
            this.general.PreviewTime /= 10;
            if (this.general.PreviewTime > this.hitObjects[0].time) {
                this.general.PreviewTime = 0;
            }
            if (this.colors.length === 0) {
                this.colors = [
                    [96,159,159],
                    [192,192,192],
                    [128,255,255],
                    [139,191,222]
                ];
            }
            if (this.general.AudioLeadIn !== 0) {
                for (var i = 0; i < this.hitObjects.length; i++) {
                    this.hitObjects[i].time -= this.general.AudioLeadIn / 10;
                }
            }
            console.log("osu decoded");
            if (this.ondecoded !== null) {
                this.ondecoded(this);
            }
        }, this);
    }

    function Osu(zip) {
        var self = this;
        this.zip = zip;
        this.song = null;
        this.ondecoded = null;
        this.onready = null;
        this.tracks = [];

        var count = 0;
        this.track_decoded = function() {
            count++;
            if (count == self.raw_tracks.length) {
                if (self.ondecoded !== null) {
                    self.ondecoded(this);
                }
                load_mp3();
            }
        };

        this.load = _.bind(function load() {
            self.raw_tracks = _.filter(zip.children, function(c) {
                return c.name.indexOf(".osu") === c.name.length - 4;
            });

            _.each(self.raw_tracks, function(t) {
                t.getText(function(text) {
                    var track = new Track(zip, text);
                    self.tracks.push(track);
                    track.ondecoded = self.track_decoded;
                    track.decode();
                })
            });
        });

        function load_mp3() {
            var mp3_raw = self.zip.getChildByName(self.tracks[0].general.AudioFilename);
            mp3_raw.getBlob("audio/mpeg", function(blob) {
                console.log("Extracted blob");

                var reader = new FileReader();
                reader.onload = function(e) {
                    var buffer = e.target.result;
                    console.log("Loaded blob");
                    self.audio = new OsuAudio(buffer, function() {
                        if (self.onready) {
                            self.onready();
                        }
                    });
                };
                reader.readAsArrayBuffer(blob);
            });
        }
    };
    return Osu;
});
