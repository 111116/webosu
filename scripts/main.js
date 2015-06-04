require(["scenes/need-files", "resources"], function(NeedFiles, Resources) {
    console.log("Starting");
    window.AudioContext = window.AudioContext || window.webkitAudioContext;

    Resources.load();

    var canvas = document.querySelector("canvas");
    var context = canvas.getContext("2d");

    var game = {
        canvas: canvas,
        context: context,
        scene: new NeedFiles()
    };
    window.game = game;

    function gameLoop(timestamp) {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        context.clearRect(0, 0, canvas.width, canvas.height);

        game.scene.render(timestamp, context, game);

        window.requestAnimationFrame(gameLoop);
    }

    window.requestAnimationFrame(gameLoop);
});
