/*
 * Ants simulation: setup
 * - Daniel Bloemendal
 */

$(function(){
    // Fetch the surface and instantiate the game
    var surface = $('#surface');
    var ants = new Ants(surface[0]);

    // Initial tick for simulation
    ants.tick(0);
    ants.render();

    // Resize canvas
    function resizeSurface(width, height) {       
        surface.width($(window).width());
        surface.height($(window).height());
        surface[0].width = surface.innerWidth();
        surface[0].height = surface.innerHeight();
        ants.render();
    }

    // Add resize handler
    window.addEventListener('resize', function(){
        resizeSurface();
    }, false);

    // Resize surface now
    resizeSurface();

    // Render loop
    var render = function() {
        ants.render();
        ants.tick(20.0/1000.0);
        setTimeout(render, 20);
    }

    // Space to start simulation
    $(document).keydown(function(e){
        if (e.keyCode == 32) render();
    });
});
