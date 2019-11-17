require(["scenes/need-files", "skin", "sound"], function(NeedFiles, Skin, sound) {
    
    let app = new PIXI.Application({
        width: window.innerWidth,
        height: window.innerHeight,
        resolution: window.devicePixelRatio || 1,
        autoResize: true,
    });
	document.body.removeChild(document.getElementById("title"));
    document.body.appendChild(app.view);
    
    app.renderer.autoResize = true;
    app.renderer.backgroundColor = 0xFFFFFF;

    // Global constants
    window.TIME_CONSTANT = 1000; // milliseconds per second
    window.SLIDER_LINEAR = "L";
    window.SLIDER_CATMULL = "C";
    window.SLIDER_BEZIER = "B";
    window.SLIDER_PERFECT_CURVE = "P";
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

    var game = {
        window: window,
        stage: null,
        scene: null,
        updatePlayerActions: null,

        allowMouseButton: true,
        allowMouseScroll: true,

        // cursor info
        mouseX: 0, // in absolute pixel
        mouseY: 0,
        K1down: false,
        K2down: false,
        K1keycode: 90,
        K2keycode: 88,
        M1down: false,
        M2down: false,
        down: false,

        lastFrameTime: -1,
        finished : false,
        score: {
          nbClicks: 0,
          goodClicks: 0,
          points: 0
        },
        sample: [{}, {}, {}, {}],
        sampleSet: 1
    };
    window.game = game;

    window.addEventListener("mousemove", function(e) {
        game.mouseX = e.clientX;
        game.mouseY = e.clientY;
    });
    
    document.addEventListener("contextmenu", function(e) {
        e.preventDefault();
        return false;
    });

    game.stage = new PIXI.Container();

    game.cursor = null;

    var statusText = new PIXI.Text("Loading skin...", { font: "24px sans-serif" });
    statusText.anchor.x = statusText.anchor.y = 0.5;
    statusText.x = window.innerWidth / 2;
    statusText.y = window.innerHeight / 2;
    game.stage.addChild(statusText);

    var wipText = new PIXI.Text("WORK IN PROGRESS", { font: "24px sans-serif", fill: 0xFF0000 });
    wipText.anchor.x = 0.5;
    wipText.x = window.innerWidth / 2;
    wipText.y = 0;
    game.stage.addChild(wipText);

    // load game cursor
    Skin.oncomplete = function() {
        game.cursor = new PIXI.Sprite(Skin["cursor.png"]);
        game.cursor.anchor.x = game.cursor.anchor.y = 0.5;
        game.stage.addChild(game.cursor);
        game.stage.removeChild(statusText);
        game.scene = new NeedFiles(game);
    };
    Skin.loadDefault();

    function gameLoop(timestamp) {
        var timediff = timestamp - game.lastFrameTime;

        if (game.cursor) {
            // Handle cursor
            game.cursor.x = game.mouseX;
            game.cursor.y = game.mouseY;
            game.cursor.scale.x = game.cursor.scale.y = 0.8;
            game.cursor.bringToFront();
        }

        if (game.scene) {
            game.scene.render(timestamp);
        }

        wipText.bringToFront();
        app.renderer.render(game.stage);
        game.lastFrameTime = timestamp;

        window.requestAnimationFrame(gameLoop);
    }

    window.requestAnimationFrame(gameLoop);
});
