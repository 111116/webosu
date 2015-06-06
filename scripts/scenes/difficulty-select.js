define(["osu", "resources", "scenes/playback", "underscore", "pixi"], function(Osu, Resources, Playback, _, PIXI) {
    function DifficultySelect(game, osu) {
        var self = this;
        self.osu = osu;
        self.game = game;
        self.background = null;
        self.tracks = _.sortBy(osu.tracks, function(t) { return t.difficulty.OverallDifficulty; });
        self.tracks = _.filter(self.tracks, function(t) { return t.general.Mode === 0; });

        // Load background if possible
        if (self.osu.tracks[0].events.length != 0) {
            self.ready = false;
            var file = self.osu.tracks[0].events[0][2];
            file = file.substr(1, file.length - 2);
            osu.zip.getChildByName(file).getBlob("image/jpeg", function(blob) {
                var uri = URL.createObjectURL(blob);
                var texture = PIXI.Texture.fromImage(uri);
                self.background = new PIXI.Sprite(texture);
                self.background.x = self.background.y = 0;
                self.background.width = self.game.canvas.width;
                self.background.height = self.game.canvas.height;
                self.game.stage.addChild(self.background);
                self.game.stage.setChildIndex(self.background, 0);
                if (self.started) {
                    self.ready = true;
                    self.start();
                }
            });
        }
        
        var disposed = false;
        this.click = function(e) {
            if (disposed) return;
            for (var i = 0; i < self.tracks.length; i++) {
                var menu = Resources["menu-button-background.png"];
                var x = game.canvas.width / 2 - menu.width / 2;
                var y = (i * (menu.height + 10)) + 10 + 30 + 20;
                if (e.clientX > x && e.clientX < x + menu.width &&
                        e.clientY > y && e.clientY < y + menu.height) {
                    self.teardown();
                    disposed = true;
                    var playback = new Playback(self.game, self.osu, self.tracks[i]);
                    game.scene = playback;
                    playback.start();
                    return;
                }
            }
        }

        this.load = function(game) {
            game.canvas.addEventListener('click', self.click);
        }

        var tracks = [];
        for (var i = 0; i < self.tracks.length; i++) {
            var track = self.tracks[i];
            var sprite = new PIXI.Sprite(Resources["menu-button-background.png"]);
            var leftEdge = game.canvas.width / 2 - sprite.width / 2;
            var text = new PIXI.Text(track.metadata.Version, { font: "20px sans" });
            sprite.x = leftEdge;
            sprite.y = i * (sprite.height + 10) + 10 + 30 + 20;
            text.x = leftEdge + 20;
            text.y = i * (sprite.height + 10) + 30 + 20 + (sprite.height / 2);
            tracks.push({ sprite: sprite, text: text });
            game.stage.addChild(sprite);
            game.stage.addChild(text);
        }

        this.render = function(time) {
            // nop
        }
        
        this.teardown = function() {
            if (self.background) {
                self.game.stage.removeChild(self.background);
                self.background.destroy();
            }
            for (var i = 0; i < tracks.length; i++) {
                self.game.stage.removeChild(tracks[i].sprite);
                self.game.stage.removeChild(tracks[i].text);
                tracks[i].sprite.destroy();
                tracks[i].text.destroy();
            }
        };
    }

    return DifficultySelect;
});
