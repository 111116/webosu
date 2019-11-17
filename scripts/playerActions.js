define([], function() {
    // TODO: support OD
    var currentSlider = null;

    var checkHit = function checkHit(upcoming, click){
        var good = upcoming.find(inUpcoming(click));
        if (good){
            switch (good.type) {
                case "circle":
                    var points = 50;
                    var diff = click.time - good.time;
                    if (Math.abs(diff) < playback.GoodTime) points = 100;
                    if (Math.abs(diff) < playback.GreatTime) points = 300;
                    good.clickTime = click.time;
                    playback.hitSuccess(good, points);
                    break;
                case "slider":
                    var points = 50;
                    var diff = click.time - good.time;
                    if (Math.abs(diff) < playback.GoodTime) points = 100;
                    if (Math.abs(diff) < playback.GreatTime) points = 300;
                    good.clickTime = click.time;
                    playback.hitSuccess(good, points);
                    currentSlider = good;
                    break;
                case "spinner":
                    // spinners don't need to be clicked on
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

    var inUpcoming = function (click){
        return function (hit){
            var dx = click.x - hit.basex;
            var dy = click.y - hit.basey;
            return ( 
                hit.score < 0
                && dx*dx + dy*dy < playback.circleRadiusPixel * playback.circleRadiusPixel 
                && Math.abs(click.time - hit.time) < playback.MehTime);
            }
    }

    var playerActions = function(playback){
        
        playback.game.updatePlayerActions = function(time){
            if (playback.autoplay) {
                let good = playback.upcomingHits.find(function(hit){return hit.score < 0 && Math.abs(time - hit.time) < playback.MehTime});
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
            function clickInfos() {
                return {
                    'x': playback.game.mouseX,
                    'y': playback.game.mouseY,
                    'time': playback.osu.audio.getPosition() * TIME_CONSTANT
                };
            }
            playback.game.window.addEventListener("mousemove", function(e) {
                playback.game.mouseX = e.clientX;
                playback.game.mouseY = e.clientY;
                if (currentSlider){
                    checkInSlider(clickInfos());
                }
            });

            // mouse click handling for gameplay
            if (playback.game.allowMouseButton) {
                playback.game.window.addEventListener("mousedown", function(e) {
                    playback.game.mouseX = e.clientX;
                    playback.game.mouseY = e.clientY;
                    if (e.button == 0) {
                        if (playback.game.M1down) return;
                        playback.game.M1down = true;
                    }
                    else
                    if (e.button == 2) {
                        if (playback.game.M2down) return;
                        playback.game.M2down = true;
                    }
                    else
                    return;
                    e.preventDefault();
                    e.stopPropagation();
                    playback.game.down = playback.game.K1down || playback.game.K2down
                                      || playback.game.M1down || playback.game.M2down;
                    checkHit(playback.upcomingHits, clickInfos());
                });
                playback.game.window.addEventListener("mouseup", function(e) {
                    playback.game.mouseX = e.clientX;
                    playback.game.mouseY = e.clientY;
                    if (e.button == 0) playback.game.M1down = false; else
                    if (e.button == 2) playback.game.M2down = false; else
                    return;
                    e.preventDefault();
                    e.stopPropagation();
                    playback.game.down = playback.game.K1down || playback.game.K2down
                                      || playback.game.M1down || playback.game.M2down;
                });
            }

            // keyboard click handling for gameplay
            playback.game.window.addEventListener("keydown", function(e) {
                if (e.keyCode == playback.game.K1keycode) {
                    if (playback.game.K1down) return;
                    playback.game.K1down = true;
                }
                else
                if (e.keyCode == playback.game.K2keycode) {
                    if (playback.game.K2down) return;
                    playback.game.K2down = true;
                }
                else
                return;
                e.preventDefault();
                e.stopPropagation();
                playback.game.down = playback.game.K1down || playback.game.K2down
                                  || playback.game.M1down || playback.game.M2down;
                checkHit(playback.upcomingHits, clickInfos());
            });
            playback.game.window.addEventListener("keyup", function(e) {
                if (e.keyCode == playback.game.K1keycode) playback.game.K1down = false; else
                if (e.keyCode == playback.game.K2keycode) playback.game.K2down = false; else
                return;
                e.preventDefault();
                e.stopPropagation();
                playback.game.down = playback.game.K1down || playback.game.K2down
                                  || playback.game.M1down || playback.game.M2down;
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
