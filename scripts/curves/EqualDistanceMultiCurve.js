var CURVE_POINTS_SEPERATION = 5;

define(["Curve", function(Curve) {
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
        var currentPoint = 0;
        var currentCurveIndex = 0;
        var currentCurve = curves[0];
        var lastCurve = currentCurve.curve[0];
        var lastDistanceAt = 0;

        var pixelLength = this.hitObject.pixelLength / 384;
        for (var i = 0; i < this.ncurve + 1; i++) {
            var prefDistance = Math.floor(i * pixelLength / this.ncurve);
            while (distanceAt < prefDistance) {
                lastDistanceAt = distanceAt;
                lastCurve = currentCurve.curve[currentPoint];
                currentPoint++;

                if (currentPoint >= currentCurve.curve.length) {
                    if (currentCurveIndex < curves.length) {
                        currentCurve = curves[++currentCurveIndex];
                        currentPoint = 0;
                    } else {
                        currentPoint = currentCurve.curve.length - 1;
                        if (lastDistanceAt === distanceAt) {
                            // out of points even though the preferred distance hasn't been reached
                            break;
                        }
                    }
                }
                distanceAt += currentCurve.curveDistances[currentPoint];
            }
            var thisCurve = currentCurve.curve[currentPoint];

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
