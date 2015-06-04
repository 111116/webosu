define([], function() {
    gfx = {
        xoffset: 0,
        yoffset: 0,
        drawImage: function(context, image, x, y, scale, alpha) {
            if (typeof scale === "undefined") {
                scale = 1;
            }
            if (typeof alpha === "undefined") {
                alpha = 1;
            }
            var width = image.width * scale;
            var height = image.height * scale;
            context.globalAlpha = alpha;
            context.drawImage(image, (this.xoffset + x - (width / 2)),
                this.yoffset + (y - (height / 2)), width, height);
        }
    };
    return gfx;
});
