/* jsarguments[i]
[1] string unique post id / key for save dict
[2] string buffer name 
[3] int buffer channel
[4] float R rgb
[5] float G rgb
[6] float B rgb
[7] string 
[8] color row 0 - 6
*/

//autowatch = 1;

outlets = 1;

/*  //  //  //  //  //  //  //  //  //  //  //
JSON STUFF
*/  //  //  //  //  //  //  //  //  //  //  //
var localSteps = new Dict("---localSteps");
var bitbyteTable = new Dict("bit-byte");

var refresh = new Task(bang, this);

/*  //  //  //  //  //  //  //  //  //  //  //
BUFF INIT
*/  //  //  //  //  //  //  //  //  //  //  //
var stepsBuf = new Buffer("---seqSteps");
var chanBuf = jsarguments[3];
//offset for read/write
var patternCurrent = (0);
/*  //  //  //  //  //  //  //  //  //  //  //
UI INIT
*/  //  //  //  //  //  //  //  //  //  //  //
mgraphics.init();
mgraphics.relative_coords = 0;
mgraphics.autofill = 0;
//main color
var rgb = [jsarguments[4], jsarguments[5], jsarguments[6], .8];
var mark = 4; //less than 1 causes crash
var boxRgb = new Array(64);
    for (i = 0; i  < 64; i++ ){
        boxRgb[i] = new Array;
        boxRgb[i] = [rgb[0], rgb[1], rgb[2], (rgb[3] * .5)];
    }
    for (i = 0; i < 64; i = i + mark){
        boxRgb[i][3] = rgb[3]; 
    }
//highlight color
var hRgb = [1, .3, .3, .25];
var current = 0;

//curser
var last_x = 0;
var last_y = 0;
var hoverBucket = new Array(2); //histogram for hovering
var lastHoverCol = 0;
var dragBucket = [-1, -1]; //histogram for draging


//state of ui
var nCols = 16; // no of steps
var state = new Array(64);
    for (i = 0; i  < 64; i++ ){
        state[i] = 0;
    }

//box size
var width = this.box.rect[2] - this.box.rect[0];
var height = this.box.rect[3] - this.box.rect[1];
//for hit test & display
var colWidth = width / nCols; //hit test area

var spaceAmount = .05;
var spacing = (colWidth * spaceAmount);
var space = new Array(64);
    for (i = 0; i  < 64; i++ ){
        space[i] = new Array;
        space[i] = [spacing, spacing * 2]; // todo make var
    }

var surfaceSend = 0;
//roundishness of steps
var oval = [0, 0]; //maybe use later
//mgraphics.redraw();
var rowNum = jsarguments[3] - 1;
/*  //  //  //  //  //  //  //  //  //  //  //
Utilities
*/  //  //  //  //  //  //  //  //  //  //  //
function wrapUpperSimple(x, lim){
    if (x < 0){
        x = lim - 1;
    } 
    if(x >= lim){
            x = x % lim;
        }
        else{
            x = x;
    }
    return x;
}

function clamp(x, min, max){
    if (x < min){
            x = min;
        }
        else if (x > max){
            x = max;
        } 
        else {
            x = x;
        }
    return x;
}
function clampUpper(x, max){
   if (x > max){
            x = max;
        } 
        else {
            x = x;
        }
    return x;
}

/*  //  //  //  //  //  //  //  //  //  //  //
BUFF STUFF
*/  //  //  //  //  //  //  //  //  //  //  //
function buffInit(){
    var recall = new Array();
    for (x = 0; x < 128; x++){
        var temp = localSteps.get(jsarguments[1] + " " + x);
            for (y = 0; y < 64; y++){
                recall.push(temp[y]);
            }
    }
    stepsBuf.poke(chanBuf, 0, recall);
}

