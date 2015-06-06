define(["osu", "resources", "scenes/playback", "underscore"], function(Osu, Resources, Playback, _) {
    function DifficultySelect(osu) {
        var self = this;
        self.osu = osu;
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
                var image = document.createElement("img");
                image.src = uri;
                self.background = image;
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
                    disposed = true;
                    var playback = new Playback(self.osu, self.tracks[i]);
                    game.scene = playback;
                    playback.start();
                    return;
                }
            }
        }

        this.load = function(game) {
            game.canvas.addEventListener('click', self.click);
        }

        this.render = function(time, context, game) {
            if (self.background !== null) {
                context.drawImage(self.background, 0, 0, game.canvas.width, game.canvas.height);
            }
            context.font = "30px sans";
            var difficultyText = "Select Difficulty:";
            var metrics = context.measureText(difficultyText);
            context.fillText(difficultyText, game.canvas.width / 2 -
                    metrics.width / 2, 10 + 30);
            for (var i = 0; i < self.tracks.length; i++) {
                var menu = Resources["menu-button-background.png"];
                var leftEdge = game.canvas.width / 2 - menu.width / 2;
                var track = self.tracks[i];
                context.drawImage(menu, leftEdge, (i * (menu.height + 10)) + 10 + 30 + 20);
                context.font = "20px sans";
                metrics = context.measureText(track.metadata.Version);
                context.fillText(track.metadata.Version, leftEdge + 20,
                    (i * (menu.height + 10)) + 30 + 20 + (menu.height / 2));
            }
        }
    }

    return DifficultySelect;
});
