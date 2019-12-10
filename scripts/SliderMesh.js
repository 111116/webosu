/*
* custom class, extends PIXI.Container
* each instance is a Pixi-renderable slider
* properties: alpha
*
* constructor params
*   curve: array of points, in osu pixels
*   radius: radius of hit circle, in osu! pixels
*   transform: {dx,ox,dy,oy} (x,y)->(x*dx+ox, y*dy+oy) [-1,1]x[-1,1]
*   tint: 24-bit integer color of inner slider body, RGB from highbits to lowbits
*/

define([],
function() {

    Container = PIXI.Container;

    // vertex shader source
    const vertexSrc = `
    precision mediump float;
    attribute vec4 position;
    varying float dist;
    uniform float dx,dy,dt,ox,oy,ot;
    void main() {
        dist = position[3];
        gl_Position = vec4(position[0], position[1], position[3] + 2.0 * float(position[2]*dt>ot), 1.0);
        gl_Position.x = gl_Position.x * dx + ox;
        gl_Position.y = gl_Position.y * dy + oy;
    }`;

    // fragment shader source
    const fragmentSrc = `
    precision mediump float;
    varying float dist;
    uniform sampler2D uSampler2;
    uniform float alpha;
    uniform float texturepos;
    void main() {
        gl_FragColor = alpha * texture2D(uSampler2, vec2(dist, texturepos));
    }`;

    // create line texture for slider from tint color
    function newTexture(colors, SliderTrackOverride, SliderBorder) {

        const borderwidth = 0.128;
        const innerPortion = 1 - borderwidth;
        const edgeOpacity = 0.8;
        const centerOpacity = 0.3;
        const blurrate = 0.015;
        const width = 200;

        let buff = new Uint8Array(colors.length * width * 4);

        for (let k=0; k<colors.length; ++k) {
            let tint = (typeof(SliderTrackOverride) != 'undefined')? SliderTrackOverride: colors[k];
            let bordertint = (typeof(SliderBorder) != 'undefined')? SliderBorder: 0xffffff;
            let borderR = (bordertint>>16)/255;
            let borderG = ((bordertint>>8)&255)/255;
            let borderB = (bordertint&255)/255;
            let borderA = 1.0;
            let innerR = (tint>>16)/255;
            let innerG = ((tint>>8)&255)/255;
            let innerB = (tint&255)/255;
            let innerA = 1.0;
            for (let i = 0; i < width; i++) {
                let position = i / width;
                let R,G,B,A;
                if (position >= innerPortion) // draw border color
                {
                    R = borderR;
                    G = borderG;
                    B = borderB;
                    A = borderA;
                }
                else // draw inner color
                {
                    R = innerR;
                    G = innerG;
                    B = innerB;
                    // TODO: tune this to make opacity transition smoother at center
                    A = innerA * ((edgeOpacity - centerOpacity) * position / innerPortion + centerOpacity);
                }
                // pre-multiply alpha
                R*=A;
                G*=A;
                B*=A;
                // blur at edge for "antialiasing" without supersampling
                if (1-position < blurrate) // outer edge
                {
                    R *= (1-position) / blurrate;
                    G *= (1-position) / blurrate;
                    B *= (1-position) / blurrate;
                    A *= (1-position) / blurrate;
                }
                if (innerPortion - position > 0 && innerPortion - position < blurrate)
                {
                    let mu = (innerPortion - position) / blurrate;
                    R = mu * R + (1-mu) * borderR * borderA;
                    G = mu * G + (1-mu) * borderG * borderA;
                    B = mu * B + (1-mu) * borderB * borderA;
                    A = mu * innerA + (1-mu) * borderA;
                }
                buff[(k*width+i)*4] = R*255;
                buff[(k*width+i)*4+1] = G*255;
                buff[(k*width+i)*4+2] = B*255;
                buff[(k*width+i)*4+3] = A*255;
            }
        }
        return PIXI.Texture.fromBuffer(buff, width, colors.length);
    }


    const DIVIDES = 64; // approximate a circle with a polygon of DEVIDES sides
    // create mesh from control curve
    // given curve0: in osu pixels
    // given radius: in osu pixels
    // output mesh: in osu pixels
    function curveGeometry(curve0, radius) // returning PIXI.Geometry object
    {
        // osu relative coordinate -> osu pixels
        curve = new Array();
        // filter out coinciding points
        for (let i=0; i<curve0.length; ++i)
            if (i==0 || 
                Math.abs(curve0[i].x - curve0[i-1].x) > 0.00001 || 
                Math.abs(curve0[i].y - curve0[i-1].y) > 0.00001)
            curve.push(curve0[i]);

        let vert = new Array();
        let index = new Array();

        vert.push(curve[0].x, curve[0].y, curve[0].t, 0.0); // first point on curve

        // add rectangles around each segment of curve
        for (let i = 1; i < curve.length; ++i) {
            let x = curve[i].x;
            let y = curve[i].y;
            let t = curve[i].t;
            let lx = curve[i-1].x;
            let ly = curve[i-1].y;
            let lt = curve[i-1].t;
            let dx = x - lx;
            let dy = y - ly;
            let length = Math.hypot(dx, dy);
            let ox = radius * -dy / length;
            let oy = radius * dx / length;

            vert.push(lx+ox, ly+oy, lt, 1.0);
            vert.push(lx-ox, ly-oy, lt, 1.0);
            vert.push(x+ox, y+oy, t, 1.0);
            vert.push(x-ox, y-oy, t, 1.0);
            vert.push(x, y, t, 0.0);

            let n = 5*i+1;
            // indices for 4 triangles composing 2 rectangles
            index.push(n-6, n-5, n-1, n-5, n-1, n-3);
            index.push(n-6, n-4, n-1, n-4, n-1, n-2);
        }

        function addArc(c, p1, p2, t) // c as center, sector from c-p1 to c-p2 counterclockwise
        {
            let theta_1 = Math.atan2(vert[4*p1+1]-vert[4*c+1], vert[4*p1]-vert[4*c])
            let theta_2 = Math.atan2(vert[4*p2+1]-vert[4*c+1], vert[4*p2]-vert[4*c])
            if (theta_1 > theta_2)
                theta_2 += 2*Math.PI;
            let theta = theta_2 - theta_1;
            let divs = Math.ceil(DIVIDES * Math.abs(theta) / (2*Math.PI));
            theta /= divs;
            let last = p1;
            for (let i=1; i<divs; ++i) {
                vert.push(vert[4*c] + radius * Math.cos(theta_1 + i * theta),
                        vert[4*c+1] + radius * Math.sin(theta_1 + i * theta), t, 1.0);
                let newv = vert.length/4 - 1;
                index.push(c, last, newv);
                last = newv;
            }
            index.push(c, last, p2);
        }

        // add half-circle for head & tail of curve
        addArc(0,1,2, curve[0].t);
        addArc(5*curve.length-5, 5*curve.length-6, 5*curve.length-7, curve[curve.length-1].t);

        // add sectors for turning points of curve
        for (let i=1; i<curve.length-1; ++i) {
            let dx1 = curve[i].x - curve[i-1].x;
            let dy1 = curve[i].y - curve[i-1].y;
            let dx2 = curve[i+1].x - curve[i].x;
            let dy2 = curve[i+1].y - curve[i].y;
            let t = dx1*dy2 - dx2*dy1; // d1 x d2
            if (t > 0) { // turning counterclockwise
                addArc(5*i, 5*i-1, 5*i+2);
            }
            else { // turning clockwise or straight back
                addArc(5*i, 5*i+1, 5*i-2);
            }
        }
        return new PIXI.Geometry().addAttribute('position', vert, 4).addIndex(index)
    }

    function circleGeometry(radius) {
        let vert = new Array();
        let index = new Array();
        vert.push(0.0, 0.0, 0.0, 0.0); // center
        for (let i=0; i<DIVIDES; ++i) {
            let theta = 2 * Math.PI / DIVIDES * i;
            vert.push(radius * Math.cos(theta), radius * Math.sin(theta), 0.0, 1.0);
            index.push(0, i+1, (i+1)%DIVIDES+1);
        }
        return new PIXI.Geometry().addAttribute('position', vert, 4).addIndex(index)
    }

    function SliderMesh(curve, radius, tintid) // constructor. 
    {
        Container.call(this);

        this.curve = curve;
        this.geometry = curveGeometry(curve.curve, radius);
        this.alpha = 1.0;
        this.tintid = tintid;
        this.startt = 0.0;
        this.endt = 1.0;
        
        // blend mode, culling, depth testing, direction of rendering triangles, backface, etc.
        this.state = PIXI.State.for2d();
        this.drawMode = PIXI.DRAW_MODES.TRIANGLES;
        // Inherited from DisplayMode, set defaults
        this.blendMode = PIXI.BLEND_MODES.NORMAL;
        this._roundPixels = PIXI.settings.ROUND_PIXELS;
    }
    

    if ( Container ) { SliderMesh.__proto__ = Container; }
    SliderMesh.prototype = Object.create( Container && Container.prototype );
    SliderMesh.prototype.constructor = SliderMesh;

    // This should be called directly on prototype before any draw
    // as we only need ONE texture & ONE shader
    SliderMesh.prototype.initialize = function(colors, radius, transform, SliderTrackOverride, SliderBorder) {
        this.ncolors = colors.length;
        this.uSampler2 = newTexture(colors, SliderTrackOverride, SliderBorder);
        this.circle = circleGeometry(radius);
        this.uniforms = {
            uSampler2: this.uSampler2,
            alpha: 1.0,
            dx: transform.dx,
            dy: transform.dy,
            ox: transform.ox,
            oy: transform.oy,
            texturepos: 0,
        };
        this.shader = PIXI.Shader.from(vertexSrc, fragmentSrc, this.uniforms);
    }

    // this should be called directly on prototype when window resizes
    SliderMesh.prototype.resetTransform = function resetTransform (transform)
    {
        this.uniforms.dx = transform.dx;
        this.uniforms.dy = transform.dy;
        this.uniforms.ox = transform.ox;
        this.uniforms.oy = transform.oy;
    };

    // Standard renderer draw.
    SliderMesh.prototype._render = function _render (renderer)
    {
        // not batchable. manual rendering
        this._renderDefault(renderer);
    };

    // Standard non-batching way of rendering.
    SliderMesh.prototype._renderDefault = function _renderDefault (renderer)
    {
        var shader = this.shader;
        shader.alpha = this.worldAlpha;
        if (shader.update)
        {
            shader.update();
        }
        renderer.batch.flush();

        // upload color info to shared shader uniform
        this.uniforms.alpha = this.alpha;
        this.uniforms.texturepos = this.tintid / this.ncolors;
        this.uniforms.dt = 0;
        this.uniforms.ot = 0.5;

        let ox0 = this.uniforms.ox;
        let oy0 = this.uniforms.oy;

        const gl = renderer.gl;
        gl.clearDepth(1.0); // setting depth of clear
        gl.clear(gl.DEPTH_BUFFER_BIT); // this really clears the depth buffer

        // first render: to store min depth in depth buffer, but not actually drawing anything
        gl.colorMask(false, false, false, false);
        
        // translation is not supported
        renderer.state.set(this.state); // set state
        renderer.state.setDepthTest(true); // enable depth testing

        let glType;
        let indexLength;

        function bind(geometry) {
            renderer.shader.bind(shader); // bind shader & sync uniforms
            renderer.geometry.bind(geometry, shader); // bind the geometry
            let byteSize = geometry.indexBuffer.data.BYTES_PER_ELEMENT; // size of each index
            glType = byteSize === 2 ? gl.UNSIGNED_SHORT : gl.UNSIGNED_INT; // type of each index
            indexLength = geometry.indexBuffer.data.length; // number of indices
        }
        if (this.startt == 0.0 && this.endt == 1.0) { // display whole slider
            this.uniforms.dt = 0;
            this.uniforms.ot = 1;
            bind(this.geometry);
            gl.drawElements(this.drawMode, indexLength, glType, 0);
        }
        else if (this.endt == 1.0) { // snaking out
            if (this.startt != 1.0) {
                // we want portion: t > this.startt
                this.uniforms.dt = -1;
                this.uniforms.ot = -this.startt;
                bind(this.geometry);
                gl.drawElements(this.drawMode, indexLength, glType, 0);
            }
            this.uniforms.dt = 0;
            this.uniforms.ot = 1;
            let p = this.curve.pointAt(this.startt);
            this.uniforms.ox += p.x * this.uniforms.dx;
            this.uniforms.oy += p.y * this.uniforms.dy;
            bind(this.circle);
            gl.drawElements(this.drawMode, indexLength, glType, 0);
        }
        else if (this.startt == 0.0) { // snaking in
            if (this.endt != 0.0) {
                // we want portion: t < this.endt
                this.uniforms.dt = 1;
                this.uniforms.ot = this.endt;
                bind(this.geometry);
                gl.drawElements(this.drawMode, indexLength, glType, 0);
            }
            this.uniforms.dt = 0;
            this.uniforms.ot = 1;
            let p = this.curve.pointAt(this.endt);
            this.uniforms.ox += p.x * this.uniforms.dx;
            this.uniforms.oy += p.y * this.uniforms.dy;
            bind(this.circle);
            gl.drawElements(this.drawMode, indexLength, glType, 0);
        }
        else {
            console.error("can't snake both end of slider");
        }

        // second render: draw at previously calculated min depth
        gl.depthFunc(gl.EQUAL);      
        gl.colorMask(true, true, true, true);

        if (this.startt == 0.0 && this.endt == 1.0) { // display whole slider
            gl.drawElements(this.drawMode, indexLength, glType, 0);
        }
        else if (this.endt == 1.0) { // snaking out
            if (this.startt != 1.0) {
                gl.drawElements(this.drawMode, indexLength, glType, 0);
                this.uniforms.ox = ox0;
                this.uniforms.oy = oy0;
                this.uniforms.dt = -1;
                this.uniforms.ot = -this.startt;
                bind(this.geometry);
            }
            gl.drawElements(this.drawMode, indexLength, glType, 0);
        }
        else if (this.startt == 0.0) { // snaking in
            if (this.endt != 0.0) {
                gl.drawElements(this.drawMode, indexLength, glType, 0);
                this.uniforms.ox = ox0;
                this.uniforms.oy = oy0;
                this.uniforms.dt = 1;
                this.uniforms.ot = this.endt;
                bind(this.geometry);
            }
            gl.drawElements(this.drawMode, indexLength, glType, 0);
        }

        // restore state
        // TODO: We don't know the previous state. THIS MIGHT CAUSE BUGS
        gl.depthFunc(gl.LESS); // restore to default depth func
        renderer.state.setDepthTest(false); // restore depth test to disabled
        // restore uniform
        this.uniforms.ox = ox0;
        this.uniforms.oy = oy0;
    };

    SliderMesh.prototype.destroy = function destroy (options)
    {
        Container.prototype.destroy.call(this, options);
        this.geometry.dispose();
        this.geometry = null;
        this.shader = null;
        this.state = null;
    };

    return SliderMesh;

});
