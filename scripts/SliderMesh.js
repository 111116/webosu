/*
* custom class, extends PIXI.Container
* each instance is a Pixi-renderable slider
* properties: alpha
*
* constructor params
*   curve: array of points, in osu relative coordinate
*   radius: radius of hit circle, in osu! pixels
*   view: info object with properties (in system pixels if not otherwise specified):
*       x, y: offset of osu field, relative to real inner window
*       width, height: dimensions of osu field
*       osuWidth, osuHeight: dimensions of osu field, in osu pixels
*       windowWidth, windowWidth: dimensions of inner window
*   tint: 24-bit integer color of inner slider body, RGB from highbits to lowbits
*   
*/

define([],
function() {

    Container = PIXI.Container;

    // vertex shader source
    const vertexSrc = `
    precision mediump float;
    attribute vec3 position;
    varying float dist;
    uniform float dx,dy,ox,oy;
    void main() {
        dist = position[2];
        gl_Position = vec4(position, 1.0);
        gl_Position.x = gl_Position.x * dx + ox;
        gl_Position.y = gl_Position.y * dy + oy;
    }`;

    // fragment shader source
    const fragmentSrc = `
    precision mediump float;
    varying float dist;
    uniform sampler2D uSampler2;
    uniform float alpha;
    void main() {
        gl_FragColor = alpha * texture2D(uSampler2, vec2(dist, 0.0));
    }`;

    // create line texture for slider from tint color
    function newTexture(tint) {

        const borderwidth = 0.128;
        const innerPortion = 1 - borderwidth;
        const edgeOpacity = 0.8;
        const centerOpacity = 0.3;
        const borderR = 1.0;
        const borderG = 1.0;
        const borderB = 1.0;
        const borderA = 1.0;
        const innerR = (tint>>16)/255;
        const innerG = ((tint>>8)&255)/255;
        const innerB = (tint&255)/255;
        const innerA = 1.0;
        const blurrate = 0.012;
        const width = 200;

        let buff = new Uint8Array(width * 4);
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
                // tune this to make opacity transition smoother at center
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
            buff[i*4] = R*255;
            buff[i*4+1] = G*255;
            buff[i*4+2] = B*255;
            buff[i*4+3] = A*255;
        }
        return PIXI.Texture.fromBuffer(buff, width, 1);
    }


    // create mesh from control curve
    // given osucurve: in osu relative coordinate
    // given radius: in osu pixels
    // output mesh: in osu pixels
    function curveGeometry(curveRelative, view, radius) // returning PIXI.Geometry object
    {
        // osu relative coordinate -> osu pixels
        curve = new Array();
        // filter out coinciding points & convert curve to osu pixel
        for (let i=0; i<curveRelative.length; ++i)
            if (i==0 || 
                Math.abs(curveRelative[i].x - curveRelative[i-1].x) > 0.00001 || 
                Math.abs(curveRelative[i].y - curveRelative[i-1].y) > 0.00001)
            curve.push({
                x: curveRelative[i].x * view.osuWidth,
                y: curveRelative[i].y * view.osuHeight
            });

        let vert = new Array();
        let index = new Array();

        vert.push(curve[0].x, curve[0].y, 0.0); // first point on curve

        // add rectangles around each segment of curve
        for (let i = 1; i < curve.length; ++i) {
            let x = curve[i].x;
            let y = curve[i].y;
            let lx = curve[i-1].x;
            let ly = curve[i-1].y;
            let dx = x - lx;
            let dy = y - ly;
            let length = Math.hypot(dx, dy);
            let ox = radius * -dy / length;
            let oy = radius * dx / length;

            vert.push(lx+ox, ly+oy, 1.0);
            vert.push(lx-ox, ly-oy, 1.0);
            vert.push(x+ox, y+oy, 1.0);
            vert.push(x-ox, y-oy, 1.0);
            vert.push(x, y, 0.0);

            let n = 5*i+1;
            // indices for 4 triangles composing 2 rectangles
            index.push(n-6, n-5, n-1, n-5, n-1, n-3);
            index.push(n-6, n-4, n-1, n-4, n-1, n-2);
        }

        function addArc(c, p1, p2) // c as center, sector from c-p1 to c-p2 counterclockwise
        {
            const DIVIDES = 40; // approximate a circle with a polygon of DEVIDES sides
            let theta_1 = Math.atan2(vert[3*p1+1]-vert[3*c+1], vert[3*p1]-vert[3*c])
            let theta_2 = Math.atan2(vert[3*p2+1]-vert[3*c+1], vert[3*p2]-vert[3*c])
            if (theta_1 > theta_2)
                theta_2 += 2*Math.PI;
            let theta = theta_2 - theta_1;
            let divs = Math.ceil(DIVIDES * Math.abs(theta) / (2*Math.PI));
            theta /= divs;
            let last = p1;
            for (let i=1; i<divs; ++i) {
                vert.push(vert[3*c] + radius * Math.cos(theta_1 + i * theta),
                        vert[3*c+1] + radius * Math.sin(theta_1 + i * theta), 1.0);
                let newv = vert.length/3 - 1;
                index.push(c, last, newv);
                last = newv;
            }
            index.push(c, last, p2);
        }

        // add half-circle for head & tail of curve
        addArc(0,1,2);
        addArc(5*curve.length-5, 5*curve.length-6, 5*curve.length-7);

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
        return new PIXI.Geometry().addAttribute('position', vert, 3).addIndex(index)
    }

    function SliderMesh(curve, radius, view, tint) // constructor. 
    {
        Container.call(this);
        this.geometry = curveGeometry(curve, view, radius);
        this.tint = tint || 0;
        // FIXME NOTE: setting this.tint has no effect

        // osu pixel -> gl coordinate
        // input mesh: [0, 512] x [0, 384]
        // view in system pixels: [x, x + width] x [y, y + height]
        // system pixel [0,windowWidth] x [0,windowHeight] -> gl coordinate [-1,1] x [1,-1]
        this.uniforms = {
            uSampler2: newTexture(this.tint),
            alpha: 1.0,
            dx: 2 / view.osuWidth * view.width / view.windowWidth,
            dy: -2 / view.osuHeight * view.height / view.windowHeight,
            ox: -1 + 2 * view.x / view.windowWidth,
            oy: 1 - 2 * view.y / view.windowHeight,
        };
        this.shader = PIXI.Shader.from(vertexSrc, fragmentSrc, this.uniforms);

        // blend mode, culling, depth testing, direction of rendering triangles, backface, etc.
        this.state = PIXI.State.for2d();
        this.drawMode = PIXI.DRAW_MODES.TRIANGLES;

        // Inherited from DisplayMode, set defaults
        this.blendMode = PIXI.BLEND_MODES.NORMAL;
        this._roundPixels = PIXI.settings.ROUND_PIXELS;

        Object.defineProperties(this, {
            "alpha": {
                get: function() { return this.uniforms.alpha },
                set: function(b) { this.uniforms.alpha = b }
            }
        });
    }
    

    if ( Container ) { SliderMesh.__proto__ = Container; }
    SliderMesh.prototype = Object.create( Container && Container.prototype );
    SliderMesh.prototype.constructor = SliderMesh;


    SliderMesh.prototype.reTransform = function reTransform (view)
    {
        this.uniforms.dx = 2 / view.osuWidth * view.width / view.windowWidth;
        this.uniforms.dy = -2 / view.osuHeight * view.height / view.windowHeight;
        this.uniforms.ox = -1 + 2 * view.x / view.windowWidth;
        this.uniforms.oy = 1 - 2 * view.y / view.windowHeight;
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
        
        // translation is not supported
        renderer.state.set(this.state); // set state
        renderer.geometry.bind(this.geometry, shader); // bind the geometry
        renderer.state.setDepthTest(true); // enable depth testing

        const gl = renderer.gl;
        const byteSize = this.geometry.indexBuffer.data.BYTES_PER_ELEMENT; // size of each index
        const glType = byteSize === 2 ? gl.UNSIGNED_SHORT : gl.UNSIGNED_INT; // type of each index
        const indexLength = this.geometry.indexBuffer.data.length; // number of indices

        renderer.shader.bind(shader); // bind shader & sync uniforms

        gl.clearDepth(1.0); // setting depth of clear
        gl.clear(gl.DEPTH_BUFFER_BIT); // this really clears the depth buffer

        // first render: to store min depth in depth buffer, but not actually drawing anything
        gl.colorMask(false, false, false, false);
        gl.drawElements(this.drawMode, indexLength, glType, 0);

        // second render: draw at previously calculated min depth
        gl.depthFunc(gl.EQUAL);      
        gl.colorMask(true, true, true, true);
        gl.drawElements(this.drawMode, indexLength, glType, 0);

        // restore state
        // TODO: We don't know the previous state. THIS MIGHT CAUSE BUGS
        gl.depthFunc(gl.LESS); // restore to default depth func
        renderer.state.setDepthTest(false); // restore depth test to disabled
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
