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
        this.pausetext.x = windowfield.width/2;
        this.pausetext.y = windowfield.height/2;
        this.pausetextshadow = new PIXI.BitmapText('PAUSED', {font: {name: 'Venera', size: 50}});
        this.pausetextshadow.anchor.set(0.5);
        this.pausetextshadow.x = windowfield.width/2;
        this.pausetextshadow.y = windowfield.height/2 + 2;
        this.pausetextshadow.alpha = 0.3;
        this.pausetextshadow.tint = 0;
        this.addChild(this.pausetextshadow);
        this.addChild(this.pausetext);
        
        this.resize = function(windowfield) {
            this.pausetext.x = windowfield.width/2;
            this.pausetext.y = windowfield.height/2;
            this.pausetextshadow.x = windowfield.width/2;
            this.pausetextshadow.y = windowfield.height/2 + 2;
        }

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
