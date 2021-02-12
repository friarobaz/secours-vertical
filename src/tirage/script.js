window.addEventListener("load", () =>{
const canvas = document.getElementById("myCanvas");
const ctx = canvas.getContext("2d");
canvas.width = window.innerWidth; 
canvas.height = window.innerHeight;

/* YOU CAN CHANGE THIS */
const BACKGROUND_COLOR = "#EEEEEE";
const NB_OF_BOLTS = 6;
const BORDER = 20; //how far away from the windows edge the last point will be
const MIN_X_VARIATION = 60; //min amount of zig zag 
const BOLT_RADIUS = 40; //length of initial quickdraws
const BIG_RADIUS = 80; //length of long quickdraws
const PATH_COLOR = "blue"; //rope color
const NB_QUICKDRAWS = 3; //number of long quickdraws available at start
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
let bolts_chosen = [];
let bolts_chosen_AI = [];
let on_display = {
    background: true,
    bolts: true,
    bolt_radius: false,
    quickdraws: true,
    path: false,
    info: true,
    straight_line: true,
    buttons: false,
};
const buttons = [
    {
        x: 100,
        y: 100,
        bgColor: "green",
        width: 200,
        height: 100,
        text: "Toggle straight line",
        txtColor: "black",
        action: function () {
            on_display.straight_line = !on_display.straight_line;
             draw();
        }
    },
    {
        x: 500,
        y: 100,
        bgColor: "blue",
        width: 200,
        height: 100,
        text: "lol",
        txtColor: "black",
        action: function () {
            console.log("lol");
        }
    }
    ];//end buttons


create_bolts();
find_best_path();
let start = last(nb); //remember path_nb before AI
console.log(`Path[${start}] before AI`);
draw();
AI();
console.log(`Path[${last(nb)}] after AI`);
console.log(paths[start] == last(path));
draw();



function draw(){
    ctx.clearRect(0, 0, canvas.width, canvas.height); //clear canvas
    if (on_display.background){
        ctx.fillStyle = BACKGROUND_COLOR;
        ctx.fillRect(0,0,canvas.width, canvas.height);
    }
    if (on_display.bolts){draw_bolts();}
    if (on_display.quickdraws && !on_display.path){draw_quickdraws(true);}
    if (on_display.path){draw_path();}
    if (on_display.info){write_data();}
    if (on_display.straight_line && !on_display.path){draw_line(bolts[0].pos,bolts[bolts.length-1].pos, "blue", 1);}
    if (on_display.buttons){buttons.forEach(element => draw_button(element));}
}
function AI(){
    for (let j = 0; j < NB_QUICKDRAWS; j++) {
        let tensions = last(path).map(x => x.tension); //make array with all tensions
        for (let i = 1; i <= NB_OF_BOLTS; i++) { //for all bolts
            if(bolts[i].radius == BIG_RADIUS){
                tensions[i] = 0;
            }
        }
        let index_of_max = tensions.reduce((iMax, x, i, arr) => x > arr[iMax] ? i : iMax, 0); //get index of max tension
        if(index_of_max != 0){ //if not first bolt (starting point)
            bolts_chosen_AI.push(index_of_max); //add to chosen bolts
            bolts[index_of_max].radius = BIG_RADIUS; //make radius big
        }
        find_best_path();
    }
    bolts_chosen_AI.sort(function(a, b){return a-b}); //sort array
    console.log(`Bolts chosen by AI: ${bolts_chosen_AI}`);
    quickdraws_left = bolts_chosen_AI.length;
    console.log(`Number of quickdraws needed: ${quickdraws_left}`);
    analyse_path();
    let reduction;
    if (paths[start].drag){
        reduction = Math.floor((paths[start].drag-last(path).drag)/paths[start].drag*100);
    }else{reduction = 0;}   
    console.log(`Tirage: ${last(path).drag} / ${paths[start].drag}`); 
    console.log(`Reduction: ${reduction}%`); 
    paths.push(paths[start]); //reset path to start position
    for (let i = 0; i < bolts.length-1; i++) { //reset bolts to start position
    bolts[i].radius = BOLT_RADIUS; 
    }
    analyse_path();
}
function draw_button(button){
    let center = {x:button.x+button.width/2, y:button.y+button.height/2};
    ctx.fillStyle = button.bgColor;
    ctx.fillRect(button.x,button.y,button.width, button.height);
    write(button.text, center );
}
function on_button(mouse, button){
    if(button.x < mouse.x && mouse.x < button.x+button.width && button.y < mouse.y && mouse.y < button.y+button.height){
        return true;
    }else{
        return false;
    }
}
function check_buttons(mouse){
    if (!on_display.buttons){return};
    buttons.forEach(element => {
        if(on_button(mouse,element)){
            element.action();
        }
    });
}
document.addEventListener("click", function(event){ //on mouse click
    let mouse = {x:event.x, y:event.y}
    check_buttons(mouse);
    let bolt = on_bolt(mouse);
    if(on_bolt(mouse) && quickdraws_left){//if you click on bolt and you have quickdraws
        if (bolts[bolt].radius == BIG_RADIUS){//if bolt is already big > do nothing
            return;
        }else{
            quickdraws_left--;
            bolts_chosen.push(bolt);
            bolts[bolt].radius = BIG_RADIUS; //make bolt bigger
            find_best_path();
            
            if (!quickdraws_left){
                on_display.path = true;
                on_display.straight_line = false;
                bolts_chosen.sort(function(a, b){return a-b});
                console.log(`Bolts chosen: ${bolts_chosen}`);
            }
            draw();
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
    for (let i = 1; i <= NB_OF_BOLTS; i++) {
        bolts[i].radius = BOLT_RADIUS;
    }
}
function analyse_path(path_nb=last(nb)){ //write tension_point, tension, contact_point, drag
    function tension_point(bolt, path) { //returns point towards which the bolt il pulled
        const A = path[bolt-1].pos;
        const B = path[bolt].pos;
        const C = path[bolt+1].pos;
        const AC = {x: C.x - A.x,y: C.y - A.y};
        const k = ((B.x - A.x) * AC.x + (B.y - A.y) * AC.y) / (AC.x * AC.x + AC.y * AC.y);
        const point = {x: A.x + k * AC.x, y: A.y + k * AC.y};
        return point;
}
    function tension_strength(bolt, path){ //returns length between bolt center and tension_point
        return Math.floor(length(path[bolt].pos, tension_point(bolt,path)));
    }
    function contact_point(bolt, path){ //returns where the bolt will end up if pulled
        
        return intersection_circle_line(bolts[bolt].pos, path[bolt].tension_point, bolts[bolt].radius);
        
    }
    function quickdraw_entry (bolt, path){
        let A = bolts[bolt].pos;
        let B = path[bolt].contact_point;
        let D = path[bolt-1].contact_point;
        let AB = length(A,B);
        let AC = bolts[bolt].radius;
        let beta = get_angle(B,A,D);
        let BC = AB*Math.cos(beta)+(Math.sqrt(Math.pow(AB,2)*((1+Math.cos(2*beta))/2)-Math.pow(AB,2)+Math.pow(AC,2)));
        let C = intersection_circle_line(B,D,BC);
        return C;
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
        path[i].quickdraw_entry = quickdraw_entry(i, path);
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
    draw_quickdraws();
}
function draw_quickdraws(loose, path_nb=last(nb)){
    function draw_quickdraw(path, bolt,loose, big){
        let A = bolts[bolt].pos; //quickdraw center
        let C = path[bolt].quickdraw_entry; //quickdraw entry point
        let R = {x:A.x, y:A.y+69420}; //reference point
        let AC = bolts[bolt].radius; //radius
        let gauche = 1;
        if (C.x > R.x){gauche = -1};
        let angle = get_angle(A, C, R) * gauche;
        if (loose){angle = 0;};
        if(big){ //if long quickdraw
            image2 = new Image();
            image2.src = `quickdraw_long.png`;
            image2.onload = function() {
                ctx.save(); 
                ctx.translate(A.x, A.y);
                ctx.rotate(angle); // in radian
                let ratio = AC / image2.height*1.12;
                ctx.scale(ratio, ratio);
                ctx.drawImage(image2, -(image2.width/1.5),-(image2.height/40));
                ctx.restore(); 
            }
        }else{ //if short quickdraw
            image = new Image();
            image.src = `quickdraw_short.png`;
            image.onload = function() {
                ctx.save(); 
                ctx.translate(A.x, A.y);
                ctx.rotate(angle); // in radian
                let ratio = AC / image.height*1.12;
                ctx.scale(ratio, ratio);
                ctx.drawImage(image, -(image.width/1.5),-(image.height/20));
                ctx.restore(); 
            }
        }
    }
    let path = paths[path_nb];
    for (let i = 1; i <= NB_OF_BOLTS; i++){
        if(bolts[i].radius == BIG_RADIUS){
            draw_quickdraw(path,i, loose,true);
        }else{
            draw_quickdraw(path,i,loose,false);
        };
    }
}
function draw_bolts (){
    for (let i = 1; i < bolts.length-1; i++) {
        let radius = bolts[i].radius;
        if(on_display.bolt_radius){
            draw_circle(bolts[i].pos, false, radius, "grey"); //draw outside radius
        }
        draw_circle(bolts[i].pos, "black"); //draw center
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
    let drag = paths[start].drag;
    let reduction;
    if (drag){
        reduction = Math.floor((paths[start].drag-last(path).drag)/drag*100);
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

