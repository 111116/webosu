// delayed js loader

function loadScript(url, callback) {
	let script = document.createElement("script");
	document.head.appendChild(script);
	if (callback)
		script.onload = callback;
	script.src = url;
}



window.beatmaplistLoadedCallback = function () {
	window.setTimeout(function(){
		loadScript("scripts/lib/zip.js", function(){window.zip.workerScriptsPath = 'scripts/lib/';});
		loadScript("scripts/lib/zip-fs.js");
		loadScript("scripts/lib/pixi.min.js");
		loadScript("scripts/lib/mp3parse.min.js");
		loadScript("scripts/lib/localforage.min.js");
		loadScript("scripts/lib/underscore.js");

		loadScript("scripts/curves/Curve.js");
		loadScript("scripts/curves/CurveType.js");
		loadScript("scripts/curves/Bezier2.js");
		loadScript("scripts/curves/CircumscribedCircle.js");
		loadScript("scripts/curves/EqualDistanceMultiCurve.js");
		loadScript("scripts/curves/LinearBezier.js");
		console.log("!")
	}, 0);
}




// "scripts/osu.js"
// "scripts/playerActions.js"
// "scripts/SliderMesh.js"
// "scripts/overlay/score.js"
// "scripts/overlay/pause.js"
// "scripts/overlay/volume.js"
// "scripts/overlay/loading.js"
// "scripts/overlay/grade.js"
// "scripts/overlay/break.js"
// "scripts/overlay/progress.js"
// "scripts/overlay/hiterrormeter.js"
// "scripts/playback.js"
