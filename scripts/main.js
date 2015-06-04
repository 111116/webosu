require(["scenes/need-files"], function(needFiles) {
    console.log("Starting");
    window.AudioContext = window.AudioContext || window.webkitAudioContext;

    var canvas = document.querySelector("canvas");
    var context = canvas.getContext("2d");

    var game = {
        canvas: canvas,
        context: context,
        scene: needFiles
    };

    function gameLoop(timestamp) {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        context.clearRect(0, 0, canvas.width, canvas.height);

        game.scene(timestamp, context, game);

        window.requestAnimationFrame(gameLoop);
    }

    window.requestAnimationFrame(gameLoop);
});
