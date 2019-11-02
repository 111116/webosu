
/*
Sound.js
===============

A complete micro library of useful, modular functions that help you load, play, control
and generate sound effects and music for games and interactive applications. All the
code targets the WebAudio API.
*/


/*
Fixing the WebAudio API
--------------------------

The WebAudio API is so new that it's API is not consistently implemented properly across
all modern browsers. Thankfully, Chris Wilson's Audio Context Monkey Patch script
normalizes the API for maximum compatibility.

https://github.com/cwilso/AudioContext-MonkeyPatch/blob/gh-pages/AudioContextMonkeyPatch.js

It's included here.
Thank you, Chris!

*/

(function (global, exports, perf) {
  'use strict';

  function fixSetTarget(param) {
    if (!param)	// if NYI, just return
      return;
    if (!param.setTargetAtTime)
      param.setTargetAtTime = param.setTargetValueAtTime;
  }

  if (window.hasOwnProperty('webkitAudioContext') &&
    !window.hasOwnProperty('AudioContext')) {
    window.AudioContext = webkitAudioContext;

    if (!AudioContext.prototype.hasOwnProperty('createGain'))
      AudioContext.prototype.createGain = AudioContext.prototype.createGainNode;
    if (!AudioContext.prototype.hasOwnProperty('createDelay'))
      AudioContext.prototype.createDelay = AudioContext.prototype.createDelayNode;
    if (!AudioContext.prototype.hasOwnProperty('createScriptProcessor'))
      AudioContext.prototype.createScriptProcessor = AudioContext.prototype.createJavaScriptNode;
    if (!AudioContext.prototype.hasOwnProperty('createPeriodicWave'))
      AudioContext.prototype.createPeriodicWave = AudioContext.prototype.createWaveTable;


    AudioContext.prototype.internal_createGain = AudioContext.prototype.createGain;
    AudioContext.prototype.createGain = function () {
      var node = this.internal_createGain();
      fixSetTarget(node.gain);
      return node;
    };

    AudioContext.prototype.internal_createDelay = AudioContext.prototype.createDelay;
    AudioContext.prototype.createDelay = function (maxDelayTime) {
      var node = maxDelayTime ? this.internal_createDelay(maxDelayTime) : this.internal_createDelay();
      fixSetTarget(node.delayTime);
      return node;
    };

    AudioContext.prototype.internal_createBufferSource = AudioContext.prototype.createBufferSource;
    AudioContext.prototype.createBufferSource = function () {
      var node = this.internal_createBufferSource();
      if (!node.start) {
        node.start = function (when, offset, duration) {
          if (offset || duration)
            this.noteGrainOn(when || 0, offset, duration);
          else
            this.noteOn(when || 0);
        };
      } else {
        node.internal_start = node.start;
        node.start = function (when, offset, duration) {
          if (typeof duration !== 'undefined')
            node.internal_start(when || 0, offset, duration);
          else
            node.internal_start(when || 0, offset || 0);
        };
      }
      if (!node.stop) {
        node.stop = function (when) {
          this.noteOff(when || 0);
        };
      } else {
        node.internal_stop = node.stop;
        node.stop = function (when) {
          node.internal_stop(when || 0);
        };
      }
      fixSetTarget(node.playbackRate);
      return node;
    };

    AudioContext.prototype.internal_createDynamicsCompressor = AudioContext.prototype.createDynamicsCompressor;
    AudioContext.prototype.createDynamicsCompressor = function () {
      var node = this.internal_createDynamicsCompressor();
      fixSetTarget(node.threshold);
      fixSetTarget(node.knee);
      fixSetTarget(node.ratio);
      fixSetTarget(node.reduction);
      fixSetTarget(node.attack);
      fixSetTarget(node.release);
      return node;
    };

    AudioContext.prototype.internal_createBiquadFilter = AudioContext.prototype.createBiquadFilter;
    AudioContext.prototype.createBiquadFilter = function () {
      var node = this.internal_createBiquadFilter();
      fixSetTarget(node.frequency);
      fixSetTarget(node.detune);
      fixSetTarget(node.Q);
      fixSetTarget(node.gain);
      return node;
    };

    if (AudioContext.prototype.hasOwnProperty('createOscillator')) {
      AudioContext.prototype.internal_createOscillator = AudioContext.prototype.createOscillator;
      AudioContext.prototype.createOscillator = function () {
        var node = this.internal_createOscillator();
        if (!node.start) {
          node.start = function (when) {
            this.noteOn(when || 0);
          };
        } else {
          node.internal_start = node.start;
          node.start = function (when) {
            node.internal_start(when || 0);
          };
        }
        if (!node.stop) {
          node.stop = function (when) {
            this.noteOff(when || 0);
          };
        } else {
          node.internal_stop = node.stop;
          node.stop = function (when) {
            node.internal_stop(when || 0);
          };
        }
        if (!node.setPeriodicWave)
          node.setPeriodicWave = node.setWaveTable;
        fixSetTarget(node.frequency);
        fixSetTarget(node.detune);
        return node;
      };
    }
  }

  if (window.hasOwnProperty('webkitOfflineAudioContext') &&
    !window.hasOwnProperty('OfflineAudioContext')) {
    window.OfflineAudioContext = webkitOfflineAudioContext;
  }

}(window));

