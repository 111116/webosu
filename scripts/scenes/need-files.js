define(["osu", "scenes/difficulty-select", "underscore", "resources", "pixi"],
function(Osu, DifficultySelect, _, Resources, PIXI) {
    function NeedFiles(game) {
        var self = this;
        this.stage = "Drag and drop a .osz file here";
        this.game = game;

        window.addEventListener('dragenter', dragNOP, false);
        window.addEventListener('dragleave', dragNOP, false);
        window.addEventListener('dragover', dragNOP, false);
        window.addEventListener('drop', handleDragDrop, false);

        function dragNOP(e) {
            e.stopPropagation();
            e.preventDefault();
        }

        function handleDragDrop(e) {
            dragNOP(e);
            var osz_raw = e.dataTransfer.files[0];
            window.osz_raw = osz_raw;
            if (osz_raw.name.indexOf(".osz") === osz_raw.name.length - 4) {
                self.stage = "Loading...";
                var fs = window.osz = new zip.fs.FS();
                fs.root.importBlob(osz_raw, function() {
                    oszLoaded();
                }, function(err) {
                    self.stage = "A valid osz file, please";
                });
            } else if (osz_raw.name.indexOf(".osk") == osz_raw.name.length - 4) {
                self.stage = "Loading skin...";
                var fs = window.osk = new zip.fs.FS();
                fs.root.importBlob(osz_raw, function() {
                    oskLoaded();
                }, function(err) {
                    self.stage = "This is not a valid osk file.";
                });
            } else {
                self.stage = "An actual osz file, please";
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
                            Resources.load(blob, child.name);
                            if (child.name === "cursor.png") {
                                game.cursor.texture = Resources["cursor.png"];
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
                document.title = title;
                self.stage = title;
            };
            osu.onready = function() {
                if (!_.some(osu.tracks, function(t) { return t.general.Mode === 0; })) {
                    self.stage = "Only osu! mode beatmaps are supported.";
                    return;
                }
                self.teardown();
                var difficultySelect = new DifficultySelect(self.game, osu);
                difficultySelect.load(game);
                game.scene = difficultySelect;
            };
            osu.load();
        }

        var statusText = new PIXI.Text(self.stage, { font: "18px sans" });
        statusText.anchor.x = statusText.anchor.y = 0.5;
        statusText.x = game.canvas.width / 2;
        statusText.y = game.canvas.height / 2;
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
