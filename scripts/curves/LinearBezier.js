define(["underscore", "EqualDistanceMultiCurve", "Bezier2"],
function(_, EqualDistanceMultiCurve, Bezier2) {
    // Adapted from LinearBezier.java from github://itdelatrisu/opsu
    function LinearBeizer(hit, line) {
        EqualDistanceMultiCurve.apply(this);
        var curves = [];
        var controlPoints = hit.keyframes.length + 1;
        var points = [];
        var lastPoi = null;
        for (var i = 0; i < controlPoints; i++) {
            var tpoi = hit.keyframes[i];
            if (line) {
                if (lastPoi !== null) {
                    points.push(tpoi);
                    curves.push(new Bezier2(points));
                    points.splice(0);
                }
            } else if (lastPoi !== null && tpoi.x == lastPoi.x && tpoi.y == lastPoi.y) {
                if (points.length >= 2) {
                    curves.push(new Bezier2(points));
                }
                points.splice(0);
            }
            points.push(tpoi);
            lastPoi = tpoi;
        }
        if (line || points.length < 2) {
            // ignored
        } else {
            curves.add(new Bezier2(points));
            points.splice(0); // neccessary?
        }
        this.init(curves);
    }
    _.extend(LinearBeizer.prototype, Curve.prototype);
    return LinearBeizer;
});
