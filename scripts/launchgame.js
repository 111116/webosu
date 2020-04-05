function launchOSU(osu, beatmapid, version){
    // select track
    let trackid = -1;
    // mode can be 0 or undefined
    for (let i=0; i<osu.tracks.length; ++i)
        if (osu.tracks[i].metadata.BeatmapID == beatmapid || !osu.tracks[i].mode && osu.tracks[i].metadata.Version == version)
            trackid = i;
    console.log("launching", beatmapid, version)
    if (trackid == -1) {
        if (log_to_server) log_to_server("unmatch " + beatmapid + " " + version);
        console.error("no suck track");
        console.log("available tracks are:");
        for (let i=0; i<osu.tracks.length; ++i)
            console.log(osu.tracks[i].metadata.BeatmapID, osu.tracks[i].mode, osu.tracks[i].metadata.Version);
        return;
    }
    // prevent launching multiple times
    if (window.app) return;
    console.log("launching PIXI app");
    // launch PIXI app
    let app = window.app = new PIXI.Application({
        width: window.innerWidth,
        height: window.innerHeight,
        resolution: (window.game.overridedpi? window.game.dpiscale: window.devicePixelRatio) || 1,
        autoResize: true,
    });
    app.renderer.autoResize = true;
    app.renderer.backgroundColor = 0x111111;

    // remember where the page is scrolled to
    let scrollTop = document.body.scrollTop;
    // save alert function and replace with silent alert to prevent pop-up in game
    let defaultAlert = window.alert;
    window.alert = function(msg){console.log("IN-GAME ALERT " + msg);};
    // get ready for gaming
    document.addEventListener("contextmenu", function(e) {
        e.preventDefault();
        return false;
    });
    document.body.classList.add("gaming");
    // update game settings
    if (window.gamesettings) {
        window.gamesettings.refresh();
        window.gamesettings.loadToGame();
    }

    // load cursor
    if (!game.showhwmouse || game.autoplay) {
        game.cursor = new PIXI.Sprite(Skin["cursor.png"]);
        game.cursor.anchor.x = game.cursor.anchor.y = 0.5;
        game.cursor.scale.x = game.cursor.scale.y = 0.3 * game.cursorSize;
        game.stage.addChild(game.cursor);
    }

    // switch page to game view
    if (game.autofullscreen)
        document.documentElement.requestFullscreen();
    let pGameArea = document.getElementById("game-area");
    var pMainPage = document.getElementById("main-page");
    var pNav = document.getElementById("main-nav");
    pGameArea.appendChild(app.view);
    if (game.autoplay) {
        pGameArea.classList.remove("shownomouse");
        pGameArea.classList.remove("showhwmousemedium");
        pGameArea.classList.remove("showhwmousesmall");
        pGameArea.classList.remove("showhwmousetiny");
    }
    else if (game.showhwmouse) {
        pGameArea.classList.remove("shownomouse");
        if (game.cursorSize < 0.65)
            pGameArea.classList.add("showhwmousetiny");
        else if (game.cursorSize < 0.95)
            pGameArea.classList.add("showhwmousesmall");
        else
            pGameArea.classList.add("showhwmousemedium");
    }
    else {
        pGameArea.classList.add("shownomouse");
        pGameArea.classList.remove("showhwmousemedium");
        pGameArea.classList.remove("showhwmousesmall");
        pGameArea.classList.remove("showhwmousetiny");
    }
    pMainPage.setAttribute("hidden","");
    pNav.setAttribute("style","display: none");
    pGameArea.removeAttribute("hidden");

    var gameLoop;
    // set quit callback
    window.quitGame = function() {
        // this shouldn't be called before playback is cleaned up
        // restore webpage state
        pGameArea.setAttribute("hidden", "");
        pMainPage.removeAttribute("hidden");
        pNav.removeAttribute("style");
        document.body.classList.remove("gaming");
        // restore page scroll position
        document.body.scrollTop = scrollTop;
        // restore alert function
        window.alert = defaultAlert;
        // TODO application level clean up
        if (game.cursor) {
            game.stage.removeChild(game.cursor);
            game.cursor.destroy();
            game.cursor = null;
        }
        window.app.destroy(true, {children: true, texture: false});
        window.app = null;
        gameLoop = null;
        window.cancelAnimationFrame(window.animationRequestID);
    }

    // load playback
    var playback = new Playback(window.game, osu, osu.tracks[trackid]);
    game.scene = playback;
    playback.onload = function() {
        // stop beatmap preview
        let audios = document.getElementsByTagName("audio");
        for (let i=0; i<audios.length; ++i)
            if (audios[i].softstop)
                audios[i].softstop();
    }
    playback.load(); // load audio

    // start main loop
    gameLoop = function(timestamp) {
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
        window.animationRequestID = window.requestAnimationFrame(gameLoop);
    }
    window.animationRequestID = window.requestAnimationFrame(gameLoop);
}

function launchGame(osublob, beatmapid, version) {
    // unzip osz & parse beatmap
    let fs = new zip.fs.FS();
    fs.root.importBlob(osublob,
        function(){
            let osu = new Osu(fs.root);
            osu.ondecoded = function() {
                launchOSU(osu, beatmapid, version);
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
