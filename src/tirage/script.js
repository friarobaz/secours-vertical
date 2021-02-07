window.addEventListener("load", () =>{
const canvas = document.getElementById("myCanvas");
const ctx = canvas.getContext("2d");
canvas.width = window.innerWidth; 
canvas.height = window.innerHeight;

/* YOU CAN CHANGE THIS */
const NB_OF_BOLTS = 6;
const END_Y = 20;
const MIN_X_VARIATION = 50;
const BOLT_RADIUS = 30;
const BIG_RADIUS = 60;
const BOLT_COLOR = false;
const PATH_COLOR = "blue";
const SHOW_AID = true; //rope etc
const NB_QUICKDRAWS = 3;
/* ------------------------- */
let paths = [];
let bolts = [];
let quickdraws_left = NB_QUICKDRAWS;
const MAX_X_VARIATION = canvas.width/2/(NB_OF_BOLTS+3);
const Y_INCREMENT = (canvas.height-END_Y) / (NB_OF_BOLTS+1);
const STARTING_POINT = {x:canvas.width/2, y:canvas.height};











create_bolts();
draw_bolts();
analyse_path(0);
find_best_path(SHOW_AID);
let before = paths.length-1; //remember path nb before all clicks
write(`Tirage: ${paths[paths.length-1].tirage} / ${paths[before].tirage}`, {x:10, y:canvas.height-100});
write(`Reduction: 0%`,{x:10, y:canvas.height-50});
write(`Degaines longues dispo: ${quickdraws_left}`, {x:canvas.width-300, y:canvas.height-50})


document.addEventListener("click", function(event){
    let mouse = {};
    mouse.x = event.x;
    mouse.y = event.y
    if(on_bolt(mouse) && quickdraws_left){//if you click on bolt
        if (bolts[on_bolt(mouse)].big_radius){//if bolt already big > do nothing
            return;
        }else{
            quickdraws_left--;
            bolts[on_bolt(mouse)].big_radius = true; //make bolt bigger
            ctx.clearRect(0, 0, canvas.width, canvas.height); //clear canva
            draw_bolts();
            find_best_path(SHOW_AID);
            let new_tirage = paths[paths.length-1].tirage;
            let reduction = Math.floor((paths[before].tirage-new_tirage)/paths[before].tirage*100);
            write(`Tirage: ${new_tirage} / ${paths[before].tirage}`, {x:10, y:canvas.height-100});
            write(`Reduction: ${reduction}%`,{x:10, y:canvas.height-50});
            write(`Degaines longues dispo: ${quickdraws_left}`, {x:canvas.width-300, y:canvas.height-50})
            if (SHOW_AID){
                draw_path(before, "rgba(255,0,0,0.2)");
                draw_path(paths.length-1);
            };//end if
        }//end else
    };//end if
});//end listen

function on_bolt(point){//returns bolt number
    for (let i = 1; i < bolts.length-1; i++) {
        if(length(point, bolts[i].pos)< BOLT_RADIUS){
            return i;
        };
    }//end for
    return false;
} 
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
    if (graphic){
        draw_circle(path[index_of_max].pos, "rgba(255,0,0,0.5)", 10);
    };
    let tirage = tensions.reduce((a, b) => a + b, 0);
    paths[path_nb].tirage = tirage;
    //console.log("Path["+path_nb+"] tirage: "+tirage);
}
function create_better_path(finetune){
    let old = paths.length-1;
    let working = old+1;
    paths.push(JSON.parse(JSON.stringify(paths[old]))); //make copy of old path and add it to array
    
    for (let i = 1; i <= NB_OF_BOLTS; i++) { //check each bolt
        if (paths[working][i].is_max_tension || finetune || bolts[i].big_radius){ //if current bolt is max tension bolt
            paths[working][i].pos = paths[working][i].contact_point; //change it to contact point
        }
    }//end for
}
function find_best_path(graphic){
    for (let i = 0; i < NB_OF_BOLTS; i++) {
        
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        draw_bolts()
        create_better_path();
        analyse_path(paths.length-1, false);
        if(graphic){draw_path(paths.length-1, PATH_COLOR);}
    }
    for (let i = 0; i < 10; i++) {
        
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        draw_bolts()
        create_better_path(true);
        analyse_path(paths.length-1, false);
        if(graphic){draw_path(paths.length-1, PATH_COLOR);}
    }  
}
function length(a, b){
    return Math.sqrt(Math.pow((a.x - b.x), 2) + Math.pow((a.y - b.y), 2));
}
function tension_point(bolt, path) { //orange point, doesn't care about the bolts
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
function contact_point(bolt, path){ //red point
    if (bolts[bolt].big_radius){
        return intersection_circle_line(bolts[bolt].pos, path[bolt].tension_point, BIG_RADIUS);
    }
    else {return intersection_circle_line(bolts[bolt].pos, path[bolt].tension_point, BOLT_RADIUS)};
}

/* --- DRAWING FUNCTIONS --- */

function write(text, point = {x:50, y:canvas.height-50}){
    ctx.font = "20px arial";
    ctx.fillStyle = "black";
    ctx.fillText(text, point.x, point.y);
}
function draw_circle (center, fillColor, radius = 2, strokeColor, strokeWidth = 1){  
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
}
function draw_old_paths(percent){
    for (let i = 0; i < paths.length; i++) {
        draw_path(i, "rgba(0,0,0,"+percent/100+")");
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
        draw_circle(bolts[i].pos, BOLT_COLOR, radius, "black");
        draw_circle(bolts[i].pos, "black");
    }
    draw_circle(STARTING_POINT, "blue", 10);
    draw_circle(bolts[bolts.length-1].pos, "blue", 10);
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


