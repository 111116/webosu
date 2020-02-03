function createStarRow(star) {
    let row = document.createElement("div");
    row.className = "star-row";
    for (let i=0; i<10; ++i) {
        let container = document.createElement("div");
        container.className = "imgcontainer";
        let img = document.createElement("img");
        container.appendChild(img);
        row.appendChild(container);
        img.src = "star.png";
        let value = Math.min(Math.max(star-i,0),1);
        let size = 8 + value*10;
        let pad = (1-value) * 5;
        let style = "width:" + size + "px;";
        style += "bottom:" + pad + "px;";
        style += "left:" + pad + "px;";
        if (value == 0) {
            style += "opacity:0.4;";
        }
        img.setAttribute("style", style);
    }
    return row;
}
function createDifficultyList(boxclicked, event) {
    // check if a list of this kind is already there
    if (window.currentDifficultyList) {
        window.removeEventListener("click", window.currentDifficultyList.clicklistener);
        window.currentDifficultyList.parentElement.removeChild(window.currentDifficultyList);
        window.currentDifficultyList = null;
    }
    // window.showingDifficultyList = true;
    event.stopPropagation();
    // calculate list position on page
    let rect = boxclicked.getBoundingClientRect();
    let x = event.clientX - rect.left;
    let y = event.clientY - rect.top; 
    // create list
    let difficultyBox = document.createElement("div");
    window.currentDifficultyList = difficultyBox;
    difficultyBox.className = "difficulty-box";
    difficultyBox.style.left = x + "px";
    difficultyBox.style.top = y + "px";
    boxclicked.appendChild(difficultyBox);
    // close list if clicked outside
    var closeDifficultyList = function() {
        boxclicked.removeChild(difficultyBox);
        window.currentDifficultyList = null;
        window.removeEventListener('click', closeDifficultyList, false);
    };
    window.addEventListener("click", closeDifficultyList, false);
    difficultyBox.clicklistener = closeDifficultyList;
    // fill list
    function starname(star) {
        if (star<2) return "easy";
        if (star<2.7) return "normal";
        if (star<4) return "hard";
        if (star<5.3) return "insane";
        if (star<6.5) return "expert";
        return "expert-plus";
    }
    for (let i=0; i<boxclicked.data.length; ++i) {
        // add a row
        let difficultyItem = document.createElement("div");
        difficultyItem.className = "difficulty-item";
        difficultyBox.appendChild(difficultyItem);
        // add ring icon representing star
        let ringbase = document.createElement("div");
        let ring = document.createElement("div");
        ringbase.className = "bigringbase";
        ring.className = "bigring";
        ring.classList.add(starname(boxclicked.data[i].star));
        difficultyItem.appendChild(ringbase);
        difficultyItem.appendChild(ring);
        // add version name & mapper
        let line = document.createElement("div");
        let version = document.createElement("div");
        let mapper = document.createElement("div");
        line.className = "versionline";
        version.className = "version";
        mapper.className = "mapper";
        line.appendChild(version);
        line.appendChild(mapper);
        difficultyItem.appendChild(line);
        version.innerText = boxclicked.data[i].version;
        mapper.innerText = "mapped by " + boxclicked.data[i].creator;
        // add row of stars
        difficultyItem.appendChild(createStarRow(boxclicked.data[i].star));
        // add callbacks
        difficultyItem.onhover = function() {

        }
        difficultyItem.onclick = function(e) {
        }
    }
    difficultyBox.onclick = function(e) {
        e.stopPropagation();
    }
}

