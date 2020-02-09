/*
* class: ErrorMeterOverlay (extends PIXI.Container)
* responsible for calculating & displaying combo, score, HP, accuracy...
* 
* Construct params
*   windowfield: {width, height} in real pixels
*   r300, r100, r50: hit judgement window radius (in milliseconds)
*/

define([], function()
{
    // ErrorMeter: a single meter
    function ErrorMeter(r300, r100, r50)
    {
        PIXI.Container.call(this);

        const barheight = 220;
        const color300 = 0x66ccff;
        const color100 = 0x88b300;
        const color50 = 0xffcc22;
        this.lscale = barheight / 2 / r50; // pixel per millisecond

        let newbarpiece = function(height, tint) {
            let piece = new PIXI.Sprite(Skin["errormeterbar.png"]);
            piece.width = 2;
            piece.height = height;
            piece.tint = tint;
            piece.anchor.set(0.5);
            piece.x = 0;
            piece.y = 0;
            return piece;
        }
        this.addChild(newbarpiece(barheight, color50));
        this.addChild(newbarpiece(barheight * r100 / r50, color100));
        this.addChild(newbarpiece(barheight * r300 / r50, color300));

        let centerline = new PIXI.Sprite(Skin["errormeterbar.png"]);
        centerline.width = 5;
        centerline.height = 2;
        centerline.anchor.set(0,0.5);
        centerline.tint = color300;
        centerline.x = 0;
        centerline.y = 0;
        this.addChild(centerline);

        this.avgmarker = new PIXI.Sprite(Skin["reversearrow.png"]);
        this.avgmarker.scale.set(0.08);
        this.avgmarker.anchor.set(0.5);
        this.avgmarker.x = -8;
        this.avgmarker.y = 0;
        this.addChild(this.avgmarker);

        this.ticks = [];
        this.poolsize = 20;
        for (let i=0; i<this.poolsize; ++i) {
            let tick = new PIXI.Sprite(Skin["errormeterindicator.png"]);
            tick.scale.set(0.2);
            tick.anchor.set(0, 0.5);
            tick.alpha = 0;
            tick.t0 = -23333;
            tick.x = 2;
            this.ticks.push(tick);
            this.addChild(tick);
        }
        this.poolptr = 0;
        this.avgerror = 0;
    }
    if ( PIXI.Container ) { ErrorMeter.__proto__ = PIXI.Container; }
    ErrorMeter.prototype = Object.create( PIXI.Container && PIXI.Container.prototype );
    ErrorMeter.prototype.constructor = ErrorMeter;
    ErrorMeter.prototype.destroy = function destroy (options)
    {
        PIXI.Container.prototype.destroy.call(this, options);
    };
    ErrorMeter.prototype.update = function(time) {
        for (let i=0; i<this.poolsize; ++i) {
            this.ticks[i].alpha = Math.exp(-(time-this.ticks[i].t0) / 1000);
        }
    }
    ErrorMeter.prototype.hit = function(hiterror, time) {
        let tick = this.ticks[this.poolptr];
        this.poolptr = (this.poolptr + 1) % this.poolsize;
        tick.t0 = time;
        tick.y = hiterror * this.lscale;
        this.avgerror = this.avgerror * 0.9 + hiterror * 0.1;
        this.avgmarker.y = this.avgerror * this.lscale;
    }

    function ErrorMeterOverlay(windowfield, r300, r100, r50) // constructor. 
    {
        PIXI.Container.call(this);

        this.barl = new ErrorMeter(r300, r100, r50);
        this.barr = new ErrorMeter(r300, r100, r50);
        this.record = [];
        this.barr.scale.x = -1;
        this.addChild(this.barl);
        this.addChild(this.barr);

        this.resize = function(windowfield) {
            this.barl.x = 27;
            this.barl.y = windowfield.height / 2;
            this.barr.x = windowfield.width - 27;
            this.barr.y = windowfield.height / 2;
        }
        this.resize(windowfield);

        this.hit = function(hiterror, time) {
            this.barl.hit(hiterror, time);
            this.barr.hit(hiterror, time);
            this.record.push(hiterror);
        }

        this.update = function(time) {
            this.barl.update(time);
            this.barr.update(time);
        }
    }
    
    if ( PIXI.Container ) { ErrorMeterOverlay.__proto__ = PIXI.Container; }
    ErrorMeterOverlay.prototype = Object.create( PIXI.Container && PIXI.Container.prototype );
    ErrorMeterOverlay.prototype.constructor = ErrorMeterOverlay;

    ErrorMeterOverlay.prototype.destroy = function destroy (options)
    {
        PIXI.Container.prototype.destroy.call(this, options);
    };

    return ErrorMeterOverlay;

});
