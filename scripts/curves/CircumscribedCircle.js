
define([],
function() {
    // Adapted from CircumscribedCircle.java @ github.com/itdelatrisu/opsu
    function CircumscribedCircle(hit, line) {

        var arcs = [];
        var start = { x: hit.x, y: hit.y };
        var mid = hit.keyframes[0];
        var end = hit.keyframes[1];

        // find the circle center
        var mida = vecmid(start, mid);
        var midb = vecmid(end, mid);
        var nora = nor(vecsub(mid, start));
        var norb = nor(vecsub(mid, end));
        var circleCenter = intersect(mida, nora, midb, norb);

        // find the angles relative to the circle center
        var startAngPoint = vecsub(start, circleCenter);
        var midAngPoint   = vecsub(mid, circleCenter);
        var endAngPoint   = vecsub(end, circleCenter);

        var startAng = Math.atan2(startAngPoint.y, startAngPoint.x);
        var midAng   = Math.atan2(midAngPoint.y, midAngPoint.x);
        var endAng   = Math.atan2(endAngPoint.y, endAngPoint.x);


        console.log(startAng, endAng, midAng);

        const TWO_PI = Math.PI * 2;
        const HALF_PI = Math.PI / 2;

        // find the angles that pass through midAng
        if (!isIn(startAng, midAng, endAng)) {
            if (Math.abs(startAng + TWO_PI - endAng) < TWO_PI && isIn(startAng + (TWO_PI), midAng, endAng))
                startAng += TWO_PI;
            else if (Math.abs(startAng - (endAng + TWO_PI)) < TWO_PI && isIn(startAng, midAng, endAng + (TWO_PI)))
                endAng += TWO_PI;
            else if (Math.abs(startAng - TWO_PI - endAng) < TWO_PI && isIn(startAng - (TWO_PI), midAng, endAng))
                startAng -= TWO_PI;
            else if (Math.abs(startAng - (endAng - TWO_PI)) < TWO_PI && isIn(startAng, midAng, endAng - (TWO_PI)))
                endAng -= TWO_PI;
            else
                throw "Cannot find angles between midAng.";
        }

        // find an angle with an arc length of pixelLength along this circle
        var radius = veclen(startAngPoint);
        var arcAng = Math.abs(startAng - endAng);
        console.log("Arc", arcAng);

        // now use it for our new end angle
        endAng = (endAng > startAng) ? startAng + arcAng : startAng - arcAng;

        console.log(startAng, endAng);

        // finds the angles to draw for repeats
        var drawEndAngle   = ((endAng   + (startAng > endAng ? HALF_PI : -HALF_PI)) * 180 / Math.PI);
        var drawStartAngle = ((startAng + (startAng > endAng ? -HALF_PI : HALF_PI)) * 180 / Math.PI);

        // calculate points
        var step = hit.pixelLength / CURVE_POINTS_SEPERATION;
        var curve = new Array(step + 1);
        console.log(circleCenter);
        console.log(startAng);
        console.log(endAng);
        console.log(radius);
        pointAt = function(t) {
            var ang = lerp(startAng, endAng, t);
            return {
                x: Math.cos(ang) * radius + circleCenter.x,
                y: Math.sin(ang) * radius + circleCenter.y
            };
        };
        for (var i = 0; i < curve.length; i++) {
            curve[i] = pointAt(i / step);
        }
        return {curve: curve, pointAt: pointAt};
    };
    return CircumscribedCircle;

    function lerp(a, b, t) {
        return a * (1 - t) + b * t;
    }

    function veclen(a) {
        return Math.sqrt(a.x * a.x + a.y * a.y);
    }

    function nor(a) {
        return { x: -a.y, y: a.x };
    }

    function vecsub(a, b)
    {
        return { x: a.x-b.x, y: a.y-b.y };
    }

    function vecmid(a, b)
    {
        return { x: (a.x+b.x)/2, y: (a.y+b.y)/2 };
    }

    function isIn(a, b, c) {
        return (b > a && b < c) || (b < a && b > c);
    }

    function intersect(a, ta, b, tb) {
        // xy = a + ta * t = b + tb * u
        // t =(b + tb*u -a)/ta
        //t(x) == t(y)
        //(b.x + tb.x*u -a.x)/ta.x = (b.y + tb.y*u -a.y)/ta.y
        // b.x*ta.y + tb.x*u*ta.y -a.x*ta.y = b.y*ta.x + tb.y*u*ta.x -a.y*ta.x
        // tb.x*u*ta.y - tb.y*u*ta.x= b.y*ta.x  -a.y*ta.x -b.x*ta.y +a.x*ta.y
        //u *(tb.x*ta.y - tb.y*ta.x) = (b.y-a.y)ta.x +(a.x-b.x)ta.y
        //u = ((b.y-a.y)ta.x +(a.x-b.x)ta.y) / (tb.x*ta.y - tb.y*ta.x);

        var des = tb.x * ta.y - tb.y * ta.x;
        if (Math.abs(des) < 0.00001)
            throw "Vectors are parallel.";
        var u = ((b.y - a.y) * ta.x + (a.x - b.x) * ta.y) / des;
        return { x: b.x + tb.x * u, y: b.y + tb.y * u };
    }
});
