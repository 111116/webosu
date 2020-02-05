function startSearch() {
	// clear navigation bar indicator
	document.getElementById("nav-new").classList.remove("active");
	document.getElementById("nav-hot").classList.remove("active");
	document.getElementById("nav-local").classList.remove("active");
	// clear current beatmap list (since we'll be writing over it)
	let plist = document.getElementById("beatmap-list");
	while (plist.firstChild) {
	    plist.removeChild(plist.firstChild);
	}
	// decide if it's keyword or sid
	let input = document.getElementById("search-input");
	let keyword = input.value;
	if (keyword == parseInt(keyword, 10)) {
		// is sid
		addBeatmapSid(keyword);
	}
	else {
		// search keyword
        addBeatmapList("https://api.sayobot.cn/beatmaplist?0=20&1=0&2=4&3=" + keyword + "&5=1");
        var cur = 20;
        document.getElementById("btnmore").onclick = function() {
            addBeatmapList("https://api.sayobot.cn/beatmaplist?0=20&1=" + cur + "&2=4&3=" + keyword + "&5=1");
            cur += 20;
        }
	}
}
document.getElementById("search-icon").onclick = startSearch;
document.getElementById("search-input").addEventListener("keyup", function(e) {
	if(e.keyCode === 13){
        e.preventDefault();
    	startSearch();
    }
})
