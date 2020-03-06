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
		loadScript("https://osugame.sayobot.cn/scripts/lib/zip.js", function(){
			window.zip.workerScriptsPath = 'https://osugame.sayobot.cn/scripts/lib/';
			loadScript("https://osugame.sayobot.cn/scripts/lib/zip-fs.js", checkdep);
		});
		loadScript("https://osugame.sayobot.cn/scripts/lib/pixi.min.js", checkdep);
		loadScript("https://osugame.sayobot.cn/scripts/lib/mp3parse.min.js", checkdep);
		loadScript("https://osugame.sayobot.cn/scripts/lib/localforage.min.js", checkdep);
		function checkdep() {
			if (!window.aaaaa) window.aaaaa = 0;
			window.aaaaa += 1;
			if (window.aaaaa == 4) {
				// load scripts of game
				loadScript("https://osugame.sayobot.cn/scripts/lib/require.js", function() {
		            require.config({
		                paths: {
		                    underscore: 'https://osugame.sayobot.cn/scripts/lib/underscore',
		                    sound: 'https://osugame.sayobot.cn/scripts/lib/sound'
		                },
		                shim: {
		                    "underscore": {
		                        exports: "_"
		                    }
		                },
		                // urlArgs: "bust=" +  (new Date()).getTime()
		            });
				}, {"data-main":"https://osugame.sayobot.cn/scripts/initgame"});
				// load Liked list
				if (window.localforage) {
					localforage.getItem("likedsidset", function(err, item) {
	                    if (!err) {
	                    	if (item && item.size)
	                    		window.liked_sid_set = item;
	                    	else
	                    		window.liked_sid_set = new Set();
	                    	for (let i=0; i<window.liked_sid_set_callbacks.length; ++i)
	                    		window.liked_sid_set_callbacks[i]();
	                    	window.liked_sid_set_callbacks = [];
	                    }
	                    else {
	                    	console.error("failed loading liked list");
	                    }
                	});
				}
			}
		}

	}, 0);
}

