define([], function() {
    Skin = {};
    Skin.oncomplete = function() { }
    Skin.loadDefault = function() {
        // Skin we need to do our thing
        var skinResource = [
            "cursor.png",
            "approachcircle.png",
            "hitcircle.png",
            "hitburst.png",
            "hitcircleoverlay.png",
            "sliderfollowcircle.png",
            "sliderb.png",
            "slideredge.png",
            "reversearrow.png",
            "spinner.png",
            "menu-button-background.png",
            "default-0.png", "default-1.png", "default-2.png", "default-3.png",
            "default-4.png", "default-5.png", "default-6.png", "default-7.png",
            "default-8.png", "default-9.png",
            "score-0.png", "score-1.png", "score-2.png", "score-3.png",
            "score-4.png", "score-5.png", "score-6.png", "score-7.png",
            "score-8.png", "score-9.png",
        ];

        var skinLoadCounter = 0;
        var loadCallback = function() {
            skinLoadCounter += 1;
            if (skinLoadCounter == skinResource.length)
                Skin.oncomplete();
        }
        for (let i=0; i<skinResource.length; ++i) {
            let xhr = new XMLHttpRequest();
            let resource = skinResource[i];
            xhr.open("GET", "skin/" + resource);
            xhr.responseType = 'blob';
            xhr.onload = function() {
                Skin.load(xhr.response, resource);
                loadCallback();
            };
            xhr.send();
        }
    };

    Skin.load = function(blob, name) {
        if (name.indexOf(".png") === name.length - 4) {
            var url = URL.createObjectURL(blob);
            var texture = PIXI.Texture.fromImage(url);
            Skin[name] = texture;
        }
    };

    return Skin;
});
