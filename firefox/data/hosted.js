(function() {
    function insert(url) {
        var button = document.createElement("div");
        button.className = "beatmapDownloadButton";
        button.title = "Preview map on osu!web";
        var link = document.createElement("a");
        link.href = url;
        link.target = "_blank";
        var img = document.createElement("img");
        img.src = "https://sr.ht/3Zm6.png";
        link.appendChild(img);
        button.appendChild(link);
        var container = document.querySelector(".content-with-bg .paddingboth");
        container.insertBefore(button, container.children[0]);
    }

    if (window.location.pathname.indexOf("/s/") === 0) {
        var set = window.location.pathname.substr(3);
        insert("http://www.drewdevault.com/osuweb#st=" + set);
    }

    if (window.location.pathname.indexOf("/b/") === 0) {
        var bm = window.location.pathname.substr(3);
        if (bm.indexOf("&") !== -1) {
            bm = bm.substr(0, bm.indexOf("&"));
        }
        var set = document.querySelector(".beatmap_download_link").pathname.substr(3);
        insert("http://www.drewdevault.com/osuweb#st=" + set + "&bm=" + bm);
    }
})();
