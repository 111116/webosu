function setOptionPanel() {

	function updateIndicator(range, indicator, show) {
		return function() {
			let min = parseFloat(range.min);
			let max = parseFloat(range.max);
			let val = parseFloat(range.value);
			let pos = (val-min) / (max-min);
			let length = range.clientWidth - 20;
			indicator.style.left = (pos * length + 13) + "px";
			indicator.innerText = show(val);
		}
	}

	function hideIndicator(indicator) {
		return function() {
	    	indicator.setAttribute("hidden", "");
		}
	}

	function showIndicator(indicator) {
		return function() {
	    	indicator.removeAttribute("hidden");
		}
	}

	function loadFromLocal() {
		let str = window.localStorage.getItem("osugamesettings");
		if (str) {
			let s = JSON.parse(str);
			if (s) Object.assign(gamesettings, s);
		}
	}

	function saveToLocal() {
		window.localStorage.setItem("osugamesettings", JSON.stringify(window.gamesettings));
	}

	// give inputs initial value; set their callback on change
	// give range inputs a visual feedback (a hovering indicator that shows on drag)

	window.gamesettings = {
		dim: 50,
		blur: 0,
		cursorsize: 1.0,
		disableWheel: false,
		disableButton: false,
		mastervolume: 60,
		effectvolume: 100,
		musicvolume: 100,
		audiooffset: 0,
		beatmapHitsound: false,
		autoplay: false,
		showhwmouse: false,
		K1name: 'Z',
		K2name: 'X',
		K1keycode: 90,
		K2keycode: 88,
	};
	loadFromLocal();

	window.gamesettings.loadToGame = function() {
		if (window.game) {
	        window.game.backgroundDimRate = this.dim / 100;
	        window.game.backgroundBlurRate = this.blur / 100;
	        window.game.cursorSize = this.cursorsize;
	        window.game.allowMouseScroll = !this.disableWheel;
	        window.game.allowMouseButton = !this.disableButton;
	        window.game.masterVolume = this.mastervolume / 100;
	        window.game.effectVolume = this.effectvolume / 100;
	        window.game.musicVolume = this.musicvolume / 100;
	        window.game.autoplay = this.autoplay;
	        window.game.showhwmouse = this.showhwmouse;
	        window.game.K1keycode = this.K1keycode;
	        window.game.K2keycode = this.K2keycode;
		}
	}
	gamesettings.loadToGame();
	// this will also be called on game side. The latter call makes effect


	// gameplay settings

	let dimRange = document.getElementById("dim-range");
	let dimRangeIndicator = document.getElementById("dim-range-indicator");
	dimRange.onmousedown = showIndicator(dimRangeIndicator);
	dimRange.onmouseup = hideIndicator(dimRangeIndicator);
	dimRange.oninput = updateIndicator(dimRange, dimRangeIndicator, function(v){return v+"%"});
	dimRange.value = gamesettings.dim;
	dimRange.oninput();
	dimRange.onchange = function() {
		gamesettings.dim = dimRange.value;
		gamesettings.loadToGame();
        saveToLocal();
	}

	let blurRange = document.getElementById("blur-range");
	let blurRangeIndicator = document.getElementById("blur-range-indicator");
	blurRange.onmousedown = showIndicator(blurRangeIndicator);
	blurRange.onmouseup = hideIndicator(blurRangeIndicator);
	blurRange.oninput = updateIndicator(blurRange, blurRangeIndicator, function(v){return v+"%"});
	blurRange.value = gamesettings.blur;
	blurRange.oninput();
	blurRange.onchange = function() {
		gamesettings.blur = blurRange.value;
		gamesettings.loadToGame();
        saveToLocal();
	}

	let cursorsizeRange = document.getElementById("cursorsize-range");
	let cursorsizeRangeIndicator = document.getElementById("cursorsize-range-indicator");
	cursorsizeRange.onmousedown = showIndicator(cursorsizeRangeIndicator);
	cursorsizeRange.onmouseup = hideIndicator(cursorsizeRangeIndicator);
	cursorsizeRange.oninput = updateIndicator(cursorsizeRange, cursorsizeRangeIndicator, function(v){return v.toFixed(2)+"x"});
	cursorsizeRange.value = gamesettings.cursorsize;
	cursorsizeRange.oninput();
	cursorsizeRange.onchange = function() {
		gamesettings.cursorsize = cursorsizeRange.value;
		gamesettings.loadToGame();
        saveToLocal();
	}

	let disableWheelCheck = document.getElementById("disable-wheel-check");
	disableWheelCheck.checked = gamesettings.disableWheel;
	disableWheelCheck.onclick = function() {
		gamesettings.disableWheel = disableWheelCheck.checked;
		gamesettings.loadToGame();
        saveToLocal();
	}

	let disableButtonCheck = document.getElementById("disable-button-check");
	disableButtonCheck.checked = gamesettings.disableButton;
	disableButtonCheck.onclick = function() {
		gamesettings.disableButton = disableButtonCheck.checked;
		gamesettings.loadToGame();
        saveToLocal();
	}

	let autoplayCheck = document.getElementById("autoplay-check");
	autoplayCheck.checked = gamesettings.autoplay;
	autoplayCheck.onclick = function() {
		gamesettings.autoplay = autoplayCheck.checked;
		gamesettings.loadToGame();
        saveToLocal();
	}

	let showhwmouseCheck = document.getElementById("showhwmouse-check");
	showhwmouseCheck.checked = gamesettings.showhwmouse;
	showhwmouseCheck.onclick = function() {
		gamesettings.showhwmouse = showhwmouseCheck.checked;
		gamesettings.loadToGame();
        saveToLocal();
	}

	// keyboard binding settings

	// left button 1
	let lbutton1select = document.getElementById("lbutton1select");
	let l1f = function() {
		let f1l = function() {
			lbutton1select.onclick = l1f;
			lbutton1select.classList.remove("using");
			document.removeEventListener("keydown",f);
		}
		let f = function(e) {
			e = e || window.event;
			gamesettings.K1keycode = e.keyCode;
			gamesettings.K1name = e.key.toUpperCase();
			lbutton1select.value = gamesettings.K1name;
			gamesettings.loadToGame();
	        saveToLocal();
			f1l();
		}
		lbutton1select.classList.add("using");
		document.addEventListener("keydown",f);
		lbutton1select.onclick = f1l;
	}
	lbutton1select.onclick = l1f;
	lbutton1select.value = gamesettings.K1name;


	// right button 1
	let rbutton1select = document.getElementById("rbutton1select");
	let r1f = function() {
		let f1r = function() {
			rbutton1select.onclick = r1f;
			rbutton1select.classList.remove("using");
			document.removeEventListener("keydown",f);
		}
		let f = function(e) {
			e = e || window.event;
			gamesettings.K2keycode = e.keyCode;
			gamesettings.K2name = e.key.toUpperCase();
			rbutton1select.value = gamesettings.K2name;
			gamesettings.loadToGame();
	        saveToLocal();
			f1r();
		}
		rbutton1select.classList.add("using");
		document.addEventListener("keydown",f);
		rbutton1select.onclick = f1r;
	}
	rbutton1select.onclick = r1f;
	rbutton1select.value = gamesettings.K2name;

	// audio settings

	let mastervolumeRange = document.getElementById("mastervolume-range");
	let mastervolumeRangeIndicator = document.getElementById("mastervolume-range-indicator");
	mastervolumeRange.onmousedown = showIndicator(mastervolumeRangeIndicator);
	mastervolumeRange.onmouseup = hideIndicator(mastervolumeRangeIndicator);
	mastervolumeRange.oninput = updateIndicator(mastervolumeRange, mastervolumeRangeIndicator, function(v){return v+"%"});
	mastervolumeRange.value = gamesettings.mastervolume;
	mastervolumeRange.oninput();
	mastervolumeRange.onchange = function() {
		gamesettings.mastervolume = mastervolumeRange.value;
		gamesettings.loadToGame();
        saveToLocal();
	}

	let effectvolumeRange = document.getElementById("effectvolume-range");
	let effectvolumeRangeIndicator = document.getElementById("effectvolume-range-indicator");
	effectvolumeRange.onmousedown = showIndicator(effectvolumeRangeIndicator);
	effectvolumeRange.onmouseup = hideIndicator(effectvolumeRangeIndicator);
	effectvolumeRange.oninput = updateIndicator(effectvolumeRange, effectvolumeRangeIndicator, function(v){return v+"%"});
	effectvolumeRange.value = gamesettings.effectvolume;
	effectvolumeRange.oninput();
	effectvolumeRange.onchange = function() {
		gamesettings.effectvolume = effectvolumeRange.value;
		gamesettings.loadToGame();
        saveToLocal();
	}

	let musicvolumeRange = document.getElementById("musicvolume-range");
	let musicvolumeRangeIndicator = document.getElementById("musicvolume-range-indicator");
	musicvolumeRange.onmousedown = showIndicator(musicvolumeRangeIndicator);
	musicvolumeRange.onmouseup = hideIndicator(musicvolumeRangeIndicator);
	musicvolumeRange.oninput = updateIndicator(musicvolumeRange, musicvolumeRangeIndicator, function(v){return v+"%"});
	musicvolumeRange.value = gamesettings.musicvolume;
	musicvolumeRange.oninput();
	musicvolumeRange.onchange = function() {
		gamesettings.musicvolume = musicvolumeRange.value;
		gamesettings.loadToGame();
        saveToLocal();
	}

	let audiooffsetRange = document.getElementById("audiooffset-range");
	let audiooffsetRangeIndicator = document.getElementById("audiooffset-range-indicator");
	audiooffsetRange.onmousedown = showIndicator(audiooffsetRangeIndicator);
	audiooffsetRange.onmouseup = hideIndicator(audiooffsetRangeIndicator);
	audiooffsetRange.oninput = updateIndicator(audiooffsetRange, audiooffsetRangeIndicator, function(v){return v+"ms"});
	audiooffsetRange.value = gamesettings.audiooffset;
	audiooffsetRange.oninput();
	audiooffsetRange.onchange = function() {
		gamesettings.audiooffset = audiooffsetRange.value;
		gamesettings.loadToGame();
        saveToLocal();
	}

	let beatmapHitsoundCheck = document.getElementById("beatmap-hitsound-check");
	beatmapHitsoundCheck.checked = gamesettings.beatmapHitsound;
	beatmapHitsoundCheck.onclick = function() {
		gamesettings.beatmapHitsound = beatmapHitsoundCheck.checked;
		gamesettings.loadToGame();
        saveToLocal();
	}

}

window.addEventListener('DOMContentLoaded', setOptionPanel);
