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
        ];
        function loadNext() {
            var xhr = new XMLHttpRequest();
            var resource = to_load[0];
            xhr.open("GET", "/skin/" + resource);
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
