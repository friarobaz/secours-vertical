window.addEventListener("load", () =>{
const canvas = document.getElementById("myCanvas");
const ctx = canvas.getContext("2d");
canvas.width = window.innerWidth; 
canvas.height = window.innerHeight;

/* YOU CAN CHANGE THIS */
const NB_OF_BOLTS = 5;
const END_Y = 50;
const MIN_X_VARIATION = 10;
/* ------------------------- */

const MAX_X_VARIATION = canvas.width/2/(NB_OF_BOLTS+2);
const Y_INCREMENT = (canvas.height-END_Y) / (NB_OF_BOLTS+1);
const STARTING_POINT = {x:canvas.width/2, y:canvas.height};
let route = [];

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
    return length(route[bolt], tension_point[bolt]);
}

/* INUTILE
function deg_to_rad(deg){
    return deg * Math.PI / 180
}
function rad_to_deg(rad){
    return rad * (180 / Math.PI)
}
function get_oppose(angle, hypo){
    //angle in degrees
    return Math.sin(deg_to_rad(angle)) * hypo;
}
function get_angle(a,b,c){
    //returns angle in radient
    return Math.acos((Math.pow(length(a,b), 2) + Math.pow(length(a,c), 2) - Math.pow(length(b,c), 2)) / (2 * length(a,b) * length(a,c)))
}
*/

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

/* --- DRAWING FUNCTIONS --- */

function draw_route(route){
    ctx.beginPath();
    ctx.moveTo(route[0].x, route[0].y);
    for (let i = 1; i < route.length; i++) {
        ctx.lineTo(route[i].x, route[i].y);
    }
    ctx.lineWidth = 3;
    ctx.strokeStyle = "green";
    ctx.stroke();
}//end function draw route

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

function draw_vector (bolt){
    draw_line(route[bolt], tension_point(bolt), "red", 3);
}

function draw_bolt (bolt){
    draw_circle(route[bolt], 10, "black", 2, "yellow");
}

function draw_bolts(route){
    for (let i = 1; i < route.length-1; i++) {
        draw_bolt(i);
        draw_vector(i);
    }
    draw_circle(STARTING_POINT,10, "black", 2, "blue");
    draw_circle(route[route.length-1],10, "black", 2, "blue");
}

function draw_line(a,b,couleur, width){
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
    ctx.lineWidth = width;
    ctx.strokeStyle = couleur;
    ctx.stroke();
}//end draw_line


for (let i = 0; i < 1; i++) {
    
    create_route();
    draw_route(route);
    draw_bolts(route);
}//end for


    
});//end everything (window on load)


