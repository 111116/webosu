define(["underscore", "curves/CurveType"], function(_, CurveType) {
    // Adapted from Bezier2.java from github://itdelatrisu/opsu
    function Bezier2(points) {
        CurveType.call(this);

        this.points = points;

        var approxLength = 0;
        for (var i = 0; i < points.length - 1; i++) {
            var x = points[i].x - points[i + 1].x;
            var y = points[i].y - points[i + 1].y;
            approxLength += Math.sqrt(x * x + y * y);
        }
        this.init(approxLength);
    }
    _.extend(Bezier2.prototype, CurveType.prototype);
    // Instance methods
    Bezier2.prototype.pointAt = function(t) {
        var c = { x: 0, y: 0 };
        var n = this.points.length - 1;
        for (var i = 0; i <= n; i++) {
            var b = Bezier2.bernstein(i, n, t);
            c.x += this.points[i].x * b;
            c.y += this.points[i].y * b;
        }
        return c;
    }
    // Static methods
    Bezier2.bernstein = function bernstein(i, n, t) {
        return Bezier2.binomialCoefficient(n, i) * Math.pow(t, i) * Math.pow(1 - t, n - i);
    }
    Bezier2.binomialCoefficient = function binomialCoefficient(n, k) {
        if (k < 0 || k > n) {
            return 0;
        }
        if (k == 0 || k == n) {
            return 1;
        }
        k = Math.min(k, n - k);
        var c = 1;
        for (var i = 0; i < k; i++) {
            c = c * (n - i) / (i + 1);
        }
        return c;
    }
    return Bezier2;
});
