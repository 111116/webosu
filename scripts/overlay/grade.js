/*
* class: GradeMenu (extends PIXI.Container)
* 
* Construct params
*   gamefield: {width, height} in real pixels
*
*/

define([], function()
{
    function GradeMenu(windowfield, score) // constructor. 
    {
        PIXI.Container.call(this);

        this.resize = function(windowfield) {
            this.x = windowfield.width/2;
            this.y = windowfield.height/2;
        }
        this.resize(windowfield);

        this.bg = new PIXI.Sprite(Skin['hpbarright.png']);
        this.bg.rotation = Math.PI/2;
        this.bg.anchor.set(0.5);
        this.bg.scale.set(0.8,500);
        this.bg.alpha = 0.8;
        this.addChild(this.bg);

        this.listname = [];
        this.listname.push(new PIXI.BitmapText('great', {font: {name: 'Venera', size: 16}, tint:0x66ccff}));
        this.listname.push(new PIXI.BitmapText('good', {font: {name: 'Venera', size: 16}, tint:0x88b300}));
        this.listname.push(new PIXI.BitmapText('meh', {font: {name: 'Venera', size: 16}, tint:0xffcc22}));
        this.listname.push(new PIXI.BitmapText('miss', {font: {name: 'Venera', size: 16}, tint:0xed1121}));
        this.listname.push(new PIXI.BitmapText('max combo', {font: {name: 'Venera', size: 16}}));
        this.listname.push(new PIXI.BitmapText('avg err', {font: {name: 'Venera', size: 16}}));
        this.listname.push(new PIXI.BitmapText('stdev', {font: {name: 'Venera', size: 16}}));
        this.listval = [];
        this.listval.push(new PIXI.BitmapText(score.judgecnt.great.toString(), {font: {name: 'Venera', size: 16}}));
        this.listval.push(new PIXI.BitmapText(score.judgecnt.good.toString(), {font: {name: 'Venera', size: 16}}));
        this.listval.push(new PIXI.BitmapText(score.judgecnt.meh.toString(), {font: {name: 'Venera', size: 16}}));
        this.listval.push(new PIXI.BitmapText(score.judgecnt.miss.toString(), {font: {name: 'Venera', size: 16}}));
        this.listval.push(new PIXI.BitmapText(score.maxcombo.toString(), {font: {name: 'Venera', size: 16}}));
        this.listval.push(new PIXI.BitmapText('n/a', {font: {name: 'Venera', size: 16}}));
        this.listval.push(new PIXI.BitmapText('n/a', {font: {name: 'Venera', size: 16}}));
        for (let i=0; i<this.listname.length; ++i) {
            this.addChild(this.listname[i]);
            this.listname[i].anchor.set(0, 0.5);
            this.listname[i].x = -340;
            this.listname[i].y = i * 40 - 120;
            this.addChild(this.listval[i]);
            this.listval[i].anchor.set(1, 0.5);
            this.listval[i].x = -80;
            this.listval[i].y = i * 40 - 120;
        }

        function grade(acc) {
            if (acc >= 1) return 'SS';
            if (acc >= 0.95) return 'S';
            if (acc >= 0.9) return 'A';
            if (acc >= 0.8) return 'B';
            if (acc >= 0.7) return 'C';
            return 'D';
        }
        function gradeColor(acc) {
            if (acc >= 0.95) return 0xfff586;
            if (acc >= 0.9) return 0x5bd85b;
            if (acc >= 0.8) return 0x4ab9ff;
            if (acc >= 0.7) return 0xd657ff;
            return 0xff4444;
        }
        let acc = score.judgeTotal / score.maxJudgeTotal;
        this.gradetext = new PIXI.BitmapText(grade(acc), {font: {name: 'Venera', size: 100}, tint: gradeColor(acc)});
        this.gradetext.letterSpacing = -10;
        this.addChild(this.gradetext);
        this.gradetext.anchor.set(0.5);
        this.gradetext.x = 210;
        this.gradetext.y = -40;

        this.acctext = new PIXI.BitmapText((acc*100).toFixed(2) + '%', {font: {name: 'Venera', size: 16}, tint: gradeColor(acc)});
        this.addChild(this.acctext);
        this.acctext.anchor.set(0.5);
        this.acctext.x = 210;
        this.acctext.y = 20;

        this.scoretext = new PIXI.BitmapText(Math.round(score.score).toString(), {font: {name: 'Venera', size: 40}, tint: 0xddffff});
        this.scoretext.letterSpacing = 5;
        this.addChild(this.scoretext);
        this.scoretext.anchor.set(0.5);
        this.scoretext.x = 210;
        this.scoretext.y = 100;


        this.update = function(timestamp) {
            if (!this.visible)
                return;
        }
    }
    
    if ( PIXI.Container ) { GradeMenu.__proto__ = PIXI.Container; }
    GradeMenu.prototype = Object.create( PIXI.Container && PIXI.Container.prototype );
    GradeMenu.prototype.constructor = GradeMenu;


    GradeMenu.prototype.destroy = function destroy (options)
    {
        PIXI.Container.prototype.destroy.call(this, options);
    };

    return GradeMenu;

});
