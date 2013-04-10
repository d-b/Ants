/*
 * Ants simulation
 * - Daniel Bloemendal
 */

function Ants(canvas) {
    // Ant orientations
    var Orientation = {
        natural: 0, reversed: 1
    };

    function Ant(position, orientation, tag) {
        this.position = position % 1;
        this.orientation = orientation;
        this.tag = tag;
    }
    Ant.prototype.distance = function(other) {
        // Distance only valid for ants with opposing orientations
        if (this.orientation == other.orientation) return NaN;
        // Return full distance for colliding ants
        if (this.position == other.position) return 1.0;

        // Compute and return distance
        if (this.orientation == Orientation.natural) {
            if(this.position > other.position)
                return (1.0 - this.position) + other.position;
            else
                return (other.position - this.position);
        }
        else {
            if(this.position < other.position)
                return (1.0 - other.position) + this.position;
            else
                return (this.position - other.position)
        }
    }

    // Settings
    this.population  = 5;   // Ant population
    this.speed       = 0.2; // Speed in units per second
    this.runtime     = 1.0; // How long to run the simulation
    this.wait        = 0.8; // Time to wait before starting and after ending

    // The global time
    var globalTime   = 0.0;

    // Current & target states
    var stateTime    = 0.0;    
    var stateCurrent = [];
    var stateTarget  = null;
    var stateSpeed   = 0.0;

    //
    // State transition function
    //
    function stateTransition(state) {
        // Find ant pair with minimum distance
        var minAnt = -1, minAnt2 = -1;
        var minDistance = null;
        for(var i = 0; i < stateCurrent.length; i++) {
            // Current ant pair and their distance
            var a1 = i,
                a2 = (i + 1) % stateCurrent.length;
            var dist = stateCurrent[a1].distance(stateCurrent[a2]);
            // Check for infinite distance
            if(isNaN(dist)) continue;
            // See if its the new min pair
            if(minAnt < 0 || dist < minDistance) {
                minAnt = a1; minAnt2 = a2;
                minDistance = dist;
            }
        }
        // If all pairs of ants have infinite distance return the same state
        if (minAnt < 0) return {state: state, speed: 1.0};

        // We compute the new state by adding half the distance between our min pair to all ants
        // with sign according to orientation. Orientation of the min pair is flipped in the new
        // state.
        var newState = [];
        for(var i = 0; i < stateCurrent.length; i++) {
            var dist
                = (stateCurrent[i].orientation == Orientation.natural)
                    ? minDistance : -minDistance;
            var pos = (stateCurrent[i].position + dist/2) % 1.0;
            var orientation = stateCurrent[i].orientation;
            var tag = stateCurrent[i].tag;
            // Flip orientation if ant is part of the min pair
            if (i == minAnt || i == minAnt2){
                orientation = (orientation + 1) % 2;
            }
            // Add new ant to the state
            newState.push(new Ant(pos, orientation, tag));
        }

        // Return the new state
        return {state: newState, speed: 2.0/minDistance};
    }

    // Setup the simulation
    this.reset = function() {
        globalTime   = 0.0
        stateTime    = 0.0
        stateCurrent = [];
        stateTarget  = null;
        for(var i = 0; i < this.population; i++) {
            var p = Math.random();
            var e = Math.floor(Math.random()*2);
            stateCurrent.push(new Ant(p, e, i));
        } stateCurrent.sort(function(x, y){return x.position - y.position;})
        for(var i = 0; i < this.population; i++) stateCurrent[i].tag = i;
    }

    // Tick the simulation forward
    this.tick = function(deltatime) {
        // See if we need to swap to the target state
        if (stateTime >= 1.0) {
            stateTime = 0.0;
            stateCurrent = stateTarget;
            stateTarget = null;
        }

        // See if we need to transition to the next state
        if (!stateTarget) {
            // Generate a new state
            var result = stateTransition(stateCurrent);
            // Setup the resulting state
            stateTarget = result.state;
            stateSpeed  = result.speed;
        }

        // Wait before starting
        if (globalTime <= this.wait ||
            (globalTime >= this.wait + this.runtime &&
             globalTime <  this.wait*2 + this.runtime))
        {globalTime += this.speed * deltatime; return;}
        // Reset simulation if we've passed the time limit
        if(globalTime >= this.runtime + this.wait*2) this.reset();        

        // Increment state and global time
        stateTime += stateSpeed * this.speed * deltatime;
        globalTime += this.speed * deltatime;
        if(stateTime >= 1.0) stateTime = 1.0;
    }

    // Render the scene to the canvas
    this.render = function() {
        // We need current & target states
        if (!stateCurrent || !stateTarget) return;

        // Fetch context, width and height
        var ctx    = canvas.getContext('2d');
        var width  = canvas.width;
        var height = canvas.height;

        // Compute coordinate system
        var origin = {x: width/2, y: height/2};
        var radius = Math.min(width, height)/3;

        // Clear the canvas
        ctx.clearRect(0, 0, width, height);

        // Draw the main circle
        ctx.beginPath();
        ctx.arc(origin.x, origin.y, radius, 0, 2*Math.PI, false);
        ctx.lineWidth = 3;
        ctx.strokeStyle = '#ffffff';
        ctx.stroke();

         // Draw the ants
        for(var i = 0; i < stateCurrent.length; i++) {
            // Compute distance to target
            var natdist = Math.abs(stateTarget[i].position - stateCurrent[i].position);
            var order   = stateCurrent[i].position < stateTarget[i].position;
            var natural = stateCurrent[i].orientation == Orientation.natural;
            var distance = (order != natural) ? 1.0 - natdist : natdist;

            // Check for collision
            if(natdist == 0) distance = 1.0;

            // Compute new position
            var delta
                = ((stateCurrent[i].orientation == Orientation.natural)
                    ? distance : -distance) * stateTime;
            var pos = (stateCurrent[i].position + delta) % 1.0;

            // Compute transformed canvas position
            var canvasPos = {
                x: origin.x + radius * Math.cos(2 * Math.PI * (1.0 - pos)),
                y: origin.y + radius * Math.sin(2 * Math.PI * (1.0 - pos)),
            };

            // Render the ant
            ctx.beginPath();
            ctx.arc(canvasPos.x, canvasPos.y, 15, 0, 2 * Math.PI, false);
            ctx.fillStyle = (stateCurrent[i].orientation == Orientation.reversed) ? '#ffff00' : '#ffffff';
            ctx.fill();
            ctx.font = 'bold 15px sans-serif';
            ctx.fillStyle = '#aa0000';
            ctx.fillText(stateCurrent[i].tag, canvasPos.x - 5, canvasPos.y + 5);
        }
    }

    // Perform initial reset
    this.reset();
}
