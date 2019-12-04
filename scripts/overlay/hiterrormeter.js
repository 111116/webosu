/*
* class: ErrorMeter (extends PIXI.Container)
* responsible for calculating & displaying combo, score, HP, accuracy...
* 
* Construct params
*   windowfield: {width, height} in real pixels
*   r300, r100, r50: hit judgement window radius (in milliseconds)
*/

define([], function()
{
    function ErrorMeter(windowfield, r300, r100, r50) // constructor. 
    {
        PIXI.Container.call(this);

        this.barheight = 220;
        this.barwidth = 2;
        this.color300 = 0x66ccff;
        this.color100 = 0x88b300;
        this.color50 = 0xffcc22;

        // initialize sprites
        this.newbar = function() {
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
            let bar = new PIXI.Container();
            bar.addChild(newbarpiece(this.barheight, this.color50));
            bar.addChild(newbarpiece(this.barheight * r100 / r50, this.color100));
            bar.addChild(newbarpiece(this.barheight * r300 / r50, this.color300));

            let centerline = new PIXI.Sprite(Skin["errormeterbar.png"]);
            centerline.width = 5;
            centerline.height = 2;
            centerline.anchor.set(0,0.5);
            centerline.tint = this.color300;
            centerline.x = 0;
            centerline.y = 0;
            bar.addChild(centerline);

            let marker = new PIXI.Sprite(Skin["reversearrow.png"]);
            marker.scale.set(0.08);
            marker.anchor.set(0.5);
            marker.x = -8;
            marker.y = 0;
            bar.addChild(marker);

            return bar;
        }
        this.barl = this.newbar();
        this.barr = this.newbar();
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

        this.hit = function(error, time) {
        }


        this.update = function(time) {

        }
    }
    
    if ( PIXI.Container ) { ErrorMeter.__proto__ = PIXI.Container; }
    ErrorMeter.prototype = Object.create( PIXI.Container && PIXI.Container.prototype );
    ErrorMeter.prototype.constructor = ErrorMeter;

    ErrorMeter.prototype.destroy = function destroy (options)
    {
        PIXI.Container.prototype.destroy.call(this, options);
    };

    return ErrorMeter;

});
