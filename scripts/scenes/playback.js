define(["osu", "resources", "pixi"], function(Osu, Resources, PIXI) {
    function Playback(game, osu, track) {
        var self = this;
        window.playback = this;
        self.game = game;
        self.osu = osu;
        self.track = track;
        self.background = null;
        self.ready = true;
        self.started = false;
        self.upcomingHits = [];
        self.hits = self.track.hitObjects.slice(0);

        var gfx = {};

        // Load background if possible
        if (self.track.events.length != 0) {
            self.ready = false;
            var file = self.track.events[0][2];
            file = file.substr(1, file.length - 2);
            osu.zip.getChildByName(file).getBlob("image/jpeg", function(blob) {
                var uri = URL.createObjectURL(blob);
                var image = PIXI.Texture.fromImage(uri);
                self.background = new PIXI.Sprite(image);
                self.background.x = self.background.y = 0;
                self.background.width = self.game.canvas.width;
                self.background.height = self.game.canvas.height;
                self.game.stage.addChild(self.background);
                self.game.stage.setChildIndex(self.background, 0);
                if (self.started) {
                    self.ready = true;
                    self.start();
                }
            });
        }

        var combos = [];
        for (var i = 0; i < track.colors.length; i++) {
            var color = track.colors[i];
            combos.push(((+color[0]) << 16) |
                        ((+color[1]) << 8) |
                        ((+color[2]) << 0));
        }

        this.createHitCircle = function(hit) {
            var index = hit.index + 1;
            var base = new PIXI.Sprite(Resources["hitcircle.png"]);
            base.anchor.x = base.anchor.y = 0.5;
            base.x = gfx.xoffset + hit.x * gfx.width;
            base.y = gfx.yoffset + hit.y * gfx.height;
            base.alpha = 0;
            base.tint = combos[hit.combo % combos.length];
            var overlay = new PIXI.Sprite(Resources["hitcircleoverlay.png"]);
            overlay.anchor.x = overlay.anchor.y = 0.5;
            overlay.x = gfx.xoffset + hit.x * gfx.width;
            overlay.y = gfx.yoffset + hit.y * gfx.height;
            overlay.alpha = 0;
            var approach;
            if (index > 0) { // index == -1 is used for slider ends
                hit.approach = approach = new PIXI.Sprite(Resources["approachcircle.png"]);
                approach.alpha = 0;
                approach.anchor.x = approach.anchor.y = 0.5;
                approach.x = gfx.xoffset + hit.x * gfx.width;
                approach.y = gfx.yoffset + hit.y * gfx.height;
                approach.tint = combos[hit.combo % combos.length];
            }

            hit.objects.push(base);
            hit.objects.push(overlay);
            if (index > 0) {
                hit.objects.push(approach);
            }

            if (index <= 9 && index > 0) {
                var number = new PIXI.Sprite(Resources["default-" + index + ".png"]);
                number.alpha = 0;
                number.anchor.x = number.anchor.y = 0.5;
                number.x = gfx.xoffset + hit.x * gfx.width;
                number.y = gfx.yoffset + hit.y * gfx.height;
                hit.objects.push(number);
            } else if (index <= 99 && index > 0) {
                var numberA = new PIXI.Sprite(Resources["default-" + (index % 10) + ".png"]);
                numberA.alpha = 0;
                numberA.anchor.x = numberA.anchor.y = 0.5;
                numberA.x = gfx.xoffset + hit.x * gfx.width + (numberA.width * 0.6) - 6;
                numberA.y = gfx.yoffset + hit.y * gfx.height;
                numberA.scale.x = numberA.scale.y = 0.9;
                hit.objects.push(numberA);

                var numberB = new PIXI.Sprite(Resources["default-" +
                    ((index - (index % 10)) / 10) + ".png"]);
                numberB.alpha = 0;
                numberB.anchor.x = numberB.anchor.y = 0.5;
                numberB.x = gfx.xoffset + hit.x * gfx.width - (numberB.width * 0.6) - 6;
                numberB.y = gfx.yoffset + hit.y * gfx.height;
                numberB.scale.x = numberB.scale.y = 0.9;
                hit.objects.push(numberB);
            }
            // Note: combos > 99 hits are unsupported
        }

        this.createSlider = function(hit) {
            var lastFrame = hit.keyFrames[hit.keyFrames.length - 1];
            // TODO: Create curve
            self.createHitCircle({ // Far end
                time: hit.time,
                combo: hit.combo,
                index: -1,
                x: lastFrame.x,
                y: lastFrame.y,
                objects: hit.objects
            });
            self.createHitCircle(hit); // Near end
            if (hit.repeat !== 1) {
                // Add reverse symbol
                var reverse = hit.reverse = new PIXI.Sprite(Resources["reversearrow.png"]);
                reverse.alpha = 0;
                reverse.anchor.x = reverse.anchor.y = 0.5;
                reverse.x = gfx.xoffset + lastFrame.x * gfx.width;
                reverse.y = gfx.yoffset + lastFrame.y * gfx.height;
                reverse.scale.x = reverse.scale.y = 0.8;
                reverse.tint = 0;
                // This makes the arrow point back towards the start of the slider
                // TODO: Make it point at the previous keyframe instead
                var deltaX = lastFrame.x - hit.x;
                var deltaY = lastFrame.y - hit.y;
                reverse.rotation = Math.atan2(deltaY, deltaX) + Math.PI;

                hit.objects.push(reverse);
            }
            if (hit.repeat > 2) {
                // Add another reverse symbol
                var reverse = hit.reverse_b = new PIXI.Sprite(Resources["reversearrow.png"]);
                reverse.alpha = 0;
                reverse.anchor.x = reverse.anchor.y = 0.5;
                reverse.x = gfx.xoffset + hit.x * gfx.width;
                reverse.y = gfx.yoffset + hit.y * gfx.height;
                reverse.scale.x = reverse.scale.y = 0.8;
                reverse.tint = 0;
                var deltaX = lastFrame.x - hit.x;
                var deltaY = lastFrame.y - hit.y;
                reverse.rotation = Math.atan2(deltaY, deltaX);

                hit.objects.push(reverse);
            }
        }

        this.populateHit = function(hit) {
            // Creates PIXI objects for a given hit
            hit.objects = [];
            hit.score = -1;
            switch (hit.type) {
                case "circle":
                    self.createHitCircle(hit);
                    break;
                case "slider":
                    self.createSlider(hit);
                    break;
            }
            for (var i = hit.objects.length - 1; i >= 0; i--) {
                self.game.stage.addChildAt(hit.objects[i], 1);
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
                self.populateHit(hit);
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
                    _.each(hit.objects, function(o) { self.game.stage.removeChild(o); o.destroy(); });
                }
            }
        }

        this.updateHitCircle = function(hit, time) {
            var diff = hit.time - time;
            var alpha = 0;
            if (diff <= NOTE_APPEAR && diff > NOTE_FULL_APPEAR) {
                alpha = diff / NOTE_APPEAR;
                alpha -= 0.5; alpha = -alpha; alpha += 0.5;
            } else if (diff <= NOTE_FULL_APPEAR && diff > 0) {
                alpha = 1;
            } else if (diff > NOTE_DISAPPEAR && diff < 0) {
                alpha = diff / NOTE_DISAPPEAR;
                alpha -= 0.5; alpha = -alpha; alpha += 0.5;
            }
            if (diff <= NOTE_APPEAR && diff > 0) {
                hit.approach.scale.x = ((diff / NOTE_APPEAR * 2) + 1) * 0.9;
                hit.approach.scale.y = ((diff / NOTE_APPEAR * 2) + 1) * 0.9;
            } else {
                hit.approach.scale.x = hit.objects[2].scale.y = 1;
            }
            _.each(hit.objects, function(o) { o.alpha = alpha; });
        }

        this.updateSlider = function(hit, time) {
            var diff = hit.time - time;
            var alpha = 0;
            if (diff <= NOTE_APPEAR && diff > NOTE_FULL_APPEAR) {
                alpha = diff / NOTE_APPEAR;
                alpha -= 0.5; alpha = -alpha; alpha += 0.5;
            } else if (diff <= NOTE_FULL_APPEAR && diff > 0) {
                alpha = 1;
            } else if (diff > NOTE_DISAPPEAR && diff < 0) {
                alpha = diff / NOTE_DISAPPEAR;
                alpha -= 0.5; alpha = -alpha; alpha += 0.5;
            }
            if (diff <= NOTE_APPEAR && diff > 0) {
                hit.approach.scale.x = ((diff / NOTE_APPEAR * 2) + 1) * 0.9;
                hit.approach.scale.y = ((diff / NOTE_APPEAR * 2) + 1) * 0.9;
            } else {
                hit.approach.scale.x = hit.objects[2].scale.y = 1;
            }
            if (hit.reverse) {
                hit.reverse.scale.x = hit.reverse.scale.y = 1 + Math.abs(diff % 300) * 0.001;
            }
            if (hit.reverse_b) {
                hit.reverse_b.scale.x = hit.reverse_b.scale.y = 1 + Math.abs(diff % 300) * 0.001;
            }
            _.each(hit.objects, function(o) { o.alpha = alpha; });
        }

        this.updateHitObjects = function(time) {
            self.updateUpcoming(time);
            for (var i = self.upcomingHits.length - 1; i >= 0; i--) {
                var hit = self.upcomingHits[i];
                switch (hit.type) {
                    case "circle":
                        self.updateHitCircle(hit, time);
                        break;
                    case "slider":
                        self.updateSlider(hit, time);
                        break;
                    case "spinner":
                        //self.updateSpinner(hit, time); // TODO
                        break;
                }
            }
        }

        this.render = function(timestamp) {
            gfx.width = game.canvas.width;
            gfx.height = game.canvas.height;
            if (gfx.width > gfx.height) {
                gfx.width = gfx.height;
                gfx.xoffset = (game.canvas.width - gfx.width) / 2;
                gfx.yoffset = 128;
                gfx.height = gfx.height - 256;
            } else {
                // TODO: Portrait displays
            }
            var time = osu.audio.getPosition() * TIME_CONSTANT;
            self.updateHitObjects(time);
        }

        this.teardown = function() {
            // TODO
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
