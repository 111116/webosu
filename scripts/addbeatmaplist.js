function starname(star) {
    if (!star) return "";
    if (star<2) return "easy";
    if (star<2.7) return "normal";
    if (star<4) return "hard";
    if (star<5.3) return "insane";
    if (star<6.5) return "expert";
    return "expert-plus";
}

// star: number; numerical representation of star rating
// returns an html element used in difficulty selection menu
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
// creates a difficulty selection menu
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
    for (let i=0; i<boxclicked.data.length; ++i) {
        // add a row
        let difficultyItem = document.createElement("div");
        difficultyItem.className = "difficulty-item";
        difficultyBox.appendChild(difficultyItem);
        difficultyItem.data = boxclicked.data[i];
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
            // check if ready
            if (!window.scriptReady) return;
            if (!window.soundReady) return;
            if (!window.skinReady) return;
            if (!this.parentElement.parentElement.oszblob) return;
            launchGame(this.parentElement.parentElement.oszblob, this.data.bid);
        }
    }
    difficultyBox.onclick = function(e) {
        e.stopPropagation();
    }
}

// async
// listurl: url of api request that returns a list of beatmap packs
// adds symbols of these beatmap packs to webpage
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
        pBeatmapBox.setdata = map;
        return pBeatmapBox;
    }

    function addStarRings(box, data) {
        // get star ratings
        let stars = [];
        for (let i=0; i<data.length; ++i) {
            stars.push(data[i].star);
        }
        let row = document.createElement("div");
        row.className = "beatmap-difficulties";
        box.appendChild(row);
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
        if (data.length == 0) {
            let cnt = document.createElement("span");
            cnt.className = "difficulty-count";
            cnt.innerText = "no std map";
            row.appendChild(cnt);
        }
    }
    function addLength(box, data) {
        // show length & bpm
        let length = 0;
        let bpm = 0;
        for (let i=0; i<data.length; ++i) {
            length = Math.max(length, data[i].length);
            bpm = Math.max(bpm, data[i].BPM);
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
    function addMoreInfo(box, data) {
        // remove all but osu std mode
        data = data.filter(function(o){return o.mode == 0;});
        data = data.sort(function(a,b){return Math.sign(a.star-b.star);});
        box.data = data;
        addStarRings(box, data);
        addLength(box, data);
    }

    // async
    function requestMoreInfo(box) {
        let url = "https://api.sayobot.cn/beatmapinfo?1=" + box.sid;
        let xhr = new XMLHttpRequest();
        xhr.responseType = 'text';
        xhr.open("GET", url);
        xhr.onload = function() {
            let res = JSON.parse(xhr.response);
            addMoreInfo(box, res.data);
        }
        xhr.send();
    }

    // request beatmap pack list
    let xhr = new XMLHttpRequest();
    xhr.responseType = 'text';
    xhr.open("GET", listurl);
    // async part 1
    xhr.onload = function() {
        let res = JSON.parse(xhr.response);
        let box = [];
        // add widget to webpage as soon as list is fetched
        for (let i=0; i<res.data.length; ++i) {
            box.push(addpreviewbox(res.data[i]));
        }
        // async add more info
        for (let i=0; i<res.data.length; ++i) {
            box[i].sid = res.data[i].sid;
            requestMoreInfo(box[i]);
            box[i].onclick = function(e) {
                // this is effective only when box.data is available
                createDifficultyList(box[i], e);
                startdownload(box[i]);
            }
        }
        if (window.beatmaplistLoadedCallback)
            window.beatmaplistLoadedCallback();
    }
    xhr.send();
}
