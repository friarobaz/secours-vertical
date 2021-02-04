window.addEventListener("load", () =>{
const canvas = document.getElementById("myCanvas");
const ctx = canvas.getContext("2d");

/* YOU CAN CHANGE THIS */
const NB_OF_QUICKDRAWS = 10;
const END_Y = 50;
const MIN_X_VARIATION = 10;
/* ------------------------- */

canvas.width = window.innerWidth; 
canvas.height = window.innerHeight;
const MAX_X_VARIATION = canvas.width/2/(NB_OF_QUICKDRAWS+2);
const Y_INCREMENT = (canvas.height-END_Y) / (NB_OF_QUICKDRAWS+1);
const STARTING_POINT = {x:canvas.width/2, y:canvas.height};
let route = [];

function get_length(a, b){
    return Math.sqrt(Math.pow((a.x - b.x), 2) + Math.pow((a.y - b.y), 2));
}

function create_route(){
    let current_point = STARTING_POINT;
    for (let i = 0; i < NB_OF_QUICKDRAWS+2; i++) {
        let rand = Math.floor(Math.random() * Math.floor(MAX_X_VARIATION))+MIN_X_VARIATION;
        let dir = Math.round(Math.random()) * 2 - 1;
        
        let last_point = current_point; //remember current point, keep it in last point
        route[i] = current_point; //right current point in route
        
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

function draw_quickdraws(route){
    ctx.fillStyle = "yellow";
    ctx.lineWidth = 2;
    ctx.strokeStyle = "black";
    
    for (let i = 1; i < route.length-1; i++) {
        ctx.beginPath();
        ctx.arc(route[i].x, route[i].y, 8, 0, 2 * Math.PI);
        ctx.fill();
        ctx.stroke();
    }
}

function draw_line(a,b){
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
    ctx.lineWidth = 3;
    ctx.strokeStyle = "blue";
    ctx.stroke();
}

function get_oppose(a, h){
    return Math.sin(a*Math.PI / 180) * h;
}

for (let i = 0; i < 1; i++) {
    
    create_route();
    draw_route(route);
    draw_quickdraws(route);
    draw_line(route[3], route[5]);
    console.log("ligne bleu : " + get_length(route[3], route[5]));
    console.log();
    //console.log(get_oppose(90, 1));
}
    
});//end everything (window on load)


