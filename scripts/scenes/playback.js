define(["osu", "skin", "hash", "curves/LinearBezier", "curves/CircumscribedCircle", "playerActions", "SliderMesh"],
function(Osu, Skin, Hash, LinearBezier, CircumscribedCircle, setPlayerActions, SliderMesh) {
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

        var gfx = {}; // game field area
        gfx.width = game.window.innerWidth;
        gfx.height = game.window.innerHeight;
        if (gfx.width > gfx.height) {
            if (gfx.width / 512 > gfx.height / 384)
                gfx.width = gfx.height / 384 * 512;
            else
                gfx.height = gfx.width / 512 * 384;
            gfx.width *= 0.8;
            gfx.height *= 0.8;
            gfx.xoffset = (game.window.innerWidth - gfx.width) / 2;
            gfx.yoffset = (game.window.innerHeight - gfx.height) / 2;
            console.log("gfx: ", gfx)
        } else {
            // TODO: Portrait displays
        }

        // deal with difficulties
        self.circleRadius = (109 - 9 * track.difficulty.CircleSize)/2; // unit: osu! pixel
        self.circleRadiusPixel = self.circleRadius * gfx.width / 512;
        self.hitSpriteScale = self.circleRadiusPixel / 60;

        self.TIME_ALLOWED = 200;
        let AR = track.difficulty.ApproachRate;
        self.approachTime = AR<5? 1800-120*AR: 1950-150*AR; // time of sliders/hitcircles and approach circles approaching
        self.objectFadeInTime = Math.min(350, self.approachTime); // time of sliders/hitcircles fading in, at beginning of approaching
        self.approachFadeInTime = Math.min(700, self.approachTime); // time of approach circles fading in, at beginning of approaching
        self.sliderFadeOutTime = 300; // time of slidebody fading out
        self.circleFadeOutTime = 100;
        self.scoreFadeOutTime = 600;
        self.followZoomInTime = 100;
        self.followFadeOutTime = 100;
        self.ballFadeOutTime = 100;
        self.objectDespawnTime = 2000;
        // TODO easing curve currently linear

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
            base.scale.x = base.scale.y = this.hitSpriteScale;
            base.anchor.x = base.anchor.y = 0.5;
            base.x = gfx.xoffset + hit.x * gfx.width;
            base.y = gfx.yoffset + hit.y * gfx.height;
            hit.basex = base.x;
            hit.basey = base.y;
            base.alpha = 0;
            base.tint = combos[hit.combo % combos.length];
            var overlay = new PIXI.Sprite(Skin["hitcircleoverlay.png"]);
            overlay.scale.x = overlay.scale.y = this.hitSpriteScale;
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
                hit.objectWin.scale.x = hit.objectWin.scale.y = this.hitSpriteScale;
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
                number.scale.x = number.scale.y = this.hitSpriteScale;
                objects.push(number);
            } else if (index <= 99 && index > 0) {
                var numberA = new PIXI.Sprite(Skin["default-" + (index % 10) + ".png"]);
                numberA.alpha = 0;
                numberA.anchor.x = numberA.anchor.y = 0.5;
                numberA.x = gfx.xoffset + hit.x * gfx.width + (numberA.width * 0.6) - 6;
                numberA.y = gfx.yoffset + hit.y * gfx.height;
                numberA.scale.x = numberA.scale.y = 0.9 * this.hitSpriteScale;
                objects.push(numberA);

                var numberB = new PIXI.Sprite(Skin["default-" +
                    ((index - (index % 10)) / 10) + ".png"]);
                numberB.alpha = 0;
                numberB.anchor.x = numberB.anchor.y = 0.5;
                numberB.x = gfx.xoffset + hit.x * gfx.width - (numberB.width * 0.6) - 6;
                numberB.y = gfx.yoffset + hit.y * gfx.height;
                numberB.scale.x = numberB.scale.y = 0.9 * this.hitSpriteScale;
                objects.push(numberB);
            }
            // Note: combos > 99 hits are unsupported
        }

        this.playHitsound = function playHitsound(hit, id) {
            let volume = self.osu.audio.gain.gain.value * hit.timing.volume / 100;
            if (hit.type == 'circle')
            {
                var toplay = hit.hitSound;

                // The normal sound is always played
                self.game.sample[self.game.sampleSet].hitnormal.volume = volume;
                self.game.sample[self.game.sampleSet].hitnormal.play();
                if (toplay & 2) {
                    self.game.sample[self.game.sampleSet].hitwhistle.volume = volume;
                    self.game.sample[self.game.sampleSet].hitwhistle.play();
                }
                if (toplay & 4) {
                    self.game.sample[self.game.sampleSet].hitfinish.volume = volume;
                    self.game.sample[self.game.sampleSet].hitfinish.play();
                }
                if (toplay & 8) {
                    self.game.sample[self.game.sampleSet].hitclap.volume = volume;
                    self.game.sample[self.game.sampleSet].hitclap.play();
                }
            }
            if (hit.type == 'slider')
            {
                var toplay = hit.edgeHitsounds[id];
                var sampleSet = self.game.sampleSet;
                var additionSet = self.game.sampleSet;
                if (hit.edgeAdditions[id].sampleSet != 0)
                    sampleSet = hit.edgeAdditions[id].sampleSet;
                if (hit.edgeAdditions[id].additionSet != 0)
                    additionSet = hit.edgeAdditions[id].additionSet;
                
                // The normal sound is always played
                self.game.sample[sampleSet].hitnormal.volume = volume;
                self.game.sample[sampleSet].hitnormal.play();
                if (toplay & 2) {
                    self.game.sample[additionSet].hitwhistle.volume = volume;
                    self.game.sample[additionSet].hitwhistle.play();
                }
                if (toplay & 4) {
                    self.game.sample[additionSet].hitfinish.volume = volume;
                    self.game.sample[additionSet].hitfinish.play();
                }
                if (toplay & 8) {
                    self.game.sample[additionSet].hitclap.volume = volume;
                    self.game.sample[additionSet].hitclap.play();
                }
            }
        };
        this.hitSuccess = function hitSuccess(hit, points){
            self.playHitsound(hit, 0);
            hit.score = points;
            self.game.score.points += points;
            self.game.score.goodClicks += 1;
            self.updateScoreView();
            hit.objectWin.texture = osuTextures["hit" + points];
        };


        this.createSlider = function(hit) {
            hit.lastrep = 0; // for hitsound counting
            hit.sliderTime = hit.timing.millisecondsPerBeat * (hit.pixelLength / track.difficulty.SliderMultiplier) / 100;
            hit.sliderTimeTotal = hit.sliderTime * hit.repeat;

            // get slider curve
            if (hit.sliderType === SLIDER_PERFECT_CURVE && hit.keyframes.length == 2) {
                // handle straight P slider
                // Vec2f nora = new Vec2f(sliderX[0] - x, sliderY[0] - y).nor();
                // Vec2f norb = new Vec2f(sliderX[0] - sliderX[1], sliderY[0] - sliderY[1]).nor();
                // if (Math.abs(norb.x * nora.y - norb.y * nora.x) < 0.00001)
                //     return new LinearBezier(this, false, scaled);  // vectors parallel, use linear bezier instead
                // else
                hit.curve = new CircumscribedCircle(hit, gfx.width / gfx.height);
            }
            else
                hit.curve = new LinearBezier(hit, hit.sliderType === SLIDER_LINEAR);
            if (hit.curve.length < 2)
                console.log("Error: slider curve calculation failed");
            
            // Add follow circle, which lies visually under slider body
            var follow = hit.follow = new PIXI.Sprite(Skin["sliderfollowcircle.png"]);
            follow.scale.x = follow.scale.y = this.hitSpriteScale;
            follow.visible = false;
            follow.alpha = 0;
            follow.anchor.x = follow.anchor.y = 0.5;
            follow.manualAlpha = true;
            hit.objects.push(follow);

            // create slider body
            var body = new SliderMesh(hit.curve.curve,
                this.circleRadius,
                {
                    x: gfx.xoffset, y: gfx.yoffset,
                    width: gfx.width, height: gfx.height,
                    osuWidth: 512, osuHeight: 384,
                    windowWidth: game.window.innerWidth,
                    windowHeight: game.window.innerHeight
                },
                combos[hit.combo % combos.length]);
            body.alpha = 0;
            hit.objects.push(body);

            // create hitcircle at head
            hit.hitcircleObjects = new Array();
            self.createHitCircle(hit, hit.hitcircleObjects); // Near end
            _.each(hit.hitcircleObjects, function(o){hit.objects.push(o);});
            
            // Add follow ball
            var ball = hit.ball = new PIXI.Sprite(Skin["sliderb.png"]);
            ball.scale.x = ball.scale.y = this.hitSpriteScale;
            ball.visible = false;
            ball.alpha = 0;
            ball.anchor.x = ball.anchor.y = 0.5;
            ball.tint = (255<<16)+(255<<8)+255;
            ball.manualAlpha = true;
            hit.objects.push(ball);

            let endPoint = hit.curve.curve[hit.curve.curve.length-1];
            let endPoint2 = hit.curve.curve[hit.curve.curve.length-2];
            // curve points are of about-same distance, so these 2 points should be different
            let endAngle = Math.atan2(endPoint.y - endPoint2.y, endPoint.x - endPoint2.x);

            if (hit.repeat > 1) {
                // Add reverse symbol
                var reverse = hit.reverse = new PIXI.Sprite(Skin["reversearrow.png"]);
                reverse.scale.x = reverse.scale.y = this.hitSpriteScale;
                reverse.alpha = 0;
                reverse.anchor.x = reverse.anchor.y = 0.5;
                reverse.x = gfx.xoffset + endPoint.x * gfx.width;
                reverse.y = gfx.yoffset + endPoint.y * gfx.height;
                reverse.tint = (255<<16)+(255<<8)+255;
                reverse.rotation = endAngle + Math.PI;
                hit.objects.push(reverse);
            }
            if (hit.repeat > 2) {
                // Add another reverse symbol at
                var reverse = hit.reverse_b = new PIXI.Sprite(Skin["reversearrow.png"]);
                reverse.scale.x = reverse.scale.y = this.hitSpriteScale;
                reverse.alpha = 0;
                reverse.anchor.x = reverse.anchor.y = 0.5;
                reverse.x = gfx.xoffset + hit.x * gfx.width;
                reverse.y = gfx.yoffset + hit.y * gfx.height;
                reverse.tint = (255<<16)+(255<<8)+255;
                reverse.rotation = endAngle;
                reverse.visible = false; // Only visible when it's the next end to hit
                hit.objects.push(reverse);
            }
        }

        this.populateHit = function(hit) {
            // Creates PIXI objects for a given hit

            // find latest timing point that's not later than this hit
            var timing = track.timingPoints[0];
            // select later one if timingPoints coincide
            for (var i = 1; i < track.timingPoints.length; i++) {
                var t = track.timingPoints[i];
                if (t.offset > hit.time) {
                    break;
                }
                timing = t;
            }
            hit.timing = timing;

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
                var despawn = -this.objectDespawnTime;
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

        this.fadeOutEasing = function(t) { // [0..1] -> [1..0]
            if (t <= 0) return 1;
            if (t > 1) return 0;
            return 1 - Math.sin(t * Math.PI/2);
        }

        this.updateHitCircle = function(hit, time) {
            let diff = hit.time - time; // milliseconds before time of circle
            // calculate opacity of circle
            let alpha = 0;
            let noteFullAppear = this.approachTime - this.objectFadeInTime; // duration of opaque hit circle when approaching
            let approachFullAppear = this.approachTime - this.approachFadeInTime; // duration of opaque approach circle when approaching

            if (diff <= this.approachTime && diff > noteFullAppear) { // fading in
                alpha = (this.approachTime - diff) / this.objectFadeInTime;
            }
            else if (diff <= noteFullAppear && diff >= 0) { // approaching (or at exact time of circle), after fade-in
                alpha = 1;
            }
            else if (-diff > 0 && -diff < this.circleFadeOutTime) { // after time of circle
                alpha = this.fadeOutEasing(-diff / this.circleFadeOutTime);
                let scale = (1 + 0.15 * -diff / this.circleFadeOutTime) * this.hitSpriteScale;
                _.each(hit.objects, function(o) { o.scale.x = o.scale.y = scale; });
            }
            _.each(hit.objects, function(o) { o.alpha = alpha; });
            // calculate size of approach circle
            if (diff <= this.approachTime && diff > 0) { // approaching
                let scale = (diff / this.approachTime * 2 + 1) * 0.9 * this.hitSpriteScale;
                hit.approach.scale.x = scale;
                hit.approach.scale.y = scale;
            } else {
                hit.approach.scale.x = hit.objects[2].scale.y = this.hitSpriteScale;
            }
            // display hit score
            if (hit.score > 0 || time > hit.time + this.TIME_ALLOWED){
              hit.objectWin.alpha = this.fadeOutEasing(-diff / this.scoreFadeOutTime);
              hit.objectWin.scale.x = this.hitSpriteScale;
              hit.objectWin.scale.y = this.hitSpriteScale;
            }
            // calculate opacity of approach circle
            if (diff <= this.approachTime && diff > approachFullAppear) { // approach circle fading in
                alpha = (this.approachTime - diff) / this.approachFadeInTime;
            }
            else if (diff <= approachFullAppear && diff > 0) { // approach circle opaque, just shrinking
                alpha = 1;
            }
            hit.approach.alpha = alpha;
        }

        this.updateSlider = function(hit, time) {
            let diff = hit.time - time; // milliseconds before hit.time
            // calculate opacity of slider
            let alpha = 0;
            let noteFullAppear = this.approachTime - this.objectFadeInTime; // duration of opaque hit circle when approaching
            let approachFullAppear = this.approachTime - this.approachFadeInTime; // duration of opaque approach circle when approaching
            if (diff <= this.approachTime && diff > noteFullAppear) {
                // Fade in (before hit)
                alpha = (this.approachTime - diff) / this.objectFadeInTime;
            } else if (diff <= noteFullAppear && diff > -hit.sliderTimeTotal) {
                // approaching or During slide
                alpha = 1;
            } else if (-diff > 0 && -diff < this.sliderFadeOutTime + hit.sliderTimeTotal) {
                // Fade out (after slide)
                alpha = this.fadeOutEasing((-diff - hit.sliderTimeTotal) / this.sliderFadeOutTime);
            }
            // apply opacity
            _.each(hit.objects, function(o) {
                if (_.isUndefined(o._manualAlpha)) {
                    o.alpha = alpha;
                }
            });

            // calculate size of approach circle
            if (diff >= 0 && diff <= this.approachTime) { // approaching
                let scale = (diff / this.approachTime * 2 + 1) * 0.9 * this.hitSpriteScale;
                hit.approach.scale.x = scale;
                hit.approach.scale.y = scale;
            } else {
                hit.approach.scale.x = hit.objects[2].scale.y = this.hitSpriteScale;
            }

            if (-diff >= 0 && -diff <= this.sliderFadeOutTime + hit.sliderTimeTotal) { // after hit.time & before slider disappears
                // hide hit circle & approach circle
                _.each(hit.hitcircleObjects, function(o){o.visible = false;});
                hit.approach.visible = false;
                // slider ball immediately emerges
                hit.ball.visible = true;
                hit.ball.alpha = 1;
                // follow circie immediately emerges and gradually enlarges
                hit.follow.visible = true;
                hit.follow.alpha = 1;
                let followscale = (-diff > this.followZoomInTime)? 1: 0.5 + 0.5 * Math.sin(-diff / this.followZoomInTime * Math.PI / 2);
                hit.follow.scale.x = hit.follow.scale.y = followscale * this.hitSpriteScale;

                // t: position relative to slider duration
                let t = -diff / hit.sliderTime;
                if (hit.repeat > 1) {
                    hit.currentRepeat = Math.ceil(t);
                }
                // clamp t
                if (Math.floor(t) > hit.lastrep)
                {
                    hit.lastrep = Math.floor(t);
                    if (hit.lastrep > 0 && hit.lastrep <= hit.repeat)
                        self.playHitsound(hit, hit.lastrep);
                }
                if (t > hit.repeat)
                    t = hit.repeat;
                if (hit.repeat > 1) {
                    if (hit.currentRepeat % 2 == 0) {
                        t = -t
                    }
                    t = t - Math.floor(t);
                }

                // Update ball and follow circle position
                let at = hit.curve.pointAt(t);
                hit.follow.x = at.x * gfx.width + gfx.xoffset;
                hit.follow.y = at.y * gfx.height + gfx.yoffset;
                hit.ball.x = at.x * gfx.width + gfx.xoffset;
                hit.ball.y = at.y * gfx.height + gfx.yoffset;

                // reverse arrow
                if (hit.currentRepeat) {
                    let finalrepfromA = hit.repeat - hit.repeat % 2; // even
                    let finalrepfromB = hit.repeat-1 + hit.repeat % 2; // odd
                    hit.reverse.visible = (hit.currentRepeat < finalrepfromA);
                    if (hit.reverse_b)
                        hit.reverse_b.visible = (hit.currentRepeat < finalrepfromB);
                    // TODO reverse arrow fade out animation
                }
            }
            // sliderball & follow circle fade-out Animation
            let timeAfter = -diff - hit.sliderTimeTotal;
            if (timeAfter > 0) {
                hit.ball.alpha = this.fadeOutEasing(timeAfter / this.ballFadeOutTime);
                let ballscale = (1 + 0.15 * timeAfter / this.ballFadeOutTime) * this.hitSpriteScale;
                hit.ball.scale.x = hit.ball.scale.y = ballscale;
                hit.follow.alpha = this.fadeOutEasing(timeAfter / this.followFadeOutTime);
                let followscale = (1 - 0.5 * timeAfter / this.followFadeOutTime) * this.hitSpriteScale;
                hit.follow.scale.x = hit.follow.scale.y = followscale;
            }

            
            // display hit score
            if (hit.score > 0 || time > hit.time + hit.sliderTimeTotal + this.TIME_ALLOWED ){
              hit.objectWin.alpha = this.fadeOutEasing((-diff - hit.sliderTimeTotal) / this.scoreFadeOutTime);
              hit.objectWin.scale.x = this.hitSpriteScale;
              hit.objectWin.scale.y = this.hitSpriteScale;
            }
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

        this.updateBackground = function(time) {
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
        }

        this.render = function(timestamp) {
            var time = osu.audio.getPosition() * TIME_CONSTANT + self.offset;
            this.updateBackground(time);
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
