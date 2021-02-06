import has from 'lodash/has';
window.addEventListener("load", () =>{
const canvas = document.getElementById("myCanvas");
const ctx = canvas.getContext("2d");
canvas.width = window.innerWidth; 
canvas.height = window.innerHeight;

/* YOU CAN CHANGE THIS */
const NB_OF_BOLTS = 5;
const END_Y = 20;
const MIN_X_VARIATION = 40;
const BOLT_RADIUS = 30;
const BOLT_COLOR = false;
const START_END_COLOR = "blue";
const ROPE_COLOR = "green";
const VECTOR_COLOR = "red";
const LEVELS = [{rope: true, vectors: true},
                {rope: true, vectors: false},
                {rope: false, vectors: false}];
/* ------------------------- */
let level = 0;
let win_streak = 0;
let current_route = [];
const MAX_X_VARIATION = canvas.width/2/(NB_OF_BOLTS+2);
const Y_INCREMENT = (canvas.height-END_Y) / (NB_OF_BOLTS+1);
const STARTING_POINT = {x:canvas.width/2, y:canvas.height};


/* --- MATH FUNCTIONS --- */
function length(a, b){
    return Math.sqrt(Math.pow((a.x - b.x), 2) + Math.pow((a.y - b.y), 2));
}
function tension_point(bolt, route) {
    const AC = {
      x: route[bolt+1].x - route[bolt-1].x,
      y: route[bolt+1].y - route[bolt-1].y
    };
    const k = ((route[bolt].x - route[bolt-1].x) * AC.x + (route[bolt].y - route[bolt-1].y) * AC.y) / (AC.x * AC.x + AC.y * AC.y);
    return {
      x: route[bolt-1].x + k * AC.x,
      y: route[bolt-1].y + k * AC.y
    };
}
function tension_strength(bolt, route){
    return Math.floor(length(route[bolt], tension_point(bolt, route)));
}

function create_route(){
    let route = [];
    let current_point = STARTING_POINT;
    for (let i = 0; i < NB_OF_BOLTS+2; i++) {
        let rand = Math.floor(Math.random() * MAX_X_VARIATION) + MIN_X_VARIATION;
        let dir = Math.round(Math.random()) * 2 - 1; //right or left
        
        let last_point = current_point; //remember current point, keep it in last point
        route[i] = current_point; //store current point in route
        
        //assign next position to current_point 
        current_point = {x:last_point.x+(rand*dir), y: last_point.y - Y_INCREMENT}; 
    }//end for 
    return route;
} //end function create_route

function smooth(route, smoothness){
    let old_route = route;
    let better_route = route;
    //better_route[0] = STARTING_POINT; //start
    //better_route[route.length-1] = route[route.length-1]; //finish
    for (let j = 0; j < smoothness; j++) {
        old_route = better_route;
        for (let i = 1; i < route.length-1; i++) {
            if (find_max_tensions(old_route) == i){
                better_route[i] = tension_point(i, old_route);
                break;
            }//end if
        }//end for
    }//end for
    return better_route;
}

function find_max_tensions(route){
    let tensions = [];
    for (let i = 1; i < route.length-1; i++) {
        tensions[i-1] = tension_strength(i, route);
    }//end for 
    return tensions.indexOf(Math.max(...tensions))+1;
}

/* --- DRAWING FUNCTIONS --- */

function draw_circle (center, radius, strokeColor, strokeWidth, fillColor){  
    ctx.beginPath();
    if (!radius){
        ctx.arc(center.x, center.y, 5, 0, 2 * Math.PI);
        ctx.fill();
    }else{
        ctx.arc(center.x, center.y, radius, 0, 2 * Math.PI);
        if (fillColor){
            ctx.fillStyle = fillColor;
            ctx.fill();
        }; 
        if (strokeWidth){
            ctx.lineWidth = strokeWidth;
            ctx.strokeStyle = strokeColor;
            ctx.stroke();
        };//end if
    };//end else
}//end draw_circle

function draw_line(a,b,color, width){
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
    if (width){ctx.lineWidth = width;}else {ctx.lineWidth = 3;}
    if (color){ctx.strokeStyle = color;}else {ctx.strokeStyle = "black";}
    ctx.stroke();
}//end draw_line

function draw_path(path, color, width){
    ctx.beginPath();
    ctx.moveTo(path[0].x, path[0].y);
    for (let i = 1; i < path.length; i++) {
        ctx.lineTo(path[i].x, path[i].y);
    }
    if (width){ctx.lineWidth = width;}else {ctx.lineWidth = 3;}
    if (color){ctx.strokeStyle = color;}else {ctx.strokeStyle = "black";}
    ctx.stroke();
}

function draw_vector (bolt, route){
    draw_line(route[bolt], tension_point(bolt, route), VECTOR_COLOR, 3);
}

function draw_bolt (bolt, route){
    draw_circle(route[bolt], BOLT_RADIUS, "black", 1, BOLT_COLOR);
}

function draw_route(route, rope, vectors){
    if (rope){
        draw_path(route, ROPE_COLOR)
    }//end rope
    for (let i = 1; i < route.length-1; i++) {
        if (vectors){draw_vector(i, route)};
        draw_bolt(i, route);
    }
    draw_circle(STARTING_POINT, 10, "black", 1, START_END_COLOR);
    draw_circle(route[route.length-1], 10, "black", 1, START_END_COLOR);
}//end function draw route

/* --- END DRAW FUNCTIONS --- */

/* ##################################################################
############### C'EST ICI QUE CA SE PASSE ########################
################################################################## */

current_route = create_route();
draw_route(current_route, LEVELS[level].rope, LEVELS[level].vectors);
//let test = smooth(current_route, 1);

draw_route(current_route, LEVELS[level].rope, LEVELS[level].vectors);


function on_bolt(point, route){
    for (let i = 1; i < route.length-1; i++) {
        if(length(point, route[i])< BOLT_RADIUS){
            //console.log("yes");
            return i;
        };
    }//end for
    return false;
}

/* document.addEventListener("click", function(event){
    let mouse = {};
    mouse.x = event.x;
    mouse.y = event.y
    
    if (on_bolt(mouse, current_route)){ //if you click on bolt
        if(on_bolt(mouse, current_route) == find_max_tensions(current_route)){ //if right bolt
            win_streak++;
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            current_route = create_route();
            if (level != LEVELS.length-1 && win_streak == 5){
                level++;
                win_streak = 0;
            } else if(level == LEVELS.length-1 && win_streak == 5){
                alert("Gagné !");
                level = 0;
                win_streak = 0;
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                current_route = create_route();
            }
            draw_route(current_route, LEVELS[level].rope, LEVELS[level].vectors);
        }//end if 
    };
});//end Click */


    
});//end everything (window on load)


