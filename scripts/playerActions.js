define([], function() {

    var checkClickdown = function checkClickdown(){
        var upcoming = playback.upcomingHits;
        var click = {
            x: playback.game.mouseX,
            y: playback.game.mouseY,
            time: playback.osu.audio.getPosition() * 1000
        };
        var hit = upcoming.find(inUpcoming(click));
        if (!hit && game.mouse) {
            // if not hit with traditional (lagged) cursor position,
            // try predicted position with more tolerance
            let res = game.mouse(new Date().getTime());
            res.time = click.time;
            hit = upcoming.find(inUpcoming_grace(res));
        }
        if (hit){
            if (hit.type == "circle" || hit.type == "slider") {
                let points = 50;
                let diff = click.time - hit.time;
                if (Math.abs(diff) < playback.GoodTime) points = 100;
                if (Math.abs(diff) < playback.GreatTime) points = 300;
                playback.hitSuccess(hit, points, click.time);
            }
        }
    };

    var inUpcoming = function (click){
        return function (hit){
            var dx = click.x - hit.x;
            var dy = click.y - hit.y;
            return ( 
                hit.score < 0
                && dx*dx + dy*dy < playback.circleRadius * playback.circleRadius
                && Math.abs(click.time - hit.time) < playback.MehTime);
            }
    }
    var inUpcoming_grace = function (predict){
        return function (hit){
            var dx = predict.x - hit.x;
            var dy = predict.y - hit.y;
            var r = predict.r + playback.circleRadius;
            let result = hit.score < 0
                && dx*dx + dy*dy < r * r
                && Math.abs(predict.time - hit.time) < playback.MehTime;
            if (result)
                console.log("grace hit");
            return result;
        }
    }

    var playerActions = function(playback){
        
        if (playback.autoplay) {
            playback.auto = {
                currentObject: null,
                curid: 0,
                lastx: playback.game.mouseX,
                lasty: playback.game.mouseY,
                lasttime: 0
            }
        }
        playback.game.updatePlayerActions = function(time){
            if (playback.autoplay) {
                const spinRadius = 60;
                let cur = playback.auto.currentObject;
                // auto move cursor
                if (playback.game.down && cur) { // already on an object
                    if (cur.type == "circle" || time > cur.endTime) {
                        // release cursor
                        playback.game.down = false;
                        playback.auto.currentObject = null;
                        playback.auto.lasttime = time;
                        playback.auto.lastx = playback.game.mouseX;
                        playback.auto.lasty = playback.game.mouseY;
                    }
                    else if (cur.type == "slider") { // follow slider ball
                        playback.game.mouseX = cur.ball.x || cur.x;
                        playback.game.mouseY = cur.ball.y || cur.y;
                    }
                    else { // spin
                        let currentAngle = Math.atan2(playback.game.mouseY - cur.y, playback.game.mouseX - cur.x);
                        currentAngle += 0.8;
                        playback.game.mouseY = cur.y + spinRadius * Math.sin(currentAngle);
                        playback.game.mouseX = cur.x + spinRadius * Math.cos(currentAngle);
                    }
                }
                // looking for next target
                cur = playback.auto.currentObject;
                while (playback.auto.curid < playback.hits.length && playback.hits[playback.auto.curid].time < time) {
                    if (playback.hits[playback.auto.curid].score < 0) {
                        playback.game.mouseX = playback.hits[playback.auto.curid].x;
                        playback.game.mouseY = playback.hits[playback.auto.curid].y;
                        if (playback.hits[playback.auto.curid].type == "spinner")
                            playback.game.mouseY -= spinRadius;
                        playback.game.down = true;
                        checkClickdown();
                    }
                    ++playback.auto.curid;
                }
                if (!cur && playback.auto.curid < playback.hits.length) {
                    cur = playback.hits[playback.auto.curid];
                    playback.auto.currentObject = cur;
                }
                if (!cur || cur.time > time + playback.approachTime) {
                    // no object to click, just rest
                    playback.auto.lasttime = time;
                    return;
                }
                if (!playback.game.down) {
                    // move toward the object
                    let targX = cur.x;
                    let targY = cur.y;
                    if (cur.type == "spinner")
                        targY -= spinRadius;
                    let t = (time - playback.auto.lasttime) / (cur.time - playback.auto.lasttime);
                    t = Math.max(0, Math.min(1, t));
                    t = 0.5-Math.sin((Math.pow(1-t,1.5)-0.5)*Math.PI)/2; // easing
                    playback.game.mouseX = t * targX + (1-t) * playback.auto.lastx;
                    playback.game.mouseY = t * targY + (1-t) * playback.auto.lasty;

                    let diff = time - cur.time;
                    if (diff > -8) {
                        // click the object
                        playback.game.down = true;
                        checkClickdown();
                    }
                }
            }
        };


        var movehistory = [{x:512/2, y:384/2, t: new Date().getTime()}];

        playback.game.mouse = function(t) {
            // realtime mouse position prediction algorithm
            let m = movehistory;
            let i = 0;
            while (i<m.length-1 && m[0].t-m[i].t<40 && t-m[i].t<100) i+=1;
            let velocity = i==0? {x:0, y:0}: {x: (m[0].x-m[i].x)/(m[0].t-m[i].t), y: (m[0].y-m[i].y)/(m[0].t - m[i].t)};
            let dt = Math.min(t - m[0].t + window.currentFrameInterval, 40);
            return {
                x: m[0].x + velocity.x * dt,
                y: m[0].y + velocity.y * dt,
                r: Math.hypot(velocity.x, velocity.y) * Math.max(t-m[0].t, window.currentFrameInterval)
            }
        }

        var mousemoveCallback = function(e) {
            playback.game.mouseX = (e.clientX - gfx.xoffset) / gfx.width * 512;
            playback.game.mouseY = (e.clientY - gfx.yoffset) / gfx.height * 384;
            movehistory.unshift({
                x: playback.game.mouseX,
                y: playback.game.mouseY,
                t: new Date().getTime()
            });
            if (movehistory.length>10) movehistory.pop();
        }
        var mousedownCallback = function(e) {
            mousemoveCallback(e);
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
            checkClickdown();
        }
        var mouseupCallback = function(e) {
            mousemoveCallback(e);
            if (e.button == 0) playback.game.M1down = false; else
            if (e.button == 2) playback.game.M2down = false; else
            return;
            e.preventDefault();
            e.stopPropagation();
            playback.game.down = playback.game.K1down || playback.game.K2down
                              || playback.game.M1down || playback.game.M2down;
        }
        var keydownCallback = function(e) {
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
            checkClickdown();
        }
        var keyupCallback = function(e) {
            if (e.keyCode == playback.game.K1keycode) playback.game.K1down = false; else
            if (e.keyCode == playback.game.K2keycode) playback.game.K2down = false; else
            return;
            e.preventDefault();
            e.stopPropagation();
            playback.game.down = playback.game.K1down || playback.game.K2down
                              || playback.game.M1down || playback.game.M2down;
        }

        // set eventlisteners
        if (!playback.autoplay) {
            playback.game.window.addEventListener("mousemove", mousemoveCallback);
            // mouse click handling for gameplay
            if (playback.game.allowMouseButton) {
                playback.game.window.addEventListener("mousedown", mousedownCallback);
                playback.game.window.addEventListener("mouseup", mouseupCallback);
            }
            // keyboard click handling for gameplay
            playback.game.window.addEventListener("keydown", keydownCallback);
            playback.game.window.addEventListener("keyup", keyupCallback);
        }

        playback.game.cleanupPlayerActions = function() {
            playback.game.window.removeEventListener("mousemove", mousemoveCallback);
            playback.game.window.removeEventListener("mousedown", mousedownCallback);
            playback.game.window.removeEventListener("mouseup", mouseupCallback);
            playback.game.window.removeEventListener("keydown", keydownCallback);
            playback.game.window.removeEventListener("keyup", keyupCallback);
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
