/*
* class: BreakOverlay (extends PIXI.Container)
* 
* Construct params
*   gamefield: {width, height} in real pixels
*
*/

define([], function()
{
    function BreakOverlay(windowfield) // constructor. 
    {
        PIXI.Container.call(this);
        this.fadetime = 200;
        this.appearthreshold = 1500;
        this.visible = false;

        this.barmid = new PIXI.Sprite(Skin['bar.png']);
        this.barmid.anchor.set(0.5,0.5);
        this.barmid.x = 0;
        this.barmid.y = 0;
        this.barleft = new PIXI.Sprite(Skin['barend.png']);
        this.barleft.anchor.set(0.1,0.5);
        this.barleft.rotation = Math.PI;
        this.barleft.y = 0;
        this.barright = new PIXI.Sprite(Skin['barend.png']);
        this.barright.anchor.set(0.1,0.5);
        this.barright.y = 0;

        this.barmid.blendMode = PIXI.BLEND_MODES.ADD;
        this.barleft.blendMode = PIXI.BLEND_MODES.ADD;
        this.barright.blendMode = PIXI.BLEND_MODES.ADD;
        this.barmid.scale.set(0.3);
        this.barleft.scale.set(0.3);
        this.barright.scale.set(0.3);
        this.addChild(this.barmid);
        this.addChild(this.barleft);
        this.addChild(this.barright);

        this.number = new PIXI.BitmapText("", {font: {name: 'Venera', size: 40}});
        this.number.anchor.set(0.5);
        this.number.x = 0;
        this.number.y = -40;
        this.addChild(this.number);


        this.resize = function(windowfield) {
            this.x = windowfield.width/2;
            this.y = windowfield.height/2;
        }
        this.resize(windowfield);

        // parameter t: time(ms) to next approach object; -1 if unavailable
        this.countdown = function(nextapproachtime, time) {
            if (nextapproachtime - time > this.appearthreshold && !this.visible) { // start a break
                this.visible = true;
                this.starttime = time;
                this.nextapproachtime = nextapproachtime;
            }
            if (!this.visible) return;
            if (time >= this.nextapproachtime) {
                this.visible = false;
                return;
            }

            let t = this.nextapproachtime - time;
            let radius = 200 * t / (this.nextapproachtime - this.starttime);
            this.barmid.width = 2 * radius;
            this.barleft.x = -radius;
            this.barright.x = radius;
            this.number.text = Math.ceil(t/1000).toString();
            this.alpha = Math.max(0, Math.min(1, Math.min(t,time-this.starttime-500)/this.fadetime));
        }

    }
    
    if ( PIXI.Container ) { BreakOverlay.__proto__ = PIXI.Container; }
    BreakOverlay.prototype = Object.create( PIXI.Container && PIXI.Container.prototype );
    BreakOverlay.prototype.constructor = BreakOverlay;


    BreakOverlay.prototype.destroy = function destroy (options)
    {
        PIXI.Container.prototype.destroy.call(this, options);
    };

    return BreakOverlay;

});
