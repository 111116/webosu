/*
* class: ScoreOverlay (extends PIXI.Container)
* responsible for calculating & displaying combo, score, HP, accuracy...
* 
* Construct params
*   gamefield: {width, height, xoffset, yxoffset} in real pixels
*
* properties
*   tint: 24-bit integer color of display
*   
*/

define(["skin"], function(Skin)
{
    function LazyNumber(value = 0) {
        this.value = value;
        this.target = value;
        this.lasttime = 0;
    }
    LazyNumber.prototype.lag = 0.01;
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


    function ScoreOverlay(windowfield, HPdrain) // constructor. 
    {
        PIXI.Container.call(this);

        this.field = windowfield;
        this.HPdrain = HPdrain;
        this.scaleMul = 1;
        this.tint = 0xffffff;

        this.score = 0;
        this.combo = 0;
        this.maxscore = 0;
        this.HP = 1;
        // accuracy = score / maxscore

        this.onfail = null;

        this.score4display = new LazyNumber(this.score);
        this.combo4display = new LazyNumber(this.combo);
        this.accuracy4display = new LazyNumber(1);
        this.HP4display = new LazyNumber(this.HP);

        this.newSpriteArray = function(len, scaleMul = 1, anchorx = 0, anchory = 0) {
            let a = new Array(len); 
            for (let i=0; i<len; ++i) {
                a[i] = new PIXI.Sprite();
                a[i].scale.x = a[i].scale.y = this.scaleMul * scaleMul;
                a[i].anchor.x = anchorx;
                a[i].anchor.y = anchory;
                a[i].alpha = 1;
                this.addChild(a[i]);
            }
            return a;
        }

        this.scoreDigits = this.newSpriteArray(7); // 1000000
        this.comboDigits = this.newSpriteArray(5, 0.5); // 1000x
        this.accuracyDigits = this.newSpriteArray(7, 0.5); // 100.00%

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

        this.hit = function(result, time) {
            this.score += result;
            this.maxscore += 300;
            // any zero-score result is a miss
            this.combo = (result > 0)? this.combo+1 : 0;
            this.HP += this.HPincreasefor(result);

            this.score4display.set(time, this.score);
            this.combo4display.set(time, this.combo);
            console.log("acc", this.score / this.maxscore);
            this.accuracy4display.set(time, this.score / this.maxscore);
            this.HP4display.set(time, this.HP);
        }

        this.setSpriteArrayText = function(arr, str) {
            let width = 0;
            if (str.length > arr.length)
                console.error("displaying string failed");
            for (let i=0; i<str.length; ++i) {
                let textname = "score-" + str[i] + ".png";
                arr[i].texture = Skin[textname];
                arr[i].knownwidth = arr[i].scale.x * Skin[textname].width;
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
                arr[i].x = curx;
                arr[i].y = y;
                curx += arr[i].knownwidth;
            }
        }

        this.update = function(time) {
            console.log("score overlay updating");
            this.score4display.set(time, this.score);
            this.combo4display.set(time, this.combo);
            if (this.maxscore > 0)
                this.accuracy4display.set(time, this.score / this.maxscore);

            this.setSpriteArrayText(this.scoreDigits, Math.round(this.score4display.valueAt(time)).toString().padStart(6,'0'));
            this.setSpriteArrayText(this.comboDigits, Math.round(this.combo4display.valueAt(time)).toString() + "X");
            this.setSpriteArrayText(this.accuracyDigits, (this.accuracy4display.valueAt(time) * 100).toFixed(2) + "%");
           
            let basex = this.field.width * 0.5;
            let basey = this.field.height * 0.02;
            let unit = Math.min(this.field.width / 640, this.field.height / 480);
            this.setSpriteArrayPos(this.scoreDigits, basex - this.scoreDigits.width / 2, basey);
            this.setSpriteArrayPos(this.accuracyDigits, basex - this.scoreDigits.width / 2 - this.accuracyDigits.width - 16*unit, basey + 4*unit);
            this.setSpriteArrayPos(this.comboDigits, basex + this.scoreDigits.width / 2 + 16*unit, basey + 4*unit);
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
