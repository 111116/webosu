require(["osu", "scenes/difficulty-select", "underscore", "skin", "sound"], 
function(Osu, DifficultySelect, _, Skin, sound) {

    var game = {
        window: window,
        stage: null,
        scene: null,
        updatePlayerActions: null,

        allowMouseButton: true,
        allowMouseScroll: true,
        backgroundDimRate: 0.7,
        backgroundBlurRate: 0.0, // not yet implemented
        cursorSize: 1.0,

        masterVolume: 0.7,
        effectVolume: 1.0,
        musicVolume: 1.0,

        K1keycode: 90,
        K2keycode: 88,

        // cursor info
        mouseX: 0, // in absolute pixel
        mouseY: 0,
        K1down: false,
        K2down: false,
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
    window.skinReady = false;
    window.soundReady = false;
    window.scriptReady = false;
    window.osuReady = false;


    // load skin & game cursor
    Skin.oncomplete = function() {
        window.skinReady = true;
        document.getElementById("skin-progress").innerText += " Done";
        game.cursor = new PIXI.Sprite(Skin["cursor.png"]);
        game.cursor.anchor.x = game.cursor.anchor.y = 0.5;
        game.cursor.scale.x = game.cursor.scale.y = 0.6 * game.cursorSize;
        game.stage.addChild(game.cursor);
    };
    Skin.loadDefault();


    // load sounds
    // load hitsound set
    var sample = [
        'hitsounds/normal-hitnormal.mp3',
        'hitsounds/normal-hitwhistle.mp3',
        'hitsounds/normal-hitfinish.mp3',
        'hitsounds/normal-hitclap.mp3',
        'hitsounds/soft-hitnormal.mp3',
        'hitsounds/soft-hitwhistle.mp3',
        'hitsounds/soft-hitfinish.mp3',
        'hitsounds/soft-hitclap.mp3',
        'hitsounds/drum-hitnormal.mp3',
        'hitsounds/drum-hitwhistle.mp3',
        'hitsounds/drum-hitfinish.mp3',
        'hitsounds/drum-hitclap.mp3'
    ];
    console.log("Loading hit sounds:");
    console.log(sample);
    sounds.whenLoaded = function(){
        game.sample[1].hitnormal = sounds['hitsounds/normal-hitnormal.mp3'];
        game.sample[1].hitwhistle = sounds['hitsounds/normal-hitwhistle.mp3'];
        game.sample[1].hitfinish = sounds['hitsounds/normal-hitfinish.mp3'];
        game.sample[1].hitclap = sounds['hitsounds/normal-hitclap.mp3'];
        game.sample[2].hitnormal = sounds['hitsounds/soft-hitnormal.mp3'];
        game.sample[2].hitwhistle = sounds['hitsounds/soft-hitwhistle.mp3'];
        game.sample[2].hitfinish = sounds['hitsounds/soft-hitfinish.mp3'];
        game.sample[2].hitclap = sounds['hitsounds/soft-hitclap.mp3'];
        game.sample[3].hitnormal = sounds['hitsounds/drum-hitnormal.mp3'];
        game.sample[3].hitwhistle = sounds['hitsounds/drum-hitwhistle.mp3'];
        game.sample[3].hitfinish = sounds['hitsounds/drum-hitfinish.mp3'];
        game.sample[3].hitclap = sounds['hitsounds/drum-hitclap.mp3'];
        window.soundReady = true;
        document.getElementById("sound-progress").innerText += " Done";
    };
    sounds.load(sample);


    // load app
    let app = new PIXI.Application({
        width: window.innerWidth,
        height: window.innerHeight,
        resolution: window.devicePixelRatio || 1,
        autoResize: true,
    });
    
    app.renderer.autoResize = true;
    app.renderer.backgroundColor = 0xFFFFFF;

    window.AudioContext = window.AudioContext || window.webkitAudioContext;

    window.addEventListener("mousemove", function(e) {
        game.mouseX = e.clientX;
        game.mouseY = e.clientY;
    });
    
    game.stage = new PIXI.Container();
    game.cursor = null;

    var pDragbox = document.getElementById("beatmap-dragbox");
    var pDragboxInner = document.getElementById("beatmap-dragbox-inner");
    var pDragboxHint = document.getElementById("beatmap-dragbox-hint");
    var pBeatmapBox = null;
    var pGameArea = document.getElementById("game-area");
    var pMainPage = document.getElementById("main-page");

    function startgame() {
        // get ready for gaming
        // Hash.set(osu.tracks[0].metadata.BeatmapSetID);
        if (!scriptReady || !skinReady || !soundReady || !osuReady)
            return;
        document.addEventListener("contextmenu", function(e) {
            e.preventDefault();
            return false;
        });
        pGameArea.appendChild(app.view);
        pMainPage.setAttribute("hidden","");
        pGameArea.removeAttribute("hidden");
        var difficultySelect = new DifficultySelect(self.game, osu);
        game.scene = difficultySelect;
    }

    function oszLoaded() {
        // Verify that this has all the pieces we need
        var osu = window.osu = new Osu(window.osz.root);

        osu.onready = function() {
            window.osuReady = true;
            if (!_.some(osu.tracks, function(t) { return t.general.Mode === 0; })) {
                pDragboxHint.innerText = "Only supports osu! (std) mode beatmaps. Drop another file.";
                return;
            }
            // replace dragbox with beatmap box
            pDragbox.className = "beatmapbox";
            pBeatmapBox = pDragbox;
            // remove dragbox elements
            pBeatmapBox.ondrop = null;
            while (pBeatmapBox.firstChild) {
                pBeatmapBox.removeChild(pBeatmapBox.firstChild);
            }
            pDragbox = null;
            pDragboxInner = null;
            pDragboxHint = null;
            // add beatmap box elements
            let pBeatmapCover = document.createElement("img");
            pBeatmapCover.className = "beatmapcover";
            let pBeatmapTitle = document.createElement("div");
            pBeatmapTitle.className = "beatmaptitle";
            pBeatmapBox.appendChild(pBeatmapCover);
            pBeatmapBox.appendChild(pBeatmapTitle);
            // set beatmap title display
            var title = osu.tracks[0].metadata.TitleUnicode || osu.tracks[0].metadata.Title;
            pBeatmapTitle.innerText = title;
            // set beatmap cover display
            pBeatmapCover.alt = "beatmap cover";
            try {
                var file = self.osu.tracks[0].events[0][2];
                if (self.osu.tracks[0].events[0][0] === "Video") {
                    file = self.osu.tracks[0].events[1][2];
                }
                file = file.substr(1, file.length - 2);
                entry = osu.zip.getChildByName(file);
            }
            catch (error) {
                console.error(error);
                entry = null;
            }
            if (entry) {
                entry.getBlob("image/jpeg", function (blob) {
                    var url = URL.createObjectURL(blob);
                    pBeatmapCover.src = url;
                });
            } else {
                pBeatmapCover.src = "skin/defaultbg.jpg";
            }
            // click Beatmap box to start playing
            pBeatmapBox.onclick = function(e) {
                e.stopPropagation();
                startgame();
            }
        };
        osu.onerror = function(error) {
            self.stage = error;
        };
        osu.load();
    }

    var handleDragDrop = function(e) {
        e.stopPropagation();
        e.preventDefault();
        pDragboxHint.innerText = "loading...";
        var raw_file = e.dataTransfer.files[0];
        // check suffix name
        if (raw_file.name.indexOf(".osz") === raw_file.name.length - 4) {
            var fs = window.osz = new zip.fs.FS();
            fs.root.importBlob(raw_file, oszLoaded,
                function(err) {
                    pDragboxHint.innerText = "Not a valid osz file. Drop another file.";
                });
        } else {
            pDragboxHint.innerText = "Not an osz file. Drop another file.";
        }
    }
    pDragbox.ondrop = handleDragDrop;

    window.addEventListener('dragover', function(e){(e||event).preventDefault()}, false);
    window.addEventListener('drop', function(e){(e||event).preventDefault()}, false);

    // load script done
    pDragboxInner.removeAttribute("hidden");
    window.scriptReady = true;
    document.getElementById("script-progress").innerText += " Done";

    PIXI.Sprite.prototype.bringToFront = function() {
        if (this.parent) {
            var parent = this.parent;
            parent.removeChild(this);
            parent.addChild(this);
        }
    }

    function gameLoop(timestamp) {
        var timediff = timestamp - game.lastFrameTime;

        if (game.cursor) {
            // Handle cursor
            game.cursor.x = game.mouseX;
            game.cursor.y = game.mouseY;
            game.cursor.bringToFront();
        }

        if (game.scene) {
            game.scene.render(timestamp);
        }

        app.renderer.render(game.stage);
        game.lastFrameTime = timestamp;

        window.requestAnimationFrame(gameLoop);
    }

    window.requestAnimationFrame(gameLoop);
});
