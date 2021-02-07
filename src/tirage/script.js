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
let routes = [];
const MAX_X_VARIATION = canvas.width/2/(NB_OF_BOLTS+3);
const Y_INCREMENT = (canvas.height-END_Y) / (NB_OF_BOLTS+1);
const STARTING_POINT = {x:canvas.width/2, y:canvas.height};

function deg_to_rad(deg){
    return deg * Math.PI / 180
}
function rad_to_deg(rad){
    return rad * (180 / Math.PI)
}
function get_oppose(angle, hypo){
    //needs angle in degrees
    return Math.sin(deg_to_rad(angle)) * hypo;
}
function get_angle(a,b,c){
    //returns angle in radient
    return Math.acos((Math.pow(length(a,b), 2) + Math.pow(length(a,c), 2) - Math.pow(length(b,c), 2)) / (2 * length(a,b) * length(a,c)))
}

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
function find_max_tensions(route){
    let tensions = [];
    for (let i = 1; i < route.length-1; i++) {
        tensions[i-1] = tension_strength(i, route);
    }//end for 
    return tensions.indexOf(Math.max(...tensions))+1;
}
function intersection_circle_line(a,c,radius){
    if (length(a,c)<radius){return c;}
    let x = -1*((radius/length(a,c))*(a.x-c.x)-a.x);
    let y = -1*((radius/length(a,c))*(a.y-c.y)-a.y);
    let point = {x:x,y:y};
    return point;
}
function contact_point(bolt, route){
    return intersection_circle_line(route[bolt], tension_point(bolt, route), BOLT_RADIUS);
}

function create_route(){ //create a few random bolts
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

function analyse_route(route, graphic){ //calculate tensions etc and fill array with objects
    draw_path(route,"black");
    for (let i = 1; i < route.length-1; i++) {//for each bolt
        route[i].tension = tension_strength(i, route);
        route[i].tension_point = tension_point(i, route);
        route[i].contact_point = contact_point(i, route);
        if(graphic){
            draw_circle(route[i].tension_point, "orange");
            draw_line(route[i].tension_point, route[i]);
            draw_circle(route[i].contact_point, "red");
        }
    }
    console.log(route);
}

function smooth(route, smoothness){
    routes.push(JSON.parse(JSON.stringify(route))); //store copy of route before smoothing
    let better_route = JSON.parse(JSON.stringify(route)); //route > better_route
    for (let j = 0; j < 10; j++) {
        let last_route = JSON.parse(JSON.stringify(better_route)); //better_route > last_route
        for (let i = 1; i <= NB_OF_BOLTS; i++) { //for each bolt
            if (find_max_tensions(last_route) == i){ //if it's bolt with most tension
                better_route[i] = intersection_circle_line(route[i],tension_point(i, route),BOLT_RADIUS); //change it on better route
                break;
            }//end if
        }//end for
    }//end for
    draw_path(better_route);
    for (let j = 0; j < 100; j++) {
        let last_route = JSON.parse(JSON.stringify(better_route)); //better_route > last_route
        for (let i = 1; i <= NB_OF_BOLTS; i++) { //for each bolt
            better_route[i] = intersection_circle_line(route[i],tension_point(i, route),BOLT_RADIUS); //change it on better route
        }//end for
    }//end for
    return better_route;
}




/* --- DRAWING FUNCTIONS --- */

function write(text, point = {x:50, y:canvas.height-50}){
    ctx.font = "20px arial";
    ctx.fillStyle = "black";
    ctx.fillText(text, point.x, point.y);
}

function draw_circle (center, fillColor, radius = 3, strokeColor, strokeWidth = 1){  
    ctx.beginPath();
    ctx.arc(center.x, center.y, radius, 0, 2 * Math.PI);
    ctx.fillStyle = fillColor;
    if (fillColor){ctx.fill();};
    ctx.lineWidth = strokeWidth;
    ctx.strokeStyle = strokeColor;
    if (strokeColor){ctx.stroke();}; 
}

function draw_line(a,b,color, width){
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
    if (width){ctx.lineWidth = width;}else {ctx.lineWidth = 1;}
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

/* function draw_vector (bolt, route){
    let a = route[bolt];
    let b = intersection_circle_line(route[bolt],tension_point(bolt, route),BOLT_RADIUS);
    draw_line(a, b, VECTOR_COLOR, 3);
    //draw_circle(intersection_circle_line(route[bolt],tension_point(bolt, route),BOLT_RADIUS));
} */

function draw_bolt (bolt, route){
    draw_circle(route[bolt], false, BOLT_RADIUS, "black");
}

function draw_route(route, rope){
    if (rope){
        draw_path(route, ROPE_COLOR)
    }//end rope
    for (let i = 1; i < route.length-1; i++) {
        draw_bolt(i, route);
    }
    draw_circle(STARTING_POINT, "blue", 10);
    draw_circle(route[route.length-1], "blue", 10);
}//end function draw route

/* --- END DRAW FUNCTIONS --- */

/* ##################################################################
############### C'EST ICI QUE CA SE PASSE ########################
################################################################## */

current_route = create_route();
draw_route(current_route, true);

//draw_path(smooth(current_route, 100), "pink");

document.addEventListener("click", function(event){

    analyse_route(current_route, true);
});

/* function on_bolt(point, route){
    for (let i = 1; i < route.length-1; i++) {
        if(length(point, route[i])< BOLT_RADIUS){
            //console.log("yes");
            return i;
        };
    }//end for
    return false;
} */

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


