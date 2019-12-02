/*
* class: PauseMenu (extends PIXI.Container)
* 
* Construct params
*   gamefield: {width, height} in real pixels
*
*/

define([], function()
{
    function PauseMenu(windowfield) // constructor. 
    {
        PIXI.Container.call(this);
        this.visible = false;

        this.pausetext = new PIXI.BitmapText('PAUSED', {font: {name: 'Venera', size: 50}});
        this.pausetext.anchor.set(0.5);
        this.bg = new PIXI.Sprite(Skin['hpbarright.png']);
        this.bg.rotation = Math.PI/2;
        this.bg.anchor.set(0.5);
        this.bg.scale.set(0.3,500);
        this.bg.alpha = 0.8;
        this.addChild(this.bg);
        this.addChild(this.pausetext);
        
        this.resize = function(windowfield) {
            this.pausetext.x = windowfield.width/2;
            this.pausetext.y = windowfield.height/2;
            this.bg.x = windowfield.width/2;
            this.bg.y = windowfield.height/2;
        }
        this.resize(windowfield);

        this.pause = function() {
            this.visible = true;
        }

        this.resume = function() {
            this.visible = false;
        }

    }
    
    if ( PIXI.Container ) { PauseMenu.__proto__ = PIXI.Container; }
    PauseMenu.prototype = Object.create( PIXI.Container && PIXI.Container.prototype );
    PauseMenu.prototype.constructor = PauseMenu;


    PauseMenu.prototype.destroy = function destroy (options)
    {
        PIXI.Container.prototype.destroy.call(this, options);
    };

    return PauseMenu;

});
