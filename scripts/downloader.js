// beatmap downloader

function startdownload(box) {
	if (box.downloading) {
		return;
	}
	let url = "https://txy1.sayobot.cn/beatmaps/download/novideo/" + box.sid;
	box.downloading = true;
    let xhr = new XMLHttpRequest();
    xhr.responseType = 'blob';
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
    document.getElementById("statuslines").appendChild(container);
    bar.max = 1;
    bar.value = 0;
    // async part
    xhr.onload = function() {
        box.oszblob = xhr.response;
        bar.className = "finished";
    }
    xhr.onprogress = function(e) {
		bar.value = e.loaded / e.total;
    }
    xhr.onerror = function() {
    	console.error("download failed");
		box.downloading = false;
    }
    xhr.send();
}