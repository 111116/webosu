define([], function() {
    function Curve(hitObject) {
        this.hitObject = hitObject;
    }
    Curve.lerp = function lerp(a, b, t) {
        return a * (1 - t) + b * t;
    }
    return Curve;
});
