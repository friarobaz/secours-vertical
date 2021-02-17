function start_game(){
    document.getElementById("welcome").style.display = 'none';
    document.getElementById("myCanvas").style.display = 'block';
}

window.addEventListener("load", () =>{
const canvas = document.getElementById("myCanvas");
const ctx = canvas.getContext("2d");
canvas.width = window.innerWidth; 
canvas.height = window.innerHeight;

/* YOU CAN CHANGE THIS */
const BACKGROUND_COLOR = "#EEEEEE";
const NB_OF_BOLTS = 6;
const NB_WINS_NEXT_LEVEL = 3;
const BORDER = 20; //how far away from the windows edge the last point will be
let MIN_X_VARIATION = 60; //min amount of zig zag 
let BOLT_RADIUS = 50; //length of initial quickdraws
const BIG_RADIUS = 80; //length of long quickdraws
const CARABINER_SCALE = 12; 
const SHORT_SLING_COLOR = "green";
const BIG_SLING_COLOR = "orange";
const PATH_COLOR = "blue"; //rope color
const NB_QUICKDRAWS = 3; //number of long quickdraws available at start 
/* ------------------------- */
const MAX_X_VARIATION = (canvas.width/2/(NB_OF_BOLTS+1))-(BORDER/NB_OF_BOLTS); //find x variation that doesn't leave the frame
MIN_X_VARIATION = MAX_X_VARIATION;
if(MIN_X_VARIATION > MAX_X_VARIATION){alert("MIN_X_VARIATION too high");};
const Y_INCREMENT = (canvas.height-BORDER) / (NB_OF_BOLTS+1);
const STARTING_POINT = {x:canvas.width/2, y:canvas.height};
const nb = "path_nb";
const path = "path";
let reduction_user;
let reduction_AI;
let paths = [];
let bolts = [];
let quickdraws_left = 0;
let end = false; //when user has spent all his quickdraws
let bolts_chosen = [];
let bolts_chosen_AI = [];
let level = 1;
let wins = 0;
let mouse;
let on_display = {
    background: true,
    bolts: true,
    bolt_radius: false,
    quickdraws: true,
    path: true,
    info: true,
    straight_line: false,
    buttons: false,
    status: false,
    tension: true,
    AI_bolts: false,
    quickdraws_left: true,
};

const buttons = [
    {
        x: 0,
        y: 100,
        bgColor: "green",
        width: 150,
        height: 50,
        text: "Line",
        txtColor: "black",
        action: function () {
            on_display.straight_line = !on_display.straight_line;
            draw();
        }
    },
    {
        x: 0,
        y: 50,
        bgColor: "blue",
        width: 150,
        height: 50,
        text: "Path",
        txtColor: "black",
        action: function () {
            on_display.path = !on_display.path;
            draw();
        }
    },
    {
        x: 0,
        y: 0,
        bgColor: "red",
        width: 150,
        height: 50,
        text: "Quickdraws",
        txtColor: "black",
        action: function () {
            on_display.quickdraws = !on_display.quickdraws;
            draw();
        }
    },
    {
        x: 0,
        y: 150,
        bgColor: "yellow",
        width: 150,
        height: 50,
        text: "Tension",
        txtColor: "black",
        action: function () {
            on_display.tension = !on_display.tension;
            draw();
        }
    },
    ];//end buttons

while(quickdraws_left < 2){
    create_bolts();
    find_best_path();
    var start = last(nb); //remember path_nb before AI
    AI();
}
draw();

document.addEventListener('mousemove', e => {
    
    //drawLine(context, x, y, e.clientX - rect.left, e.clientY - rect.top);
    let x = e.clientX;
    let y = e.clientY;
    mouse = {x:x, y:y};
    draw();
});

document.addEventListener("click", function(event){ //on mouse click
    if(document.getElementById("myCanvas").style.display == 'block'){
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
                if(bolts_chosen_AI.includes(bolt)){
                    bolts[bolt].status = "right";
                }else {
                    bolts[bolt].status = "wrong";
                }
                
                find_best_path();
                
                if (!quickdraws_left){
                    //on_display.status = true;
                    end = true;
                    on_display.path = true;
                    on_display.straight_line = false;
                    bolts_chosen.sort(function(a, b){return a-b});
                    console.log("______ USER _________");
                    console.log(`Bolts chosen: ${bolts_chosen}`);
                    analyse_path();
                    let drag = paths[start].drag;
                    
                    if (drag){
                        reduction_user = Math.floor((paths[start].drag-last(path).drag)/drag*100);
                    }else{reduction_user = 0;}
                    console.log(`reduction_user: ${reduction_user}%`);
                    let win_ratio = reduction_user/reduction_AI;
                    console.log(`Win ratio: ${win_ratio}`);
                    if (win_ratio>0.97){
                        win();
                    }else{
                        lose();
                    };
                }
                draw();
            }//end else
        };//end if
    };//end if display block
});
function win(){
    console.log("win");
    wins++;
    if(wins == NB_WINS_NEXT_LEVEL){
        wins = 0;
        level++;
        if(level >= 2){
            on_display.tension = false;
        }
        if(level >= 3){
            on_display.path = false;
        }
    }
    reset();
    while(quickdraws_left < 2){
        create_bolts();
        find_best_path();
        var start = last(nb); //remember path_nb before AI
        AI();
    }
    draw();
}
function lose(){
    console.log("lose");
    reset();
    while(quickdraws_left < 2){
        create_bolts();
        find_best_path();
        var start = last(nb); //remember path_nb before AI
        AI();
    }
    draw();
}
function reset(){
    reduction_user = 0;
    reduction_AI = 0;
    paths = [];
    bolts = [];
    quickdraws_left = 0;
    end = false; //when user has spent all his quickdraws
    bolts_chosen = [];
    bolts_chosen_AI = [];
}
function AI(){
    console.clear();
    console.log("_______ AI ________");
    bolts_chosen_AI = [];
    for (let j = 0; j < NB_QUICKDRAWS; j++) {
        let tensions = last(path).map(x => x.tension); //make array with all tensions
        for (let i = 1; i <= NB_OF_BOLTS; i++) { //for all bolts
            if(bolts[i].radius == BIG_RADIUS){
                tensions[i] = 0;
            }
        }
        let index_of_max = tensions.reduce((iMax, x, i, arr) => x > arr[iMax] ? i : iMax, 0); //get index of max tension
        if(index_of_max != 0){ //if not first bolt (starting point)
            //console.log(`Most tension at bolt ${index_of_max}, making it big`);
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
    if (paths[start].drag){
        reduction_AI = Math.floor((paths[start].drag-last(path).drag)/paths[start].drag*100);
    }else{reduction_AI = 0;}   
    //console.log(`Tirage: ${last(path).drag} / ${paths[start].drag}`); 
    console.log(`Reduction_AI: ${reduction_AI}%`); 
    paths.push(paths[start]); //reset path to start position
    for (let i = 0; i < bolts.length-1; i++) { //reset bolts to start position
    bolts[i].radius = BOLT_RADIUS; 
    }
    analyse_path();
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
    path[0].quickdraw_entry = path[0].pos;
    path[path.length-1].tension_point = path[path.length-1].pos;
    path[path.length-1].tension = 0;
    path[path.length-1].contact_point = path[path.length-1].pos;
    path[path.length-1].quickdraw_entry = path[path.length-1].pos;

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
function draw(){
    ctx.clearRect(0, 0, canvas.width, canvas.height); //clear canvas
    if (on_display.background){
        ctx.fillStyle = BACKGROUND_COLOR;
        ctx.fillRect(0,0,canvas.width, canvas.height);
    }
    if (on_display.status){draw_status();}
    if (on_display.path){draw_path();}
    if (on_display.tension && on_display.path){draw_tension();}
    if (on_display.quickdraws){draw_quickdraws(!on_display.path);}
    
    if (on_display.bolts){draw_bolts();}
    if (on_display.info){write_data();}
    if (on_display.straight_line){draw_line(bolts[0].pos,bolts[bolts.length-1].pos, "blue", 1);}
    if (on_display.buttons){buttons.forEach(element => draw_button(element));}
    if(on_display.AI_bolts && end){draw_AI_bolts();}
    if(on_display.quickdraws_left){draw_quickdraws_left();}
    if(mouse && quickdraws_left){draw_quickdraw(mouse, BIG_RADIUS);}
    
}
function draw_quickdraws_left(){
    for (let i = 0; i < quickdraws_left; i++) {
        let point = {x:30, y:30+BIG_RADIUS*1.5*i*1.2};
        draw_quickdraw(point, BIG_RADIUS*1.5, 0, CARABINER_SCALE*1.5);
    }
}
function draw_AI_bolts(){
    for (let i = 0; i < bolts_chosen_AI.length; i++) {
        draw_circle(bolts[bolts_chosen_AI[i]].pos, false, 30, "green", 2 );
    }
}
function draw_status(){
    for (let i = 1; i <= NB_OF_BOLTS; i++) {
        if(bolts[i].status=="right"){
            draw_circle(bolts[i].pos, "rgba(0,255,0,0.3)", 20);
        }else if(bolts[i].status=="wrong"){
            draw_circle(bolts[i].pos, "rgba(255,0,0,0.3)", 20);
        }
    }
}
function draw_button(button){
    let center = {x:button.x+button.width/2, y:button.y+button.height/2};
    ctx.fillStyle = button.bgColor;
    ctx.fillRect(button.x,button.y,button.width, button.height);
    write(button.text, {x:button.x, y:button.y+20} );
}
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
function draw_quickdraw(point={x:0, y:0}, length=BOLT_RADIUS, angle=0, scale=CARABINER_SCALE){
    function carabiner(scale=CARABINER_SCALE, point = {x: 0, y:0}){
        let X = point.x+(scale/6);
        let Y = point.y-(scale/40);
        let A = {x:X, y:Y+(scale/10)};
        let B = {x:X , y: Y+(scale/20)+scale};
        let C1 = {x:B.x-(scale/5), y:B.y+(scale/5)};
        let C = {x:X-(scale/2.4) ,y: Y+scale};
        let D = {x: X-(scale/1.8), y: Y+(scale/4)};
        let C2 = {x:X-(scale/2.3), y:Y-(scale/8)};
        let C3 = {x: X, y: Y-(scale/10)};
        ctx.lineWidth = scale/10;
        //draw gate
        ctx.beginPath();
        ctx.moveTo(B.x, B.y);
        ctx.quadraticCurveTo(C1.x, C1.y, C.x, C.y);
        ctx.lineTo(D.x, D.y);
        ctx.bezierCurveTo(C2.x, C2.y, C3.x, C3.y, A.x, A.y);
        ctx.strokeStyle = "grey";
        ctx.stroke();
        //draw body
        ctx.beginPath();
        ctx.moveTo(D.x, D.y);
        ctx.bezierCurveTo(C2.x, C2.y, C3.x, C3.y, A.x, A.y);
        ctx.lineTo(B.x, B.y);
        ctx.quadraticCurveTo(C1.x, C1.y, C.x, C.y);
        ctx.moveTo(X-(scale/8), Y+scale+(scale/8));
        ctx.strokeStyle = "black";
        ctx.stroke();
    }
    function carabiner_down(scale=CARABINER_SCALE, point = {x: 0, y:0}){
        ctx.save();
        ctx.translate(point.x, point.y);
        ctx.rotate(Math.PI);
        carabiner(scale);
        ctx.restore();
    }
    ctx.save();
    ctx.translate(point.x, point.y);
    ctx.rotate(angle);
    let A = {x:0, y:0};
    let B = {x:0, y:length};
    let C = {x:0, y:scale*1.15};
    let D = {x:0, y:B.y-scale*1.15};
    let color = SHORT_SLING_COLOR;
    if(length > BOLT_RADIUS){color = BIG_SLING_COLOR}
    carabiner(scale, A);
    carabiner_down(scale, B);
    //draw_line(A, B, "red", 1);
    draw_line(C, D, color, scale/6);
    ctx.restore();
}
function draw_quickdraws(loose, path_nb=last(nb)){
    let path = paths[path_nb];
    for (let i = 1; i <= NB_OF_BOLTS; i++){
        let A = bolts[i].pos; //quickdraw center
        let C = path[i].quickdraw_entry; //quickdraw entry point
        let R = {x:A.x, y:A.y+69420}; //reference point
        let AC = bolts[i].radius; //radius
        let gauche = 1;
        if (C.x > R.x){gauche = -1};
        let angle = get_angle(A, C, R) * gauche;
        if (loose){angle = 0;};
        draw_quickdraw(A, AC, angle, CARABINER_SCALE);
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
    draw_circle(STARTING_POINT, PATH_COLOR, 10); //draw starting point
    draw_circle(bolts[bolts.length-1].pos, PATH_COLOR, 10); //draw finish point
} 
function write(text, point={x:50, y:50}){
    ctx.font = "20px arial";
    ctx.fillStyle = "black";
    ctx.fillText(text, point.x, point.y);
}
function write_data(){
    
    write(`Victoires : ${wins} / ${NB_WINS_NEXT_LEVEL}`, {x:10, y:canvas.height-100});
    write(`Niveau ${level}`,{x:10, y:canvas.height-50});
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
function draw_tension(path_nb=last(nb), width = 3){
    let path = paths[path_nb];
    for (let i = 1; i < path.length-1; i++) {
        ctx.beginPath();
        ctx.moveTo(path[0].pos.x, path[0].pos.y);
        for (let j = 1; j < path.length; j++) {
            ctx.lineTo(path[j].pos.x, path[j].pos.y);
        }
        var grad = ctx.createRadialGradient(path[i].quickdraw_entry.x, path[i].quickdraw_entry.y, 0, path[i].quickdraw_entry.x, path[i].quickdraw_entry.y, path[i].tension*4);
        grad.addColorStop(0, "red");
        grad.addColorStop(1, "rgba(0,0,0,0)");
        ctx.strokeStyle = grad;
        ctx.lineWidth = width;
        ctx.stroke();
    }
}

   
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

*/
