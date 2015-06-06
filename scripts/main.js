require(["scenes/need-files", "gfx", "resources"], function(NeedFiles, gfx, Resources) {
    console.log("Starting");
    window.AudioContext = window.AudioContext || window.webkitAudioContext;

    Resources.loadDefault();

    var canvas = document.querySelector("canvas");
    var context = canvas.getContext("2d");

    var game = {
        canvas: canvas,
        context: context,
        scene: new NeedFiles(),
        mouseX: 0,
        mouseY: 0,
        click: 100,
        lastFrameTime: -1
    };
    window.game = game;

    canvas.addEventListener("mousemove", function(e) {
        game.mouseX = e.clientX;
        game.mouseY = e.clientY;
    });

    canvas.addEventListener("mousedown", function(e) {
        game.click = 150;
    });

    function gameLoop(timestamp) {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        context.clearRect(0, 0, canvas.width, canvas.height);

        game.scene.render(timestamp, context, game);

        context.fillStyle = "#F00";
        var text = "WORK IN PROGRESS";
        context.font = "20px sans";
        var metrics = context.measureText(text);
        context.fillText(text, game.canvas.width / 2 - metrics.width / 2, 20);

        if (Resources["cursor.png"] && Resources["cursormiddle.png"]) {
            gfx.drawImage(context, Resources["cursor.png"],
                game.mouseX, game.mouseY, game.click / 100);
            gfx.drawImage(context, Resources["cursormiddle.png"],
                game.mouseX, game.mouseY);
        }

        if (game.click > 100) {
            game.click -= (timestamp - game.lastFrameTime) * 0.2;
        }
        if (game.click < 100) {
            game.click = 100;
        }

        game.lastFrameTime = timestamp;

        window.requestAnimationFrame(gameLoop);
    }

    window.requestAnimationFrame(gameLoop);
});
