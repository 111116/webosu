define(["osu", "resources", "gfx"], function(Osu, Resources, gfx) {
    var TIME_CONSTANT = 1000;
    var NOTE_APPEAR = 0.5 * TIME_CONSTANT;
    var NOTE_DISAPPEAR = -0.5 * TIME_CONSTANT;
    var NOTE_DESPAWN = -2 * TIME_CONSTANT;

    function Playback(osu, track) {
        var self = this;
        window.playback = this;
        self.osu = osu;
        self.track = track;
        self.background = null;
        self.ready = true;
        self.started = false;
        self.upcomingHits = [];
        self.hits = self.track.hitObjects.slice(0);

        // Load background if possible
        if (self.track.events.length != 0) {
            if (self.track.events[0].length == 5) {
                self.ready = false;
                var file = self.track.events[0][2];
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

        var futuremost = 0, current = 0;
        if (self.track.hitObjects.length > 0) {
            futuremost = self.track.hitObjects[0].time;
        }
        this.updateUpcoming = function(timestamp) {
            // Cache the next ten seconds worth of hit objects
            while (current < self.hits.length && futuremost < timestamp + (10 * TIME_CONSTANT)) {
                var hit = self.hits[current++];
                self.upcomingHits.push(hit);
                if (hit.time > futuremost) {
                    futuremost = hit.time;
                }
            }
            for (var i = 0; i < self.upcomingHits.length; i++) {
                var hit = self.upcomingHits[i];
                var diff = hit.time - timestamp;
                if (diff < NOTE_DESPAWN) {
                    self.upcomingHits.splice(i, 1);
                    i--;
                }
            }
        }

        this.renderHitCircle = function(hit, time, context, game) {
            var diff = hit.time - time;
            if (diff <= NOTE_APPEAR && diff > 0) {
                // Figure out alpha
                var alpha = diff / NOTE_APPEAR;
                alpha -= 0.5;
                alpha = -alpha;
                alpha += 0.5;
                gfx.drawImage(context, Resources["hitcircle.png"],
                    hit.x * gfx.width,
                    hit.y * gfx.height, 1, alpha);
                gfx.drawImage(context, Resources["hitcircleoverlay.png"],
                    hit.x * gfx.height,
                    hit.y * gfx.height, 1, alpha);
                // Draw approach ring
                (function() {
                    var scale = (diff / NOTE_APPEAR * 2) + 1;
                    var width = Resources["approachcircle.png"].width;
                    var height = Resources["approachcircle.png"].height;
                    gfx.drawImage(context, Resources["approachcircle.png"],
                        hit.x * gfx.width, hit.y * gfx.height,
                        scale, alpha);
                })();
            } else if (diff > NOTE_DISAPPEAR && diff < 0) {
                var alpha = diff / NOTE_DISAPPEAR;
                alpha -= 0.5;
                alpha = -alpha;
                alpha += 0.5;
                gfx.drawImage(context, Resources["hitcircle.png"],
                    hit.x * gfx.width, hit.y * gfx.height, 1, alpha);
                gfx.drawImage(context, Resources["hitcircleoverlay.png"],
                    hit.x * gfx.width, hit.y * gfx.height, 1, alpha);
                gfx.drawImage(context, Resources["approachcircle.png"],
                    hit.x * gfx.width, hit.y * gfx.height, 1, alpha);
            }
        }

        this.renderHitObjects = function(time, context, game) {
            self.updateUpcoming(time);
            for (var i = self.upcomingHits.length - 1; i >= 0; i--) {
                var hit = self.upcomingHits[i];
                switch (hit.type) {
                    case "circle":
                    case "circle-new-combo":
                        self.renderHitCircle(hit, time, context, game);
                        break;
                }
            }
            context.globalAlpha = 1;
        }

        this.renderBackground = function(time, context, game) {
            var fade = 0.7;
            if (self.track.general.PreviewTime !== 0 && time < self.track.general.PreviewTime) {
                var diff = self.track.general.PreviewTime - time;
                if (diff < 3 * TIME_CONSTANT) {
                    fade = diff / (3 * TIME_CONSTANT);
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
        }

        this.render = function(timestamp, context, game) {
            if (self.background !== null) {
                context.drawImage(self.background, 0, 0, game.canvas.width, game.canvas.height);
            }
            gfx.width = game.canvas.width;
            gfx.height = game.canvas.height;
            if (gfx.width > gfx.height) {
                gfx.width = gfx.height;
                gfx.xoffset = (game.canvas.width - gfx.width) / 2;
            } else {
                // TODO
            }
            var time = osu.audio.getPosition() * TIME_CONSTANT;
            self.renderBackground(time, context, game);
            self.renderHitObjects(time, context, game);
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
