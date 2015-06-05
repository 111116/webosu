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

        // Render hit circles with this map's combo colors
        // http://www.playmycode.com/blog/2011/06/realtime-image-tinting-on-html5-canvas/
        function generateRGBKs(img) {
            var w = img.width;
            var h = img.height;
            var rgbks = [];

            var canvas = document.createElement("canvas");
            canvas.width = w;
            canvas.height = h;
            
            var ctx = canvas.getContext("2d");
            ctx.drawImage(img, 0, 0);
            
            var pixels = ctx.getImageData(0, 0, w, h).data;

            // 4 is used to ask for 3 images: red, green, blue and
            // black in that order.
            for (var rgbI = 0; rgbI < 4; rgbI++) {
                var canvas = document.createElement("canvas");
                canvas.width  = w;
                canvas.height = h;
                
                var ctx = canvas.getContext('2d');
                ctx.drawImage( img, 0, 0 );
                var to = ctx.getImageData( 0, 0, w, h );
                var toData = to.data;
                
                for (var i = 0, len = pixels.length; i < len; i += 4) {
                    toData[i  ] = (rgbI === 0) ? pixels[i  ] : 0;
                    toData[i+1] = (rgbI === 1) ? pixels[i+1] : 0;
                    toData[i+2] = (rgbI === 2) ? pixels[i+2] : 0;
                    toData[i+3] =                pixels[i+3]    ;
                }
                
                ctx.putImageData( to, 0, 0 );
                
                // image is _slightly_ faster then canvas for this, so convert
                var imgComp = new Image();
                imgComp.src = canvas.toDataURL();
                
                rgbks.push(imgComp);
            }

            return rgbks;
        }

        function generateTintImage(img, rgbks, red, green, blue) {
            var buff = document.createElement("canvas");
            buff.width  = img.width;
            buff.height = img.height;
            
            var ctx  = buff.getContext("2d");

            ctx.globalAlpha = 1;
            ctx.globalCompositeOperation = 'copy';
            ctx.drawImage( rgbks[3], 0, 0 );

            ctx.globalCompositeOperation = 'lighter';
            if (red > 0) {
                ctx.globalAlpha = red   / 255.0;
                ctx.drawImage(rgbks[0], 0, 0);
            }
            if (green > 0) {
                ctx.globalAlpha = green / 255.0;
                ctx.drawImage(rgbks[1], 0, 0);
            }
            if (blue > 0) {
                ctx.globalAlpha = blue  / 255.0;
                ctx.drawImage(rgbks[2], 0, 0);
            }

            var i = document.createElement('img');
            var u = buff.toDataURL(); // TODO: We could be using toBlob here
            i.src = u;
            return i;
        }
        
        var hitCircleImages = [];
        var baseRGBK = [
            generateRGBKs(Resources["hitcircle.png"]),
            generateRGBKs(Resources["hitcircleoverlay.png"]),
            generateRGBKs(Resources["approachcircle.png"])
        ];
        for (var i = 0; i < self.track.colors.length; i++) {
            var color = self.track.colors[i];
            var hitcircle = generateTintImage(Resources["hitcircle.png"], baseRGBK[0],
                +color[0], +color[1], +color[2]);
            var hitcircleoverlay = generateTintImage(Resources["hitcircleoverlay.png"], baseRGBK[1],
                +color[0], +color[1], +color[2]);
            var approachcircle = generateTintImage(Resources["approachcircle.png"], baseRGBK[2],
                +color[0], +color[1], +color[2]);
            hitCircleImages.push({
                hitcircle: hitcircle,
                hitcircleoverlay: hitcircleoverlay,
                approachcircle: approachcircle,
            });
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
            var combo = hit.combo % hitCircleImages.length;
            combo = 0;
            if (diff <= NOTE_APPEAR && diff > 0) {
                // Figure out alpha
                var alpha = diff / NOTE_APPEAR;
                alpha -= 0.5;
                alpha = -alpha;
                alpha += 0.5;
                gfx.drawImage(context, hitCircleImages[combo].hitcircle,
                    hit.x * gfx.width,
                    hit.y * gfx.height, 1, alpha);
                gfx.drawImage(context, hitCircleImages[combo].hitcircleoverlay,
                    hit.x * gfx.width,
                    hit.y * gfx.height, 1, alpha);
                // Draw approach ring
                (function() {
                    var scale = (diff / NOTE_APPEAR * 2) + 1;
                    var width = Resources["approachcircle.png"].width;
                    var height = Resources["approachcircle.png"].height;
                    gfx.drawImage(context, hitCircleImages[combo].approachcircle,
                        hit.x * gfx.width, hit.y * gfx.height,
                        scale, alpha);
                })();
                // Draw index
                if (hit.index <= 9) {
                    gfx.drawImage(context, Resources["default-" + hit.index + ".png"],
                        hit.x * gfx.width, hit.y * gfx.height, 1, alpha);
                }
            } else if (diff > NOTE_DISAPPEAR && diff < 0) {
                var alpha = diff / NOTE_DISAPPEAR;
                alpha -= 0.5;
                alpha = -alpha;
                alpha += 0.5;
                gfx.drawImage(context, hitCircleImages[combo].hitcircle,
                    hit.x * gfx.width, hit.y * gfx.height, 1, alpha);
                gfx.drawImage(context, hitCircleImages[combo].hitcircleoverlay,
                    hit.x * gfx.width, hit.y * gfx.height, 1, alpha);
                gfx.drawImage(context, hitCircleImages[combo].approachcircle,
                    hit.x * gfx.width, hit.y * gfx.height, 1, alpha);
                if (hit.index <= 9) {
                    gfx.drawImage(context, Resources["default-" + hit.index + ".png"],
                        hit.x * gfx.width, hit.y * gfx.height, 1, alpha);
                }
            }
        }

        this.renderHitObjects = function(time, context, game) {
            self.updateUpcoming(time);
            for (var i = self.upcomingHits.length - 1; i >= 0; i--) {
                var hit = self.upcomingHits[i];
                switch (hit.type) {
                    case "circle":
                        self.renderHitCircle(hit, time, context, game);
                        break;
                    case "slider":
                        //self.renderSlider(hit, time, context, game); // TODO
                        break;
                    case "spinner":
                        //self.renderSpinner(hit, time, context, game); // TODO
                        break;
                }
            }
            context.globalAlpha = 1;
        }

        this.renderBackground = function(time, context, game) {
            if (self.background !== null) {
                context.drawImage(self.background, 0, 0, game.canvas.width, game.canvas.height);
            }
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
            gfx.width = game.canvas.width;
            gfx.height = game.canvas.height;
            if (gfx.width > gfx.height) {
                gfx.width = gfx.height;
                gfx.xoffset = (game.canvas.width - gfx.width) / 2;
                gfx.yoffset = 128;
                gfx.height = gfx.height - 256;
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