function buffWrite(){
    var writePos = patternCurrent * 64;
    stepsBuf.poke(chanBuf, writePos, state);
}
/*  //  //  //  //  //  //  //  //  //  //  //
JSON Stuff
*/  //  //  //  //  //  //  //  //  //  //  //
function updateState(){
    state = new Array(64);
    state = localSteps.get(jsarguments[1] + " " + patternCurrent);
    requestRefresh();
    if (surfaceSend) sendState();
}

function updateDict(){
    localSteps.replace(jsarguments[1] + " " + patternCurrent, state);
}

function writeSteps(){
    this.patcher.getnamed('globalSeq').message( 'writeSteps', arguments[0]);
}

/*  //  //  //  //  //  //  //  //  //  //  //
Draw stuff
*/  //  //  //  //  //  //  //  //  //  //  //
//limit how often the ui is redrawn
function requestRefresh(){
    if (!refresh.running) refresh.schedule(25);
}
function bang() {
    mgraphics.redraw();
}

function paint() {
    with (mgraphics){
    set_line_width(1);
    /* unused background
    set_source_rgba(0, 0, 0, .75);
    rectangle(0, 0, width, height);
    fill();
    stroke();
    */
        for (i = 0; i < nCols; i++){
            var eachStep = i * colWidth; 
                if (state[i] == 1){
                    rectangle_rounded(eachStep + space[i][0], 
                            0 + space[i][0], 
                                (colWidth - space[i][1]), 
                                    (height - space[i][1]), 
                                        oval[0], oval[1]); 
                                            //(x, y, width, height, ovalwidth, ovalheight);    
                    set_source_rgba(boxRgb[i][0], boxRgb[i][1], boxRgb[i][2], boxRgb[i][3]);
                    stroke_preserve();
                    set_source_rgba(rgb[0], rgb[1], rgb[2], 1);
                    fill();
                    stroke();
                    }
                    /*
                    else if (state[i] == 0) {
                        rectangle_rounded(eachStep + (space[i][0]), 
                            space[i][0], 
                                (colWidth - space[i][1]), 
                                    (height - space[i][1]), 
                                        0, 0); 
                                            //(x, y, width, height, ovalwidth, ovalheight);    
                    set_source_rgba(boxRgb[i][0], boxRgb[i][1], boxRgb[i][2], .3);
                    stroke_preserve();
                    set_source_rgba(rgb[0], rgb[1], rgb[2], .1);
                    fill();
                    stroke();
                    }
                    */
        }
    }
}

/*  //  //  //  //  //  //  //  //  //  //  //
Input -- Mouse
*/  //  //  //  //  //  //  //  //  //  //  //
//get column from x value
function getCol(i){
     return Math.floor(i / colWidth);
}

function onresize() {
    width = box.rect[2] - box.rect[0];
    height = box.rect[3] - box.rect[1];
    colWidth = width / nCols;
    spacing = clamp((colWidth * spaceAmount), 1., 1.7);
    for (i = 0; i  < 64; i++ ){
        space[i] = new Array;
        space[i] = [spacing, spacing * 2]; // todo make var
    }
    requestRefresh() // draw and refresh display
    if (surfaceSend) sendState();
}
onresize.local = 1;

function onclick(x,y,but,cmd,shift,capslock,option,ctrl) {
    var mouse = getCol(x);
    last_x = x;
    last_y = y;
    if (shift){
        random(1);
        }
        else if (ctrl || cmd){
            clear(1);
        }
        else{
            state[mouse] = (state[mouse] + 1) % 2;
            buffWrite();
            requestRefresh();
            updateDict();
    }
}
onclick.local = 1; 

/* sticking to single clicks for now
function ondblclick(x,y,but,cmd,shift,capslock,option,ctrl)
{
	last_x = x;
    last_y = y;
    if (shift){
        random(1);
        }
        else{
            clear(1);
    }
}
*/

