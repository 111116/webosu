require(["osu", "underscore", "sound", "playback"],
function(Osu, _, sound, Playback) {

    // initialize global game
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
        document.getElementById("skin-progress").innerText += " Done";
        Skin = PIXI.Loader.shared.resources["sprites.json"].textures;
    });


    // load sounds
    // load hitsound set
    var sample = [
        'hitsounds/normal-hitnormal.mp3',
        'hitsounds/normal-hitwhistle.mp3',
        'hitsounds/normal-hitfinish.mp3',
        'hitsounds/normal-hitclap.mp3',
        'hitsounds/normal-slidertick.mp3',
        'hitsounds/soft-hitnormal.mp3',
        'hitsounds/soft-hitwhistle.mp3',
        'hitsounds/soft-hitfinish.mp3',
        'hitsounds/soft-hitclap.mp3',
        'hitsounds/soft-slidertick.mp3',
        'hitsounds/drum-hitnormal.mp3',
        'hitsounds/drum-hitwhistle.mp3',
        'hitsounds/drum-hitfinish.mp3',
        'hitsounds/drum-hitclap.mp3',
        'hitsounds/drum-slidertick.mp3',
    ];
    sounds.whenLoaded = function(){
        game.sample[1].hitnormal = sounds['hitsounds/normal-hitnormal.mp3'];
        game.sample[1].hitwhistle = sounds['hitsounds/normal-hitwhistle.mp3'];
        game.sample[1].hitfinish = sounds['hitsounds/normal-hitfinish.mp3'];
        game.sample[1].hitclap = sounds['hitsounds/normal-hitclap.mp3'];
        game.sample[1].slidertick = sounds['hitsounds/normal-slidertick.mp3'];
        game.sample[2].hitnormal = sounds['hitsounds/soft-hitnormal.mp3'];
        game.sample[2].hitwhistle = sounds['hitsounds/soft-hitwhistle.mp3'];
        game.sample[2].hitfinish = sounds['hitsounds/soft-hitfinish.mp3'];
        game.sample[2].hitclap = sounds['hitsounds/soft-hitclap.mp3'];
        game.sample[2].slidertick = sounds['hitsounds/soft-slidertick.mp3'];
        game.sample[3].hitnormal = sounds['hitsounds/drum-hitnormal.mp3'];
        game.sample[3].hitwhistle = sounds['hitsounds/drum-hitwhistle.mp3'];
        game.sample[3].hitfinish = sounds['hitsounds/drum-hitfinish.mp3'];
        game.sample[3].hitclap = sounds['hitsounds/drum-hitclap.mp3'];
        game.sample[3].slidertick = sounds['hitsounds/drum-slidertick.mp3'];
        window.soundReady = true;
        document.getElementById("sound-progress").innerText += " Done";
    };
    sounds.load(sample);


    // objects that contain osu object of a beatmap
    function BeatmapController(){
        this.osuReady = false;
    }

    BeatmapController.prototype.startGame = function(trackid){
        // load app
        let app = window.app = new PIXI.Application({
            width: window.innerWidth,
            height: window.innerHeight,
            resolution: window.devicePixelRatio || 1,
            autoResize: true,
        });
        app.renderer.autoResize = true;
        app.renderer.backgroundColor = 0x111111;
        // load audio context
        window.AudioContext = window.AudioContext || window.webkitAudioContext;

        // get ready for gaming
        // Hash.set(osu.tracks[0].metadata.BeatmapSetID);
        if (!scriptReady || !skinReady || !soundReady || !this.osuReady)
            return;
        document.addEventListener("contextmenu", function(e) {
            e.preventDefault();
            return false;
        });
        document.body.classList.add("gaming");
        // load cursor
        if (!game.showhwmouse || game.autoplay) {
            game.cursor = new PIXI.Sprite(Skin["cursor.png"]);
            game.cursor.anchor.x = game.cursor.anchor.y = 0.5;
            game.cursor.scale.x = game.cursor.scale.y = 0.3 * game.cursorSize;
            game.stage.addChild(game.cursor);
        }
        // switch page to game view
        pGameArea.appendChild(app.view);
        if (game.autoplay) {
            pGameArea.classList.remove("shownomouse");
            pGameArea.classList.remove("showhwmouse");
        }
        else if (game.showhwmouse) {
            pGameArea.classList.remove("shownomouse");
            pGameArea.classList.add("showhwmouse");
        }
        else {
            pGameArea.classList.remove("showhwmouse");
            pGameArea.classList.add("shownomouse");
        }
        pMainPage.setAttribute("hidden","");
        pGameArea.removeAttribute("hidden");

        var playback = new Playback(window.game, this.osu, this.osu.tracks[trackid]);
        game.scene = playback;
        playback.load();

        function gameLoop(timestamp) {
            if (game.scene) {
                game.scene.render(timestamp);
            }
            if (game.cursor) {
                // Handle cursor
                game.cursor.x = game.mouseX / 512 * gfx.width + gfx.xoffset;
                game.cursor.y = game.mouseY / 384 * gfx.height + gfx.yoffset;
                game.cursor.bringToFront();
            }
            app.renderer.render(game.stage);
            window.requestAnimationFrame(gameLoop);
        }
        window.requestAnimationFrame(gameLoop);
    }

    BeatmapController.prototype.createBeatmapBox = function(){
        let map = this;
        // create container of beatmap on web page
        let pBeatmapBox = document.createElement("div");
        let pBeatmapCover = document.createElement("img");
        let pBeatmapTitle = document.createElement("div");
        let pBeatmapAuthor = document.createElement("div");
        pBeatmapBox.className = "beatmapbox";
        pBeatmapCover.className = "beatmapcover";
        pBeatmapTitle.className = "beatmaptitle";
        pBeatmapAuthor.className = "beatmapauthor";
        pBeatmapBox.appendChild(pBeatmapCover);
        pBeatmapBox.appendChild(pBeatmapTitle);
        pBeatmapBox.appendChild(pBeatmapAuthor);
        // set beatmap title & artist display (prefer ascii title)
        var title = map.osu.tracks[0].metadata.Title;
        var artist = map.osu.tracks[0].metadata.Artist;
        var creator = map.osu.tracks[0].metadata.Creator;
        pBeatmapTitle.innerText = title;
        pBeatmapAuthor.innerText = artist + " / " + creator;
        // set beatmap cover display
        pBeatmapCover.alt = "beatmap cover";
        map.osu.getCoverSrc(pBeatmapCover);
        // display beatmap length
        if (map.osu.tracks[0].length) {
            let pBeatmapLength = document.createElement("div");
            pBeatmapLength.className = "beatmaplength";
            pBeatmapBox.appendChild(pBeatmapLength);
            let length = map.osu.tracks[0].length;
            pBeatmapLength.innerText = Math.floor(length/60) + ":" + (length%60<10?"0":"") + (length%60);
        }

        // click Beatmap box to show difficulty selection menu
        pBeatmapBox.onclick = function(e) {
            // allow only one selection menu at a time
            if (!window.showingDifficultyBox) {
                e.stopPropagation();
                // create difficulty seleciton menu
                // set menu position
                let difficultyBox = document.createElement("div");
                difficultyBox.className = "difficulty-box";
                let rect = this.getBoundingClientRect();
                let x = e.clientX - rect.left;
                let y = e.clientY - rect.top; 
                difficultyBox.style.left = x + "px";
                difficultyBox.style.top = y + "px";
                // close menu callback
                var closeDifficultyMenu = function() {
                    pBeatmapBox.removeChild(difficultyBox);
                    window.showingDifficultyBox = false;
                    window.removeEventListener('click', closeDifficultyMenu, false);
                };
                // create difficulty list items
                for (let i=0; i<map.osu.tracks.length; ++i) {
                    let difficultyItem = document.createElement("div");
                    let difficultyRing = document.createElement("div");
                    let difficultyText = document.createElement("span");
                    difficultyItem.className = "difficulty-item";
                    difficultyRing.className = "difficulty-ring";
                    // color ring acoording to Star; gray ring if unavailable
                    let star = map.osu.tracks[i].difficulty.star;
                    if (star) {
                        if (star<2) difficultyRing.classList.add("easy"); else
                        if (star<2.7) difficultyRing.classList.add("normal"); else
                        if (star<4) difficultyRing.classList.add("hard"); else
                        if (star<5.3) difficultyRing.classList.add("insane"); else
                        if (star<6.5) difficultyRing.classList.add("expert"); else
                            difficultyRing.classList.add("expert-plus");
                    }
                    difficultyText.innerText = map.osu.tracks[i].metadata.Version;
                    difficultyItem.appendChild(difficultyRing);
                    difficultyItem.appendChild(difficultyText);
                    difficultyBox.appendChild(difficultyItem);
                    // launch game if clicked inside
                    difficultyItem.onclick = function(e) {
                        e.stopPropagation();
                        closeDifficultyMenu();
                        map.startGame(i);
                    }
                }
                pBeatmapBox.appendChild(difficultyBox);
                window.showingDifficultyBox = true;
                // close menu if clicked outside
                window.addEventListener("click", closeDifficultyMenu, false);
            }
        }
        return pBeatmapBox;
    }


    // web page elements
    var pDragbox = document.getElementById("beatmap-dragbox");
    var pDragboxInner = document.getElementById("beatmap-dragbox-inner");
    var pDragboxHint = document.getElementById("beatmap-dragbox-hint");
    var pBeatmapList = document.getElementById("beatmap-list");
    pDragboxHint.defaultHint = "Drag and drop a beatmap (.osz) file here";
    pDragboxHint.modeErrHint = "Only supports osu! (std) mode beatmaps. Drop another file.";
    pDragboxHint.nonValidHint = "Not a valid osz file. Drop another file.";
    pDragboxHint.noTransferHint = "Not receiving any file. Please retry.";
    pDragboxHint.nonOszHint = "Not an osz file. Drop another file.";
    pDragboxHint.loadingHint = "loading...";
    var pGameArea = document.getElementById("game-area");
    var pMainPage = document.getElementById("main-page");
    var beatmapFileList = [];

    // load beatmap from local
    localforage.getItem("beatmapfilelist", function(err, names){
        if (!err && names && typeof names.length !== undefined) {
            names = names.filter(function(t){return t;});
            console.log("local beatmap list:", names);
            document.getElementById('bm-total-counter').innerText = names.length;
            var tempbox = [];
            for (let i=0; i<names.length; ++i) {
                let box = document.createElement("div");
                box.className = "beatmapbox";
                pBeatmapList.insertBefore(box, pDragbox);
                tempbox.push(box);
            }
            var loadingCounter = document.getElementById('bm-loaded-counter');
            var loadingn = 0;
            beatmapFileList = beatmapFileList.concat(names);
            for (let i=0; i<names.length; ++i) {
                // load blobs of these beatmaps
                localforage.getItem(names[i], function(err, blob){
                    if (!err && blob) {
                        let fs = new zip.fs.FS();
                        fs.filename = names[i];
                        fs.root.importBlob(blob,
                            function(){
                                addbeatmap(fs, function(box){
                                    pBeatmapList.replaceChild(box, tempbox[i]);
                                    pDragboxHint.innerText = pDragboxHint.defaultHint;
                                });
                                loadingCounter.innerText = ++loadingn;
                            },
                            function(err) {
                                pDragboxHint.innerText = pDragboxHint.nonValidHint;
                            }
                        );
                    }
                    else {
                        console.error("error while loading beatmap:", names[i], err);
                    }
                });
            }
        } else {
            if (!names)
                console.log("no local beatmap list found.");
            else
                console.error("error while loading beatmap list:", err, names);
        }
    });

    function addbeatmap(osz,f) {
        // Verify that this has all the pieces we need
        var map = new BeatmapController();
        map.osu = new Osu(osz.root);
        map.filename = osz.filename;
        console.log("adding beatmap filename:", osz.filename)

        // ask sayobot of star ratings of beatmaps immediately when decoded
        map.osu.ondecoded = function() {
            map.osu.filterTracks();
            map.osu.sortTracks();
            map.osu.requestStar();
            map.osuReady = true;
            if (!_.some(map.osu.tracks, function(t) { return t.general.Mode === 0; })) {
                pDragboxHint.innerText = pDragboxHint.modeErrHint;
                return;
            }
            // add the beatmap to page & restore drag box
            let pBeatmapBox = map.createBeatmapBox();
            f(pBeatmapBox);
            // save the beatmap locally TODO
            if (!beatmapFileList.includes(map.filename)) {
                beatmapFileList.push(map.filename);
                localforage.setItem("beatmapfilelist", beatmapFileList, function(err, val){
                    if (!err) {
                        console.log("local beatmap list set to", val);
                    }
                    else {
                        console.error("Error while saving beatmap list");
                    }
                });
            }
        };
        map.osu.onerror = function(error) {
            console.error("osu load error");
        };
        map.osu.load();
    }

    var handleDragDrop = function(e) {
        e.stopPropagation();
        e.preventDefault();
        pDragboxHint.innerText = pDragboxHint.loadingHint;
        for (let i=0; i<e.dataTransfer.files.length; ++i) {
            let raw_file = e.dataTransfer.files[i];
            console.log("importing file", raw_file.name);
            if (!raw_file) {
                pDragboxHint.innerText = pDragboxHint.noTransferHint;
                return;
            }
            // check suffix name
            if (raw_file.name.indexOf(".osz") === raw_file.name.length - 4) {
                let fs = new zip.fs.FS();
                fs.filename = raw_file.name;
                localforage.setItem(raw_file.name, raw_file, function(err,val) {
                    if (err) {
                        console.error("Error while saving beatmap", fs.filename);
                    }
                })
                console.log(fs);
                fs.root.importBlob(raw_file,
                    function(){
                        addbeatmap(fs, function(box){
                            pBeatmapList.insertBefore(box, pDragbox);
                            pDragboxHint.innerText = pDragboxHint.defaultHint;
                        })
                    },
                    function(err) {
                        pDragboxHint.innerText = pDragboxHint.nonValidHint;
                    });
            } else {
                pDragboxHint.innerText = pDragboxHint.nonOszHint;
            }
        }
    }
    pDragbox.ondrop = handleDragDrop;

    window.addEventListener('dragover', function(e){(e||event).preventDefault()}, false);
    window.addEventListener('drop', function(e){(e||event).preventDefault()}, false);

    // load script done
    pDragboxHint.innerText = pDragboxHint.defaultHint;
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
});
