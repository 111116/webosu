let pageMod = require("sdk/page-mod");
let tabs = require("sdk/tabs");

pageMod.PageMod({
    include: "*.ppy.sh",
    contentScriptFile: './hosted.js'
});
