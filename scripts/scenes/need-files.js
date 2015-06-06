define(["osu", "scenes/difficulty-select", "underscore"], function(Osu, DifficultySelect, _) {
    function NeedFiles() {
        var stage = "Drag and drop a .osz file here";
        var game = null;

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
            if (osz_raw.name.indexOf(".osz") != osz_raw.name.length - 4) {
                stage = "An actual osz file, please";
            } else {
                stage = "Loading...";
                var fs = window.osz = new zip.fs.FS();
                fs.root.importBlob(osz_raw, function() {
                    oszLoaded();
                }, function(err) {
                    stage = "A valid osz file, please";
                });
            }
        }

        function oszLoaded() {
            // Verify that this has all the pieces we need
            var osu = new Osu(window.osz.root);
            window.osu = osu;
            osu.ondecoded = function() {
                var title = osu.tracks[0].metadata.TitleUnicode || osu.tracks[0].metadata.Title;
                document.title = title;
                stage = title;
            };
            osu.onready = function() {
                if (!_.some(osu.tracks, function(t) { return t.general.Mode === 0; })) {
                    stage = "Only osu! mode beatmaps are supported.";
                    return;
                }
                var difficultySelect = new DifficultySelect(osu);
                difficultySelect.load(game);
                game.scene = difficultySelect;
            };
            osu.load();
        }

        this.render = function render(timestamp, context, _game) {
            game = _game;
            context.font = "18px sans";
            var metrics = context.measureText(stage);
            context.fillText(stage, game.canvas.width / 2 -
                    metrics.width / 2, game.canvas.height / 2);
        };
    }

    return NeedFiles;
});
