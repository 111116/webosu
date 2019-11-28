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

define([], function()
{
    function LazyNumber(value = 0) {
        this.value = value;
        this.target = value;
        this.lasttime = -1000000; // playback can start before time=0
    }
    LazyNumber.prototype.lag = 300;
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
        this.scaleMul = windowfield.height / 800;

        this.score = 0;
        this.combo = 0;
        this.judgeTotal = 0;
        this.maxJudgeTotal = 0;
        this.HP = 1;
        // accuracy = score / maxscore

        this.onfail = null;

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

        this.scoreDigits = this.newSpriteArray(7, 0.4, 0xddffff); // 1000000
        this.comboDigits = this.newSpriteArray(5, 0.2, 0xddffff); // 1000x
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

        this.hit = function(result, time) {
            this.judgeTotal += result;
            this.maxJudgeTotal += 300;
            this.score += result * (1 + this.combo / 25);
            // any zero-score result is a miss
            this.combo = (result > 0)? this.combo+1 : 0;
            this.HP += this.HPincreasefor(result);
            this.HP = Math.min(1, Math.max(0, this.HP));

            this.score4display.set(time, this.score);
            this.combo4display.set(time, this.combo);
            this.accuracy4display.set(time, this.judgeTotal / this.maxJudgeTotal);
            this.HP4display.set(time, this.HP);
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
