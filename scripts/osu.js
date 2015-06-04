define(["underscore", "osu-audio"], function(_, OsuAudio) {
    function Osu(zip) {
        var self = this;
        this.zip = zip;
        this.song = null;
        this.ondecoded = null;
        this.onready = null;

        this.load = _.bind(function load() {
            this.osu_raw = _.find(zip.children, function(c) {
                return c.name.indexOf(".osu") == c.name.length - 4;
            });

            this.osu_raw.getText(function(text) {
                self.osu = text;
                console.log("Loaded beatmap text");
                self.decodeData();
            });
        }, this);

        this.general = {};
        this.metadata = {};
        this.events = [];

        this.decodeData = _.bind(function decodeData() {
            // Decodes a .osu file
            var lines = self.osu.replace("\r", "").split("\n");
            if (lines[0] != "osu file format v13") {
                return; // TODO: Raise error somehow
            }
            var section = null;
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
                }
            }
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
