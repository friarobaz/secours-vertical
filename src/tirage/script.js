window.addEventListener("load", () =>{
const canvas = document.getElementById("myCanvas");
const ctx = canvas.getContext("2d");
canvas.width = window.innerWidth; 
canvas.height = window.innerHeight;

/* YOU CAN CHANGE THIS */
const NB_OF_BOLTS = 4;
const BORDER = 20; //how far away from the windows edge the last point will be
const MIN_X_VARIATION = 40; //min amount of zig zag 
const BOLT_RADIUS = 50; //length of initial quickdraws
const BIG_RADIUS = 60; //length of long quickdraws
const PATH_COLOR = "blue"; //rope color
const NB_QUICKDRAWS = 10; //number of long quickdraws available at start
/* ------------------------- */
const MAX_X_VARIATION = (canvas.width/2/(NB_OF_BOLTS+1))-(BORDER/NB_OF_BOLTS); //find x variation that doesn't leave the frame
if(MIN_X_VARIATION > MAX_X_VARIATION){alert("MIN_X_VARIATION too high");};
const Y_INCREMENT = (canvas.height-BORDER) / (NB_OF_BOLTS+1);
const STARTING_POINT = {x:canvas.width/2, y:canvas.height};
let paths = [];
let bolts = [];
let quickdraws_left = NB_QUICKDRAWS;
const nb = "path_nb";
const path = "path";

create_bolts();
draw_bolts();
find_best_path();
draw_path();
draw_quickdraws();
let start = last(nb); //remember path_nb before all clicks
write_data();


document.addEventListener("click", function(event){ //on mouse click
    let mouse = {x:event.x, y:event.y}
    if(on_bolt(mouse) && quickdraws_left){//if you click on bolt and you have quickdraws
        let bolt = on_bolt(mouse);
        if (bolts[bolt].big_radius){//if bolt is already big > do nothing
            return;
        }else{
            quickdraws_left--;
            bolts[bolt].big_radius = true; //make bolt bigger
            ctx.clearRect(0, 0, canvas.width, canvas.height); //clear canvas
            draw_bolts();
            find_best_path();
            write_data();
            draw_path(start, "rgba(255,0,0,0.2)");
            draw_path();
            draw_quickdraws();
            console.log(bolts[bolt])
            console.log(last(path)[bolt]);
        }//end else
    };//end if
});

function create_bolts(){ //create a few random bolts
    let current_point = {pos:STARTING_POINT};
    for (let i = 0; i < NB_OF_BOLTS+2; i++){ //+2 because we need to create first and last point too
        let rand = Math.random() * (MAX_X_VARIATION - MIN_X_VARIATION) + MIN_X_VARIATION; //how far to deviate
        let dir = Math.round(Math.random()) * 2 - 1; //right or left
        
        let last_point = current_point; //remember current point, keep it in last point
        bolts[i] = current_point; //write current point in bolts
        
        //assign next position to current_point 
        current_point = {pos:{x:last_point.pos.x+(rand*dir),y:last_point.pos.y - Y_INCREMENT}}; 
    }//end for 
    paths = []; //reset paths array
    paths[0] = JSON.parse(JSON.stringify(bolts)); //create first path that follows bolts centers
}
function analyse_path(path_nb=last(nb)){ //write tension_point, tension, contact_point, drag
    function tension_point(bolt, path) { //returns point towards which the bolt il pulled
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
    function tension_strength(bolt, path){ //returns length between bolt center and tension_point
        return Math.floor(length(path[bolt].pos, tension_point(bolt,path)));
    }
    function contact_point(bolt, path){ //returns where the bolt will end up if pulled
        if (bolts[bolt].big_radius){
            return intersection_circle_line(bolts[bolt].pos, path[bolt].tension_point, BIG_RADIUS);
        }
        else {
            return intersection_circle_line(bolts[bolt].pos, path[bolt].tension_point, BOLT_RADIUS)
        };
    }
    let path = paths[path_nb];
    //initialize first and last point in path
    path[0].tension_point = path[0].pos;
    path[0].tension = 0;
    path[0].contact_point = path[0].pos;
    path[path.length-1].tension_point = path[path.length-1].pos;
    path[path.length-1].tension = 0;
    path[path.length-1].contact_point = path[path.length-1].pos;

    for (let i = 1; i < path.length-1; i++) {//for each bolt (all points except first and last)
        path[i].is_max_tension = false; //reset
        path[i].tension_point = tension_point(i, path);
        path[i].tension = tension_strength(i, path);
        path[i].contact_point = contact_point(i, path);
    }
    let tensions = path.map(x => x.tension); //create array with tension strength at each point
    
    //find point with most tension and assign it "is_max_tension"
    let index_of_max = tensions.reduce((iMax, x, i, arr) => x > arr[iMax] ? i : iMax, 0);
    path[index_of_max].is_max_tension = true; 

    //create drag, the sum of all tensions in path and assign it to path
    let drag = tensions.reduce((a, b) => a + b, 0); 
    paths[path_nb].drag = drag;
}
function find_best_path(){ //runs create_better_path() a few times in normal and finetune mode
    function create_better_path(finetune){ //changes 1 bolt or all bolts in finetune mode
        analyse_path();
        paths.push(JSON.parse(JSON.stringify(last(path)))); //make copy of old path and add it to paths[] array
        for (let i = 1; i <= last(path).length-1; i++) { //check each bolt (each point except first and last)
            if (last(path)[i].is_max_tension || finetune){ //if current bolt is max tension bolt (or finetune mode)
                last(path)[i].pos = last(path)[i].contact_point; //change bolt position to contact_point
            }
        }//end for
    }
    for (let i = 0; i < NB_OF_BOLTS; i++) { //NB_OF_BOLTS could be any number
        create_better_path();
    }
    for (let i = 0; i < 10; i++) {
        create_better_path(true); //finetune mode
    }  
}
function on_bolt(point){ //check if mouse click is on bolt, returns bolt number or false
    for (let i = 1; i < bolts.length-1; i++) { //check all bolts
        if(length(point, bolts[i].pos)< BOLT_RADIUS){
            return i;
        };
    }//end for
    return false;
} 
function length(a, b){ //returns length between two points
    return Math.sqrt(Math.pow((a.x - b.x), 2) + Math.pow((a.y - b.y), 2));
}
function last(type){
    if (type == "path"){
        return paths[paths.length-1];
    }
    else if (type == "path_nb"){
        return paths.length-1;
    }
}
function intersection_circle_line(a,c,radius){ //returns point where circle intersects with segment
    if (length(a,c)<radius){return c;}
    let x = -1*((radius/length(a,c))*(a.x-c.x)-a.x);
    let y = -1*((radius/length(a,c))*(a.y-c.y)-a.y);
    return {x:x,y:y};
}
function get_angle(center,b,c){
    //returns angle in radient
    return Math.acos((Math.pow(length(center,b), 2) + Math.pow(length(center,c), 2) - Math.pow(length(b,c), 2)) / (2 * length(center,b) * length(center,c)))
}

/* --- DRAWING FUNCTIONS --- */

function draw_path(path_nb=last(nb), color=PATH_COLOR, width=3){
    let path = paths[path_nb];
    ctx.beginPath();
    ctx.moveTo(path[0].pos.x, path[0].pos.y);
    for (let i = 1; i < path.length; i++) {
        ctx.lineTo(path[i].pos.x, path[i].pos.y);
    }
    ctx.lineWidth = width;
    ctx.strokeStyle = color;
    ctx.stroke();
}
function draw_quickdraws(path_nb=last(nb)){
    function drawRotatedImage(point, angle){ 
        image = new Image();
        image.src = "quickdraw.png";
        image.onload = function() {
            ctx.save(); 
            ctx.translate(point.x, point.y);
            ctx.rotate(angle); // in radian
            let ratio =  BOLT_RADIUS / image.height*1.12;
            ctx.scale(ratio, ratio);
            ctx.drawImage(image, -(image.width/1.5),-(image.height/20));
            ctx.restore(); 
        }
    }   
    let path = paths[path_nb];
    for (let i = 1; i <= NB_OF_BOLTS; i++){
        let radius = BOLT_RADIUS;
        if (path[i].big_radius){radius = BIG_RADIUS;}
        let A = bolts[i].pos;
        let B = path[i].contact_point;
        let D = path[i-1].contact_point;
        let AB = length(A,B);
        let AC = radius;

        let alpha = get_angle(A,B,D);
        function deg_to_rad(deg){
            return deg * Math.PI / 180
        }

        let BC = Math.sqrt(Math.pow(AC,2)+Math.pow(AB,2)-2*AC*AB*Math.cos(alpha));

        //draw_circle(B,false, BC,"purple");
        
        let C = intersection_circle_line(B,D,BC);
        let CC = intersection_circle_line(B,D,-BC);

        draw_line(A,B);
        draw_line(B,C);
        draw_line(A,C);
        draw_circle(A, "green",3);
        draw_circle(B, "blue", 3);
        draw_circle(C, "red", 3);
        draw_circle(CC, "red", 3);
        draw_circle(D, "orange", 3);
        let R = {x:A.x, y:A.y+radius};
        let gauche = 1;
        if (C.x > R.x){gauche = -1};
        let angle = get_angle(A, C, R) * gauche;
        //drawRotatedImage(A,angle);
        
        console.log ("#################################");
        console.log(`BC: ${BC}`);
        console.log ("#################################");
    }
}
function draw_bolts (){
    for (let i = 1; i < bolts.length-1; i++) {
        let radius;
        if (bolts[i].big_radius){
            radius = BIG_RADIUS;
        }else{
            radius=BOLT_RADIUS;
        }
        draw_circle(bolts[i].pos, false, radius, "black"); //draw outside radius
        draw_circle(bolts[i].pos, "black", 2); //draw center
    }
    draw_circle(STARTING_POINT, "blue", 10); //draw starting point
    draw_circle(bolts[bolts.length-1].pos, "blue", 10); //draw finish point
} 
function write(text, point={x:50, y:50}){
    ctx.font = "20px arial";
    ctx.fillStyle = "black";
    ctx.fillText(text, point.x, point.y);
}
function write_data(){
    analyse_path();
    let drag = paths[start].drag*100;
    let reduction
    if (drag){
        reduction = Math.floor((paths[start].drag-last(path).drag)/drag);
    }else{reduction = 0;}
    
    write(`Tirage: ${last(path).drag} / ${paths[start].drag}`, {x:10, y:canvas.height-100});
    write(`Reduction: ${reduction}%`,{x:10, y:canvas.height-50});
    write(`Degaines longues dispo: ${quickdraws_left}`, {x:canvas.width-300, y:canvas.height-50})
}
function draw_circle (center, fillColor, radius=2, strokeColor, strokeWidth=1){  
    ctx.beginPath();
    ctx.arc(center.x, center.y, radius, 0, 2 * Math.PI);
    ctx.fillStyle = fillColor;
    if (fillColor){ctx.fill();};
    ctx.lineWidth = strokeWidth;
    ctx.strokeStyle = strokeColor;
    if (strokeColor){ctx.stroke();}; 
}
function draw_line(a,b,color = "black", width = 1){
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
    ctx.lineWidth = width;
    ctx.strokeStyle = color;
    ctx.stroke();
}
function draw_old_paths(percent=10){
    for (let i = 0; i < paths.length; i++) {
        draw_path(i, "rgba(0,0,0,"+percent/100+")");
    }
}






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

/* if(graphic){
    draw_circle(path[i].tension_point, "orange");
    draw_line(path[i].tension_point, path[i].pos);
    draw_circle(path[i].contact_point, "red");
} */

/* let max_tension = Math.max(...tensions); */

