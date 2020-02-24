/*
* class: ScoreOverlay (extends PIXI.Container)
* responsible for calculating & displaying combo, score, HP, accuracy...
* 
* Construct params
*   gamefield: {width, height} in real pixels
*
* properties
*   tint: 24-bit integer color of display
*   
*/

define([], function()
{
    function addPlayHistory(summary) {
        if (!window.playHistory1000) {
            window.playHistory1000 = [];
        }
        window.playHistory1000.push(summary);
        if (window.playHistory1000.length > 1000)
            window.playHistory1000.shift();
        // save history
        if (window.localforage) {
            localforage.setItem("playhistory1000", window.playHistory1000, function(err, val){
                if (err) {
                    console.error("Error saving play history");
                }
            });
        }
    }
    function grade(acc) {
        if (acc >= 1) return 'SS';
        if (acc >= 0.95) return 'S';
        if (acc >= 0.9) return 'A';
        if (acc >= 0.8) return 'B';
        if (acc >= 0.7) return 'C';
        return 'D';
    }
    function LazyNumber(value = 0) {
        this.value = value;
        this.target = value;
        this.lasttime = -1000000; // playback can start before time=0
    }
    LazyNumber.prototype.lag = 200;
    // param time must be non-decreasing
    LazyNumber.prototype.update = function(time) {
        this.value += (this.target - this.value) * (1 - Math.exp((this.lasttime - time) / this.lag));
        this.lasttime = time;
    }
    // param time must be non-decreasing
    LazyNumber.prototype.set = function(time, value) {
        this.update(time);
        this.target = value;
    }
    // param time must be non-decreasing
    LazyNumber.prototype.valueAt = function(time) {
        this.update(time);
        return this.value;
    }


    function ScoreOverlay(windowfield, HPdrain, scoreMultiplier) // constructor. 
    {
        PIXI.Container.call(this);

        this.field = windowfield;
        this.HPdrain = HPdrain;
        this.scaleMul = windowfield.height / 800;
        this.scoreMultiplier = scoreMultiplier;

        this.score = 0; // this have been multiplied by scoreMultiplier
        this.combo = 0;
        this.maxcombo = 0;
        this.judgeTotal = 0;
        this.maxJudgeTotal = 0;
        this.HP = 1;
        this.fullcombo = true;
        // accuracy = judgeTotal / maxJudgeTotal

        this.onfail = null;
        this.judgecnt = {
            great: 0,
            good: 0,
            meh: 0,
            miss: 0,
        }

        this.score4display = new LazyNumber(this.score);
        this.combo4display = new LazyNumber(this.combo);
        this.accuracy4display = new LazyNumber(1);
        this.HP4display = new LazyNumber(this.HP);

        this.newSpriteArray = function(len, scaleMul = 1, tint = 0xffffff) {
            let a = new Array(len); 
            for (let i=0; i<len; ++i) {
                a[i] = new PIXI.Sprite();
                a[i].scale.x = a[i].scale.y = this.scaleMul * scaleMul;
                a[i].anchor.x = 0;
                a[i].anchor.y = 0;
                a[i].alpha = 1;
                a[i].tint = tint;
                this.addChild(a[i]);
            }
            return a;
        }

        this.scoreDigits = this.newSpriteArray(10, 0.4, 0xddffff); // 9999999999
        this.comboDigits = this.newSpriteArray(6, 0.2, 0xddffff); // 99999x
        this.accuracyDigits = this.newSpriteArray(7, 0.2, 0xddffff); // 100.00%

        this.HPbar = this.newSpriteArray(3, 0.5);
        this.HPbar[0].texture = Skin["hpbarleft.png"];
        this.HPbar[1].texture = Skin["hpbarright.png"];
        this.HPbar[2].texture = Skin["hpbarmid.png"];
        this.HPbar[0].anchor.x = 1;
        this.HPbar[0].scale.x = this.field.width / 500;
        this.HPbar[1].scale.x = this.field.width / 500;
        this.HPbar[0].y = -7 * this.scaleMul;
        this.HPbar[1].y = -7 * this.scaleMul;
        this.HPbar[2].y = -7 * this.scaleMul;

        // value initialization ends
        
        this.resize = function(windowfield) {
            this.field = windowfield;
            this.scaleMul = windowfield.height / 800;

            let f = function(a, mul) {
                for (let i=0; i<a.length; ++i) {
                    a[i].scale.x = a[i].scale.y = mul;
                }
            };
            f(this.scoreDigits, this.scaleMul * 0.4);
            f(this.comboDigits, this.scaleMul * 0.2);
            f(this.accuracyDigits, this.scaleMul * 0.2);
            f(this.HPbar, this.scaleMul * 0.5);

            this.HPbar[0].scale.x = this.field.width / 500;
            this.HPbar[1].scale.x = this.field.width / 500;
            this.HPbar[0].y = -7 * this.scaleMul;
            this.HPbar[1].y = -7 * this.scaleMul;
            this.HPbar[2].y = -7 * this.scaleMul;
        }

        this.HPincreasefor = function(result) {
            switch (result)
            {
                case 0:
                    return -0.02 * this.HPdrain;
                case 50:
                    return 0.01 * (4 - this.HPdrain);
                case 100:
                    return 0.01 * (8 - this.HPdrain);
                case 300:
                    return 0.01 * (10.2 - this.HPdrain);
                default:
                    return 0;
            }
        }

        // should be called when note is hit or missed
        // maxresult: 300 for a hitcircle / slider start & end of every repeat
        // maxresult: 10 for a tick
        this.hit = function(result, maxresult, time) {
            if (maxresult == 300) {
                if (result == 300) this.judgecnt.great++;
                if (result == 100) this.judgecnt.good++;
                if (result == 50) this.judgecnt.meh++;
                if (result == 0) this.judgecnt.miss++;
            }
            this.judgeTotal += result;
            this.maxJudgeTotal += maxresult;
            this.score += this.scoreMultiplier * result * (1 + this.combo / 25);
            // any zero-score result is a miss
            let oldCombo = this.combo;
            this.combo = (result > 0)? this.combo+1 : 0;
            if (result == 0) {
                this.fullcombo = false;
                // combo creak
                if (oldCombo > 20) {
                    // play combo break sound
                    window.game.sampleComboBreak.volume = window.game.masterVolume * window.game.effectVolume;
                    window.game.sampleComboBreak.play();
                }
            }
            this.maxcombo = Math.max(this.maxcombo, this.combo);
            if (this.HP >= 0)
                this.HP += this.HPincreasefor(result);
            this.HP = Math.min(1, this.HP);

            this.score4display.set(time, this.score);
            this.combo4display.set(time, this.combo);
            this.accuracy4display.set(time, this.judgeTotal / this.maxJudgeTotal);
            this.HP4display.set(time, Math.max(0, this.HP));
        }

        this.charspacing = 10; // in texture pixel

        this.setSpriteArrayText = function(arr, str) {
            let width = 0;
            if (str.length > arr.length)
                console.error("displaying string failed");
            for (let i=0; i<str.length; ++i) {
                let ch = str[i];
                if (ch == "%") ch = "percent";
                let textname = "score-" + ch + ".png";
                arr[i].texture = Skin[textname];
                arr[i].knownwidth = arr[i].scale.x * (Skin[textname].width + this.charspacing);
                arr[i].visible = true;
                width += arr[i].knownwidth;
            }
            for (let i=str.length; i<arr.length; ++i) {
                arr[i].visible = false;
            }
            arr.width = width;
            arr.useLength = str.length;
        }

        this.setSpriteArrayPos = function(arr, x, y) {
            let curx = x;
            if (arr.useLength > 0) {} // TODO
                else throw "wtf!";
            for (let i=0; i<arr.useLength; ++i) {
                arr[i].x = curx + arr[i].scale.x * this.charspacing / 2;
                arr[i].y = y;
                curx += arr[i].knownwidth;
            }
        }

        this.update = function(time) {
            if (Number.isNaN(time)) {
                console.error("score overlay update with time = NaN");
                return;
            }
            let HPpos = this.HP4display.valueAt(time) * this.field.width;
            this.HPbar[0].x = HPpos;
            this.HPbar[1].x = HPpos;
            this.HPbar[2].x = HPpos;

            this.setSpriteArrayText(this.scoreDigits, Math.round(this.score4display.valueAt(time)).toString().padStart(6,'0'));
            this.setSpriteArrayText(this.comboDigits, Math.round(this.combo4display.valueAt(time)).toString() + "x");
            this.setSpriteArrayText(this.accuracyDigits, (this.accuracy4display.valueAt(time) * 100).toFixed(2) + "%");
           
            let basex = this.field.width * 0.5;
            let basey = this.field.height * 0.017;
            let unit = Math.min(this.field.width / 640, this.field.height / 480);
            this.setSpriteArrayPos(this.scoreDigits, basex - this.scoreDigits.width / 2, basey);
            this.setSpriteArrayPos(this.accuracyDigits, basex - this.scoreDigits.width / 2 - this.accuracyDigits.width - 16*unit, basey + 3*unit);
            this.setSpriteArrayPos(this.comboDigits, basex + this.scoreDigits.width / 2 + 16*unit, basey + 3*unit);
        }

        function uploadScore(summary) {
            let xhr = new XMLHttpRequest();
            let url = "http://api.osugame.online/send/";
            url += "?sid=" + encodeURIComponent(summary.sid);
            url += "&bid=" + encodeURIComponent(summary.bid);
            url += "&title=" + encodeURIComponent(summary.title);
            url += "&version=" + encodeURIComponent(summary.version);
            url += "&mods=" + encodeURIComponent(summary.mods);
            url += "&grade=" + encodeURIComponent(summary.grade);
            url += "&score=" + encodeURIComponent(summary.score);
            url += "&combo=" + encodeURIComponent(summary.combo);
            url += "&acc=" + encodeURIComponent(summary.acc);
            url += "&time=" + encodeURIComponent(summary.time);
            xhr.open("GET", url);
            console.log(url);
            xhr.onload = function() {
                console.log("play record uploaded");
            }
            xhr.onerror = function() {
                console.error("play record upload failed");
            }
            xhr.send();
        }

        this.showSummary = function(metadata, hiterrors, retryCallback, quitCallback) {
            function errortext(a) {
                let sum = 0;
                for (let i=0; i<a.length; ++i)
                    sum += a[i];
                let avg = sum / a.length;
                let sumsqerr = 0;
                for (let i=0; i<a.length; ++i)
                    sumsqerr += (a[i]-avg) * (a[i]-avg);
                let variance = sumsqerr / a.length;
                let stdev = Math.sqrt(variance);
                let sgnavg = avg.toFixed(0);
                if (sgnavg[0] != '-')
                    sgnavg = '+' + sgnavg;
                return sgnavg + "±" + stdev.toFixed(0) + "ms";
            }
            function modstext(game) {
                let l = [];
                if (game.easy) l.push("EZ");
                if (game.daycore) l.push("DC");
                if (game.hidden) l.push("HD");
                if (game.hardrock) l.push("HR");
                if (game.nightcore) l.push("NC");
                if (game.autoplay) l.push("AT");
                if (l.length == 0) return "";
                let s = l[0];
                for (let i=1; i<l.length; ++i)
                    s = s + '+' + l[i];
                return s;
            }
            function newdiv(parent, classname, text) {
                let div = document.createElement("div");
                if (parent)
                    parent.appendChild(div);
                if (classname)
                    div.className = classname;
                if (text)
                    div.innerText = text;
                return div;
            }
            let acc = this.judgeTotal / this.maxJudgeTotal;
            let rank = this.HP<0? "F": grade(acc);
            let grading = newdiv(null, "grading");
            grading.classList.add("transparent");
            document.body.appendChild(grading);
            let top = newdiv(grading, "top");
            let info = newdiv(top, "beatmap-info");
            newdiv(info, "title", metadata.Title);
            newdiv(info, "artist", metadata.Artist);
            newdiv(info, "version", metadata.Version);
            newdiv(info, "mapper", "mapped by " + metadata.Creator);
            newdiv(info, "version", modstext(window.game));
            newdiv(top, "ranking", "Ranking");
            newdiv(top, "grade " + rank, rank);
            let left = newdiv(grading, "left");
            newdiv(left, "block score", Math.round(this.score).toString());
            newdiv(left, "block acc", (acc*100).toFixed(2)+"%");
            newdiv(left, "block err", errortext(hiterrors));
            newdiv(left, "block great", this.judgecnt.great.toString());
            newdiv(left, "block good", this.judgecnt.good.toString());
            newdiv(left, "block meh", this.judgecnt.meh.toString());
            newdiv(left, "block miss", this.judgecnt.miss.toString());
            newdiv(left, "block placeholder");
            newdiv(left, "block combo", this.maxcombo.toString() + "x");
            if (this.fullcombo)
                newdiv(left, "fullcombo");
            let b1 = newdiv(grading, "btn retry");
            newdiv(b1, "inner", "Retry");
            b1.onclick = function() {
                grading.remove();
                retryCallback();
            }
            let b2 = newdiv(grading, "btn quit");
            newdiv(b2, "inner", "Quit");
            b2.onclick = function() {
                grading.remove();
                quitCallback();
            }
            window.setTimeout(function(){grading.classList.remove("transparent")},100);
            // generate summary data
            let summary = {
                sid: metadata.BeatmapSetID,
                bid: metadata.BeatmapID,
                title: metadata.Title,
                version: metadata.Version,
                mods: modstext(window.game),
                grade: rank,
                score: Math.round(this.score).toString(),
                combo: this.maxcombo.toString(),
                acc: (acc*100).toFixed(2)+"%",
                time: new Date().getTime()
            }
            addPlayHistory(summary);
            uploadScore(summary);
            // show history best
            if (window.localforage && summary.bid) {
                window.localforage.getItem("historybest", function(err, val) {
                    if (err) return;
                    let historybest = 0;
                    if (val && val.size) {
                        historybest = val.get(summary.bid) || 0;
                    }
                    newdiv(left, "history-best", historybest.toString());
                    if (parseInt(summary.score) > historybest) {
                        if (!val || !val.size)
                            val = new Map();
                        val.set(summary.bid, parseInt(summary.score));
                        window.localforage.setItem("historybest", val, function(err, val){
                            if (err) console.error("failed saving best score");
                        });
                    }
                })

            }
        }
    }
    
    if ( PIXI.Container ) { ScoreOverlay.__proto__ = PIXI.Container; }
    ScoreOverlay.prototype = Object.create( PIXI.Container && PIXI.Container.prototype );
    ScoreOverlay.prototype.constructor = ScoreOverlay;


    ScoreOverlay.prototype.destroy = function destroy (options)
    {
        PIXI.Container.prototype.destroy.call(this, options);
    };

    return ScoreOverlay;

});
