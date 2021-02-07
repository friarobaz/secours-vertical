window.addEventListener("load", () =>{
const canvas = document.getElementById("myCanvas");
const ctx = canvas.getContext("2d");
canvas.width = window.innerWidth; 
canvas.height = window.innerHeight;

/* YOU CAN CHANGE THIS */
const NB_OF_BOLTS = 5;
const END_Y = 20;
const MIN_X_VARIATION = 40;
const BOLT_RADIUS = 60;
const BOLT_COLOR = false;
const PATH_COLOR = "blue";
const VECTOR_COLOR = "red";
/* ------------------------- */
let paths = [];
let bolts = [];
const MAX_X_VARIATION = canvas.width/2/(NB_OF_BOLTS+3);
const Y_INCREMENT = (canvas.height-END_Y) / (NB_OF_BOLTS+1);
const STARTING_POINT = {x:canvas.width/2, y:canvas.height};

create_bolts();
draw_bolts();
analyse_path(0, true);
draw_path(0);
create_better_path();
analyse_path(paths.length-1, true);
draw_path(paths.length-1, "cyan");

    

document.addEventListener("click", function(event){
    create_better_path();
    analyse_path(paths.length-1, true);
    draw_path(paths.length-1, "cyan");
    
    //ctx.clearRect(0, 0, canvas.width, canvas.height); //clear
   
});

function create_bolts(){ //create a few random bolts
    let current_point = {pos:STARTING_POINT};
    for (let i = 0; i < NB_OF_BOLTS+2; i++) {
        let rand = Math.floor(Math.random() * MAX_X_VARIATION) + MIN_X_VARIATION;
        let dir = Math.round(Math.random()) * 2 - 1; //right or left
        
        let last_point = current_point; //remember current point, keep it in last point
        bolts[i] = current_point; //store current point in bolts
        
        //assign next position to current_point 
        current_point = {pos:{x:last_point.pos.x+(rand*dir),y:last_point.pos.y - Y_INCREMENT}}; 
    }//end for 
    console.log("bolts created");
    paths = []; //empty routes
    paths[0] = JSON.parse(JSON.stringify(bolts)); //store bolts in first place of array
}
function analyse_path(path_nb, graphic){ //calculate tensions etc and fill array with objects
    let path = paths[path_nb];
    path[0].tension_point = path[0].pos;
    path[0].tension = 0;
    path[0].contact_point = path[0].pos;
    path[path.length-1].tension_point = path[path.length-1].pos;
    path[path.length-1].tension = 0;
    path[path.length-1].contact_point = path[path.length-1].pos;
    for (let i = 1; i < path.length-1; i++) {//for each bolt
        path[i].is_max_tension = false; //reset
        path[i].tension_point = tension_point(i, path);
        path[i].tension = tension_strength(i, path);
        path[i].contact_point = contact_point(i, path);
        if(graphic){
            draw_circle(path[i].tension_point, "orange");
            draw_line(path[i].tension_point, path[i].pos);
            draw_circle(path[i].contact_point, "red");
        }
    }
    let tensions = path.map(x => x.tension);
    let max_tension = Math.max(...tensions)
    let index_of_max = tensions.reduce((iMax, x, i, arr) => x > arr[iMax] ? i : iMax, 0);
    path[index_of_max].is_max_tension = true;
    console.log(path);
    if (graphic){
        draw_circle(path[index_of_max].pos, "rgba(255,0,0,0.5)", 10);
    };
    console.log("Path["+path_nb+"] analyzed\n max tension : "+max_tension+" at bolt nb "+index_of_max);
}
function create_better_path(){
    console.log("####################");
    console.log("creating better path");
    let old = paths.length-1;
    let working = old+1;
    console.log("old path: "+old+"    working path: "+working);
    paths.push(JSON.parse(JSON.stringify(paths[old]))); //make copy of old path and add it to array
    
    for (let i = 1; i <= NB_OF_BOLTS; i++) { //for each bolt
        if (paths[working][i].is_max_tension){
            paths[working][i].pos = paths[working][i].contact_point; //change it to contact point
            console.log("changed bolt nb."+i+" to "+paths[working][i].contact_point.x);
        }
    }//end for
    
}
function isMiddleValid (path, bolt){
    console.log("checking");
    let a = path[bolt-1].pos;
    let b = bolts[bolt].pos;
    let c = path[bolt+1].pos;
    let middle = {x:(a.x+c.x)/2 , y:(a.y+c.y)/2};
    //draw_circle(middle, "purple", 5);
    //draw_circle(b, "orange", 5);
    if (length(middle,b)<BOLT_RADIUS){
        path[bolt].pos = middle;
        console.log("valid "+bolt);
    }
}

function length(a, b){
    return Math.sqrt(Math.pow((a.x - b.x), 2) + Math.pow((a.y - b.y), 2));
}
function tension_point(bolt, path) { //doesn't care about the bolts, only about the angle btwn 3 pnts
    const A = path[bolt-1].pos;
    const B = path[bolt].pos;
    const C = path[bolt+1].pos;
    const AC = {x: C.x - A.x,y: C.y - A.y};
    const k = ((B.x - A.x) * AC.x + (B.y - A.y) * AC.y) / (AC.x * AC.x + AC.y * AC.y);
    return {
      x: A.x + k * AC.x,
      y: A.y + k * AC.y
    };
}
function tension_strength(bolt, path){
    return Math.floor(length(path[bolt].pos, tension_point(bolt,path)));
}
function intersection_circle_line(a,c,radius){
    if (length(a,c)<radius){return c;}
    let x = -1*((radius/length(a,c))*(a.x-c.x)-a.x);
    let y = -1*((radius/length(a,c))*(a.y-c.y)-a.y);
    let point = {x:x,y:y};
    return point;
}
function contact_point(bolt, route){
    return intersection_circle_line(route[bolt].pos, route[bolt].tension_point, BOLT_RADIUS);
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
}
function draw_path(path_nb, color = PATH_COLOR, width){
    let path = paths[path_nb];
    ctx.beginPath();
    ctx.moveTo(path[0].pos.x, path[0].pos.y);
    for (let i = 1; i < path.length; i++) {
        ctx.lineTo(path[i].pos.x, path[i].pos.y);
    }
    if (width){ctx.lineWidth = width;}else {ctx.lineWidth = 3;}
    if (color){ctx.strokeStyle = color;}else {ctx.strokeStyle = "black";}
    ctx.stroke();
    console.log("path["+path_nb+"] drawn in "+color);
}
function draw_bolts (){
    for (let i = 1; i < bolts.length-1; i++) {
        draw_circle(bolts[i].pos, BOLT_COLOR, BOLT_RADIUS, "black");
    }
    draw_circle(STARTING_POINT, "blue", 10);
    draw_circle(bolts[bolts.length-1].pos, "blue", 10);
    console.log("bolts drawn");
} 

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
            current_route = create_bolts
        ();
            if (level != LEVELS.length-1 && win_streak == 5){
                level++;
                win_streak = 0;
            } else if(level == LEVELS.length-1 && win_streak == 5){
                alert("Gagné !");
                level = 0;
                win_streak = 0;
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                current_route = create_bolts
            ();
            }
            draw_route(current_route, LEVELS[level].rope, LEVELS[level].vectors);
        }//end if 
    };
});//end Click */


    
});//end everything (window on load)



/* const LEVELS = [{rope: true, vectors: true},
                {rope: true, vectors: false},
                {rope: false, vectors: false}]; */

/* let level = 0;
let win_streak = 0; */

/* function deg_to_rad(deg){
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
} */


