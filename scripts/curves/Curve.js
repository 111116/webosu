define([], function() {
    function Curve(hitObject) {
        this.hitObject = hitObject;
    }
    Curve.lerp = function lerp(var a, var b, var t) {
        return a * (1 - t) + b * t;
    }
    return Curve;
});
