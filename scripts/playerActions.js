define([], function() {
  var TIME_ALLOWED = 200; // 0.2s
  var POSITION_ALLOWED = 60; //60px = circle radius
  var currentSlider = null;

  var checkHit = function checkHit(upcoming, click){
    var good = upcoming.find(inUpcoming(click));
    if (good){
      switch (good.type) {
        case "circle":
          var points = 50;
          var diff = click.time - good.time;
          if (diff < 100) points = 100;
          playback.hitSuccess(good, points);
          break;
        case "slider":
          currentSlider = good;
          break;
        case "spinner":
          //self.updateSpinner(hit, time); // TODO
          break;
      }
    }
  };

  var checkInSlider = function checkInSlider(click){
    // var inSlider = true;
    var inSlider = Math.abs(click.x - currentSlider.ball.x) < 2 * POSITION_ALLOWED 
                && Math.abs(click.y - currentSlider.ball.y) < 2 * POSITION_ALLOWED ;
    if (!inSlider){
      currentSlider = null;
    }
  };

  var checkEndSlider = function checkEndSlider(click){
    if (Math.abs(click.time - currentSlider.time - currentSlider.sliderTimeTotal) < TIME_ALLOWED){
      var points = 300;
      playback.hitSuccess(currentSlider, points);
    }
  };

  var inUpcoming = function (click){
    return function (hit){
      return ( 
        hit.score < 0 
        && Math.abs(click.x - hit.basex) < POSITION_ALLOWED 
        && Math.abs(click.y - hit.basey) < POSITION_ALLOWED 
        && Math.abs(click.time - hit.time) < TIME_ALLOWED);
      }
  }

  var playerActions = function(playback){
    playback.game.canvas.addEventListener("mousemove", function(e) {
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
    playback.game.canvas.addEventListener("mousedown", function(e) {
        e.preventDefault();
        e.stopPropagation(); // we don't want the main rpgmaker canvas to receive mouse events
        playback.game.cursorScale = 151;
        playback.game.score.nbClicks += 1;
        var clickInfos = {
          'x': e.clientX,
          'y': e.clientY,
          'time': playback.osu.audio.getPosition() * TIME_CONSTANT
        };
        checkHit(playback.upcomingHits, clickInfos);
    });
    playback.game.canvas.addEventListener("dblclick", function(e) {
        e.preventDefault();
        e.stopPropagation(); // we don't want the main rpgmaker canvas to receive mouse events
        playback.game.cursorScale = 151;
        playback.game.score.nbClicks += 1;
        var clickInfos = {
          'x': e.clientX,
          'y': e.clientY,
          'time': playback.osu.audio.getPosition() * TIME_CONSTANT
        };
        checkHit(playback.upcomingHits, clickInfos);
    });
    playback.game.canvas.addEventListener("mouseup", function(e) {
        e.preventDefault();
        e.stopPropagation();
        playback.game.cursorScale = 150;
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