function onidle(x,y,but,cmd,shift,capslock,option,ctrl) {
    var hover = getCol(x);
    hoverBucket[0] = hoverBucket[1];
    hoverBucket[1] = hover;
        if (hoverBucket[0] != hoverBucket[1]){
            lastHoverCol = hover;
            space[hoverBucket[1]] = [(spacing * 4), (spacing * 8)];
            space[hoverBucket[0]] = [spacing, spacing * 2]; 
            requestRefresh();
            //requestRefresh();
        }
}

function onidleout(x,y,but,cmd,shift,capslock,option,ctrl) {
    space[lastHoverCol] = [spacing, spacing * 2];
    hoverBucket = [-1, -1];
    //bitbyteAccum = 0;
    requestRefresh();
    //if (surfaceSend) sendState();
}

//todo add bit-byte on drag 
function ondrag(x,y,but,cmd,shift,capslock,option,ctrl){
    var mouse = getCol(x);
    dragCol = getCol(last_x);
    dragBucket[0] = dragBucket[1];
    dragBucket[1] = mouse;
    if (but){
        if (dragBucket[0] != dragBucket[1]){
            state[mouse] = state[dragCol];
            buffWrite();
            updateDict();
            onidle(x);
        }
    }    
    if (!but){
        onidleout();
        if (surfaceSend) sendState();
        writeSteps();
    }    
}

/*  //  //  //  //  //  //  //  //  //  //  //
Input -- Messages
*/  //  //  //  //  //  //  //  //  //  //  //
function surfaceSel(){
    surfaceSend = arguments[0]; 
}

function sendState(){
    this.patcher.getnamed('surfaceControl').message('updateMatrix', state, nCols, rowNum);
}
//respond to surface
function surfaceUpdate(){
    state[arguments[0]] = arguments[1];
    buffWrite();
    requestRefresh();
    updateDict();
    writeSteps();
}

//update pattern #
function pattern(i){
    i = clamp(i, 0, 127);
    patternCurrent = i;
    updateState();
}

//# of columns
function columns(r, i){
    if (r == rowNum){
        i = clamp(i, 1, 64);
        nCols = i;
        onresize();
    }
}
//unused right now
function roundness(i0, i1){
    oval = [i0, i1];
    bang();
}
//clear whole grid
function clear(){
    for (i = 0; i  < 64; i++ ){
        state[i] = 0;
    }
    buffWrite();
    requestRefresh();
    if (surfaceSend) sendState();
    if (arguments[0]){ 
        updateDict();
        writeSteps();
    }
}
//randomize whole grid
function random(){
    for (i = 0; i  < 64; i++ ){
        state[i] = Math.round(Math.random());
    }
    buffWrite();
    requestRefresh();
    if (surfaceSend) sendState();
    if (arguments[0]){ 
        updateDict();
        writeSteps(); 
    }
}
//recall from table
function bitbyte(i){
    i = clamp(i, -255, 255);
    state = bitbyteTable.get(i);
    buffWrite();
    requestRefresh();
    if (surfaceSend) sendState();
    if (arguments[1]){ 
        updateDict();
        writeSteps();
    }

}
//shift visable steps left + wrap;
function right(){
    var shift = new Array(nCols);
    for (i = 0; i < nCols; i++){
        var offset = wrapUpperSimple((i + 1), nCols);
        shift[offset] = state[i];
    }
    for (i = 0; i < nCols; i++){
        state[i] = shift[i];
    }
    buffWrite();
    requestRefresh();
    if (surfaceSend) sendState();
    if (arguments[0]){ 
        updateDict();
        writeSteps();
    }
}

function left(){
    var shift = new Array(nCols);
    for (i = 0; i < nCols; i++){
        var offset = wrapUpperSimple((i - 1), nCols);
        shift[offset] = state[i];
    }
    for (i = 0; i < nCols; i++){
        state[i] = shift[i];
    }
    buffWrite();
    requestRefresh();
    if (surfaceSend) sendState();
    if (arguments[0]){ 
        updateDict();
        writeSteps();
    }
}