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
    ctx.lineWidth = 5;
    ctx.strokeStyle = "red";
    ctx.stroke();
}//end function draw route

function draw_quickdraws(route){
    ctx.fillStyle = "yellow";
    ctx.lineWidth = 2;
    ctx.strokeStyle = "black";
    
    for (let i = 1; i < route.length-1; i++) {
        //ctx.fillRect(route[i].x, route[i].y, 20, 20)
        ctx.beginPath();
        ctx.arc(route[i].x, route[i].y, 10, 0, 2 * Math.PI);
        ctx.fill();
        ctx.stroke();
    }
}

for (let i = 0; i < 1; i++) {
    
    create_route();
    draw_route(route);
    draw_quickdraws(route);
}
    
});//end everything (window on load)


