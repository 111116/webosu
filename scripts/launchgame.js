function launchOSU(osu, beatmapid){
    // select track
    let trackid = -1;
    for (let i=0; i<osu.tracks.length; ++i)
        if (osu.tracks[i].metadata.BeatmapID == beatmapid)
            trackid = i;
    if (trackid == -1) {
        console.error("no suck track");
        return;
    }
    // launch PIXI app
    let app = window.app = new PIXI.Application({
        width: window.innerWidth,
        height: window.innerHeight,
        resolution: window.devicePixelRatio || 1,
        autoResize: true,
    });
    app.renderer.autoResize = true;
    app.renderer.backgroundColor = 0x111111;

    // get ready for gaming
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
    let pGameArea = document.getElementById("game-area");
    var pMainPage = document.getElementById("main-page");
    var pNav = document.getElementById("main-nav");
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
    pNav.setAttribute("style","display: none");
    pGameArea.removeAttribute("hidden");

    // load playback
    var playback = new Playback(window.game, osu, osu.tracks[trackid]);
    game.scene = playback;
    playback.load();

    // start main loop
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

function launchGame(osublob, beatmapid) {
    // unzip osz & parse beatmap
    let fs = new zip.fs.FS();
    fs.root.importBlob(osublob,
        function(){
            let osu = new Osu(fs.root);
            osu.ondecoded = function() {
                launchOSU(osu, beatmapid);
            }
            osu.onerror = function() {
                console.error("osu parse error");
            }
            osu.load();
        },
        function(err) {
            console.error("unzip failed");
        }
    );
}
