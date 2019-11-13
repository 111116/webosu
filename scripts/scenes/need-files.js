define(["osu", "scenes/difficulty-select", "hash", "underscore", "skin"],
function(Osu, DifficultySelect, Hash, _, Skin) {
    function NeedFiles(game) {
        var self = this;
        this.stage = "Drag and drop a .osz file here\nDrag and drop a .osk file to apply a skin first";
        this.game = game;

        if (Hash.set()) {
            this.stage = "Downloading beatmap...";
            var xhr = new XMLHttpRequest();
            xhr.open("GET", "http://irc.sircmpwn.com/api/beatmap/" + Hash.set());
            xhr.responseType = 'arraybuffer';
            xhr.onload = function() {
                var view = new DataView(xhr.response);
                var blob = new Blob([view]);
                loadMap(blob);
            };
            xhr.send();
        }

        window.addEventListener('dragenter', dragNOP, false);
        window.addEventListener('dragleave', dragNOP, false);
        window.addEventListener('dragover', dragNOP, false);
        window.addEventListener('drop', handleDragDrop, false);

        function dragNOP(e) {
            e.stopPropagation();
            e.preventDefault();
        }

        function loadMap(data) {
            self.stage = "Loading map...";
            var fs = window.osz = new zip.fs.FS();
            fs.root.importBlob(data, oszLoaded,
                function(err) {
                    self.stage = "A valid osz file, please";
                });
        }

        function handleDragDrop(e) {
            dragNOP(e);
            var raw_file = e.dataTransfer.files[0];
            if (raw_file.name.indexOf(".osz") === raw_file.name.length - 4) {
                loadMap(raw_file);
            } else if (raw_file.name.indexOf(".osk") == raw_file.name.length - 4) {
                self.stage = "Loading skin...";
                var fs = window.osk = new zip.fs.FS();
                fs.root.importBlob(raw_file, oskLoaded,
                    function(err) {
                        self.stage = "This is not a valid osk file.";
                    });
            } else {
                self.stage = "An actual osz or osk file, please";
            }
        }

        function oskLoaded() {
            self.stage = "Loading skin...";
            var children = window.osk.root.children[0].children;
            for (var i = 0; i < children.length; i++) {
                var child = children[i];
                var total = 0;
                (function(child, i) {
                    var mimetype = "image/png"; // TODO: More kinds of blobs
                    if (child.getBlob) {
                        child.getBlob(mimetype, function(blob) {
                            Skin.load(blob, child.name);
                            if (child.name === "cursor.png") {
                                game.cursor.texture = Skin["cursor.png"];
                                game.cursorMiddle.visible = false;
                            }
                        });
                    }
                })(child, i);
            }
            self.stage = "Drag and drop a .osz file here";
        }

        function oszLoaded() {
            // Verify that this has all the pieces we need
            var osu = new Osu(window.osz.root);
            window.osu = osu;
            osu.ondecoded = function() {
                var title = osu.tracks[0].metadata.TitleUnicode || osu.tracks[0].metadata.Title;
                document.title = "osu! - " + title;
                self.stage = title;
            };
            osu.onready = function() {
                if (!_.some(osu.tracks, function(t) { return t.general.Mode === 0; })) {
                    self.stage = "Only osu! mode beatmaps are supported.";
                    return;
                }
                self.teardown();
                console.log(osu.tracks[0].metadata);
                Hash.set(osu.tracks[0].metadata.BeatmapSetID);
                var difficultySelect = new DifficultySelect(self.game, osu);
                game.scene = difficultySelect;
            };
            osu.onerror = function(error) {
                self.stage = error;
            };
            osu.load();
        }

        var statusText = new PIXI.Text(self.stage, { fontSize: 18, align: "center" });
        statusText.anchor.x = statusText.anchor.y = 0.5;
        statusText.x = game.window.innerWidth / 2;
        statusText.y = game.window.innerHeight / 2;
        game.stage.addChild(statusText);

        this.render = function render(timestamp) {
            statusText.text = self.stage;
        };

        this.teardown = function() {
            game.stage.removeChild(statusText);
            statusText.destroy();
        };
    }

    return NeedFiles;
});
