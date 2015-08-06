define(["osu", "resources", "pixi", "curves/LinearBezier"], function(Osu, Resources, PIXI, LinearBezier) {
    function Playback(game, osu, track) {
        var self = this;
        window.playback = this;
        self.game = game;
        self.osu = osu;
        self.track = track;
        self.background = null;
        self.backgroundOverlay = null;
        self.ready = true;
        self.started = false;
        self.upcomingHits = [];
        self.hits = self.track.hitObjects.slice(0);

        self.game.canvas.addEventListener('wheel', function(e) {
            self.osu.audio.gain.gain.value -= e.deltaY * 0.01;
            if (self.osu.audio.gain.gain.value < 0) {
                self.osu.audio.gain.gain.value = 0;
            } 
            if (self.osu.audio.gain.gain.value > 1) {
                self.osu.audio.gain.gain.value = 1;
            }
            // TODO: Visualization
        });

        window.addEventListener("keyup", function(e) {
            if (e.keyCode === 32) {
                if (self.osu.audio.playing) {
                    self.osu.audio.pause();
                } else {
                    self.osu.audio.play();
                }
            }
            // TODO: Visualization
        });

        var gfx = {};
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

        // Load background if possible
        self.backgroundOverlay = new PIXI.Graphics();
        self.backgroundOverlay.alpha = 0;
        self.backgroundOverlay.beginFill(0);
        self.backgroundOverlay.drawRect(0, 0, self.game.canvas.width, self.game.canvas.height);
        self.backgroundOverlay.endFill();
        self.game.stage.addChild(self.backgroundOverlay);
        if (self.track.events.length != 0) {
            self.ready = false;
            var file = self.track.events[0][2];
            if (track.events[0][0] === "Video") {
                file = self.track.events[1][2];
            }
            file = file.substr(1, file.length - 2);
            entry = osu.zip.getChildByName(file);
            if (entry) {
                entry.getBlob("image/jpeg", function (blob) {
                    var uri = URL.createObjectURL(blob);
                    var image = PIXI.Texture.fromImage(uri);
                    self.background = new PIXI.Sprite(image);
                    self.background.x = self.background.y = 0;
                    self.background.width = self.game.canvas.width;
                    self.background.height = self.game.canvas.height;
                    self.game.stage.addChild(self.background);
                    self.game.stage.setChildIndex(self.background, 0);
                    self.game.stage.setChildIndex(self.backgroundOverlay, 1);
                    self.ready = true;
                    self.start();
                });
            } else  {
                self.ready = true;
            }
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
            var lastFrame = hit.keyframes[hit.keyframes.length - 1];
            var timing = track.timingPoints[0];
            for (var i = 1; i < track.timingPoints.length; i++) {
                var t = track.timingPoints[i];
                if (t.offset < hit.time) {
                    break;
                }
                timing = t;
            }
            hit.sliderTime = timing.millisecondsPerBeat * (hit.pixelLength / track.difficulty.SliderMultiplier) / 100;
            hit.sliderTimeTotal = hit.sliderTime * hit.repeat;
            // TODO: Other sorts of curves besides LINEAR and BEZIER
            // TODO: Something other than shit peppysliders
            hit.curve = new LinearBezier(hit, hit.type === SLIDER_LINEAR);
            for (var i = 0; i < hit.curve.curve.length; i++) {
                var c = hit.curve.curve[i];
                var base = new PIXI.Sprite(Resources["hitcircle.png"]);
                base.anchor.x = base.anchor.y = 0.5;
                base.x = gfx.xoffset + c.x * gfx.width;
                base.y = gfx.yoffset + c.y * gfx.height;
                base.alpha = 0;
                base.tint = combos[hit.combo % combos.length];
                hit.objects.push(base);
            }
            self.createHitCircle({ // Far end
                time: hit.time,
                combo: hit.combo,
                index: -1,
                x: lastFrame.x,
                y: lastFrame.y,
                objects: hit.objects
            });
            self.createHitCircle(hit); // Near end
            // Add follow circle
            var follow = hit.follow = new PIXI.Sprite(Resources["sliderfollowcircle.png"]);
            follow.visible = false;
            follow.alpha = 0;
            follow.anchor.x = follow.anchor.y = 0.5;
            follow.manualAlpha = true;
            hit.objects.push(follow);
            // Add follow ball
            var ball = hit.ball = new PIXI.Sprite(Resources["sliderb0.png"]);
            ball.visible = false;
            ball.alpha = 0;
            ball.anchor.x = ball.anchor.y = 0.5;
            ball.tint = 0;
            ball.manualAlpha = true;
            hit.objects.push(ball);

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
                reverse.visible = false; // Only visible when it's the next end to hit

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
        }

        for (var i = 0; i < this.hits.length; i++) {
            this.populateHit(this.hits[i]); // Prepare sprites and such
        }

        var futuremost = 0, current = 0;
        if (self.track.hitObjects.length > 0) {
            futuremost = self.track.hitObjects[0].time;
        }
        this.updateUpcoming = function(timestamp) {
            // Cache the next ten seconds worth of hit objects
            while (current < self.hits.length && futuremost < timestamp + (10 * TIME_CONSTANT)) {
                var hit = self.hits[current++];
                for (var i = hit.objects.length - 1; i >= 0; i--) {
                    self.game.stage.addChildAt(hit.objects[i], 2);
                }
                self.upcomingHits.push(hit);
                if (hit.time > futuremost) {
                    futuremost = hit.time;
                }
            }
            for (var i = 0; i < self.upcomingHits.length; i++) {
                var hit = self.upcomingHits[i];
                var diff = hit.time - timestamp;
                var despawn = NOTE_DESPAWN;
                if (hit.type === "slider") {
                    despawn -= hit.sliderTimeTotal;
                }
                if (diff < despawn) {
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
                // Fade in (before hit)
                alpha = diff / NOTE_APPEAR;
                alpha -= 0.5; alpha = -alpha; alpha += 0.5;

                hit.approach.scale.x = ((diff / NOTE_APPEAR * 2) + 1) * 0.9;
                hit.approach.scale.y = ((diff / NOTE_APPEAR * 2) + 1) * 0.9;
            } else if (diff <= NOTE_FULL_APPEAR && diff > -hit.sliderTimeTotal) {
                // During slide
                alpha = 1;
            } else if (diff > NOTE_DISAPPEAR - hit.sliderTimeTotal && diff < 0) {
                // Fade out (after slide)
                alpha = diff / (NOTE_DISAPPEAR - hit.sliderTimeTotal);
                alpha -= 0.5; alpha = -alpha; alpha += 0.5;
            }

            // Update approach circle
            if (diff >= 0) {
                hit.approach.scale.x = ((diff / NOTE_APPEAR * 2) + 1) * 0.9;
                hit.approach.scale.y = ((diff / NOTE_APPEAR * 2) + 1) * 0.9;
            } else if (diff > NOTE_DISAPPEAR - hit.sliderTimeTotal) {
                hit.approach.visible = false;
                hit.follow.visible = true;
                hit.follow.alpha = 1;
                hit.ball.visible = true;
                hit.ball.alpha = 1;

                // Update ball and follow circle
                var t = -diff / hit.sliderTimeTotal;
                var at = hit.curve.pointAt(t);
                var at_next = hit.curve.pointAt(t + 0.01);
                hit.follow.x = at.x * gfx.width + gfx.xoffset;
                hit.follow.y = at.y * gfx.height + gfx.yoffset;
                hit.ball.x = at.x * gfx.width + gfx.xoffset;
                hit.ball.y = at.y * gfx.height + gfx.yoffset;
                var deltaX = at.x - at_next.x;
                var deltaY = at.y - at_next.y;
                if (at.x !== at_next.x || at.y !== at_next.y) {
                    hit.ball.rotation = Math.atan2(deltaY, deltaX) + Math.PI;
                }

                if (diff > -hit.sliderTimeTotal) {
                    var index = Math.floor(t * hit.sliderTime * 60 / 1000) % 10;
                    hit.ball.texture = Resources["sliderb" + index + ".png"];
                }
            }

            if (hit.reverse) {
                hit.reverse.scale.x = hit.reverse.scale.y = 1 + Math.abs(diff % 300) * 0.001;
            }
            if (hit.reverse_b) {
                hit.reverse_b.scale.x = hit.reverse_b.scale.y = 1 + Math.abs(diff % 300) * 0.001;
            }
            _.each(hit.objects, function(o) {
                if (_.isUndefined(o._manualAlpha)) {
                    o.alpha = alpha;
                }
            });
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
            var time = osu.audio.getPosition() * TIME_CONSTANT;
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
            self.backgroundOverlay.alpha = fade;
            if (time !== 0) {
                self.updateHitObjects(time);
            }
        }

        this.teardown = function() {
            // TODO
        }

        this.start = function() {
            self.started = true;
            if (!self.ready) {
                return;
            }
            setTimeout(function() {
                self.osu.audio.play();
            }, 1000);
        };

        self.start();
    }
    
    return Playback;
});
