define(["pixi"], function(PIXI) {
    Resources = {};
    Resources.oncomplete = function() { }
    Resources.loadDefault = function() {
        // Resources we need to do our thing
        var to_load = [
            "cursor.png",
            "approachcircle.png",
            "hitcircle.png",
            "hitcircleoverlay.png",
            "sliderfollowcircle.png",
            "sliderb.png",
            "slideredge.png",
            "reversearrow.png",
            "menu-button-background.png",
            "default-0.png", "default-1.png", "default-2.png", "default-3.png",
            "default-4.png", "default-5.png", "default-6.png", "default-7.png",
            "default-8.png", "default-9.png",
            "score-0.png", "score-1.png", "score-2.png", "score-3.png",
            "score-4.png", "score-5.png", "score-6.png", "score-7.png",
            "score-8.png", "score-9.png",
        ];
        function loadNext() {
            var xhr = new XMLHttpRequest();
            var resource = to_load[0];
            xhr.open("GET", "skin/" + resource);
            xhr.responseType = 'blob';
            to_load.splice(0, 1);
            xhr.onload = function() {
                Resources.load(xhr.response, resource);
                if (to_load.length > 0) {
                    loadNext();
                } else {
                    Resources.oncomplete();
                }
            };
            xhr.send();
        }
        loadNext();
    };

    Resources.load = function(blob, name) {
        if (name.indexOf(".png") === name.length - 4) {
            var url = URL.createObjectURL(blob);
            var texture = PIXI.Texture.fromImage(url);
            Resources[name] = texture;
        }
    };

    return Resources;
});
