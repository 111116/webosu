require(["osu", "underscore", "sound", "playback"],
function(Osu, _, sound, Playback) {

    // initialize global game variables
    var game = {
        window: window,
        stage: null,
        scene: null,
        updatePlayerActions: null,

        // note: preference values here will be overwritten by gamesettings (in settings.js)
        // display
        backgroundDimRate: 0.7,
        backgroundBlurRate: 0.0,
        cursorSize: 1.0,
        showhwmouse: false,
        snakein: true,
        snakeout: true,

        // audio
        masterVolume: 0.7,
        effectVolume: 1.0,
        musicVolume: 1.0,

        // input
        allowMouseButton: false,
        allowMouseScroll: true,
        K1keycode: 90,
        K2keycode: 88,

        // mods
        autoplay: false,
        nightcore: false,
        daycore: false,
        hardrock: false,
        easy: false,
        hidden: false,

        // skin mods
        hideNumbers: false,
        hideGreat: false,
        hideFollowPoints: false,

        // cursor info
        mouseX: 0, // in osu pixel, probably negative or exceeding 512
        mouseY: 0,
        K1down: false,
        K2down: false,
        M1down: false,
        M2down: false,
        down: false,

        finished : false,
        sample: [{}, {}, {}, {}],
        sampleSet: 1
    };
    window.game = game;
    if (window.gamesettings)
        window.gamesettings.loadToGame();
    window.skinReady = false;
    window.soundReady = false;
    window.scriptReady = false;
    game.stage = new PIXI.Container();
    game.cursor = null;


    // load skin & game cursor
    PIXI.Loader.shared
    .add('fonts/venera.fnt')
    .add("sprites.json").load(function() {
        window.skinReady = true;
        document.getElementById("skin-progress").classList.add("finished");
        Skin = PIXI.Loader.shared.resources["sprites.json"].textures;
    });


    // load sounds
    // load hitsound set
    var sample = [
        'hitsounds/normal-hitnormal.ogg',
        'hitsounds/normal-hitwhistle.ogg',
        'hitsounds/normal-hitfinish.ogg',
        'hitsounds/normal-hitclap.ogg',
        'hitsounds/normal-slidertick.ogg',
        'hitsounds/soft-hitnormal.ogg',
        'hitsounds/soft-hitwhistle.ogg',
        'hitsounds/soft-hitfinish.ogg',
        'hitsounds/soft-hitclap.ogg',
        'hitsounds/soft-slidertick.ogg',
        'hitsounds/drum-hitnormal.ogg',
        'hitsounds/drum-hitwhistle.ogg',
        'hitsounds/drum-hitfinish.ogg',
        'hitsounds/drum-hitclap.ogg',
        'hitsounds/drum-slidertick.ogg',
    ];
    sounds.whenLoaded = function(){
        game.sample[1].hitnormal = sounds['hitsounds/normal-hitnormal.ogg'];
        game.sample[1].hitwhistle = sounds['hitsounds/normal-hitwhistle.ogg'];
        game.sample[1].hitfinish = sounds['hitsounds/normal-hitfinish.ogg'];
        game.sample[1].hitclap = sounds['hitsounds/normal-hitclap.ogg'];
        game.sample[1].slidertick = sounds['hitsounds/normal-slidertick.ogg'];
        game.sample[2].hitnormal = sounds['hitsounds/soft-hitnormal.ogg'];
        game.sample[2].hitwhistle = sounds['hitsounds/soft-hitwhistle.ogg'];
        game.sample[2].hitfinish = sounds['hitsounds/soft-hitfinish.ogg'];
        game.sample[2].hitclap = sounds['hitsounds/soft-hitclap.ogg'];
        game.sample[2].slidertick = sounds['hitsounds/soft-slidertick.ogg'];
        game.sample[3].hitnormal = sounds['hitsounds/drum-hitnormal.ogg'];
        game.sample[3].hitwhistle = sounds['hitsounds/drum-hitwhistle.ogg'];
        game.sample[3].hitfinish = sounds['hitsounds/drum-hitfinish.ogg'];
        game.sample[3].hitclap = sounds['hitsounds/drum-hitclap.ogg'];
        game.sample[3].slidertick = sounds['hitsounds/drum-slidertick.ogg'];
        window.soundReady = true;
        document.getElementById("sound-progress").classList.add("finished");
    };
    sounds.load(sample);


    PIXI.Sprite.prototype.bringToFront = function() {
        if (this.parent) {
            var parent = this.parent;
            parent.removeChild(this);
            parent.addChild(this);
        }
    }

    // load script done
    window.scriptReady = true;
    document.getElementById("script-progress").classList.add("finished");
});