// var exports = {};

/*
Define the audio context
------------------------

All this code uses a single `AudioContext` If you want to use any of these functions
independently of this file, make sure that have an `AudioContext` called `actx`.
*/
var actx = new AudioContext();
// exports.actx = actx;

/*
sounds
------

`sounds` is an object that you can use to store all your loaded sound fles.
It also has a helpful `load` method that manages asset loading. You can load sounds at
any time during the game by using the `sounds.load` method. You don't have to use
the `sounds` object or its `load` method, but it's a really convenient way to
work with sound file assets.

Here's how could use the `sound` object to load three sound files from a `sounds` folder and
call a `setup` method when all the files have finished loading:

    sounds.load([
      "sounds/shoot.wav",
      "sounds/music.wav",
      "sounds/bounce.mp3"
    ]);
    sounds.whenLoaded = setup;

You can now access these loaded sounds in your application code like this:

var shoot = sounds["sounds/shoot.wav"],
    music = sounds["sounds/music.wav"],
    bounce = sounds["sounds/bounce.mp3"];

*/

var sounds = {
  //Properties to help track the assets being loaded.
  toLoad: 0,
  loaded: 0,

  //File extensions for different types of sounds.
  audioExtensions: ["mp3", "ogg", "wav", "webm"],

  //The callback function that should run when all assets have loaded.
  //Assign this when you load the fonts, like this: `assets.whenLoaded = makeSprites;`.
  whenLoaded: undefined,

  //The callback function to run after each asset is loaded
  onProgress: undefined,

  //The callback function to run if an asset fails to load or decode
  onFailed: function (source, error) {
    throw new Error("Audio could not be loaded: " + source);
  },

  //The load method creates and loads all the assets. Use it like this:
  //`assets.load(["images/anyImage.png", "fonts/anyFont.otf"]);`.

  load: function (sources) {
    console.log("Loading sounds..");

    //Get a reference to this asset object so we can
    //refer to it in the `forEach` loop ahead.
    var self = this;

    //Find the number of files that need to be loaded.
    self.toLoad = sources.length;
    sources.forEach(function (source) {

      //Find the file extension of the asset.
      var extension = source.split('.').pop();

      //#### Sounds
      //Load audio files that have file extensions that match
      //the `audioExtensions` array.
      if (self.audioExtensions.indexOf(extension) !== -1) {

        //Create a sound sprite.
        var soundSprite = makeSound(source, self.loadHandler.bind(self), true, false, self.onFailed);

        //Get the sound file name.
        soundSprite.name = source;

        //If you just want to extract the file name with the
        //extension, you can do it like this:
        //soundSprite.name = source.split("/").pop();
        //Assign the sound as a property of the assets object so
        //we can access it like this: `assets["sounds/sound.mp3"]`.
        self[soundSprite.name] = soundSprite;
      }

      //Display a message if the file type isn't recognized.
      else {
        console.log("File type not recognized: " + source);
      }
    });
  },

  //#### loadHandler
  //The `loadHandler` will be called each time an asset finishes loading.
  loadHandler: function (source) {
    var self = this;
    self.loaded += 1;

    if (self.onProgress) {
      self.onProgress(100 * self.loaded / self.toLoad, { url: source });
    }

    //Check whether everything has loaded.
    if (self.toLoad === self.loaded) {

      //If it has, run the callback function that was assigned to the `whenLoaded` property
      console.log("Sounds finished loading");

      //Reset `loaded` and `toLoaded` so we can load more assets
      //later if we want to.
      self.toLoad = 0;
      self.loaded = 0;
      if (self.whenLoaded) {
        self.whenLoaded();
      }
    }
  }
};
// exports.sounds = sounds;

