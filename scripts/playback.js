/*
*   object layering:
*       [0,1) background / storyboard
*       [2,3) hit score, bottom to top
*       [4,5) hit objects, top to bottom
*       [5,6) hit score, top to bottom
*       [6,7) hit burst
*       [7,8) follow circle, slider ball, one visible instance at a time (add blend)
*       [8,9) approach circle, bottom to top
*       assuming number of possible hits doesn't exceed 9998
*/
define(["osu", "skin", "hash", "playerActions", "SliderMesh", "score"],
function(Osu, Skin, Hash, setPlayerActions, SliderMesh, ScoreOverlay) {
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
        self.hits = self.track.hitObjects.slice(0); // creating a copy of hitobjects
        self.offset = 0;
        self.currentHitIndex = 0; // index for all hit objects
        self.autoplay = false;
        self.approachScale = 3;
        var scoreCharWidth = 35;
        var scoreCharHeight = 45;

        var gfx = {}; // game field area
        self.calcSize = function() {
            gfx.width = game.window.innerWidth;
            gfx.height = game.window.innerHeight;
            if (gfx.width / 512 > gfx.height / 384)
                gfx.width = gfx.height / 384 * 512;
            else
                gfx.height = gfx.width / 512 * 384;
            gfx.width *= 0.8;
            gfx.height *= 0.8;
            gfx.xoffset = (game.window.innerWidth - gfx.width) / 2;
            gfx.yoffset = (game.window.innerHeight - gfx.height) / 2;
            console.log("gfx: ", gfx)
            // deal with difficulties
            self.circleRadius = (109 - 9 * track.difficulty.CircleSize)/2; // unit: osu! pixel
            self.circleRadiusPixel = self.circleRadius * gfx.width / 512;
            self.hitSpriteScale = self.circleRadiusPixel / 60;
            self.scoreOverlay = new ScoreOverlay({width: game.window.innerWidth, height: game.window.innerHeight}, track.difficulty.HPDrainRate);
            self.scoreOverlay.depth = 23333333333; // score overlay is at top of screen
        };
        self.calcSize();

        self.replaceHit = function(hit) {
            switch (hit.type) {
                case "circle":
                    self.createHitCircle(hit);
                    break;
                case "slider":
                    self.createSlider(hit);
                    break;
                case "spinner":
                    self.createSpinner(hit);
                    break;
            }
        }

        self.game.window.onresize = function() {
            self.pause();
            self.calcSize();
            for (let i=0; i<self.hits.length; ++i)
                self.replaceHit(self.hits[i]);
        }

        // deal with difficulties
        let OD = track.difficulty.OverallDifficulty;
        self.MehTime = 200 - 10 * OD;
        self.GoodTime = 140 - 8 * OD;
        self.GreatTime = 80 - 6 * OD;
        let AR = track.difficulty.ApproachRate;
        self.approachTime = AR<5? 1800-120*AR: 1950-150*AR; // time of sliders/hitcircles and approach circles approaching
        self.objectFadeInTime = Math.min(350, self.approachTime); // time of sliders/hitcircles fading in, at beginning of approaching
        self.approachFadeInTime = self.approachTime; // time of approach circles fading in, at beginning of approaching
        self.sliderFadeOutTime = 300; // time of slidebody fading out
        self.circleFadeOutTime = 150;
        self.scoreFadeOutTime = 600;
        self.followZoomInTime = 100; // TODO related to AR
        self.followFadeOutTime = 100;
        self.ballFadeOutTime = 100;
        self.objectDespawnTime = 2000;
        self.backgroundFadeTime = 3000;

        if (Hash.timestamp()) {
            self.offset = +Hash.timestamp();
        }

        setPlayerActions(self);


        self.paused = false;
        this.pause = function() {
            // this.osu.audio.pause();
            // this.game.paused = true;
        };
        this.resume = function() {
            // this.osu.audio.resume();
            // this.game.paused = false;
        };

        // adjust volume
        if (game.allowMouseScroll) {
            self.game.window.addEventListener('wheel', function(e) {
                self.game.masterVolume -= e.deltaY * 0.01;
                if (self.game.masterVolume < 0) {
                    self.game.masterVolume = 0;
                } 
                if (self.game.masterVolume > 1) {
                    self.game.masterVolume = 1;
                }
                self.osu.audio.gain.gain.value = self.game.musicVolume * self.game.masterVolume;
                // TODO: Visualization
            });
        }
        self.osu.audio.gain.gain.value = self.game.musicVolume * self.game.masterVolume;

        // pause
        window.addEventListener("keyup", function(e) {
            if (e.keyCode === 32) {
                if (!self.game.paused) {
                    self.pause();
                }
                else {
                    self.resume();
                }
            }
            // TODO: Visualization
        });


        this.fadeOutEasing = function(t) { // [0..1] -> [1..0]
            if (t <= 0) return 1;
            if (t > 1) return 0;
            return 1 - Math.sin(t * Math.PI/2);
        }

        this.newJudgement = function(x, y, depth, finalTime) {
            let judgement = new PIXI.Sprite(Skin["hit0.png"]);
            judgement.scale.x = judgement.scale.y = this.hitSpriteScale;
            judgement.anchor.x = judgement.anchor.y = 0.5;
            judgement.basex = x;
            judgement.basey = y;
            judgement.x = gfx.xoffset + x * gfx.width;
            judgement.y = gfx.yoffset + y * gfx.height;
            judgement.depth = depth; 
            judgement.alpha = 0;
            judgement.clickTime = -1;
            judgement.finalTime = finalTime;
            judgement.dir = 0.000000000001;
            return judgement;
        }

        this.updateJudgement = function(judgement, time) {
            let timeAfter = -1;
            if (judgement.clickTime >= 0) {
                timeAfter = time - judgement.clickTime;
            }
            else if (time > judgement.finalTime) {
                // missed
                this.scoreOverlay.hit(0, time);
                judgement.clickTime = judgement.finalTime;
                timeAfter = time - judgement.finalTime;
            }
            if (timeAfter >= 0) {
                judgement.alpha = Math.max(0, 1 - timeAfter / this.scoreFadeOutTime);
                judgement.x = gfx.xoffset + judgement.basex * gfx.width;
                judgement.y = gfx.yoffset + (judgement.basey + judgement.dir * Math.pow(timeAfter,4)) * gfx.height;
            }
        }

        this.createBackground = function(){
            // Load background if possible
            function loadBackground(uri) {
                var image = PIXI.Texture.fromImage(uri);
                self.background = new PIXI.Sprite(image);
                self.background.x = self.background.y = 0;
                self.background.width = self.game.window.innerWidth;
                self.background.height = self.game.window.innerHeight;
                // var blurFilter = new PIXI.filters.KawaseBlurFilter(4,3,true);
                // self.background.filters = [blurFilter];
                self.game.stage.addChildAt(self.background, 0);
            }
            self.backgroundDim = new PIXI.Graphics();
            self.backgroundDim.alpha = 0;
            self.backgroundDim.beginFill(0);
            self.backgroundDim.drawRect(0, 0, self.game.window.innerWidth, self.game.window.innerHeight);
            self.backgroundDim.endFill();
            self.game.stage.addChild(self.backgroundDim);
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
                        loadBackground(uri);
                        self.ready = true;
                        self.start();
                    });
                } else  {
                    loadBackground("skin/defaultbg.jpg");
                    self.ready = true;
                }
            } else {
                loadBackground("skin/defaultbg.jpg");
            }
        };
        self.createBackground();

        // load combo colors
        var combos = [];
        for (var i = 0; i < track.colors.length; i++) {
            var color = track.colors[i];
            combos.push(((+color[0]) << 16) |
                        ((+color[1]) << 8) |
                        ((+color[2]) << 0));
        }

        self.game.stage.addChild(this.scoreOverlay);

        // creating hit objects
        this.createHitCircle = function(hit, objects = hit.objects) {

            function newHitSprite(spritename, depth, scalemul = 1, anchorx = 0.5, anchory = 0.5) {
                let sprite = new PIXI.Sprite(Skin[spritename]);
                sprite.scale.x = sprite.scale.y = self.hitSpriteScale * scalemul;
                sprite.anchor.x = anchorx;
                sprite.anchor.y = anchory;
                sprite.x = gfx.xoffset + hit.x * gfx.width;
                sprite.y = gfx.yoffset + hit.y * gfx.height;
                sprite.depth = depth;
                sprite.alpha = 0;
                objects.push(sprite);
                return sprite;
            }
            var index = hit.index + 1;

            hit.base = newHitSprite("hitcircle.png", 4.9999 - 0.0001 * hit.hitIndex);
            hit.base.tint = combos[hit.combo % combos.length];
            hit.basex = hit.base.x;
            hit.basey = hit.base.y;

            newHitSprite("hitcircleoverlay.png", 4.9999 - 0.0001 * hit.hitIndex);
            hit.burst = newHitSprite("hitburst.png", 6.9999 - 0.0001 * hit.hitIndex);
            hit.burst.visible = false;

            if (index > 0) { // index == -1 is used for slider ends
                hit.approach = newHitSprite("approachcircle.png", 8 + 0.0001 * hit.hitIndex);
                hit.approach.tint = combos[hit.combo % combos.length];
            }
            hit.judgements.push(this.newJudgement(hit.x, hit.y, 5, hit.time + this.MehTime)); // TODO depth

            // create combo number
            if (index <= 9 && index > 0) {
                newHitSprite("default-" + index + ".png", 4.9999-0.0001*hit.hitIndex);
            } else if (index <= 99 && index > 0) {
                newHitSprite("default-" + (index % 10) + ".png", 4.9999-0.0001*hit.hitIndex, 0.9, 0.1);
                newHitSprite("default-" + ((index - (index % 10)) / 10) + ".png", 4.9999-0.0001*hit.hitIndex, 0.9, 1.1);
            }
            // Note: combos > 99 hits are unsupported
        }

        this.createSlider = function(hit) {
            hit.lastrep = 0; // for hitsound counting
            hit.sliderTime = hit.timing.millisecondsPerBeat * (hit.pixelLength / track.difficulty.SliderMultiplier) / 100;
            hit.sliderTimeTotal = hit.sliderTime * hit.repeat;
            
            // Add follow circle (above slider body)
            var follow = hit.follow = new PIXI.Sprite(Skin["sliderfollowcircle.png"]);
            follow.scale.x = follow.scale.y = this.hitSpriteScale;
            follow.visible = false;
            follow.alpha = 0;
            follow.anchor.x = follow.anchor.y = 0.5;
            follow.manualAlpha = true;
            follow.blendMode = PIXI.BLEND_MODES.ADD;
            follow.depth = 7;
            hit.objects.push(follow);
            hit.followSize = 1; // [1,2] current follow circle size relative to hitcircle

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
            body.depth = 4.9999-0.0001*hit.hitIndex;
            hit.objects.push(body);

            // Add slider ball (above follow circle)
            var ball = hit.ball = new PIXI.Sprite(Skin["sliderb.png"]);
            ball.scale.x = ball.scale.y = this.hitSpriteScale;
            ball.visible = false;
            ball.alpha = 0;
            ball.anchor.x = ball.anchor.y = 0.5;
            ball.tint = 0xFFFFFF;
            ball.manualAlpha = true;
            ball.depth = 7.1;
            hit.objects.push(ball);

            // create hitcircle at head
            hit.hitcircleObjects = new Array();
            self.createHitCircle(hit, hit.hitcircleObjects); // Near end
            _.each(hit.hitcircleObjects, function(o){hit.objects.push(o);});

            var burst = hit.burst = new PIXI.Sprite(Skin["hitburst.png"]);
            burst.scale.x = burst.scale.y = this.hitSpriteScale;
            burst.anchor.x = burst.anchor.y = 0.5;
            burst.x = gfx.xoffset + hit.x * gfx.width;
            burst.y = gfx.yoffset + hit.y * gfx.height;
            burst.depth = 6.9999 - 0.0001 * hit.hitIndex;
            burst.visible = false;
            hit.objects.push(burst);


            if (hit.repeat > 1) {
                // Add reverse symbol
                var reverse = hit.reverse = new PIXI.Sprite(Skin["reversearrow.png"]);
                reverse.scale.x = reverse.scale.y = this.hitSpriteScale;
                reverse.alpha = 0;
                reverse.anchor.x = reverse.anchor.y = 0.5;
                // curve points are of about-same distance, so these 2 points should be different
                let endPoint = hit.curve.curve[hit.curve.curve.length-1];
                let endPoint2 = hit.curve.curve[hit.curve.curve.length-2];
                reverse.x = gfx.xoffset + endPoint.x * gfx.width;
                reverse.y = gfx.yoffset + endPoint.y * gfx.height;
                reverse.tint = 0xFFFFFF;
                reverse.rotation = Math.atan2(endPoint2.y - endPoint.y, endPoint2.x - endPoint.x);
                reverse.depth = 4.9999-0.0001*hit.hitIndex;
                hit.objects.push(reverse);
            }
            if (hit.repeat > 2) {
                // Add another reverse symbol at
                var reverse = hit.reverse_b = new PIXI.Sprite(Skin["reversearrow.png"]);
                reverse.scale.x = reverse.scale.y = this.hitSpriteScale;
                reverse.alpha = 0;
                // curve points are of about-same distance, so these 2 points should be different
                let startPoint = hit.curve.curve[0];
                let startPoint2 = hit.curve.curve[1];
                reverse.anchor.x = reverse.anchor.y = 0.5;
                reverse.x = gfx.xoffset + startPoint.x * gfx.width;
                reverse.y = gfx.yoffset + startPoint.y * gfx.height;
                reverse.tint = 0xFFFFFF;
                reverse.rotation = Math.atan2(startPoint2.y - startPoint.y, startPoint2.x - startPoint.x);
                reverse.visible = false; // Only visible when it's the next end to hit
                reverse.depth = 4.9999-0.0001*hit.hitIndex;
                hit.objects.push(reverse);
            }
            // add judgement objects at edge
            let endPoint = hit.curve.curve[hit.curve.curve.length-1];
            for (let i=1; i<=hit.repeat; ++i) {
                let x = (i%2==1)? endPoint.x: hit.x;
                let y = (i%2==1)? endPoint.y: hit.y;
                hit.judgements.push(this.newJudgement(x, y, 5, hit.time + i * hit.sliderTime));
            }
        }

        this.createSpinner = function(hit) {
            hit.x = 0.5;
            hit.y = 0.5;
            hit.rotation = 0;
            hit.clicked = false;

            var base = hit.base = new PIXI.Sprite(Skin["spinner.png"]);
            base.scale.x = base.scale.y = gfx.width / 768;
            base.anchor.x = base.anchor.y = 0.5;
            base.x = gfx.xoffset + hit.x * gfx.width;
            base.y = gfx.yoffset + hit.y * gfx.height;
            base.depth = 4.9999 - 0.0001 * (hit.hitIndex || 1);
            base.alpha = 0;

                // hit.judgement = new PIXI.Sprite(Skin["hit0.png"]);
                // hit.judgement.scale.x = hit.judgement.scale.y = this.hitSpriteScale;
                // hit.judgement.anchor.x = hit.judgement.anchor.y = 0.5;
                // hit.judgement.x = gfx.xoffset + hit.x * gfx.width;
                // hit.judgement.y = gfx.yoffset + hit.y * gfx.height;
                // hit.judgement.depth = 2 + 0.0001 * hit.hitIndex;
                // hit.judgement.alpha = 0;
            hit.objects.push(base);
        }

        this.populateHit = function(hit) {
            // Creates PIXI objects for a given hit
            this.currentHitIndex += 1;
            hit.hitIndex = this.currentHitIndex;
            hit.objects = [];
            hit.judgements = [];
            hit.score = -1;
            switch (hit.type) {
                case "circle":
                    self.createHitCircle(hit);
                    break;
                case "slider":
                    self.createSlider(hit);
                    break;
                case "spinner":
                    self.createSpinner(hit);
                    break;
            }
        }

        for (var i = 0; i < this.hits.length; i++) {
            this.populateHit(this.hits[i]); // Prepare sprites and such
        }

        // hit result handling
        this.playHitsound = function playHitsound(hit, id) {
            let volume = self.game.masterVolume * self.game.effectVolume * (hit.hitSample.volume || hit.timing.volume) / 100;
            let defaultSet = hit.timing.sampleSet || self.game.sampleSet;
            function playHit(bitmask, normalSet, additionSet) {
                // The normal sound is always played
                self.game.sample[normalSet].hitnormal.volume = volume;
                self.game.sample[normalSet].hitnormal.play();
                if (bitmask & 2) {
                    self.game.sample[additionSet].hitwhistle.volume = volume;
                    self.game.sample[additionSet].hitwhistle.play();
                }
                if (bitmask & 4) {
                    self.game.sample[additionSet].hitfinish.volume = volume;
                    self.game.sample[additionSet].hitfinish.play();
                }
                if (bitmask & 8) {
                    self.game.sample[additionSet].hitclap.volume = volume;
                    self.game.sample[additionSet].hitclap.play();
                }
            }
            if (hit.type == 'circle') {
                let toplay = hit.hitSound;
                let normalSet = hit.hitSample.normalSet || defaultSet;
                let additionSet = hit.hitSample.additionSet || normalSet;
                playHit(toplay, normalSet, additionSet);
            }
            if (hit.type == 'slider') {
                let toplay = hit.edgeHitsounds[id];
                let normalSet = hit.edgeSets[id].normalSet || defaultSet;
                let additionSet = hit.edgeSets[id].additionSet || normalSet;
                playHit(toplay, normalSet, additionSet);
            }
        };

        this.hitSuccess = function hitSuccess(hit, points, time){
            this.scoreOverlay.hit(points, time);
            self.playHitsound(hit, 0);
            hit.score = points;
            self.game.score.points += points;
            self.game.score.goodClicks += 1;
            hit.clickTime = time;
            hit.judgements[0].clickTime = time;
            hit.judgements[0].dir *= -0.5;
            hit.judgements[0].texture = Skin["hit" + points + ".png"];
        };

        // hit object updating
        var futuremost = 0, current = 0;
        if (self.track.hitObjects.length > 0) {
            futuremost = self.track.hitObjects[0].time;
        }
        this.updateUpcoming = function(timestamp) {
            // Cache the next ten seconds worth of hit objects
            while (current < self.hits.length && futuremost < timestamp + 10000) {
                var hit = self.hits[current++];
                let findindex = function(i) { // returning smallest j satisfying (self.game.stage.children[j].depth || 0)>=i
                    let l = 0, r = self.game.stage.children.length;
                    while (l+1<r) {
                        let m = Math.floor((l+r)/2)-1;
                        if ((self.game.stage.children[m].depth || 0) < i)
                            l = m+1;
                        else
                            r = m+1;
                    }
                    return l;
                }
                for (let i = hit.judgements.length - 1; i >= 0; i--) {
                    self.game.stage.addChildAt(hit.judgements[i], findindex(hit.judgements[i].depth || 0.0001));
                }
                for (let i = hit.objects.length - 1; i >= 0; i--) {
                    self.game.stage.addChildAt(hit.objects[i], findindex(hit.objects[i].depth || 0.0001));
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
                if (hit.type === "spinner") {
                    despawn -= hit.endTime - hit.time;
                }
                if (diff < despawn) {
                    self.upcomingHits.splice(i, 1);
                    i--;
                    _.each(hit.objects, function(o) { self.game.stage.removeChild(o); o.destroy(); });
                    _.each(hit.judgements, function(o) { self.game.stage.removeChild(o); o.destroy(); });
                }
            }
        }

        this.updateHitCircle = function(hit, time) {
            let diff = hit.time - time; // milliseconds before time of circle
            // calculate opacity of circle
            let alpha = 0;
            let noteFullAppear = this.approachTime - this.objectFadeInTime; // duration of opaque hit circle when approaching
            let approachFullAppear = this.approachTime - this.approachFadeInTime; // duration of opaque approach circle when approaching

            if (diff <= this.approachTime && diff > noteFullAppear) { // fading in
                alpha = (this.approachTime - diff) / this.objectFadeInTime;
                _.each(hit.objects, function(o) { o.alpha = alpha; });
            }
            else if (hit.score > 0) { // clicked
                // burst light
                if (!hit.burst.visible) {
                    _.each(hit.objects, function(o) { o.visible = false; });
                    hit.burst.visible = true;
                }
                let timeAfter = time - hit.clickTime;
                alpha = Math.max(0, 1 - timeAfter / this.circleFadeOutTime);
                let scale = (1 + 0.4 * timeAfter / this.circleFadeOutTime) * this.hitSpriteScale;
                hit.burst.alpha = alpha;
                hit.burst.scale.x = hit.burst.scale.y = scale;
            }
            else if (diff <= noteFullAppear && -diff <= this.MehTime) { // before click
                alpha = 1;
                _.each(hit.objects, function(o) { o.alpha = alpha; });
            }
            else if (-diff > this.MehTime) { // missed
                hit.score = 0;
                let timeAfter = time - hit.time - this.MehTime;
                alpha = this.fadeOutEasing(timeAfter / this.circleFadeOutTime);
                _.each(hit.objects, function(o) { o.alpha = alpha; });
            }

            // calculate size of approach circle
            if (diff <= this.approachTime && diff > 0) { // approaching
                let scale = (diff / this.approachTime * this.approachScale + 1) * 0.48 * this.hitSpriteScale;
                hit.approach.scale.x = scale;
                hit.approach.scale.y = scale;
            } else {
                hit.approach.scale.x = hit.approach.scale.y = 0.48 * this.hitSpriteScale;
            }

            // display hit score
            this.updateJudgement(hit.judgements[0], time);

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

            // calculate opacity of approach circle
            if (diff <= this.approachTime && diff > approachFullAppear) { // approach circle fading in
                alpha = (this.approachTime - diff) / this.approachFadeInTime;
            }
            else if (diff <= approachFullAppear && diff > 0) { // approach circle opaque, just shrinking
                alpha = 1;
            }
            hit.approach.alpha = alpha;

            // calculate size of approach circle
            if (diff >= 0 && diff <= this.approachTime) { // approaching
                let scale = (diff / this.approachTime * this.approachScale + 1) * 0.48 * this.hitSpriteScale;
                hit.approach.scale.x = scale;
                hit.approach.scale.y = scale;
            } else {
                hit.approach.scale.x = hit.approach.scale.y = 0.48 * this.hitSpriteScale;
            }
            // calculate for hit circle
            if (hit.clickTime) { // clicked
                // burst light
                if (!hit.burst.visible) {
                    _.each(hit.hitcircleObjects, function(o) { o.visible = false; });
                    hit.burst.visible = true;
                    hit.approach.visible = false;
                }
                let timeAfter = time - hit.clickTime;
                alpha = Math.max(0, 1 - timeAfter / this.circleFadeOutTime);
                let scale = (1 + 0.4 * timeAfter / this.circleFadeOutTime) * this.hitSpriteScale;
                hit.burst.alpha = alpha;
                hit.burst.scale.x = hit.burst.scale.y = scale;
            }
            else if (-diff > this.MehTime) { // missed
                let timeAfter = -diff - this.MehTime;
                alpha = this.fadeOutEasing(timeAfter / this.circleFadeOutTime);
                _.each(hit.hitcircleObjects, function(o) { o.alpha = alpha; });
                hit.approach.alpha = alpha;
            }

            function resizeFollow(hit, time, dir) {
                if (!hit.followLasttime) hit.followLasttime = time;
                if (!hit.followLinearSize) hit.followLinearSize = 1;
                let dt = time - hit.followLasttime;
                hit.followLinearSize = Math.max(1, Math.min(2, hit.followLinearSize + dt * dir));
                hit.followSize = hit.followLinearSize; // easing can happen here
                hit.followLasttime = time;
            }

            if (-diff >= 0 && -diff <= this.sliderFadeOutTime + hit.sliderTimeTotal) { // after hit.time & before slider disappears
                // t: position relative to slider duration
                let t = -diff / hit.sliderTime;
                if (hit.repeat > 1) {
                    hit.currentRepeat = Math.ceil(t);
                }
                let atEnd = false;
                if (Math.floor(t) > hit.lastrep)
                {
                    hit.lastrep = Math.floor(t);
                    if (hit.lastrep > 0 && hit.lastrep <= hit.repeat)
                        atEnd = true;
                }
                // clamp t
                if (t > hit.repeat)
                    t = hit.repeat;
                if (hit.repeat > 1) {
                    if (t - Math.floor(t) == 0) {
                        t = t % 2;
                    }
                    else {
                        if (hit.currentRepeat % 2 == 0) {
                            t = -t
                        }
                        t = t - Math.floor(t);
                    }
                }

                // Update ball and follow circle position
                let at = hit.curve.pointAt(t);
                let atx = at.x * gfx.width + gfx.xoffset;
                let aty = at.y * gfx.height + gfx.yoffset;
                hit.follow.x = atx;
                hit.follow.y = aty;
                hit.ball.x = atx;
                hit.ball.y = aty;
                _.each(hit.hitcircleObjects, function(o) { o.x = atx; o.y = aty; });
                hit.approach.x = atx;
                hit.approach.y = aty;

                let dx = game.mouseX - atx;
                let dy = game.mouseY - aty;
                let followPixelSize = hit.followSize * this.circleRadiusPixel;
                let isfollowing = dx*dx + dy*dy <= followPixelSize * followPixelSize;

                // slider edge judgement
                if (atEnd && this.game.down && isfollowing) {
                    hit.judgements[hit.lastrep].clickTime = time;
                    hit.judgements[hit.lastrep].texture = Skin["hit300.png"];
                    hit.judgements[hit.lastrep].dir *= -0.5;
                    this.scoreOverlay.hit(300, time);
                    self.playHitsound(hit, hit.lastrep);
                }

                // sliderball & follow circle Animation
                if (-diff >= 0 && -diff <= hit.sliderTimeTotal) {
                    // slider ball immediately emerges
                    hit.ball.visible = true;
                    hit.ball.alpha = 1;
                    // follow circie immediately emerges and gradually enlarges
                    hit.follow.visible = true;
                    if (this.game.down && isfollowing)
                        resizeFollow(hit, time, 1 / this.followZoomInTime); // expand 
                    else
                        resizeFollow(hit, time, -1 / this.followZoomInTime); // shrink
                    let followscale = hit.followSize * 0.45 * this.hitSpriteScale;
                    hit.follow.scale.x = hit.follow.scale.y = followscale;
                    hit.follow.alpha = hit.followSize - 1;
                }
                let timeAfter = -diff - hit.sliderTimeTotal;
                if (timeAfter > 0) {
                    resizeFollow(hit, time, -1 / this.followZoomInTime); // shrink
                    let followscale = hit.followSize * 0.45 * this.hitSpriteScale;
                    hit.follow.scale.x = hit.follow.scale.y = followscale;
                    hit.follow.alpha = hit.followSize - 1;
                    hit.ball.alpha = this.fadeOutEasing(timeAfter / this.ballFadeOutTime);
                    let ballscale = (1 + 0.15 * timeAfter / this.ballFadeOutTime) * this.hitSpriteScale;
                    hit.ball.scale.x = hit.ball.scale.y = ballscale;
                }

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
            
            // display hit score
            for (let i=0; i<hit.judgements.length; ++i)
                this.updateJudgement(hit.judgements[i], time);
        }

        this.updateSpinner = function(hit, time) {
            // update rotation
            if (time >= hit.time && time <= hit.endTime) {
                if (this.game.down) {
                    let Xr = this.game.mouseX - gfx.xoffset - gfx.width/2;
                    let Yr = this.game.mouseY - gfx.yoffset - gfx.height/2;
                    let mouseAngle = Math.atan2(Yr, Xr);
                    if (!hit.clicked) {
                        hit.clicked = true;
                    }
                    else {
                        hit.rotation += mouseAngle - hit.lastAngle;
                    }
                    hit.lastAngle = mouseAngle;
                }
                else {
                    hit.clicked = false;
                }
            }

            let diff = hit.time - time; // milliseconds before time of circle
            // calculate opacity of circle
            let alpha = (time >= hit.time && time <= hit.endTime)? 1: 0;

            hit.base.rotation = hit.rotation;
            hit.base.alpha = alpha;
           
            // // display hit score
            // if (hit.score > 0 || time > hit.time + this.TIME_ALLOWED){
            //   hit.judgement.alpha = this.fadeOutEasing(-diff / this.scoreFadeOutTime);
            //   hit.judgement.scale.x = this.hitSpriteScale;
            //   hit.judgement.scale.y = this.hitSpriteScale;
            // }
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
                        self.updateSpinner(hit, time);
                        break;
                }
            }
        }

        this.updateBackground = function(time) {
            var fade = self.game.backgroundDimRate;
            if (self.track.general.PreviewTime !== 0 && time < self.track.general.PreviewTime) {
                var diff = self.track.general.PreviewTime - time;
                if (diff < self.backgroundFadeTime) {
                    fade = 1 - diff / (self.backgroundFadeTime);
                    fade *= self.game.backgroundDimRate;
                } else {
                    fade = 0;
                }
            }
            self.backgroundDim.alpha = fade;
        }

        this.render = function(timestamp) {
            var time = osu.audio.getPosition() * 1000 + self.offset;
            this.updateBackground(time);
            if (time !== 0) {
                self.updateHitObjects(time);
                this.scoreOverlay.update(time);
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
