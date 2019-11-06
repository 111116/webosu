define(["osu", "skin", "hash", "pixi", "curves/LinearBezier", "curves/CircumscribedCircle", "playerActions"],
function(Osu, Skin, Hash, PIXI, LinearBezier, CircumscribedCircle, setPlayerActions) {
    function Playback(game, osu, track) {
        var scoreCharWidth = 35;
        var scoreCharHeight = 45;
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
        self.hits = self.track.hitObjects.slice(0); // what does this do?
        self.offset = 0;
        if (Hash.timestamp()) {
            self.offset = +Hash.timestamp();
        }

        setPlayerActions(self);

        self.game.window.addEventListener('wheel', function(e) {
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
        gfx.width = game.window.innerWidth;
        gfx.height = game.window.innerHeight;
        if (gfx.width > gfx.height) {
            gfx.width = gfx.height;
            gfx.xoffset = (game.window.innerWidth - gfx.width) / 2;
            gfx.yoffset = 128;
            gfx.height = gfx.height - 256;
        } else {
            // TODO: Portrait displays
        }

        // Load background if possible
        self.backgroundOverlay = new PIXI.Graphics();
        self.backgroundOverlay.alpha = 0;
        self.backgroundOverlay.beginFill(0);
        self.backgroundOverlay.drawRect(0, 0, self.game.window.innerWidth, self.game.window.innerHeight);
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
                    self.background.width = self.game.window.innerWidth;
                    self.background.height = self.game.window.innerHeight;
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

      //XXX doesn't work ...
        // function makeScoreNumberObject(position){
        //   var num = new PIXI.Sprite(osuTextures['score0']);
        //   num.anchor.x = num.anchor.y = 0.5;
        //   num.x = game.canvas.width - (position * scoreCharWidth);
        //   num.y = scoreCharHeight;
        //   self.game.stage.addChild(num);
        //   return num;
        // }
        // self.scoreView = {
          // score1: makeScoreNumberObject(1),
          // score10: makeScoreNumberObject(2),
          // score100: makeScoreNumberObject(3),
          // score1000: makeScoreNumberObject(4),
          // score10000: makeScoreNumberObject(5)
        // };

          var num1 = new PIXI.Sprite(osuTextures['score0']);
          num1.anchor.x = num1.anchor.y = 0.5;
          num1.x = game.window.innerWidth - (1 * scoreCharWidth);
          num1.y = scoreCharHeight;
          self.game.stage.addChild(num1);

          var num2 = new PIXI.Sprite(osuTextures['score0']);
          num2.anchor.x = num2.anchor.y = 0.5;
          num2.x = game.window.innerWidth - (2 * scoreCharWidth);
          num2.y = scoreCharHeight;
          self.game.stage.addChild(num2);

          var num3 = new PIXI.Sprite(osuTextures['score0']);
          num3.anchor.x = num3.anchor.y = 0.5;
          num3.x = game.window.innerWidth - (3 * scoreCharWidth);
          num3.y = scoreCharHeight;
          self.game.stage.addChild(num3);

          var num4 = new PIXI.Sprite(osuTextures['score0']);
          num4.anchor.x = num4.anchor.y = 0.5;
          num4.x = game.window.innerWidth - (4 * scoreCharWidth);
          num4.y = scoreCharHeight;
          self.game.stage.addChild(num4);

          var num5 = new PIXI.Sprite(osuTextures['score0']);
          num5.anchor.x = num5.anchor.y = 0.5;
          num5.x = game.window.innerWidth - (5 * scoreCharWidth);
          num5.y = scoreCharHeight;
          self.game.stage.addChild(num5);

        self.scoreView = {
          score1: num1,
          score10: num2,
          score100: num3,
          score1000: num4,
          score10000: num5
        };

        this.updateScoreView = function(){
          var numbers = self.game.score.points.toString().split('').reverse();
          var len = numbers.length;
          if (len > 0){
            self.scoreView.score1.texture = osuTextures["score" + numbers[0]];
          }
          if (len > 1){
            self.scoreView.score10.texture = osuTextures["score" + numbers[1]];
          }
          if (len > 2){
            self.scoreView.score100.texture = osuTextures["score" + numbers[2]];
          }
          if (len > 3){
            self.scoreView.score1000.texture = osuTextures["score" + numbers[3]];
          }
          if (len > 4){
            self.scoreView.score10000.texture = osuTextures["score" + numbers[4]];
          }
        }

        this.createHitCircle = function(hit, objects = hit.objects) {
            var index = hit.index + 1;
            var base = new PIXI.Sprite(Skin["hitcircle.png"]);
            base.anchor.x = base.anchor.y = 0.5;
            base.x = gfx.xoffset + hit.x * gfx.width;
            base.y = gfx.yoffset + hit.y * gfx.height;
            hit.basex = base.x;
            hit.basey = base.y;
            base.alpha = 0;
            base.tint = combos[hit.combo % combos.length];
            var overlay = new PIXI.Sprite(Skin["hitcircleoverlay.png"]);
            overlay.anchor.x = overlay.anchor.y = 0.5;
            overlay.x = gfx.xoffset + hit.x * gfx.width;
            overlay.y = gfx.yoffset + hit.y * gfx.height;
            overlay.alpha = 0;
            var approach;
            if (index > 0) { // index == -1 is used for slider ends
                hit.approach = approach = new PIXI.Sprite(Skin["approachcircle.png"]);
                approach.alpha = 0;
                approach.anchor.x = approach.anchor.y = 0.5;
                approach.x = gfx.xoffset + hit.x * gfx.width;
                approach.y = gfx.yoffset + hit.y * gfx.height;
                approach.tint = combos[hit.combo % combos.length];
            }

            if (!hit.objectWin){
              hit.objectWin = new PIXI.Sprite(osuTextures.hit0);
              hit.objectWin.anchor.x = hit.objectWin.anchor.y = 0.5;
              hit.objectWin.x = gfx.xoffset + hit.x * gfx.width;
              hit.objectWin.y = gfx.yoffset + hit.y * gfx.height;
              hit.objectWin.alpha = 0;
            }

            objects.push(base);
            objects.push(overlay);
            if (index > 0) {
                objects.push(approach);
            }

            if (index <= 9 && index > 0) {
                var number = new PIXI.Sprite(Skin["default-" + index + ".png"]);
                number.alpha = 0;
                number.anchor.x = number.anchor.y = 0.5;
                number.x = gfx.xoffset + hit.x * gfx.width;
                number.y = gfx.yoffset + hit.y * gfx.height;
                objects.push(number);
            } else if (index <= 99 && index > 0) {
                var numberA = new PIXI.Sprite(Skin["default-" + (index % 10) + ".png"]);
                numberA.alpha = 0;
                numberA.anchor.x = numberA.anchor.y = 0.5;
                numberA.x = gfx.xoffset + hit.x * gfx.width + (numberA.width * 0.6) - 6;
                numberA.y = gfx.yoffset + hit.y * gfx.height;
                numberA.scale.x = numberA.scale.y = 0.9;
                objects.push(numberA);

                var numberB = new PIXI.Sprite(Skin["default-" +
                    ((index - (index % 10)) / 10) + ".png"]);
                numberB.alpha = 0;
                numberB.anchor.x = numberB.anchor.y = 0.5;
                numberB.x = gfx.xoffset + hit.x * gfx.width - (numberB.width * 0.6) - 6;
                numberB.y = gfx.yoffset + hit.y * gfx.height;
                numberB.scale.x = numberB.scale.y = 0.9;
                objects.push(numberB);
            }
            // Note: combos > 99 hits are unsupported
        }

        this.hitSuccess = function hitSuccess(hit, points){
          self.game.hitNormal.play();
          hit.score = points;
          self.game.score.points += points;
          self.game.score.goodClicks += 1;
          self.updateScoreView();
          hit.objectWin.texture = osuTextures["hit" + points];
        };


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

            // get slider curve
            if (hit.sliderType === SLIDER_PERFECT_CURVE && hit.keyframes.length == 2) {
                // handle straight P slider
                // Vec2f nora = new Vec2f(sliderX[0] - x, sliderY[0] - y).nor();
                // Vec2f norb = new Vec2f(sliderX[0] - sliderX[1], sliderY[0] - sliderY[1]).nor();
                // if (Math.abs(norb.x * nora.y - norb.y * nora.x) < 0.00001)
                //     return new LinearBezier(this, false, scaled);  // vectors parallel, use linear bezier instead
                // else
                console.log("use perfect curve");
                hit.curve = new CircumscribedCircle(hit, gfx.width / gfx.height);
            }
            else
                hit.curve = new LinearBezier(hit, hit.sliderType === SLIDER_LINEAR);

            // drawing slider edge under slider body
            for (var i = 0; i < hit.curve.curve.length; i++) {
                var c = hit.curve.curve[i];
                var underlay = new PIXI.Sprite(Skin["slideredge.png"]);
                underlay.anchor.x = underlay.anchor.y = 0.5;
                underlay.x = gfx.xoffset + c.x * gfx.width;
                underlay.y = gfx.yoffset + c.y * gfx.height;
                underlay.alpha = 0;
                hit.objects.push(underlay);
            }

            for (var i = 0; i < hit.curve.curve.length; i++) {
                var c = hit.curve.curve[i];
                var base = new PIXI.Sprite(Skin["hitcircle.png"]);
                base.anchor.x = base.anchor.y = 0.5;
                base.x = gfx.xoffset + c.x * gfx.width;
                base.y = gfx.yoffset + c.y * gfx.height;
                base.alpha = 0;
                base.tint = combos[hit.combo % combos.length];
                hit.objects.push(base);
            }
            hit.hitcircleObjects = new Array();
            self.createHitCircle(hit, hit.hitcircleObjects); // Near end
            _.each(hit.hitcircleObjects, function(o){hit.objects.push(o);});
            // Add follow circle
            var follow = hit.follow = new PIXI.Sprite(Skin["sliderfollowcircle.png"]);
            follow.visible = false;
            follow.alpha = 0;
            follow.anchor.x = follow.anchor.y = 0.5;
            follow.manualAlpha = true;
            hit.objects.push(follow);
            // Add follow ball
            var ball = hit.ball = new PIXI.Sprite(Skin["sliderb.png"]);
            ball.visible = false;
            ball.alpha = 0;
            ball.anchor.x = ball.anchor.y = 0.5;
            ball.tint = (255<<16)+(255<<8)+255;
            ball.manualAlpha = true;
            hit.objects.push(ball);

            if (hit.repeat > 1) {
                // Add reverse symbol
                var reverse = hit.reverse = new PIXI.Sprite(Skin["reversearrow.png"]);
                reverse.alpha = 0;
                reverse.anchor.x = reverse.anchor.y = 0.5;
                reverse.x = gfx.xoffset + lastFrame.x * gfx.width;
                reverse.y = gfx.yoffset + lastFrame.y * gfx.height;
                reverse.scale.x = reverse.scale.y = 1;
                reverse.tint = (255<<16)+(255<<8)+255;
                // This makes the arrow point back towards the start of the slider
                // TODO: Make it point at the previous keyframe instead
                var deltaX = lastFrame.x - hit.x;
                var deltaY = lastFrame.y - hit.y;
                reverse.rotation = Math.atan2(deltaY, deltaX) + Math.PI;

                hit.objects.push(reverse);
            }
            if (hit.repeat > 2) {
                // Add another reverse symbol
                var reverse = hit.reverse_b = new PIXI.Sprite(Skin["reversearrow.png"]);
                reverse.alpha = 0;
                reverse.anchor.x = reverse.anchor.y = 0.5;
                reverse.x = gfx.xoffset + hit.x * gfx.width;
                reverse.y = gfx.yoffset + hit.y * gfx.height;
                reverse.scale.x = reverse.scale.y = 1;
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
                if (hit.objectWin){
                  self.game.stage.addChildAt(hit.objectWin, 2);
                }
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
                    if (hit.objectWin){
                      self.game.stage.removeChild(hit.objectWin); hit.objectWin.destroy();
                    }
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
            if (hit.score > 0 || time > hit.time + TIME_ALLOWED ){
              hit.objectWin.alpha = 1 + (time - hit.time)/NOTE_DESPAWN;
              hit.objectWin.scale.x = 1.2 * hit.objectWin.alpha;
              hit.objectWin.scale.y = 1.2 * hit.objectWin.alpha;
              if (hit.score > 0){
                // hit.objectWin.y = hit.approach.y - (1 - hit.objectWin.alpha) * gfx.height;
              } else{
                hit.objectWin.y = hit.approach.y + 0.3 * (1 - hit.objectWin.alpha) * gfx.height;
              }
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

            if (diff >= 0) {
                // Update approach circle
                hit.approach.scale.x = ((diff / NOTE_APPEAR * 2) + 1) * 0.9;
                hit.approach.scale.y = ((diff / NOTE_APPEAR * 2) + 1) * 0.9;
            } else if (diff > NOTE_DISAPPEAR - hit.sliderTimeTotal) {
                // Update slider ball and reverse symbols
                hit.approach.visible = false;
                hit.follow.visible = true;
                hit.follow.alpha = 1;
                hit.ball.visible = true;
                hit.ball.alpha = 1;
                // hide hit circle
                _.each(hit.hitcircleObjects, function(o){o.visible = false;});

                if (hit.repeat > 1) {
                    hit.currentRepeat = Math.ceil(-diff / hit.sliderTimeTotal * hit.repeat);
                }

                if (hit.currentRepeat > 1) {
                   // TODO Hide combo number of first hit circle
                }

                // t: position relative to slider duration (0..1)
                var t = -diff / hit.sliderTime;
                if (t > hit.repeat)
                    t = hit.repeat;
                if (hit.repeat > 1) {
                    if (hit.currentRepeat % 2 == 0) {
                        t = -t
                    }
                    t = t - Math.floor(t);
                }

                // Update ball and follow circle
                var at = hit.curve.pointAt(t);
                hit.follow.x = at.x * gfx.width + gfx.xoffset;
                hit.follow.y = at.y * gfx.height + gfx.yoffset;
                hit.ball.x = at.x * gfx.width + gfx.xoffset;
                hit.ball.y = at.y * gfx.height + gfx.yoffset;

                // sliderball rolling
                // if (diff > -hit.sliderTimeTotal) {
                //     var index = Math.floor(t * hit.sliderTime * 60 / 1000) % 10;
                //     hit.ball.texture = Skin["sliderb" + index + ".png"];
                // }

                if (hit.currentRepeat) {
                    // Update position of reverse symbol
                    if (hit.currentRepeat % 2 == 0 && hit.currentRepeat < hit.repeat) {
                        // Reverse symbol is on start
                        hit.reverse.visible = false;
                        if (hit.reverse_b) {hit.reverse_b.visible = true;}
                    } else if (hit.currentRepeat % 2 == 1 && hit.currentRepeat < hit.repeat) {
                        // Reverse symbol is on end
                        hit.reverse.visible = true;
                        if (hit.reverse_b) {hit.reverse_b.visible = true;}
                    } else {
                        // Last slide
                        hit.reverse.visible = false;
                        if (hit.reverse_b) {hit.reverse_b.visible = true;}
                    }
                }

            }

            if (hit.reverse_b) {
                hit.reverse_b.scale.x = hit.reverse_b.scale.y = 1 + Math.abs(diff % 300) * 0.001;
            }
            if (hit.score > 0 || time > hit.time + hit.sliderTimeTotal + TIME_ALLOWED ){
              hit.objectWin.alpha = 1 + (time - hit.time)/NOTE_DESPAWN;
              hit.objectWin.scale.x = 1.2 * hit.objectWin.alpha;
              hit.objectWin.scale.y = 1.2 * hit.objectWin.alpha;
              if (hit.score > 0){
                // hit.objectWin.y = hit.approach.y - (1 - hit.objectWin.alpha) * gfx.height;
              } else{
                hit.objectWin.y = hit.approach.y + (1 - hit.objectWin.alpha) * gfx.height;
              }
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
            var time = osu.audio.getPosition() * TIME_CONSTANT + self.offset;
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
                self.game.updatePlayerActions(time);
                if (self.osu.audio.playing && false) { // TODO: Better way of updating this
                    Hash.timestamp(Math.floor(time));
                }
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
                self.osu.audio.play(self.offset);
            }, 1000);
        };

        self.start();
    }
    
    return Playback;
});
