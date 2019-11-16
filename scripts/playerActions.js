define([], function() {
    var TIME_ALLOWED = 200; // 200 ms
    var TIME_ALLOWED_100 = 140;
    var TIME_ALLOWED_300 = 80;
    // TODO: support OD
    var currentSlider = null;

    var checkHit = function checkHit(upcoming, click){
        var good = upcoming.find(inUpcoming(click));
        if (good){
            switch (good.type) {
                case "circle":
                    var points = 50;
                    var diff = click.time - good.time;
                    if (Math.abs(diff) < TIME_ALLOWED_100) points = 100;
                    if (Math.abs(diff) < TIME_ALLOWED_300) points = 300;
                    playback.hitSuccess(good, points);
                    break;
                case "slider":
                    var points = 50;
                    var diff = click.time - good.time;
                    if (Math.abs(diff) < TIME_ALLOWED_100) points = 100;
                    if (Math.abs(diff) < TIME_ALLOWED_300) points = 300;
                    playback.hitSuccess(good, points);
                    currentSlider = good;
                    break;
                case "spinner":
                    //self.updateSpinner(hit, time); // TODO
                    break;
            }
        }
    };

    var checkInSlider = function checkInSlider(click){
        var dx = click.x - currentSlider.ball.x;
        var dy = click.y - currentSlider.ball.y;
        var inSlider = dx*dx + dy*dy < 4 * playback.circleRadiusPixel * playback.circleRadiusPixel;
        if (!inSlider){
            currentSlider = null;
        }
    };

    var checkEndSlider = function checkEndSlider(click){
        // check if releasing slider
        if (click.time + 36 < currentSlider.time + currentSlider.sliderTimeTotal) {
            currentSlider = null;
        }
    };

    var inUpcoming = function (click){
        return function (hit){
            var dx = click.x - hit.basex;
            var dy = click.y - hit.basey;
            return ( 
                hit.score < 0
                && dx*dx + dy*dy < playback.circleRadiusPixel * playback.circleRadiusPixel 
                && Math.abs(click.time - hit.time) < TIME_ALLOWED);
            }
    }

    var playerActions = function(playback){
        
        playback.game.updatePlayerActions = function(time){
            if (playback.autoplay) {
                let good = playback.upcomingHits.find(function(hit){return hit.score < 0 && Math.abs(time - hit.time) < TIME_ALLOWED});
                if (good){
                    let diff = time - good.time;
                    if (diff > -8)
                        playback.hitSuccess(good, 300);
                }
            }
            else {
                if (currentSlider){
                    var clickInfos = {
                        'x': playback.game.mouseX,
                        'y': playback.game.mouseY,
                        'time': time
                    };
                    checkInSlider(clickInfos);
                }
            }
        };

        // set eventlisteners
        if (!playback.autoplay) {
            playback.game.window.addEventListener("mousemove", function(e) {
                    playback.game.mouseX = e.clientX;
                    playback.game.mouseY = e.clientY;
                    if (currentSlider){
                        var clickInfos = {
                            'x': e.clientX,
                            'y': e.clientY,
                            'time': playback.osu.audio.getPosition() * TIME_CONSTANT
                        };
                        checkInSlider(clickInfos);
                    }
            });
            playback.game.window.addEventListener("mousedown", function(e) {
                    e.preventDefault();
                    e.stopPropagation(); // we don't want the main rpgmaker canvas to receive mouse events
                    playback.game.score.nbClicks += 1;
                    var clickInfos = {
                        'x': e.clientX,
                        'y': e.clientY,
                        'time': playback.osu.audio.getPosition() * TIME_CONSTANT
                    };
                    checkHit(playback.upcomingHits, clickInfos);
            });
            var Zdown = false;
            var Xdown = false;
            playback.game.window.addEventListener("keydown", function(e) {
                if (e.keyCode == 90 || e.keyCode == 88) { // zx
                    if (e.keyCode == 90) {
                        if (Zdown) return;
                        Zdown = true;
                    }
                    if (e.keyCode == 88) {
                        if (Xdown) return;
                        Xdown = true;
                    }
                    e.preventDefault();
                    e.stopPropagation();
                    playback.game.score.nbClicks += 1;
                    var clickInfos = {
                        'x': playback.game.mouseX,
                        'y': playback.game.mouseY,
                        'time': playback.osu.audio.getPosition() * TIME_CONSTANT
                    };
                    checkHit(playback.upcomingHits, clickInfos);
                }
            });
            playback.game.window.addEventListener("keyup", function(e) {
                if (e.keyCode == 90 || e.keyCode == 88) { // zx
                    if (e.keyCode == 90) {
                        Zdown = false;
                    }
                    if (e.keyCode == 88) {
                        Xdown = false;
                    }
                    e.preventDefault();
                    e.stopPropagation();
                }
            });
            playback.game.window.addEventListener("dblclick", function(e) {
                e.preventDefault();
                e.stopPropagation(); // we don't want the main rpgmaker canvas to receive mouse events
                playback.game.score.nbClicks += 1;
                var clickInfos = {
                    'x': e.clientX,
                    'y': e.clientY,
                    'time': playback.osu.audio.getPosition() * TIME_CONSTANT
                };
                checkHit(playback.upcomingHits, clickInfos);
            });
            playback.game.window.addEventListener("mouseup", function(e) {
                e.preventDefault();
                e.stopPropagation();
                if (currentSlider){
                    var clickInfos = {
                        'x': e.clientX,
                        'y': e.clientY,
                        'time': playback.osu.audio.getPosition() * TIME_CONSTANT
                    };
                    checkEndSlider(clickInfos);
                    currentSlider = null;
                }
            });
        }
    }

    // https://tc39.github.io/ecma262/#sec-array.prototype.find
    if (!Array.prototype.find) {
        Object.defineProperty(Array.prototype, 'find', {
            value: function(predicate) {
                // 1. Let O be ? ToObject(this value).
                if (this == null) {
                    throw new TypeError('"this" is null or not defined');
                }

                var o = Object(this);

                // 2. Let len be ? ToLength(? Get(O, "length")).
                var len = o.length >>> 0;

                // 3. If IsCallable(predicate) is false, throw a TypeError exception.
                if (typeof predicate !== 'function') {
                    throw new TypeError('predicate must be a function');
                }

                // 4. If thisArg was supplied, let T be thisArg; else let T be undefined.
                var thisArg = arguments[1];

                // 5. Let k be 0.
                var k = 0;

                // 6. Repeat, while k < len
                while (k < len) {
                    // a. Let Pk be ! ToString(k).
                    // b. Let kValue be ? Get(O, Pk).
                    // c. Let testResult be ToBoolean(? Call(predicate, T, « kValue, k, O »)).
                    // d. If testResult is true, return kValue.
                    var kValue = o[k];
                    if (predicate.call(thisArg, kValue, k, o)) {
                        return kValue;
                    }
                    // e. Increase k by 1.
                    k++;
                }

                // 7. Return undefined.
                return undefined;
            },
            configurable: true,
            writable: true
        });
    }
    return playerActions;
});
