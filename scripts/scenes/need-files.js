define(["osu", "scenes/playback"], function(Osu, Playback) {
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
            document.title = osu.metadata.Title;
            stage = osu.metadata.TitleUnicode;
        };
        osu.onready = function() {
            var playback = new Playback(osu);
            game.scene = playback.scene;
            playback.start();
        };
        osu.load();
    }

    return function(timestamp, context, _game) {
        game = _game;
        context.font = "18px sans";
        var metrics = context.measureText(stage);
        context.fillText(stage, game.canvas.width / 2 -
                metrics.width / 2, game.canvas.height / 2);
    };
});
