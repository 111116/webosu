define([], function() {
    function CurveType() {
        // Points along the curve
        this.curve = [];
        // Distance between a given point and the previous point
        this.curveDistance = [];
        // Number of points along this curve
        this.ncurve = 0;
        // Total distances of this curve
        this.totalDistance = 0;
    }
    CurveType.prototype.init = function init(approxLength) {
        // Subdivide the curve
        this.ncurve = Math.floor(approxLength/5) + 2;
        for (var i = 0; i < this.ncurve; i++) {
            this.curve.push(this.pointAt(i / (this.ncurve - 1)));
        }
        // Find distance of each point from the previous point
        for (var i = 0; i < this.ncurve; i++) {
            if (i === 0) {
                this.curveDistance.push(0);
            } else {
                var dx = this.curve[i].x - this.curve[i-1].x;
                var dy = this.curve[i].y - this.curve[i-1].y;
                this.curveDistance.push(Math.hypot(dx, dy));
                this.totalDistance += this.curveDistance[i];
            }
        }
    };
    return CurveType;
});
