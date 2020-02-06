(function(){
	let url = new URL(window.location.href);
	let keyword = url.searchParams.get("q");
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
})()