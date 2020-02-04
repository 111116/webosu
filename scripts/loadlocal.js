
    // load beatmap from local
    localforage.getItem("beatmapfilelist", function(err, names){
        if (!err && names && typeof names.length !== undefined) {
            names = names.filter(function(t){return t;});
            console.log("local beatmap list:", names);
            document.getElementById('bm-total-counter').innerText = names.length;
            var tempbox = [];
            for (let i=0; i<names.length; ++i) {
                let box = document.createElement("div");
                box.className = "beatmapbox";
                pBeatmapList.insertBefore(box, pDragbox);
                tempbox.push(box);
            }
            var loadingCounter = document.getElementById('bm-loaded-counter');
            var loadingn = 0;
            beatmapFileList = beatmapFileList.concat(names);
            for (let i=0; i<names.length; ++i) {
                // load blobs of these beatmaps
                localforage.getItem(names[i], function(err, blob){
                    if (!err && blob) {
                        let fs = new zip.fs.FS();
                        fs.filename = names[i];
                        fs.root.importBlob(blob,
                            function(){
                                addbeatmap(fs, function(box){
                                    pBeatmapList.replaceChild(box, tempbox[i]);
                                    pDragboxHint.innerText = pDragboxHint.defaultHint;
                                });
                                loadingCounter.innerText = ++loadingn;
                            },
                            function(err) {
                                pDragboxHint.innerText = pDragboxHint.nonValidHint;
                            }
                        );
                    }
                    else {
                        console.error("error while loading beatmap:", names[i], err);
                    }
                });
            }
        } else {
            if (!names)
                console.log("no local beatmap list found.");
            else
                console.error("error while loading beatmap list:", err, names);
        }
    });


    
    function addbeatmap(osz,f) {
        // Verify that this has all the pieces we need
        var map = new BeatmapController();
        map.osu = new Osu(osz.root);
        map.filename = osz.filename;
        console.log("adding beatmap filename:", osz.filename)

        // ask sayobot of star ratings of beatmaps immediately when decoded
        map.osu.ondecoded = function() {
            map.osu.filterTracks();
            map.osu.sortTracks();
            map.osu.requestStar();
            map.osuReady = true;
            if (!_.some(map.osu.tracks, function(t) { return t.general.Mode === 0; })) {
                pDragboxHint.innerText = pDragboxHint.modeErrHint;
                return;
            }
            // add the beatmap to page & restore drag box
            let pBeatmapBox = map.createBeatmapBox();
            f(pBeatmapBox);
            // save the beatmap locally TODO
            if (!beatmapFileList.includes(map.filename)) {
                beatmapFileList.push(map.filename);
                localforage.setItem("beatmapfilelist", beatmapFileList, function(err, val){
                    if (!err) {
                        console.log("local beatmap list set to", val);
                    }
                    else {
                        console.error("Error while saving beatmap list");
                    }
                });
            }
        };
        map.osu.onerror = function(error) {
            console.error("osu load error");
        };
        map.osu.load();
    }







    
    BeatmapController.prototype.createBeatmapBox = function(){
        let map = this;
        // create container of beatmap on web page
        let pBeatmapBox = document.createElement("div");
        let pBeatmapCover = document.createElement("img");
        let pBeatmapCoverOverlay = document.createElement("div");
        let pBeatmapTitle = document.createElement("div");
        let pBeatmapAuthor = document.createElement("div");
        let pBeatmapRings = document.createElement("div");
        pBeatmapBox.className = "beatmapbox";
        pBeatmapCover.className = "beatmapcover";
        pBeatmapCoverOverlay.className = "beatmapcover-overlay";
        pBeatmapTitle.className = "beatmaptitle";
        pBeatmapAuthor.className = "beatmapauthor";
        pBeatmapRings.className = "beatmap-difficulties";
        pBeatmapBox.appendChild(pBeatmapCover);
        pBeatmapBox.appendChild(pBeatmapCoverOverlay);
        pBeatmapBox.appendChild(pBeatmapTitle);
        pBeatmapBox.appendChild(pBeatmapAuthor);
        pBeatmapBox.appendChild(pBeatmapRings);
        // set beatmap title & artist display (prefer ascii title)
        var title = map.osu.tracks[0].metadata.Title;
        var artist = map.osu.tracks[0].metadata.Artist;
        var creator = map.osu.tracks[0].metadata.Creator;
        pBeatmapTitle.innerText = title;
        pBeatmapAuthor.innerText = artist + " / " + creator;
        // set beatmap cover display
        pBeatmapCover.alt = "beatmap cover";
        map.osu.getCoverSrc(pBeatmapCover);
        // display beatmap length
        if (map.osu.tracks[0].length) {
            let pBeatmapLength = document.createElement("div");
            pBeatmapLength.className = "beatmaplength";
            pBeatmapBox.appendChild(pBeatmapLength);
            let length = map.osu.tracks[0].length;
            pBeatmapLength.innerText = Math.floor(length/60) + ":" + (length%60<10?"0":"") + (length%60);
        }

        // click Beatmap box to show difficulty selection menu
        pBeatmapBox.onclick = function(e) {
            console.log("clcked");
            createDifficultyList(pBeatmapBox, e);
        }
        return pBeatmapBox;
    }


    // web page elements
    var pDragbox = document.getElementById("beatmap-dragbox");
    var pDragboxInner = document.getElementById("beatmap-dragbox-inner");
    var pDragboxHint = document.getElementById("beatmap-dragbox-hint");
    var pBeatmapList = document.getElementById("beatmap-list");
    pDragboxHint.defaultHint = window.i18n_dragdrophint || "Drag and drop a beatmap (.osz) file here";
    pDragboxHint.modeErrHint = "Only supports osu! (std) mode beatmaps. Drop another file.";
    pDragboxHint.nonValidHint = "Not a valid osz file. Drop another file.";
    pDragboxHint.noTransferHint = "Not receiving any file. Please retry.";
    pDragboxHint.nonOszHint = "Not an osz file. Drop another file.";
    pDragboxHint.loadingHint = "loading...";
    var pGameArea = document.getElementById("game-area");
    var pMainPage = document.getElementById("main-page");
    var pNav = document.getElementById("main-nav");
    var beatmapFileList = [];

