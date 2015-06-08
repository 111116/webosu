define(["underscore", "curves/EqualDistanceMultiCurve", "curves/Bezier2"],
function(_, EqualDistanceMultiCurve, Bezier2) {
    // Adapted from LinearBezier.java from github://itdelatrisu/opsu
    function LinearBeizer(hit, line) {
        EqualDistanceMultiCurve.call(this, hit);

        var beziers = [];

        var controlPoints = hit.keyframes.length + 1;
        var points = [];
        var lastPoi = null;
        for (var i = -1; i < hit.keyframes.length; i++) { // NOTE: This was +1 earlier?
            var tpoi;
            if (i !== -1) {
                tpoi = hit.keyframes[i];
            } else {
                tpoi = { x: hit.x, y: hit.y };
            }
            if (line) {
                if (lastPoi !== null) {
                    points.push(tpoi);
                    beziers.push(new Bezier2(points));
                    points.splice(0);
                }
            } else if (lastPoi !== null && tpoi.x == lastPoi.x && tpoi.y == lastPoi.y) {
                if (points.length >= 2) {
                    beziers.push(new Bezier2(points));
                }
                points.splice(0);
            }
            points.push(tpoi);
            lastPoi = tpoi;
        }
        if (line || points.length < 2) {
            // ignored
        } else {
            beziers.push(new Bezier2(points));
            points.splice(0); // neccessary?
        }
        this.init(beziers);
    }
    _.extend(LinearBeizer.prototype, EqualDistanceMultiCurve.prototype);
    return LinearBeizer;
});
