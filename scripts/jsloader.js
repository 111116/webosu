// delayed js loader

function loadScript(url, callback, aux) {
	let script = document.createElement("script");
	document.head.appendChild(script);
	if (callback)
		script.onload = callback;
	if (aux) {
		for (let key in aux) {
			script.setAttribute(key, aux[key]);
		}
	}
	script.src = url;
}



window.beatmaplistLoadedCallback = function () {
	window.setTimeout(function(){
		loadScript("scripts/lib/zip.js", function(){
			window.zip.workerScriptsPath = 'scripts/lib/';
			loadScript("scripts/lib/zip-fs.js", checkdep);
		});
		loadScript("scripts/lib/pixi.min.js", checkdep);
		loadScript("scripts/lib/mp3parse.min.js", checkdep);
		loadScript("scripts/lib/localforage.min.js", checkdep);
		function checkdep() {
			if (!window.aaaaa) window.aaaaa = 0;
			window.aaaaa += 1;
			if (window.aaaaa == 4) {
				loadScript("scripts/lib/require.js", function() {
		            require.config({
		                paths: {
		                    underscore: 'lib/underscore',
		                    sound: 'lib/sound'
		                },
		                shim: {
		                    "underscore": {
		                        exports: "_"
		                    }
		                },
		                urlArgs: "bust=" +  (new Date()).getTime()
		            });
				}, {"data-main":"scripts/initgame"});
			}
		}

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
