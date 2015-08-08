define([], function() {
    var struct = {
        st: null, // beatmap set
        bm: null, // beatmap (difficulty)
        ts: null, // timestamp
    };

    if (window.location.hash !== "") {
        var parts = window.location.hash.substr(1).split("&");
        for (var i = 0; i < parts.length; i++) {
            var part = parts[i];
            if (part.indexOf("bm=") === 0) {
                struct.bm = part.substr(3);
            } else if (part.indexOf("ts=") === 0) {
                struct.ts = part.substr(3);
            } else if (part.indexOf("st=") === 0) {
                struct.st = part.substr(3);
            }
        }
    }

    function updateHash() {
        var hash = "#";
        var set = false;
        for (var key in struct) {
            if (struct[key]) {
                set = true;
                hash += key + "=" + struct[key] + "&";
            }
        }
        if (set) {
            window.location.hash = hash.substr(0, hash.length - 1);
        }
    }

    Hash = {
        beatmap: function(val) {
            if (typeof val !== "undefined") {
                struct.bm = val;
                updateHash();
            } else {
                return struct.bm;
            }
        },
        set: function(val) {
            if (typeof val !== "undefined") {
                struct.st = val;
                updateHash();
            } else {
                return struct.st;
            }
        },
        timestamp: function(val) {
            if (typeof val !== "undefined") {
                struct.ts = val;
                updateHash();
            } else {
                return struct.ts;
            }
        }
    };

    return Hash;
});
