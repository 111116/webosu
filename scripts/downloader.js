// beatmap downloader

function startpreview(box) {
    let volume = 1;
    if (window.gamesettings) {
        volume = (window.gamesettings.mastervolume/100) * (window.gamesettings.musicvolume/100);
        volume = Math.min(1, Math.max(0, volume));
    }
    let audios = document.getElementsByTagName("audio");
    for (let i=0; i<audios.length; ++i)
        if (audios[i].softstop)
            audios[i].softstop();
    let a = document.createElement("audio");
    let s = document.createElement("source");
    s.src = "https://cdn.sayobot.cn:25225/preview/" + box.sid + ".mp3";
    s.type = "audio/mpeg";
    a.appendChild(s);
    a.volume = 0;
    a.play();
    document.body.appendChild(a);
    let fadeIn = setInterval(function(){
        if (a.volume < volume)
            a.volume = Math.min(volume, a.volume + 0.05*volume);
        else
            clearInterval(fadeIn);
    }, 30);
    let fadeOut = setInterval(function(){
        if (a.currentTime > 9.3) // assume it's 10s long
            a.volume = Math.max(0, a.volume - 0.05*volume);
        if (a.volume == 0)
            clearInterval(fadeOut);
    }, 30);
    a.softstop = function() {
        let fadeOut = setInterval(function(){
            a.volume = Math.max(0, a.volume - 0.05*volume);
            if (a.volume == 0) {
                clearInterval(fadeOut);
                a.remove();
            }
        }, 10);
    }
}

function log_to_server(message) {
    let url = "http://api.osugame.online/log/?msg=" + message;
    let xhr = new XMLHttpRequest();
    xhr.open("GET", url);
    xhr.send();
}

function startdownload(box) {
    startpreview(box);
	if (box.downloading) {
		return;
	}
	let url = "https://txy1.sayobot.cn/beatmaps/download/mini/" + box.sid;
	box.downloading = true;
    box.classList.add("downloading");
    let xhr = new XMLHttpRequest();
    xhr.responseType = 'arraybuffer';
    xhr.open("GET", url);
    // create download progress bar
    let container = document.createElement("div");
    let title = document.createElement("div");
    let bar = document.createElement("progress");
    container.className = "download-progress";
    title.className = "title";
    title.innerText = box.setdata.title;
    container.appendChild(title);
    container.appendChild(bar);
    // insert so that download list from recent to old
    let statuslines = document.getElementById("statuslines");
    statuslines.insertBefore(container, statuslines.children[3]);
    bar.max = 1;
    bar.value = 0;
    // async part
    xhr.onload = function() {
        box.oszblob = new Blob([xhr.response]);
        bar.className = "finished";
        box.classList.remove("downloading");
        log_to_server("got " + box.sid + " in " + (new Date().getTime() - (box.download_starttime || 0)));
    }
    xhr.onprogress = function(e) {
		bar.value = e.loaded / e.total;
    }
    xhr.onerror = function() {
    	console.error("download failed");
        alert("Beatmap download failed. Please retry later.")
		box.downloading = false;
        box.classList.remove("downloading");
        log_to_server("fail " + box.sid);
    }
    xhr.send();
    // start time (for logging)
    box.download_starttime = new Date().getTime();
}