// beatmap downloader

(() => {

    /**
     * Preview Audio
     */
    class PreviewAudio {
        /**
         * Build a PreviewAudio object
         * @param {string | number} sid Beatmap's sid
         * @param {number} volume Volume of preview audio
         */
        constructor(sid, volume = 1) {
            const audioContext = new Audio("https://cdn.sayobot.cn:25225/preview/" + sid + ".mp3");
            this._sid = sid;
            this._volume = volume;
            this._audioContext = audioContext;
            this._playing = false;
            this._ready = false;
            this._timer = 0;
            audioContext.load();
            audioContext.volume = 0;
            audioContext.addEventListener('canplay', () => {
                this._ready = true
                if(this._playing === true){
                    this.play();
                }
            }, {once: true})
        }
        play() {
            this._playing  = true;
            if(this._ready){
                this._playing = true
                this._audioContext.volume = 0;
                this._audioContext.currentTime = 0;
                this._audioContext.play();
                clearInterval(this._timer);
                this._timer = setInterval(() => {
                    if (this._audioContext.volume < this._volume)
                        this._audioContext.volume = Math.min(this._volume, this._audioContext.volume + 0.05 * this._volume);
                    else
                        clearInterval(this._timer);
                }, 30);    
            }
        }
        stop() {
            this._playing = false
            clearInterval(this._timer);
            this._timer = setInterval(() => {
                this._audioContext.volume = Math.max(0, this._audioContext.volume - 0.05 * this._volume);
                if (this._audioContext.volume === 0) {
                    clearInterval(this._timer);
                }
            }, 10);
        }
        set volume(value) {
            this._volume = value;
        }
        get volume() {
            return this._volume;
        }
    }

    class PreviewAudioManager {
        /**
         * Create a preview audio manager
         * @param {object} [settings] Preview audio manager settings
         * @param {number} [settings.volume] Audio's volume
         */
        constructor(settings = {}) {
            const {volume} = settings
            /**
             * @type {PreviewAudio}
             */
            this._active = null;
            this._volume = volume;
        }
        /**
         * Play preview audio
         * @param {string | number} sid Beatmap's sid
         */
        play(sid) {
            if(this._active){
                this._active.stop();
            }
            this._active = new PreviewAudio(sid, this._volume);
            this._active.play()
        }
        stop() {
            if(this._active){
                this._active.stop();
            }
        }
        set volume(value) {
            if(value > 1){
                value = 1;
            }
            this._volume = value;
            if(this._active) {
                this._active.volume = value;
            }
        }
        get volume() {
            return this._volume;
        }
    }

    const previewAudioMgr = new PreviewAudioManager()

    function startpreview(box) {
        let volume = 1;
        if (window.gamesettings) {
            volume = (window.gamesettings.mastervolume/100) * (window.gamesettings.musicvolume/100);
            volume = Math.min(1, Math.max(0, volume));
        }
        previewAudioMgr.volume = volume
        previewAudioMgr.play(box.sid)
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
        }
        xhr.onprogress = function(e) {
            bar.value = e.loaded / e.total;
        }
        xhr.onerror = function() {
            console.error("download failed");
            alert("Beatmap download failed. Please retry later.")
            box.downloading = false;
            box.classList.remove("downloading");
        }
        xhr.send();
    }

    window.startdownload = startdownload
    window.previewAudioMgr = previewAudioMgr
})()