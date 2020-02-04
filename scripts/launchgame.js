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
        pNav.setAttribute("style","display: none");
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