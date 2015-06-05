define([], function() {
    Resources = {};
    Resources.load = function() {
        // Resources we need to do our thing
        var to_load = [
            "approachcircle.png",
            "cursor.png",
            "hitcircle.png",
            "hitcircleoverlay.png",
            "hitcircleselect.png",
            "menu-button-background.png",
            "star.png",
            "default-0.png",
            "default-1.png",
            "default-2.png",
            "default-3.png",
            "default-4.png",
            "default-5.png",
            "default-6.png",
            "default-7.png",
            "default-8.png",
            "default-9.png"
        ];
        function loadNext() {
            var xhr = new XMLHttpRequest();
            var resource = to_load[0];
            xhr.open("GET", "skin/" + resource);
            xhr.responseType = 'blob';
            to_load.splice(0, 1);
            xhr.onload = function() {
                var url = URL.createObjectURL(xhr.response);
                var img = document.createElement('img');
                img.src = url;
                Resources[resource] = img;
                if (to_load.length > 0) {
                    loadNext();
                }
            };
            xhr.send();
        }
        loadNext();
    };
    return Resources;
});