/*
makeSound
---------

`makeSound` is the function you want to use to load and play sound files.
It creates and returns and WebAudio sound object with lots of useful methods you can
use to control the sound.
You can use it to load a sound like this:

    var anySound = makeSound("sounds/anySound.mp3", loadHandler);


The code above will load the sound and then call the `loadHandler`
when the sound has finished loading.
(However, it's more convenient to load the sound file using
the `sounds.load` method described above, so I don't recommend loading sounds
like this unless you need more low-level control.)

After the sound has been loaded you can access and use it like this:

    function loadHandler() {
      anySound.loop = true;
      anySound.pan = 0.8;
      anySound.volume = 0.5;
      anySound.play();
      anySound.pause();
      anySound.playFrom(second);
      anySound.restart();
      anySound.setReverb(2, 2, false);
      anySound.setEcho(0.2, 0.2, 0);
      anySound.playbackRate = 0.5;
    }

For advanced configurations, you can optionally supply `makeSound` with optional 3rd and
4th arguments:

   var anySound = makeSound(source, loadHandler, loadTheSound?, xhrObject);

`loadTheSound?` is a Boolean (true/false) value that, if `false` prevents the sound file
from being loaded. You would only want to set it to `false` like this if you were
using another file loading library to load the sound, and didn't want it to be loaded
twice.

`xhrObject`, the optional 4th argument, is the XHR object that was used to load the sound. Again, you
would only supply this if you were using another file loading library to load the sound,
and that library had generated its own XHR object. If you supply the `xhr` argument, `makeSound`
will skip the file loading step (because you've already done that), but still decode the audio buffer for you.
(If you are loading the sound file using another file loading library, make sure that your sound
files are loaded with the XHR `responseType = "arraybuffer"` option.)

For example, here's how you could use this advanced configuration to decode a sound that you've already loaded
using your own custom loading system:

   var soundSprite = makeSound(source, decodeHandler.bind(this), false, xhr);

When the file has finished being decoded, your custom `decodeHandler` will run, which tells you
that the file has finished decoding.

If you're creating more than one sound like this, use counter variables to track the number of sounds
you need to decode, and the number of sounds that have been decoded. When both sets of counters are the
same, you'll know that all your sound files have finished decoding and you can proceed with the rest
of you application. (The [Hexi game engine](https://github.com/kittykatattack/hexi) uses `makeSound` in this way.)

*/

