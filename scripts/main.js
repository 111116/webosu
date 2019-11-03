require(["scenes/need-files", "resources", "pixi", "sound"], function(NeedFiles, Resources, PIXI, sound) {
    // Global constants
    window.TIME_CONSTANT = 1000;
    window.TIME_ALLOWED = 0.2 * TIME_CONSTANT;
    window.NOTE_APPEAR = 0.5 * TIME_CONSTANT;
    window.NOTE_FULL_APPEAR = 0.4 * TIME_CONSTANT;
    window.NOTE_DISAPPEAR = -0.2 * TIME_CONSTANT;
    window.NOTE_DESPAWN = -2 * TIME_CONSTANT;
    window.SLIDER_LINEAR = "L";
    window.SLIDER_CATMULL = "C";
    window.SLIDER_BEZIER = "B";
    window.SLIDER_PASSTHROUGH = "P";
    sounds.load(['skin/normal-hitnormal.wav']);
    sounds.whenLoaded = function(){ window.SOUND_HIT = sounds['skin/normal-hitnormal.wav']; }
    window.osuTextures = {
      'hit0': PIXI.Texture.fromImage('skin/hit0.png'),
      'hit50': PIXI.Texture.fromImage('skin/hit50.png'),
      'hit100': PIXI.Texture.fromImage('skin/hit100.png'),
      'hit300': PIXI.Texture.fromImage('skin/hit300.png'),
      'score0': PIXI.Texture.fromImage('skin/score-0.png'),
      'score1': PIXI.Texture.fromImage('skin/score-1.png'),
      'score2': PIXI.Texture.fromImage('skin/score-2.png'),
      'score3': PIXI.Texture.fromImage('skin/score-3.png'),
      'score4': PIXI.Texture.fromImage('skin/score-4.png'),
      'score5': PIXI.Texture.fromImage('skin/score-5.png'),
      'score6': PIXI.Texture.fromImage('skin/score-6.png'),
      'score7': PIXI.Texture.fromImage('skin/score-7.png'),
      'score8': PIXI.Texture.fromImage('skin/score-8.png'),
      'score9': PIXI.Texture.fromImage('skin/score-9.png')
    };

    window.AudioContext = window.AudioContext || window.webkitAudioContext;

    PIXI.Sprite.prototype.bringToFront = function() {
        if (this.parent) {
            var parent = this.parent;
            parent.removeChild(this);
            parent.addChild(this);
        }
    }

    var canvas = document.querySelector("canvas");

    var game = {
        canvas: canvas,
        renderer: null,
        stage: null,
        scene: null,
        mouseX: 0,
        mouseY: 0,
        lastFrameTime: -1,
        finished : false,
        score: {
          nbClicks: 0,
          goodClicks: 0,
          points: 0
        }
    };
    window.game = game;

    window.addEventListener("keydown", function(e) {
        if (e.keyCode === 70 || e.keyCode === 68 // fd
            || e.keyCode === 90 || e.keyCode === 88 // zx
            ) {
        }
    });
    window.addEventListener("keyup", function(e) {
        if (e.keyCode === 70 || e.keyCode === 68 // fd
            || e.keyCode === 90 || e.keyCode === 88 // zx
            ) {
        }
    });
    canvas.addEventListener("mousemove", function(e) {
        game.mouseX = e.clientX;
        game.mouseY = e.clientY;
    });
    canvas.addEventListener("mousedown", function(e) {
        e.preventDefault();
    });
    canvas.addEventListener("mouseup", function(e) {
    });
    document.addEventListener("contextmenu", function(e) {
        e.preventDefault();
        return false;
    });

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    game.renderer = PIXI.autoDetectRenderer(canvas.width, canvas.height,
        { view: canvas, backgroundColor: 0xFFFFFF });
    game.stage = new PIXI.Container();

    game.cursor = null;

    var statusText = new PIXI.Text("Loading...", { font: "24px sans-serif" });
    statusText.anchor.x = statusText.anchor.y = 0.5;
    statusText.x = game.canvas.width / 2;
    statusText.y = game.canvas.height / 2;
    game.stage.addChild(statusText);

    var wipText = new PIXI.Text("WORK IN PROGRESS", { font: "24px sans-serif", fill: 0xFF0000 });
    wipText.anchor.x = 0.5;
    wipText.x = game.canvas.width / 2;
    wipText.y = 0;
    game.stage.addChild(wipText);

    Resources.oncomplete = function() {
        game.cursor = new PIXI.Sprite(Resources["cursor.png"]);
        game.cursor.anchor.x = game.cursor.anchor.y = 0.5;
        game.stage.addChild(game.cursor);
        game.stage.removeChild(statusText);
        game.scene = new NeedFiles(game);
    };
    Resources.loadDefault();

    function gameLoop(timestamp) {
        var timediff = timestamp - game.lastFrameTime;

        if (game.cursor) {
            // Handle cursor
            game.cursor.x = game.mouseX;
            game.cursor.y = game.mouseY;
            game.cursor.scale.x = game.cursor.scale.y = 1.3;
            game.cursor.bringToFront();
        }

        if (game.scene) {
            game.scene.render(timestamp);
        }

        wipText.bringToFront();
        game.renderer.render(game.stage);
        game.lastFrameTime = timestamp;

        window.requestAnimationFrame(gameLoop);
    }

    window.requestAnimationFrame(gameLoop);
});
