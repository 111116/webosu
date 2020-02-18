var CURVE_POINTS_SEPERATION = 5;

define(["curves/Curve"], function(Curve) {
    // Adapted from EqualDistanceMultiCurve.java from github://itdelatrisu/opsu
    function EqualDistanceMultiCurve(hit) {
        Curve.call(this, hit);
        this.ncurve = 0;
        this.startAngle = 0;
        this.endAngle = 0;
    }
    EqualDistanceMultiCurve.prototype.init = function init(curves) {
        this.ncurve = Math.floor(this.hitObject.pixelLength / CURVE_POINTS_SEPERATION)+1;
        // number of segments, which have approximately same length
        this.curve = [];


        var distanceAt = 0; // accumulated length of new curve
        var curPoint = 0;
        var curCurveIndex = 0;
        var curCurve = curves[0]; // current pointer of raw curve array
        var lastCurve = curCurve.curve[0];
        var lastDistanceAt = 0;

        var pixelLength = this.hitObject.pixelLength; // This is the expected value of length
        if (pixelLength < 0) console.error("osu curve: negative slider length");
        for (var i = 0; i <= this.ncurve; i++) {
            var prefDistance = i * pixelLength / this.ncurve; // expected current accumulated length
            while (distanceAt < prefDistance) {
                lastDistanceAt = distanceAt;
                lastCurve = curCurve.curve[curPoint];
                curPoint++;

                if (curPoint >= curCurve.ncurve) {
                    if (curCurveIndex < curves.length - 1) {
                        curCurveIndex++;
                        curCurve = curves[curCurveIndex];
                        curPoint = 0;
                    } else {
                        curPoint = curCurve.ncurve - 1;
                        if (lastDistanceAt === distanceAt) {
                            if (distanceAt < pixelLength * 0.97) {
                                console.warn("[curve] L/B shorter than given", distanceAt / pixelLength);
                            }
                            // out of points even though the preferred distance hasn't been reached
                            break;
                        }
                    }
                }
                distanceAt += curCurve.curveDistance[curPoint];
            }
            var thisCurve = curCurve.curve[curPoint];

            // linear interpolate between lastCurve & thisCurve
            // this can always be done when lastCurve != thisCurve, since lastCurve is always available
            // lastDistanceAt <= prefDistance <= distanceAt
            if (lastCurve == thisCurve) {
                this.curve[i] = thisCurve;
            }
            else {
                let t = (prefDistance - lastDistanceAt) / (distanceAt - lastDistanceAt);
                this.curve[i] = {
                    x: Curve.lerp(lastCurve.x, thisCurve.x, t),
                    y: Curve.lerp(lastCurve.y, thisCurve.y, t),
                };
            }
            this.curve[i].t = i / this.ncurve;
        }
    }
    EqualDistanceMultiCurve.prototype.pointAt = function pointAt(t) {

        var indexF = t * this.ncurve;
        var index = Math.floor(indexF);
        if (index >= this.ncurve) { // overflowing or at exact endpoint
            return this.curve[this.ncurve];
        } else {
            // linear interpolation between two points
            let poi = this.curve[index];
            let poi2 = this.curve[index + 1];
            let t = indexF - index;
            return {
                x: Curve.lerp(poi.x, poi2.x, t),
                y: Curve.lerp(poi.y, poi2.y, t)
            };
        }
    }
    return EqualDistanceMultiCurve;
});
