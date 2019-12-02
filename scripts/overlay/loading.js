/*
* class: LoadingMenu (extends PIXI.Container)
* 
* Construct params
*   gamefield: {width, height} in real pixels
*
*/

define([], function()
{
    function LoadingMenu(windowfield, track) // constructor. 
    {
        PIXI.Container.call(this);
        this.fadetime = 200;
        this.alpha = 1;
        this.hidden = false;

        this.bg = new PIXI.Sprite(Skin['hpbarright.png']);
        this.bg.rotation = Math.PI/2;
        this.bg.anchor.set(0.5);
        this.bg.scale.set(0.6,500);
        this.bg.alpha = 0.8;
        this.addChild(this.bg);

        this.titletext = new PIXI.BitmapText(track.metadata.Title || '-', {font: {name: 'Venera', size: 24}});
        this.artisttext = new PIXI.BitmapText(track.metadata.Artist || '-', {font: {name: 'Venera', size: 14}});
        this.versiontext = new PIXI.BitmapText(track.metadata.Version || '-', {font: {name: 'Venera', size: 14}});
        this.sourcetext = new PIXI.BitmapText("Source: " + (track.metadata.Source || '-'), {font: {name: 'Venera', size: 14}});
        this.mappertext = new PIXI.BitmapText("Mapper: " + (track.metadata.Creator || '-'), {font: {name: 'Venera', size: 14}});
        this.titletext.anchor.set(0.5);
        this.artisttext.anchor.set(0.5);
        this.versiontext.anchor.set(0.5);
        this.sourcetext.anchor.set(0.5);
        this.mappertext.anchor.set(0.5);

        this.addChild(this.titletext);
        this.addChild(this.artisttext);
        this.addChild(this.versiontext);
        this.addChild(this.sourcetext);
        this.addChild(this.mappertext);

        this.loading = new PIXI.Sprite(Skin['dot.png']);
        this.loading.anchor.set(0.5,0.3);
        this.loading.scale.set(1,0.6);
        this.addChild(this.loading);
        
        this.resize = function(windowfield) {
            this.bg.x = windowfield.width/2;
            this.bg.y = windowfield.height/2;
            this.titletext.x = windowfield.width/2;
            this.artisttext.x = windowfield.width/2;
            this.versiontext.x = windowfield.width/2;
            this.sourcetext.x = windowfield.width/2;
            this.mappertext.x = windowfield.width/2;
            this.titletext.y = windowfield.height/2 - 90;
            this.artisttext.y = windowfield.height/2 - 60;
            this.versiontext.y = windowfield.height/2 + 60;
            this.sourcetext.y = windowfield.height/2 + 85;
            this.mappertext.y = windowfield.height/2 + 110;
            this.loading.x = windowfield.width/2;
            this.loading.y = windowfield.height/2;
        }
        this.resize(windowfield);

        this.hide = function(volume) {
            this.hidden = true;
        }

        this.updateloading = function(timestamp) {
            this.loading.rotation = timestamp/128;
        }

        this.update = function(timestamp) {
            if (!this.visible)
                return;
            if (!this.hidden) {
                this.updateloading(timestamp);
                return;
            }
            if (this.hidden && !this.t0) {
                this.t0 = timestamp;
                this.changed = false;
            }   
            let dt = timestamp - this.t0;
            if (dt > this.fadetime) {
                this.visible = false;
            }
            else {
                this.alpha = 1 - dt/this.fadetime;
            }
        }

    }
    
    if ( PIXI.Container ) { LoadingMenu.__proto__ = PIXI.Container; }
    LoadingMenu.prototype = Object.create( PIXI.Container && PIXI.Container.prototype );
    LoadingMenu.prototype.constructor = LoadingMenu;


    LoadingMenu.prototype.destroy = function destroy (options)
    {
        PIXI.Container.prototype.destroy.call(this, options);
    };

    return LoadingMenu;

});
