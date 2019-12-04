/*
* class: ProgressOverlay (extends PIXI.Container)
* 
* Construct params
*   gamefield: {width, height} in real pixels
*
*/

define([], function()
{
    function ProgressOverlay(windowfield, starttime, endtime) // constructor. 
    {
        PIXI.Container.call(this);
        this.starttime = starttime;
        this.endtime = endtime;

        // remaining time, in lower right corner
        this.remaining = new PIXI.BitmapText("", {font: {name: 'Venera', size: 16}, tint: 0xddffff});
        this.remaining.anchor.set(1);
        this.addChild(this.remaining);
        this.past = new PIXI.BitmapText("", {font: {name: 'Venera', size: 16}, tint: 0xddffff});
        this.past.anchor.set(0,1);
        this.addChild(this.past);

        this.resize = function(windowfield) {
            this.remaining.x = windowfield.width - 10;
            this.remaining.y = windowfield.height - 10;
            this.past.x = 10;
            this.past.y = windowfield.height - 10;
        }
        this.resize(windowfield);

        function timeformat(seconds) {
            let s = Math.round(seconds);
            let prefix = '';
            if (s < 0) {
                prefix = '-';
                s = -s;
            }
            return prefix + Math.floor(s/60) + ":" + (s%60<10?"0":"") + (s%60);
        }

        // parameter t: time(ms) to next approach object; -1 if unavailable
        this.update = function(time) {
            this.remaining.text = timeformat(Math.max(0, (this.endtime - time) / 1000));
            this.past.text = timeformat((time - this.starttime) / 1000);
        }

    }
    
    if ( PIXI.Container ) { ProgressOverlay.__proto__ = PIXI.Container; }
    ProgressOverlay.prototype = Object.create( PIXI.Container && PIXI.Container.prototype );
    ProgressOverlay.prototype.constructor = ProgressOverlay;

    ProgressOverlay.prototype.destroy = function destroy (options)
    {
        PIXI.Container.prototype.destroy.call(this, options);
    };

    return ProgressOverlay;

});
