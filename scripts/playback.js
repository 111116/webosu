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
define(["osu", "hash", "playerActions", "SliderMesh", "score"],
function(Osu, Hash, setPlayerActions, SliderMesh, ScoreOverlay) {
    function clamp01(a) {
        return Math.min(1, Math.max(0, a));
    }
    function repeatclamp(a) {
        a%=2;
        return a>1? 2-a: a;
    }
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
        self.autoplay = game.autoplay;
        self.approachScale = 3;
        self.audioReady = false;
        var scoreCharWidth = 35;
        var scoreCharHeight = 45;

        self.osu.onready = function() {
            self.audioReady = true;
            self.start();
        }
        self.load = function() {
            self.osu.load_mp3();
        }

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
            console.log("gfx: ", gfx.xoffset, gfx.yoffset, gfx.width, gfx.height);
            // deal with difficulties
            self.circleRadius = (109 - 9 * track.difficulty.CircleSize)/2; // unit: osu! pixel
            self.circleRadiusPixel = self.circleRadius * gfx.width / 512;
            self.hitSpriteScale = self.circleRadiusPixel / 60;
        };
        self.calcSize();
        game.mouseX = game.window.innerWidth / 2;
        game.mouseY = game.window.innerHeight / 2;
        self.scoreOverlay = new ScoreOverlay({width: game.window.innerWidth, height: game.window.innerHeight}, track.difficulty.HPDrainRate);
        self.scoreOverlay.depth = 23333333333; // score overlay is at top of screen

        self.replaceHit = function(hit, zoom) {
            if (hit.destoryed)
                return;
            hit.basex = gfx.xoffset + hit.x * gfx.width;
            hit.basey = gfx.yoffset + hit.y * gfx.height;
            function place(o) {
                o.x = gfx.xoffset + hit.x * gfx.width;
                o.y = gfx.yoffset + hit.y * gfx.height;
                o.scale.x *= zoom;
                o.scale.y *= zoom;
                if (o.initialscale)
                    o.initialscale *= zoom;
            }
            for (let i=0; i<hit.judgements.length; ++i)
                hit.judgements[i].scale.set(0.85 * this.hitSpriteScale, 1 * this.hitSpriteScale);
            function placecircle(hit) {
                place(hit.base);
                place(hit.circle);
                place(hit.burst);
                place(hit.glow);
                place(hit.approach);
                for (let i=0; i<hit.numbers.length; ++i) {
                    place(hit.numbers[i]);
                }
            }
            switch (hit.type) {

                case "circle":
                    placecircle(hit);
                    break;

                case "slider":
                    placecircle(hit);
                    // this will place hitcircle of the slider to its start,
                    // but if the circle has started to move, it will be updated in render loop.
                    // so the position set here will be overwritten.

                    hit.ball.scale.x *= zoom;
                    hit.ball.scale.y *= zoom;
                    
                    hit.body.reTransform({
                        x: gfx.xoffset, y: gfx.yoffset,
                        width: gfx.width, height: gfx.height,
                        osuWidth: 512, osuHeight: 384,
                        windowWidth: game.window.innerWidth,
                        windowHeight: game.window.innerHeight
                    });

                    if (hit.repeat > 1) {
                        hit.reverse.scale.x *= zoom;
                        hit.reverse.scale.y *= zoom;
                        let endPoint = hit.curve.curve[hit.curve.curve.length-1];
                        hit.reverse.x = gfx.xoffset + endPoint.x * gfx.width;
                        hit.reverse.y = gfx.yoffset + endPoint.y * gfx.height;
                    }
                    if (hit.repeat > 2) {
                        hit.reverse_b.scale.x *= zoom;
                        hit.reverse_b.scale.y *= zoom;
                        let startPoint = hit.curve.curve[0];
                        hit.reverse_b.x = gfx.xoffset + startPoint.x * gfx.width;
                        hit.reverse_b.y = gfx.yoffset + startPoint.y * gfx.height;
                    }
                    for (let i=0; i<hit.ticks.length; ++i) {
                        hit.ticks[i].scale.x *= zoom;
                        hit.ticks[i].scale.y *= zoom;
                        let at = hit.curve.pointAt(repeatclamp((hit.ticks[i].time - hit.time) / hit.sliderTime));
                        hit.ticks[i].x = gfx.xoffset + at.x * gfx.width;
                        hit.ticks[i].y = gfx.yoffset + at.y * gfx.height;
                    }
                    break;
                case "spinner":
                    let t = hit.basescale;
                    hit.basescale = gfx.height / 1280;
                    for (let i=0; i<hit.objects.length; ++i) {
                        hit.objects[i].x = gfx.xoffset + hit.x * gfx.width;
                        hit.objects[i].y = gfx.yoffset + hit.y * gfx.height;
                        hit.objects[i].scale.x *= hit.basescale / t;
                        hit.objects[i].scale.y *= hit.basescale / t;
                    }
                    break;
            }
        }

        self.game.window.onresize = function() {
            window.app.renderer.resize(window.innerWidth, window.innerHeight);
            self.pause();
            let oldwidth = gfx.width;
            self.calcSize();
            self.scoreOverlay.resize({width: window.innerWidth, height: window.innerHeight});

            self.background.width = self.game.window.innerWidth;
            self.background.height = self.game.window.innerHeight;
           
            let zoom = gfx.width / oldwidth;
            for (let i=0; i<self.hits.length; ++i)
                self.replaceHit(self.hits[i], zoom);
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
        self.glowFadeOutTime = 350;
        self.glowMaxOpacity = 0.5;
        self.flashFadeInTime = 40;
        self.flashFadeOutTime = 120;
        self.flashMaxOpacity = 0.8;
        self.scoreFadeOutTime = 500;
        self.followZoomInTime = 100; // TODO related to AR
        self.followFadeOutTime = 100;
        self.ballFadeOutTime = 100;
        self.objectDespawnTime = 2000;
        self.backgroundFadeTime = 1500;
        self.spinnerAppearTime = 1500;
        self.spinnerZoomInTime = 300;
        self.spinnerFadeOutTime = 150;

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


        function judgementText(points) {
            switch (points) {
                case 0: return "miss";
                case 50: return "meh";
                case 100: return "good";
                case 300: return "great";
                default: throw "no such judgement";
            }
        }
        function judgementColor(points) {
            switch (points) {
                case 0: return 0xed1121;
                case 50: return 0xffcc22;
                case 100: return 0x88b300;
                case 300: return 0x66ccff;
                default: throw "no such judgement";
            }
        }

        this.createJudgement = function(x, y, depth, finalTime) {
            let judge = new PIXI.BitmapText('', {font: {name: 'Venera', size: 20}});
            judge.anchor.set(0.5);
            judge.scale.set(0.85 * this.hitSpriteScale, 1 * this.hitSpriteScale);
            judge.visible = false;
            judge.basex = x;
            judge.basey = y;
            judge.depth = depth;
            judge.points = -1;
            judge.finalTime = finalTime;
            return judge;
        }

        this.invokeJudgement = function(judge, points, time) {
            judge.visible = true;
            judge.points = points;
            judge.t0 = time;
            judge.text = judgementText(points);
            judge.tint = judgementColor(points);
            this.updateJudgement(judge, time);
        }

        this.updateJudgement = function(judge, time) // set transform of judgement text
        {
            if (judge.points < 0 && time >= judge.finalTime) // miss
            {
                this.scoreOverlay.hit(0, time);
                this.invokeJudgement(judge, 0, time);
                return;
            }
            if (!judge.visible) return;

            let t = time - judge.t0;

            if (judge.points == 0) // miss
            {
                if (t > 800) {
                    judge.visible = false;
                    return;
                }
                judge.alpha = (t<100)? t/100: (t<600)? 1: 1-(t-600)/200;
                judge.x = gfx.xoffset + gfx.width * judge.basex;
                judge.y = gfx.yoffset + gfx.height * judge.basey;
                judge.y += 100 * Math.pow(t/800, 5) * this.hitSpriteScale;
                judge.rotation = 0.7 * Math.pow(t/800, 5);
            }
            else // meh, good, great
            {
                if (t > 500) {
                    judge.visible = false;
                    return;
                }
                judge.alpha = (t<100)? t/100: 1-(t-100)/400;
                judge.x = gfx.xoffset + gfx.width * judge.basex;
                judge.y = gfx.yoffset + gfx.height * judge.basey;
                judge.letterSpacing = 70 *(Math.pow(t/1800-1,5)+1);
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
            self.backgroundDim.drawRect(0, 0, 233333, 233333); // make it infinite big
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
        this.createHitCircle = function(hit) {

            function newHitSprite(spritename, depth, scalemul = 1, anchorx = 0.5, anchory = 0.5) {
                let sprite = new PIXI.Sprite(Skin[spritename]);
                sprite.initialscale = self.hitSpriteScale * scalemul;
                sprite.scale.x = sprite.scale.y = sprite.initialscale;
                sprite.anchor.x = anchorx;
                sprite.anchor.y = anchory;
                sprite.x = gfx.xoffset + hit.x * gfx.width;
                sprite.y = gfx.yoffset + hit.y * gfx.height;
                sprite.depth = depth;
                sprite.alpha = 0;
                hit.objects.push(sprite);
                return sprite;
            }
            let index = hit.index + 1;
            let basedep = 4.9999 - 0.0001 * hit.hitIndex;

            hit.base = newHitSprite("disc.png", basedep, 0.5);
            hit.base.tint = combos[hit.combo % combos.length];
            hit.basex = hit.base.x;
            hit.basey = hit.base.y;

            hit.circle = newHitSprite("hitcircleoverlay.png", basedep, 0.5);
            hit.glow = newHitSprite("ring-glow.png", basedep+2, 0.46);
            hit.glow.tint = combos[hit.combo % combos.length];
            hit.glow.blendMode = PIXI.BLEND_MODES.ADD;
            hit.burst = newHitSprite("hitburst.png", 8.00005 + 0.0001 * hit.hitIndex);
            hit.burst.visible = false;

            hit.approach = newHitSprite("approachcircle.png", 8 + 0.0001 * hit.hitIndex);
            hit.approach.tint = combos[hit.combo % combos.length];

            hit.judgements.push(this.createJudgement(hit.x, hit.y, 4, hit.time + this.MehTime)); // TODO depth

            // create combo number
            hit.numbers = [];
            if (index <= 9) {
                hit.numbers.push(newHitSprite("score-"+index+".png", basedep, 0.4, 0.5, 0.47));
            } else if (index <= 99) {
                hit.numbers.push(newHitSprite("score-"+(index%10)+".png", basedep, 0.35, 0, 0.47));
                hit.numbers.push(newHitSprite("score-"+((index-(index%10))/10)+".png", basedep, 0.35, 1, 0.47));
            }
            // Note: combos > 99 hits are unsupported
        }

        this.createSlider = function(hit) {

            hit.lastrep = 0; // for current-repeat counting
            hit.nexttick = 0; // for tick hit counting
            hit.sliderTime = hit.timing.millisecondsPerBeat * (hit.pixelLength / track.difficulty.SliderMultiplier) / 100;
            hit.sliderTimeTotal = hit.sliderTime * hit.repeat;
            hit.endTime = hit.time + hit.sliderTimeTotal;

            // create slider body
            var body = hit.body = new SliderMesh(hit.curve.curve,
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

            function newSprite(spritename, x, y, scalemul = 1) {
                let sprite = new PIXI.Sprite(Skin[spritename]);
                sprite.scale.set(self.hitSpriteScale * scalemul);
                sprite.anchor.set(0.5);
                sprite.x = gfx.xoffset + x * gfx.width;
                sprite.y = gfx.yoffset + y * gfx.height;
                sprite.depth = 4.9999-0.0001*hit.hitIndex;
                sprite.alpha = 0;
                hit.objects.push(sprite);
                return sprite;
            }

            // add slider ticks
            hit.ticks = [];
            let tickDuration = hit.timing.trueMillisecondsPerBeat / this.track.difficulty.SliderTickRate;
            let nticks = Math.floor(hit.sliderTimeTotal / tickDuration) + 1;
            for (let i=0; i<nticks; ++i) {
                let t = hit.time + i * tickDuration;
                // Question: are ticks offset to the slider start or its timing point?
                let pos = repeatclamp(i * tickDuration / hit.sliderTime);
                if (pos < 0.001 || pos > 0.999) // omit tick at slider edge
                    continue;
                let at = hit.curve.pointAt(pos);
                hit.ticks.push(newSprite("sliderscorepoint.png", at.x, at.y));
                hit.ticks[hit.ticks.length-1].time = t;
            }

            // add reverse symbol
            if (hit.repeat > 1) {
                // curve points are of about-same distance, so these 2 points should be different
                let p = hit.curve.curve[hit.curve.curve.length-1];
                let p2 = hit.curve.curve[hit.curve.curve.length-2];
                hit.reverse = newSprite("reversearrow.png", p.x, p.y);
                hit.reverse.rotation = Math.atan2(p2.y - p.y, p2.x - p.x);
            }
            if (hit.repeat > 2) {
                // curve points are of about-same distance, so these 2 points should be different
                let p = hit.curve.curve[0];
                let p2 = hit.curve.curve[1];
                hit.reverse_b = newSprite("reversearrow.png", p.x, p.y);
                hit.reverse_b.rotation = Math.atan2(p2.y - p.y, p2.x - p.x);
                hit.reverse_b.visible = false; // Only visible when it's the next end to hit
            }

            // Add follow circle (above slider body)
            hit.follow = newSprite("sliderfollowcircle.png", hit.x, hit.y);
            hit.follow.visible = false;
            hit.follow.blendMode = PIXI.BLEND_MODES.ADD;
            hit.followSize = 1; // [1,2] current follow circle size relative to hitcircle

            // Add slider ball (above follow circle)
            hit.ball = newSprite("sliderb.png", hit.x, hit.y);
            hit.ball.visible = false;

            // A slider contains a complete hit circle at its start, so we just make use of this
            self.createHitCircle(hit);

            // add judgement objects at edge
            let endPoint = hit.curve.curve[hit.curve.curve.length-1];
            for (let i=1; i<=hit.repeat; ++i) {
                let x = (i%2==1)? endPoint.x: hit.x;
                let y = (i%2==1)? endPoint.y: hit.y;
                hit.judgements.push(this.createJudgement(x, y, 4, hit.time + i * hit.sliderTime));
            }
        }

        this.createSpinner = function(hit) {
            hit.x = 0.5;
            hit.y = 0.5;
            // absolute position
            hit.basex = gfx.xoffset + hit.x * gfx.width;
            hit.basey = gfx.yoffset + hit.y * gfx.height;
            hit.rotation = 0;
            hit.rotationProgress = 0;
            hit.clicked = false;
            hit.basescale = gfx.height / 1280;
            let OD = track.difficulty.OverallDifficulty;
            let spinRequiredPerSec = OD<5? 3+0.4*OD: 2.5+0.5*OD;
            spinRequiredPerSec *= 0.8; // make it easier
            hit.rotationRequired = 2 * Math.PI * spinRequiredPerSec * (hit.endTime - hit.time)/1000;

            function newsprite(spritename, scalemul) {
                var sprite = new PIXI.Sprite(Skin[spritename]);
                sprite.scale.x = sprite.scale.y = hit.basescale * scalemul;
                sprite.anchor.x = sprite.anchor.y = 0.5;
                sprite.x = hit.basex;
                sprite.y = hit.basey;
                sprite.depth = 4.9999 - 0.0001 * (hit.hitIndex || 1);
                sprite.alpha = 0;
                hit.objects.push(sprite);
                return sprite;
            }
            hit.base = newsprite("spinnerbase.png", 2);
            hit.progress = newsprite("spinnerprogress.png", 2);
            hit.top = newsprite("spinnertop.png");

            hit.judgements.push(this.createJudgement(hit.x, hit.y, 5, hit.endTime + 233)); // TODO depth
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
        this.wait = Math.max(0, 1500-this.hits[0].time);

        // hit result handling
        // use separate timing for hitsounds, since volume may change inside a slider or spinner
        // note: time is expected time of object hit, not real time
        this.curtimingid = 0;
        this.playTicksound = function playTicksound(hit, time) {
            while (this.curtimingid+1 < this.track.timingPoints.length && this.track.timingPoints[this.curtimingid+1].offset <= time)
                this.curtimingid++;
            while (this.curtimingid>0 && this.track.timingPoints[this.curtimingid].offset > time)
                this.curtimingid--;
            let timing = this.track.timingPoints[this.curtimingid];
            let volume = self.game.masterVolume * self.game.effectVolume * (hit.hitSample.volume || timing.volume) / 100;
            let defaultSet = timing.sampleSet || self.game.sampleSet;
            self.game.sample[defaultSet].slidertick.volume = volume;
            self.game.sample[defaultSet].slidertick.play();
        };
        this.playHitsound = function playHitsound(hit, id, time) {
            while (this.curtimingid+1 < this.track.timingPoints.length && this.track.timingPoints[this.curtimingid+1].offset <= time)
                this.curtimingid++;
            while (this.curtimingid>0 && this.track.timingPoints[this.curtimingid].offset > time)
                this.curtimingid--;
            let timing = this.track.timingPoints[this.curtimingid];
            let volume = self.game.masterVolume * self.game.effectVolume * (hit.hitSample.volume || timing.volume) / 100;
            let defaultSet = timing.sampleSet || self.game.sampleSet;
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
            if (hit.type == 'circle' || hit.type == 'spinner') {
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
            if (points > 0) {
                if (hit.type == "spinner")
                    self.playHitsound(hit, 0, hit.endTime); // hit happen at end of spinner
                else
                    self.playHitsound(hit, 0, hit.time);
            }
            hit.score = points;
            hit.clickTime = time;
            self.invokeJudgement(hit.judgements[0], points, time);
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
                    hit.destoryed = true;
                }
            }
        }

        this.updateHitCircle = function(hit, time) {
            let diff = hit.time - time; // milliseconds before time of circle
            // calculate opacity of circle
            let noteFullAppear = this.approachTime - this.objectFadeInTime; // duration of opaque hit circle when approaching
            let approachFullAppear = this.approachTime - this.approachFadeInTime; // duration of opaque approach circle when approaching

            function setcircleAlpha(alpha) {
                hit.base.alpha = alpha;
                hit.circle.alpha = alpha;
                for (let i=0; i<hit.numbers.length; ++i)
                    hit.numbers[i].alpha = alpha;
                hit.glow.alpha = alpha * self.glowMaxOpacity;
            }

            if (diff <= this.approachTime && diff > noteFullAppear) { // fading in
                let alpha = (this.approachTime - diff) / this.objectFadeInTime;
                setcircleAlpha(alpha);
            }
            else if (hit.score > 0) { // clicked
                hit.burst.visible = true;
                let timeAfter = time - hit.clickTime;
                let t = timeAfter / this.glowFadeOutTime;
                let newscale = 1 + 0.5 * t * (2-t);
                hit.burst.scale.set(newscale * hit.burst.initialscale);
                hit.glow.scale.set(newscale * hit.glow.initialscale);
                hit.burst.alpha = this.flashMaxOpacity * clamp01((timeAfter < this.flashFadeInTime)? (timeAfter / this.flashFadeInTime): (1 - (timeAfter - this.flashFadeInTime) / this.flashFadeOutTime));
                hit.glow.alpha = clamp01(1 - timeAfter / this.glowFadeOutTime) * this.glowMaxOpacity;
                
                if (hit.base.visible) {
                    if (timeAfter < this.flashFadeInTime) {
                        hit.base.scale.set(newscale * hit.base.initialscale);
                        hit.circle.scale.set(newscale * hit.circle.initialscale);
                        for (let i=0; i<hit.numbers.length; ++i)
                            hit.numbers[i].scale.set(newscale * hit.numbers[i].initialscale);
                    }
                    else {
                        // hide circle
                        hit.base.visible = false;
                        hit.circle.visible = false;
                        for (let i=0; i<hit.numbers.length; ++i)
                            hit.numbers[i].visible = false;
                        hit.approach.visible = false;
                    }
                }
            }
            else if (diff <= noteFullAppear && -diff <= this.MehTime) { // before click
                setcircleAlpha(1);
            }
            else if (-diff > this.MehTime) { // missed
                hit.score = 0;
                let timeAfter = time - hit.time - this.MehTime;
                let alpha = this.fadeOutEasing(timeAfter / this.circleFadeOutTime);
                setcircleAlpha(alpha);
                hit.approach.alpha = alpha;
            }

            // update approach circle
            if (diff <= this.approachTime && diff > 0) { // approaching
                let scalemul = diff / this.approachTime * this.approachScale + 1;
                hit.approach.scale.set(0.5 * this.hitSpriteScale * scalemul);
            } else {
                hit.approach.scale.set(0.5 * this.hitSpriteScale);
            }
            if (diff <= this.approachTime && diff > approachFullAppear) { // approach circle fading in
                hit.approach.alpha = (this.approachTime - diff) / this.approachFadeInTime;
            }
            else if (diff <= approachFullAppear && hit.score<0) { // approach circle opaque, just shrinking
                hit.approach.alpha = 1;
            }

            this.updateJudgement(hit.judgements[0], time);
        }

        this.updateSlider = function(hit, time) {
            // just make use of the duplicate part
            this.updateHitCircle(hit, time);

            let noteFullAppear = this.approachTime - this.objectFadeInTime; // duration of opaque hit circle when approaching

            // set opacity of slider body
            function setbodyAlpha(alpha) {
                hit.body.alpha = alpha;
                if (hit.reverse)
                    hit.reverse.alpha = alpha;
                if (hit.reverse_b)
                    hit.reverse_b.alpha = alpha;
                for (let i=0; i<hit.ticks.length; ++i)
                    hit.ticks[i].alpha = alpha;
            }
            let diff = hit.time - time; // milliseconds before hit.time
            if (diff <= this.approachTime && diff > noteFullAppear) {
                // Fade in (before hit)
                setbodyAlpha((this.approachTime - diff) / this.objectFadeInTime);
            } else if (diff <= noteFullAppear && diff > -hit.sliderTimeTotal) {
                // approaching or During slide
                setbodyAlpha(1);
            } else if (-diff > 0 && -diff < this.sliderFadeOutTime + hit.sliderTimeTotal) {
                // Fade out (after slide)
                setbodyAlpha(this.fadeOutEasing((-diff - hit.sliderTimeTotal) / this.sliderFadeOutTime));
            }

            // set position of slider ball & follow circle
            // approach circle & hit circle moves along fading

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
                // check for slider edge hit
                let atEnd = false;
                if (Math.floor(t) > hit.lastrep)
                {
                    hit.lastrep = Math.floor(t);
                    if (hit.lastrep > 0 && hit.lastrep <= hit.repeat)
                        atEnd = true;
                }
                // clamp t
                t = repeatclamp(Math.min(t, hit.repeat));

                // Update ball and follow circle position
                let at = hit.curve.pointAt(t);
                let atx = at.x * gfx.width + gfx.xoffset;
                let aty = at.y * gfx.height + gfx.yoffset;

                hit.follow.x = atx;
                hit.follow.y = aty;
                hit.ball.x = atx;
                hit.ball.y = aty;

                if (hit.base.visible && hit.score<=0) {
                    hit.base.x = atx;
                    hit.base.y = aty;
                    hit.circle.x = atx;
                    hit.circle.y = aty;
                    for (let i=0; i<hit.numbers.length; ++i) {
                        hit.numbers[i].x = atx;
                        hit.numbers[i].y = aty;
                    }
                    hit.glow.x = atx;
                    hit.glow.y = aty;
                    hit.burst.x = atx;
                    hit.burst.y = aty;
                    hit.approach.x = atx;
                    hit.approach.y = aty;
                }

                let dx = game.mouseX - atx;
                let dy = game.mouseY - aty;
                let followPixelSize = hit.followSize * this.circleRadiusPixel;
                let isfollowing = dx*dx + dy*dy <= followPixelSize * followPixelSize;
                let activated = this.game.down && isfollowing || hit.followSize > 1.01;


                // slider tick judgement
                if (hit.nexttick < hit.ticks.length && time >= hit.ticks[hit.nexttick].time && activated) {
                    // TODO this.scoreOverlay.hit tick
                    hit.ticks[hit.nexttick].visible = false;
                    self.playTicksound(hit, hit.ticks[hit.nexttick].time);
                    hit.nexttick++;
                }

                // slider edge judgement
                // Note: being tolerant if follow circle hasn't shrinked to minimum
                if (atEnd && activated) {
                    self.invokeJudgement(hit.judgements[hit.lastrep], 300, time);
                    self.playHitsound(hit, hit.lastrep, hit.time + hit.lastrep * hit.sliderTime);
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
                        let delta = mouseAngle - hit.lastAngle;
                        if (delta > Math.PI) delta -= Math.PI * 2;
                        if (delta < -Math.PI) delta += Math.PI * 2;
                        hit.rotation += delta;
                        hit.rotationProgress += Math.abs(delta);
                    }
                    hit.lastAngle = mouseAngle;
                }
                else {
                    hit.clicked = false;
                }
            }

            // calculate opacity of spinner
            let alpha = 0;
            if (time >= hit.time - self.spinnerZoomInTime - self.spinnerAppearTime)
            {
                if (time <= hit.endTime)
                    alpha = 1;
                else
                    alpha = clamp01(1 - (time - hit.endTime) / self.spinnerFadeOutTime);
            }
            hit.top.alpha = alpha;
            hit.progress.alpha = alpha;
            hit.base.alpha = alpha;

            // calculate scales of components
            if (time < hit.endTime) {
                // top zoom in first
                hit.top.scale.set(hit.basescale * clamp01((time - (hit.time - self.spinnerZoomInTime - self.spinnerAppearTime)) / self.spinnerZoomInTime));
                hit.base.scale.set(2 * hit.basescale * clamp01((time - (hit.time - self.spinnerZoomInTime)) / self.spinnerZoomInTime));
            }
            if (time < hit.time) {
                let t = (hit.time - time) / (self.spinnerZoomInTime + self.spinnerAppearTime);
                if (t <= 1)
                    hit.top.rotation = -t*t*10;
            }
            let progress = hit.rotationProgress / hit.rotationRequired;
            hit.progress.scale.set(2 * hit.basescale * clamp01(progress));
            if (time > hit.time) {
                hit.base.rotation = hit.rotation / 2;
                hit.top.rotation = hit.rotation / 2;
            }

            if (time >= hit.endTime) {
                if (hit.score < 0) {
                    let points = 0;
                    if (progress >= 1) points = 300; else
                    if (progress >= 0.9) points = 100; else
                    if (progress >= 0.75) points = 50;
                    this.hitSuccess(hit, points, hit.endTime);
                }
            }
            this.updateJudgement(hit.judgements[0], time);
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
            let fade = self.game.backgroundDimRate;
            if (time < -self.wait)
                fade *= Math.max(0, 1 - (-self.wait - time) / self.backgroundFadeTime);
            self.backgroundDim.alpha = fade;
        }

        this.render = function(timestamp) {
            var time;
            if (this.audioReady) {
                time = osu.audio.getPosition() * 1000 + self.offset;
            }
            if (typeof time !== 'undefined') {
                this.updateBackground(time);
                self.updateHitObjects(time);
                this.scoreOverlay.update(time);
                self.game.updatePlayerActions(time);
                if (self.osu.audio.playing && false) { // TODO: Better way of updating this
                    Hash.timestamp(Math.floor(time));
                }
            }
            else {
                this.updateBackground(-100000);
            }
        }

        this.teardown = function() {
            // TODO
        }

        this.start = function() {
            console.log("start playback")
            self.started = true;
            self.osu.audio.gain.gain.value = self.game.musicVolume * self.game.masterVolume;
            if (!self.ready) {
                return;
            }
            self.osu.audio.play(self.offset, self.backgroundFadeTime + self.wait);
        };

    }
    
    return Playback;
});
