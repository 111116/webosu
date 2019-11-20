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
        this.timingPoints = [];
        this.hitObjects = [];

        this.decode = _.bind(function decode() {
            // Decodes a .osu file
            var lines = self.track.replace("\r", "").split("\n");
            if (lines[0] != "osu file format v13") {
                // TODO: Do we care?
            }
            var section = null;
            var combo = 0, index = 0;
            for (var i = 0; i < lines.length; i++) {
                var line = lines[i].trim();
                if (line === "") continue;
                if (line.indexOf("//") === 0) continue;
                if (line.indexOf("[") === 0) {
                    section = line;
                    continue;
                }
                switch (section) {
                    case "[General]":
                        var key = line.substr(0, line.indexOf(":"));
                        var value = line.substr(line.indexOf(":") + 1).trim();
                        if (isNaN(value)) {
                            self.general[key] = value;
                        } else {
                            self.general[key] = (+value);
                        }
                        break;
                    case "[Metadata]":
                        var key = line.substr(0, line.indexOf(":"));
                        var value = line.substr(line.indexOf(":") + 1).trim();
                        if (isNaN(value)) {
                            self.metadata[key] = value;
                        } else {
                            self.metadata[key] = (+value);
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
                    case "[TimingPoints]":
                        var parts = line.split(",");
                        var t = {
                            offset: +parts[0],
                            millisecondsPerBeat: +parts[1],
                            meter: +parts[2],
                            sampleSet: +parts[3],
                            sampleIndex: +parts[4],
                            volume: +parts[5],
                            uninherited: +parts[6],
                            kaiMode: +parts[7]
                        };
                        if (t.millisecondsPerBeat < 0) {
                            t.uninherited = 0;
                        }
                        this.timingPoints.push(t);
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
                            // parse hitSample
                            const hitSample = (parts.length > 5? parts[5]: '0:0:0:0:').split(":");
                            hit.hitSample = {
                                normalSet: +hitSample[0],
                                additionSet: +hitSample[1],
                                index: +hitSample[2],
                                volume: +hitSample[3],
                                filename: hitSample[4]
                            };
                        } else if ((hit.type & HIT_TYPE_SLIDER) > 0) {
                            hit.type = "slider";
                            var sliderKeys = parts[5].split("|");
                            hit.sliderType = sliderKeys[0];
                            hit.keyframes = [];
                            for (var j = 1; j < sliderKeys.length; j++) {
                                var p = sliderKeys[j].split(":");
                                hit.keyframes.push({ x: (+p[0]) / 512, y: (+p[1]) / 384 });
                            }
                            hit.repeat = +parts[6];
                            hit.pixelLength = +parts[7];

                            if (parts.length > 8) {
                                hit.edgeHitsounds = parts[8].split("|").map(Number);
                            }
                            else {
                                hit.edgeHitsounds = new Array();
                                for (var wdnmd=0; wdnmd<hit.repeat+1; wdnmd++)
                                    hit.edgeHitsounds.push(0);
                            }

                            hit.edgeSets = new Array();
                            for (var wdnmd=0; wdnmd<hit.repeat+1; wdnmd++)
                                hit.edgeSets.push({
                                    normalSet: 0,
                                    additionSet: 0
                                });
                            if (parts.length > 9) {
                                var additions = parts[9].split("|");
                                for (var wdnmd=0; wdnmd<additions.length; wdnmd++) {
                                    var sets = additions[wdnmd].split(":");
                                    hit.edgeSets[wdnmd].normalSet = +sets[0];
                                    hit.edgeSets[wdnmd].additionSet = +sets[1]
                                }
                            }
                            // parse hitSample
                            const hitSample = (parts.length > 10? parts[10]: '0:0:0:0:').split(":");
                            hit.hitSample = {
                                normalSet: +hitSample[0],
                                additionSet: +hitSample[1],
                                index: +hitSample[2],
                                volume: +hitSample[3],
                                filename: hitSample[4]
                            };
                        } else if ((hit.type & HIT_TYPE_SPINNER) > 0) {
                            hit.type = "spinner";
                            hit.endTime = +parts[5];
                            if (hit.endTime < hit.time)
                                hit.endTime = hit.time + 1;
                            // parse hitSample
                            const hitSample = (parts.length > 6? parts[6]: '0:0:0:0:').split(":");
                            hit.hitSample = {
                                normalSet: +hitSample[0],
                                additionSet: +hitSample[1],
                                index: +hitSample[2],
                                volume: +hitSample[3],
                                filename: hitSample[4]
                            };
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
            } // WTF is this

            // complete with default values
            if (this.colors.length === 0) {
                this.colors = [
                    [96,159,159],
                    [192,192,192],
                    [128,255,255],
                    [139,191,222]
                ];
            }
            if (this.difficulty.OverallDifficulty) {
                this.difficulty.HPDrainRate = this.difficulty.HPDrainRate || this.difficulty.OverallDifficulty;
                this.difficulty.CircleSize = this.difficulty.CircleSize || this.difficulty.OverallDifficulty;
                this.difficulty.ApproachRate = this.difficulty.ApproachRate || this.difficulty.OverallDifficulty;
            } else {
                console.log("Error: OverallDifficulty undefined");
            }

            // calculate inherited timing points
            var last = this.timingPoints[0];
            for (var i = 1; i < this.timingPoints.length; i++) {
                var point = this.timingPoints[i];
                if (point.uninherited === 0) {
                    point.uninherited = 1;
                    point.millisecondsPerBeat *= -0.01 * last.millisecondsPerBeat;
                } else {
                    last = point;
                }
            }

            // stack hitobjects
            stackHitObjects(this);

            // callback
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

            if (_.isEmpty(self.raw_tracks)) {
                self.onerror("No .osu files found!");
            } else {
                _.each(self.raw_tracks, function (t) {
                    t.getText(function (text) {
                        var track = new Track(zip, text);
                        self.tracks.push(track);
                        track.ondecoded = self.track_decoded;
                        track.decode();
                    })
                });
            }
        });

        this.getCoverSrc = function(img) {
            let fileentry = null;
            try {
                var file = this.tracks[0].events[0][2];
                if (this.tracks[0].events[0][0] === "Video") {
                    file = this.tracks[0].events[1][2];
                }
                file = file.substr(1, file.length - 2);
                fileentry = this.zip.getChildByName(file);
            }
            catch (error) {
                console.error(error);
                fileentry = null;
            }
            if (fileentry) {
                console.log(fileentry);
                console.log(URL.createObjectURL);
                fileentry.getBlob("image/jpeg", function (blob) {
                    img.src = URL.createObjectURL(blob);
                });
            } else {
                img.src = "skin/defaultbg.jpg";
            }
        };

        function load_mp3() {
            var mp3_raw = _.find(self.zip.children, function(c) { return c.name.toLowerCase() === self.tracks[0].general.AudioFilename.toLowerCase(); });
            mp3_raw.getBlob("audio/mpeg", function(blob) {
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

    function stackHitObjects(track) {

    }
});
