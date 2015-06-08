var CURVE_POINTS_SEPERATION = 5;

define(["curves/Curve"], function(Curve) {
    // Adapted from EqualDistanceMultiCurve.java from github://itdelatrisu/opsu
    function EqualDistanceMultiCurve(hitObject) {
        Curve.apply(this, arguments);
        this.ncurve = 0;
        this.startAngle = 0;
        this.endAngle = 0;
    }
    EqualDistanceMultiCurve.prototype.init = function init(curves) {
        this.ncurve = this.hitObject.pixelLength / CURVE_POINTS_SEPERATION;
        this.curve = [];

        var distanceAt = 0;
        var curPoint = 0;
        var curCurveIndex = 0;
        var curCurve = curves[0];
        var lastCurve = curCurve.curve[0];
        var lastDistanceAt = 0;

        var pixelLength = this.hitObject.pixelLength / 384; // Scaled to 0...1
        for (var i = 0; i < this.ncurve + 1; i++) {
            var prefDistance = Math.floor(i * pixelLength / this.ncurve);
            while (distanceAt < prefDistance) {
                lastDistanceAt = distanceAt;
                lastCurve = curCurve.curve[curPoint];
                curPoint++;

                if (curPoint >= curCurve.curve.length) {
                    if (curCurveIndex < curves.length) {
                        curCurve = curves[++curCurveIndex];
                        curPoint = 0;
                    } else {
                        curPoint = curCurve.curve.length - 1;
                        if (lastDistanceAt === distanceAt) {
                            // out of points even though the preferred distance hasn't been reached
                            break;
                        }
                    }
                }
                distanceAt += curCurve.curveDistances[curPoint];
            }
            var thisCurve = curCurve.curve[curPoint];

            // interpolate the point between the two closest distances
            if (distanceAt - lastDistanceAt > 1) {
                var t = (prefDistance - lastDistanceAt) / (distanceAt - lastDistanceAt);
                this.curve.push({
                    x: Curve.lerp(lastCurve.x, thisCurve.x, t),
                    y: Curve.lerp(lastCurve.y, thisCurve.y, t)
                });
            } else {
                this.curve.push(thisCurve);
            }
        }
    }
    return EqualDistanceMultiCurve;
});