function makeSound(source, loadHandler, shouldLoadSound, xhr, failHandler) {

  //The sound object that this function returns.
  var o = {};

  //Set the default properties.
  o.volumeNode = actx.createGain();

  //Create the pan node using the efficient `createStereoPanner`
  //method, if it's available.
  if (!actx.createStereoPanner) {
    o.panNode = actx.createPanner();
  } else {
    o.panNode = actx.createStereoPanner();
  }
  o.delayNode = actx.createDelay();
  o.feedbackNode = actx.createGain();
  o.filterNode = actx.createBiquadFilter();
  o.convolverNode = actx.createConvolver();
  o.soundNode = null;
  o.buffer = null;
  o.source = source;
  o.loop = false;
  o.playing = false;

  //The function that should run when the sound is loaded.
  o.loadHandler = undefined;

  //Values for the `pan` and `volume` getters/setters.
  o.panValue = 0;
  o.volumeValue = 1;

  //Values to help track and set the start and pause times.
  o.startTime = 0;
  o.startOffset = 0;

  //Set the playback rate.
  o.playbackRate = 1;

  //Echo properties.
  o.echo = false;
  o.delayValue = 0.3;
  o.feebackValue = 0.3;
  o.filterValue = 0;

  //Reverb properties
  o.reverb = false;
  o.reverbImpulse = null;

  //The sound object's methods.
  o.play = function () {

    //Set the start time (it will be `0` when the sound
    //first starts.
    o.startTime = actx.currentTime;

    //Create a sound node.
    o.soundNode = actx.createBufferSource();

    //Set the sound node's buffer property to the loaded sound.
    o.soundNode.buffer = o.buffer;

    //Set the playback rate
    o.soundNode.playbackRate.value = this.playbackRate;

    //Connect the sound to the pan, connect the pan to the
    //volume, and connect the volume to the destination.
    o.soundNode.connect(o.volumeNode);

    //If there's no reverb, bypass the convolverNode
    if (o.reverb === false) {
      o.volumeNode.connect(o.panNode);
    }

    //If there is reverb, connect the `convolverNode` and apply
    //the impulse response
    else {
      o.volumeNode.connect(o.convolverNode);
      o.convolverNode.connect(o.panNode);
      o.convolverNode.buffer = o.reverbImpulse;
    }

    //Connect the `panNode` to the destination to complete the chain.
    o.panNode.connect(actx.destination);

    //Add optional echo.
    if (o.echo) {

      //Set the values.
      o.feedbackNode.gain.value = o.feebackValue;
      o.delayNode.delayTime.value = o.delayValue;
      o.filterNode.frequency.value = o.filterValue;

      //Create the delay loop, with optional filtering.
      o.delayNode.connect(o.feedbackNode);
      if (o.filterValue > 0) {
        o.feedbackNode.connect(o.filterNode);
        o.filterNode.connect(o.delayNode);
      } else {
        o.feedbackNode.connect(o.delayNode);
      }

      //Capture the sound from the main node chain, send it to the
      //delay loop, and send the final echo effect to the `panNode` which
      //will then route it to the destination.
      o.volumeNode.connect(o.delayNode);
      o.delayNode.connect(o.panNode);
    }

    //Will the sound loop? This can be `true` or `false`.
    o.soundNode.loop = o.loop;

    //Finally, use the `start` method to play the sound.
    //The start time will either be `0`,
    //or a later time if the sound was paused.
    o.soundNode.start(
      0, o.startOffset % o.buffer.duration
    );

    //Set `playing` to `true` to help control the
    //`pause` and `restart` methods.
    o.playing = true;
  };

  o.pause = function () {
    //Pause the sound if it's playing, and calculate the
    //`startOffset` to save the current position.
    if (o.playing) {
      o.soundNode.stop(0);
      o.startOffset += actx.currentTime - o.startTime;
      o.playing = false;
    }
  };

  o.getPosition = function() {
    return actx.currentTime - o.startTime + o.startOffset;
  };

  o.restart = function () {
    //Stop the sound if it's playing, reset the start and offset times,
    //then call the `play` method again.
    if (o.playing) {
      o.soundNode.stop(0);
    }
    o.startOffset = 0;
    o.play();
  };

  o.playFrom = function (value) {
    if (o.playing) {
      o.soundNode.stop(0);
    }
    o.startOffset = value;
    o.play();
  };

  o.setEcho = function (delayValue, feedbackValue, filterValue) {
    if (delayValue === undefined) delayValue = 0.3;
    if (feedbackValue === undefined) feedbackValue = 0.3;
    if (filterValue === undefined) filterValue = 0;
    o.delayValue = delayValue;
    o.feebackValue = feedbackValue;
    o.filterValue = filterValue;
    o.echo = true;
  };

  o.setReverb = function (duration, decay, reverse) {
    if (duration === undefined) duration = 2;
    if (decay === undefined) decay = 2;
    if (reverse === undefined) reverse = false;
    o.reverbImpulse = impulseResponse(duration, decay, reverse, actx);
    o.reverb = true;
  };

  //A general purpose `fade` method for fading sounds in or out.
  //The first argument is the volume that the sound should
  //fade to, and the second value is the duration, in seconds,
  //that the fade should last.
  o.fade = function (endValue, durationInSeconds) {
    if (o.playing) {
      o.volumeNode.gain.linearRampToValueAtTime(
        o.volumeNode.gain.value, actx.currentTime
      );
      o.volumeNode.gain.linearRampToValueAtTime(
        endValue, actx.currentTime + durationInSeconds
      );
    }
  };

  //Fade a sound in, from an initial volume level of zero.

  o.fadeIn = function(durationInSeconds) {

    //Set the volume to 0 so that you can fade
    //in from silence
    o.volumeNode.gain.value = 0;
    o.fade(1, durationInSeconds);

  };

  //Fade a sound out, from its current volume level to zero.
  o.fadeOut = function (durationInSeconds) {
    o.fade(0, durationInSeconds);
  };

  //Volume and pan getters/setters.
  Object.defineProperties(o, {
    volume: {
      get: function () {
        return o.volumeValue;
      },
      set: function (value) {
        o.volumeNode.gain.value = value;
        o.volumeValue = value;
      },
      enumerable: true, configurable: true
    },

    //The pan node uses the high-efficiency stereo panner, if it's
    //available. But, because this is a new addition to the
    //WebAudio spec, it might not be available on all browsers.
    //So the code checks for this and uses the older 3D panner
    //if 2D isn't available.
    pan: {
      get: function () {
        if (!actx.createStereoPanner) {
          return o.panValue;
        } else {
          return o.panNode.pan.value;
        }
      },
      set: function (value) {
        if (!actx.createStereoPanner) {
          //Panner objects accept x, y and z coordinates for 3D
          //sound. However, because we're only doing 2D left/right
          //panning we're only interested in the x coordinate,
          //the first one. However, for a natural effect, the z
          //value also has to be set proportionately.
          var x = value,
            y = 0,
            z = 1 - Math.abs(x);
          o.panNode.setPosition(x, y, z);
          o.panValue = value;
        } else {
          o.panNode.pan.value = value;
        }
      },
      enumerable: true, configurable: true
    }
  });

  //Optionally Load and decode the sound.
  if (shouldLoadSound) {
    loadSound(o, source, loadHandler, failHandler);
  }

  //Optionally, if you've loaded the sound using some other loader, just decode the sound
  if (xhr) {
    decodeAudio(o, xhr, loadHandler, failHandler);
  }

  //Return the sound object.
  return o;
}
// exports.makeSound = makeSound;

//The `loadSound` function loads the sound file using XHR
function loadSound(o, source, loadHandler, failHandler) {
  var xhr = new XMLHttpRequest();

  //Use xhr to load the sound file.
  xhr.open("GET", source, true);
  xhr.responseType = "arraybuffer";

  //When the sound has finished loading, decode it using the
  //`decodeAudio` function (which you'll see ahead)
  xhr.addEventListener("load", decodeAudio.bind(this, o, xhr, loadHandler, failHandler));

  //Send the request to load the file.
  xhr.send();
}
// exports.loadSound = loadSound;

//The `decodeAudio` function decodes the audio file for you and
//launches the `loadHandler` when it's done
function decodeAudio(o, xhr, loadHandler, failHandler) {

  //Decode the sound and store a reference to the buffer.
  actx.decodeAudioData(
    xhr.response,
    function (buffer) {
      o.buffer = buffer;
      o.hasLoaded = true;

      //This next bit is optional, but important.
      //If you have a load manager in your game, call it here so that
      //the sound is registered as having loaded.
      if (loadHandler) {
        loadHandler(o.source);
      }
    },
    function (error) {
      if (failHandler) failHandler(o.source, error);
    }
  );
}
// exports.decodeAudio = decodeAudio;

