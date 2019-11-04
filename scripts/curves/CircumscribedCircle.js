
define(["underscore", "curves/EqualDistanceMultiCurve"],
function(_, EqualDistanceMultiCurve) {
	// Adapted from CircumscribedCircle.java @ github.com/itdelatrisu/opsu
    function CircumscribedCircle(hit, line) {
        EqualDistanceMultiCurve.call(this, hit);

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
                    arcs.push(new Bezier2(points));
                    points.splice(0);
                }
            } else if (lastPoi !== null && tpoi.x == lastPoi.x && tpoi.y == lastPoi.y) {
                if (points.length >= 2) {
                    arcs.push(new Bezier2(points));
                }
                points.splice(0);
            }
            points.push(tpoi);
            lastPoi = tpoi;
        }
        if (line || points.length < 2) {
            // ignored
        } else {
            arcs.push(new Bezier2(points));
            points.splice(0); // neccessary?
        }
        this.init(arcs);
    }
    _.extend(CircumscribedCircle.prototype, EqualDistanceMultiCurve.prototype);
    return CircumscribedCircle;

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
