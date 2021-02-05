window.addEventListener("load", () =>{
const canvas = document.getElementById("myCanvas");
const ctx = canvas.getContext("2d");
canvas.width = window.innerWidth; 
canvas.height = window.innerHeight;

/* YOU CAN CHANGE THIS */
const NB_OF_BOLTS = 5;
const END_Y = 50;
const MIN_X_VARIATION = 10;
const BOLT_RADIUS = 10;
const BOLT_COLOR = "yellow";
const START_END_COLOR = "blue";
const ROPE_COLOR = "green";
const VECTOR_COLOR = "red";
const LEVELS = [{rope: true, vectors: true},
                {rope: true, vectors: false},
                {rope: false, vectors: false}];
let level = 0;
let win_streak = 0;
/* ------------------------- */

const MAX_X_VARIATION = canvas.width/2/(NB_OF_BOLTS+2);
const Y_INCREMENT = (canvas.height-END_Y) / (NB_OF_BOLTS+1);
const STARTING_POINT = {x:canvas.width/2, y:canvas.height};
let route = [];
let tensions = [];

/* --- MATH FUNCTIONS --- */
function length(a, b){
    return Math.sqrt(Math.pow((a.x - b.x), 2) + Math.pow((a.y - b.y), 2));
}
function tension_point(bolt) {
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
function tension_strength(bolt){
    return Math.floor(length(route[bolt], tension_point(bolt)));
}

function create_route(){
    let current_point = STARTING_POINT;
    for (let i = 0; i < NB_OF_BOLTS+2; i++) {
        let rand = Math.floor(Math.random() * MAX_X_VARIATION) + MIN_X_VARIATION;
        let dir = Math.round(Math.random()) * 2 - 1; //right or left
        
        let last_point = current_point; //remember current point, keep it in last point
        route[i] = current_point; //store current point in route
        
        //assign next position to current_point 
        current_point = {x:last_point.x+(rand*dir), y: last_point.y - Y_INCREMENT}; 
    }//end for 
} //end function create_route

function find_max_tensions(route){
    for (let i = 1; i < route.length-1; i++) {
        tensions[i-1] = tension_strength(i);
    }//end for 
    return tensions.indexOf(Math.max(...tensions))+1;
}

/* --- DRAWING FUNCTIONS --- */

function draw_circle (center, radius, strokeColor, strokeWidth, fillColor){  
    ctx.beginPath();
    ctx.arc(center.x, center.y, radius, 0, 2 * Math.PI);
    if (fillColor){
        ctx.fillStyle = fillColor;
        ctx.fill();
    }; 
    if (strokeWidth){
        ctx.lineWidth = strokeWidth;
        ctx.strokeStyle = strokeColor;
        ctx.stroke();
    };
}//end draw_circle

function draw_line(a,b,couleur, width){
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
    ctx.lineWidth = width;
    ctx.strokeStyle = couleur;
    ctx.stroke();
}//end draw_line

function draw_vector (bolt){
    draw_line(route[bolt], tension_point(bolt), VECTOR_COLOR, 3);
}

function draw_bolt (bolt){
    draw_circle(route[bolt], BOLT_RADIUS, "black", 1, BOLT_COLOR);
}

function draw_route(route, rope, vectors){
    if (rope){
        ctx.beginPath();
        ctx.moveTo(route[0].x, route[0].y);
        for (let i = 1; i < route.length; i++) {
            ctx.lineTo(route[i].x, route[i].y);
        }
        ctx.lineWidth = 3;
        ctx.strokeStyle = ROPE_COLOR;
        ctx.stroke();
    }//end rope
    for (let i = 1; i < route.length-1; i++) {
        if (vectors){draw_vector(i)};
        draw_bolt(i);
    }
    draw_circle(STARTING_POINT, 10, "black", 1, START_END_COLOR);
    draw_circle(route[route.length-1], 10, "black", 1, START_END_COLOR);
}//end function draw route

for (let i = 0; i < 1; i++) {
    create_route();
    draw_route(route, LEVELS[level].rope, LEVELS[level].vectors);
    //draw_circle(route[find_max_tensions(route)], 8, "black", 0, "red");
}//end for

document.addEventListener("click", function(event){
    let mouse = {};
    mouse.x = event.x;
    mouse.y = event.y
    for (let i = 1; i < route.length-1; i++) {
        if(length(mouse, route[i])< BOLT_RADIUS){
            console.log(i);
            if(i == find_max_tensions(route)){
                win_streak++;
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                create_route();
                if (level != LEVELS.length-1 && win_streak == 5){
                    level++;
                    win_streak = 0;
                } else if(level == LEVELS.length-1 && win_streak == 5){
                    alert("Gagné !");
                }
                draw_route(route, LEVELS[level].rope, LEVELS[level].vectors);
            }//end if  
        }//end if   
    }//end for

  });

    
});//end everything (window on load)