// async
function addBeatmapList(listurl) {

    function addpreviewbox(map) {
        // create container of beatmap on web page
        let pBeatmapBox = document.createElement("div");
        let pBeatmapCover = document.createElement("img");
        let pBeatmapCoverOverlay = document.createElement("div");
        let pBeatmapTitle = document.createElement("div");
        let pBeatmapArtist = document.createElement("div");
        let pBeatmapCreator = document.createElement("div");
        pBeatmapBox.className = "beatmapbox";
        pBeatmapCover.className = "beatmapcover";
        pBeatmapCoverOverlay.className = "beatmapcover-overlay";
        pBeatmapTitle.className = "beatmaptitle";
        pBeatmapArtist.className = "beatmapartist";
        pBeatmapCreator.className = "beatmapcreator";
        pBeatmapBox.appendChild(pBeatmapCover);
        pBeatmapBox.appendChild(pBeatmapCoverOverlay);
        pBeatmapBox.appendChild(pBeatmapTitle);
        pBeatmapBox.appendChild(pBeatmapArtist);
        pBeatmapBox.appendChild(pBeatmapCreator);
        // set beatmap title & artist display (prefer ascii title)
        pBeatmapTitle.innerText = map.title;
        pBeatmapArtist.innerText = map.artist;
        pBeatmapCreator.innerText = "mapped by " + map.creator;
        pBeatmapCover.alt = "cover" + map.sid;
        pBeatmapCover.src = "https://cdn.sayobot.cn:25225/beatmaps/" + map.sid + "/covers/cover.webp";
        document.getElementById("beatmap-list").appendChild(pBeatmapBox);
        return pBeatmapBox;
    }

    function starname(star) {
        if (star<2) return "easy";
        if (star<2.7) return "normal";
        if (star<4) return "hard";
        if (star<5.3) return "insane";
        if (star<6.5) return "expert";
        return "expert-plus";
    }

    // async
    function addMoreInfo(box, sid) {
        let row = document.createElement("div");
        row.className = "beatmap-difficulties";
        box.appendChild(row);
        let url = "https://api.sayobot.cn/beatmapinfo?1=" + sid;
        let xhr = new XMLHttpRequest();
        xhr.responseType = 'text';
        xhr.open("GET", url);
        xhr.onload = function() {
            let res = JSON.parse(xhr.response);
            // remove all but osu std mode
            res.data = res.data.filter(function(o){return o.mode == 0;});
            res.data = res.data.sort(function(a,b){return a.star>b.star;});
            box.data = res.data;
            // get star ratings
            let stars = [];
            for (let i=0; i<res.data.length; ++i) {
                stars.push(res.data[i].star);
            }
            // show all of them if can be fit in
            if (stars.length <= 15) {
                for (let i=0; i<stars.length; ++i) {
                    let difficultyRing = document.createElement("div");
                    difficultyRing.className = "difficulty-ring";
                    difficultyRing.classList.add(starname(stars[i]));
                    row.appendChild(difficultyRing);
                }
            }
            // show only highest star and count otherwise
            else {
                let difficultyRing = document.createElement("div");
                difficultyRing.className = "difficulty-ring";
                difficultyRing.classList.add(starname(stars[stars.length-1]));
                row.appendChild(difficultyRing);
                let cnt = document.createElement("span");
                cnt.className = "difficulty-count";
                cnt.innerText = stars.length;
                row.appendChild(cnt);
            }
            // show length & bpm
            let length = 0;
            let bpm = 0;
            for (let i=0; i<res.data.length; ++i) {
                length = Math.max(length, res.data[i].length);
                bpm = Math.max(bpm, res.data[i].BPM);
            }
            // let pBeatmapBPM = document.createElement("div");
            // pBeatmapBPM.className = "beatmapbpm";
            // box.appendChild(pBeatmapBPM);
            // pBeatmapBPM.innerText = Math.round(bpm) + "♪";
            let pBeatmapLength = document.createElement("div");
            pBeatmapLength.className = "beatmaplength";
            box.appendChild(pBeatmapLength);
            pBeatmapLength.innerText = Math.floor(length/60) + ":" + (length%60<10?"0":"") + (length%60);
        }
        xhr.send();
    }

    let xhr = new XMLHttpRequest();
    xhr.responseType = 'text';
    xhr.open("GET", listurl);
    xhr.onload = function() {
        let res = JSON.parse(xhr.response);
        let box = [];
        for (let i=0; i<res.data.length; ++i) {
            box.push(addpreviewbox(res.data[i]));
        }
        for (let i=0; i<res.data.length; ++i) {
            addMoreInfo(box[i], res.data[i].sid);
            box[i].onclick = function(e) {
                createDifficultyList(box[i], e);
            }
        }
    }
    xhr.send();
}