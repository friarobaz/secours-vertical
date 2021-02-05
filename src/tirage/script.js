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

function get_length(a, b){
    return Math.sqrt(Math.pow((a.x - b.x), 2) + Math.pow((a.y - b.y), 2));
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

function draw_route(route){
    ctx.beginPath();
    ctx.moveTo(route[0].x, route[0].y);
    for (let i = 1; i < route.length; i++) {
        ctx.lineTo(route[i].x, route[i].y);
    }
    ctx.lineWidth = 3;
    ctx.strokeStyle = "red";
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

function draw_bolts(route){
    for (let i = 1; i < route.length-1; i++) {
        ctx.beginPath();
        draw_circle(route[i], 10, "black", 2, "yellow");
    }
}

function draw_line(a,b,couleur){
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
    ctx.lineWidth = 3;
    ctx.strokeStyle = couleur;
    ctx.stroke();
}

function get_oppose(a, h){
    return Math.sin(deg_to_rad(a)) * h;
}

function deg_to_rad(deg){
    return deg * Math.PI / 180
}

function rad_to_deg(rad){
    return rad * (180 / Math.PI)
}

function get_angle(a,b,c){
    return Math.acos((Math.pow(get_length(a,b), 2) + Math.pow(get_length(a,c), 2) - Math.pow(get_length(b,c), 2)) / (2 * get_length(a,b) * get_length(a,c)))
}

let test1 = {x:500, y:500}
let test2 = {x:5, y:0}
let test3 = {x:0, y:4}

for (let i = 0; i < 1; i++) {
    
    create_route();
    draw_route(route);
    draw_bolts(route);
    //draw_line(route[3], route[5], "green");
    //draw_line(route[3], route[4], "blue");
    console.log("ligne bleu : " + get_length(route[3], route[4]));
    console.log("ligne verte : " + get_length(route[3], route[5]));
    let angle = rad_to_deg(get_angle(route[3], route[4], route[5]));
    let oppose = get_oppose(angle, get_length(route[3], route[4]));
    //draw_circle(route[4].x, route[4].y, oppose);
}
function tension(A, B, P) {
    const AB = {
      x: B.x - A.x,
      y: B.y - A.y
    };
    const k = ((P.x - A.x) * AB.x + (P.y - A.y) * AB.y) / (AB.x * AB.x + AB.y * AB.y);
    return {
      x: A.x + k * AB.x,
      y: A.y + k * AB.y
    };
  }
  
  const A = route[3];
  const B = route[5];
  const P = route[4];
  const C = tension(A, B, P);
  console.log(C);
  draw_line(C,P, "blue");


    
});//end everything (window on load)


