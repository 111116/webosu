define(["osu", "scenes/playback"], function(Osu) {
    function Playback(osu) {
        var self = this;
        self.osu = osu;
        self.background = null;
        self.ready = true;
        self.started = false;

        if (osu.events.length != 0) {
            if (osu.events[0].length == 5) {
                self.ready = false;
                var file = osu.events[0][2];
                file = file.substr(1, file.length - 2);
                osu.zip.getChildByName(file).getBlob("image/jpeg", function(blob) {
                    var uri = URL.createObjectURL(blob);
                    var image = document.createElement("img");
                    image.src = uri;
                    self.background = image;
                    if (self.started) {
                        self.ready = true;
                        self.start();
                    }
                });
            }
        }

        this.scene = function(timestamp, context, game) {
            if (self.background !== null) {
                context.drawImage(self.background, 0, 0, game.canvas.width, game.canvas.height);
            }
            var time = osu.audio.getPosition() * 10000;
            // Fade background as required
            var fade = 0.7;
            if (osu.general.PreviewTime !== 0 && time < osu.general.PreviewTime) {
                var diff = osu.general.PreviewTime - time;
                if (diff < 30000) {
                    fade = diff / 30000;
                    fade -= 0.5;
                    fade = -fade;
                    fade += 0.5;
                    fade *= 0.7;
                } else {
                    fade = 0;
                }
            }
            context.fillStyle = "rgba(0,0,0," + fade + ")";
            context.fillRect(0, 0, game.canvas.width, game.canvas.height);
            // Hit circles
        }

        this.start = function() {
            self.started = true;
            if (!self.ready) {
                return;
            }
            self.osu.audio.play();
        };
    }
    
    return Playback;
});
