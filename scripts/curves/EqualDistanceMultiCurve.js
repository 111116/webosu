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
        this.ncurve = Math.floor(this.hitObject.pixelLength / CURVE_POINTS_SEPERATION);
        this.curve = [];

        var distanceAt = 0;
        var curPoint = 0;
        var curCurveIndex = 0;
        var curCurve = curves[0];
        var lastCurve = curCurve.curve[0];
        var lastDistanceAt = 0;

        var pixelLength = this.hitObject.pixelLength; // Scaled to 0...1
        for (var i = 0; i < this.ncurve + 1; i++) {
            var prefDistance = Math.floor(i * pixelLength / this.ncurve);
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
                            // out of points even though the preferred distance hasn't been reached
                            break;
                        }
                    }
                }
                distanceAt += Math.floor(curCurve.curveDistance[curPoint]);
            }
            var thisCurve = curCurve.curve[curPoint];

            // interpolate the point between the two closest distances
            if (distanceAt - lastDistanceAt > 1) {
                var t = (prefDistance - lastDistanceAt) / (distanceAt - lastDistanceAt);
                this.curve[i] = {
                    x: Curve.lerp(lastCurve.x, thisCurve.x, t),
                    y: Curve.lerp(lastCurve.y, thisCurve.y, t)
                };
            } else {
                this.curve[i] = thisCurve;
            }
        }
    }
    EqualDistanceMultiCurve.prototype.pointAt = function pointAt(t) {
        var indexF = t * this.ncurve;
        var index = Math.floor(indexF);
        if (index >= this.ncurve) {
            return this.curve[this.ncurve - 1];
        } else {
            var poi = this.curve[index];
            var poi2 = this.curve[index + 1];
            var t2 = indexF - index;
            return {
                x: Curve.lerp(poi.x, poi2.x, t2),
                y: Curve.lerp(poi.y, poi2.y, t2)
            };
        }
    }
    return EqualDistanceMultiCurve;
});
