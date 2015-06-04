define(["underscore", "osu-audio"], function(_, OsuAudio) {
    function Osu(zip) {
        var self = this;
        this.zip = zip;
        this.song = null;
        this.ondecoded = null;
        this.onready = null;

        this.load = _.bind(function load() {
            this.osu_raw = _.find(zip.children, function(c) {
                return c.name.indexOf(".osu") === c.name.length - 4 &&
                    c.name.indexOf("Another") !== -1;
            });

            this.osu_raw.getText(function(text) {
                self.osu = text;
                console.log("Loaded beatmap text");
                self.decodeData();
            });
        }, this);

        this.general = {};
        this.metadata = {};
        this.difficulty = {};
        this.colors = {};
        this.events = [];
        this.hitObjects = [];

        this.decodeData = _.bind(function decodeData() {
            // Decodes a .osu file
            var lines = self.osu.replace("\r", "").split("\n");
            if (lines[0] != "osu file format v13") {
                // TODO: Do we care?
            }
            var section = null;
            var combo = 1;
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
                        self.colors[parts[0]] = "rgb(" + value + ")";
                        break;
                    case "[HitObjects]":
                        var parts = line.split(",");
                        var hit = {
                            x: (+parts[0]) / 512,
                            y: (+parts[1]) / 384,
                            time: +parts[2],
                            type: +parts[3]
                        };
                        switch (hit.type) { // TODO: Are there more types?
                            // TODO: decode type specific properties
                            case 1:
                                hit.type = "circle";
                                hit.combo = combo++;
                                break;
                            case 2:
                                hit.type = "slider";
                                break;
                            case 5:
                                hit.type = "circle-new-combo";
                                hit.combo = 1;
                                combo = 1;
                                break;
                            case 12:
                                hit.type = "spinner";
                                break;
                        }
                        self.hitObjects.push(hit);
                        break;
                }
            }
            // Make some corrections
            this.general.PreviewTime /= 10;
            console.log("osu decoded");
            if (this.ondecoded !== null) {
                this.ondecoded(this);
            }
            load_mp3();
        }, this);

        function load_mp3() {
            var mp3_raw = self.zip.getChildByName(self.general.AudioFilename);
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
