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

function setOptionPanel() {
	// give inputs initial value; set their callback on change
	// give range inputs a visual feedback (a hovering indicator that shows on drag)

	window.gamesettings = {
		dim: 70,
		blur: 100,
		cursorsize: 1.0,
		disableWheel: false,
		disableButton: false,
		mastervolume: 60,
		effectvolume: 100,
		musicvolume: 100,
		audiooffset: 0,
		beatmapHitsound: false,
	};

	// gameplay settings

	let dimRange = document.getElementById("dim-range");
	let dimRangeIndicator = document.getElementById("dim-range-indicator");
	dimRange.onmousedown = showIndicator(dimRangeIndicator);
	dimRange.onmouseup = hideIndicator(dimRangeIndicator);
	dimRange.oninput = updateIndicator(dimRange, dimRangeIndicator, function(v){return v+"%"});
	dimRange.oninput();
	dimRange.value = gamesettings.dim;
	dimRange.onchange = function() {

	}

	let blurRange = document.getElementById("blur-range");
	let blurRangeIndicator = document.getElementById("blur-range-indicator");
	blurRange.onmousedown = showIndicator(blurRangeIndicator);
	blurRange.onmouseup = hideIndicator(blurRangeIndicator);
	blurRange.oninput = updateIndicator(blurRange, blurRangeIndicator, function(v){return v+"%"});
	blurRange.oninput();
	blurRange.value = gamesettings.blur;
	blurRange.onchange = function() {

	}

	let cursorsizeRange = document.getElementById("cursorsize-range");
	let cursorsizeRangeIndicator = document.getElementById("cursorsize-range-indicator");
	cursorsizeRange.onmousedown = showIndicator(cursorsizeRangeIndicator);
	cursorsizeRange.onmouseup = hideIndicator(cursorsizeRangeIndicator);
	cursorsizeRange.oninput = updateIndicator(cursorsizeRange, cursorsizeRangeIndicator, function(v){return v.toFixed(2)+"x"});
	cursorsizeRange.oninput();
	cursorsizeRange.value = gamesettings.cursorsize;
	cursorsizeRange.onchange = function() {

	}

	let disableWheelCheck = document.getElementById("disable-wheel-check");
	disableWheelCheck.checked = gamesettings.disableWheel;
	disableWheelCheck.onclick = function() {

	}

	let disableButtonCheck = document.getElementById("disable-button-check");
	disableButtonCheck.checked = gamesettings.disableButton;
	disableButtonCheck.onclick = function() {

	}

	// audio settings

	let mastervolumeRange = document.getElementById("mastervolume-range");
	let mastervolumeRangeIndicator = document.getElementById("mastervolume-range-indicator");
	mastervolumeRange.onmousedown = showIndicator(mastervolumeRangeIndicator);
	mastervolumeRange.onmouseup = hideIndicator(mastervolumeRangeIndicator);
	mastervolumeRange.oninput = updateIndicator(mastervolumeRange, mastervolumeRangeIndicator, function(v){return v+"%"});
	mastervolumeRange.oninput();
	mastervolumeRange.value = gamesettings.mastervolume;
	mastervolumeRange.onchange = function() {

	}

	let effectvolumeRange = document.getElementById("effectvolume-range");
	let effectvolumeRangeIndicator = document.getElementById("effectvolume-range-indicator");
	effectvolumeRange.onmousedown = showIndicator(effectvolumeRangeIndicator);
	effectvolumeRange.onmouseup = hideIndicator(effectvolumeRangeIndicator);
	effectvolumeRange.oninput = updateIndicator(effectvolumeRange, effectvolumeRangeIndicator, function(v){return v+"%"});
	effectvolumeRange.oninput();
	effectvolumeRange.value = gamesettings.effectvolume;
	effectvolumeRange.onchange = function() {

	}

	let musicvolumeRange = document.getElementById("musicvolume-range");
	let musicvolumeRangeIndicator = document.getElementById("musicvolume-range-indicator");
	musicvolumeRange.onmousedown = showIndicator(musicvolumeRangeIndicator);
	musicvolumeRange.onmouseup = hideIndicator(musicvolumeRangeIndicator);
	musicvolumeRange.oninput = updateIndicator(musicvolumeRange, musicvolumeRangeIndicator, function(v){return v+"%"});
	musicvolumeRange.oninput();
	musicvolumeRange.value = gamesettings.musicvolume;
	musicvolumeRange.onchange = function() {

	}

	let audiooffsetRange = document.getElementById("audiooffset-range");
	let audiooffsetRangeIndicator = document.getElementById("audiooffset-range-indicator");
	audiooffsetRange.onmousedown = showIndicator(audiooffsetRangeIndicator);
	audiooffsetRange.onmouseup = hideIndicator(audiooffsetRangeIndicator);
	audiooffsetRange.oninput = updateIndicator(audiooffsetRange, audiooffsetRangeIndicator, function(v){return v+"ms"});
	audiooffsetRange.oninput();
	audiooffsetRange.value = gamesettings.audiooffset;
	audiooffsetRange.onchange = function() {

	}

	let beatmapHitsoundCheck = document.getElementById("beatmap-hitsound-check");
	beatmapHitsoundCheck.checked = gamesettings.beatmapHitsound;
	beatmapHitsoundCheck.onclick = function() {
		
	}

}

window.addEventListener('DOMContentLoaded', setOptionPanel);
