
/* jsarguments[i]
[1] string unique post id / key for save dict
[2] float R rgb
[3] float G rgb
[4] float B rgb
[5] string 
*/


//autowatch = 1;
/*
var logNum = 1;
function printf() {
    post('js log ' + 'No.' + logNum + ' for ' + ' file path: ' + jsarguments[0] + ' logged by: ' + jsarguments[1] + '\n');
    logNum = logNum + 1;
    for(var i=0, len = arguments.length; i<len; i++) {
        var message = arguments[i];
        if(message && message.toString) {
            var s = message.toString();
            if(s.indexOf("[object ") >= 0) {
                s = JSON.stringify(message);
            }   
            post(s);
        }
            else if(message === null) {
                post("<null>");
            }
            else {
        post(message);
        }
    }
    post("\n");
}
*/
/*  //  //  //  //  //  //  //  //  //  //  //
UI INIT
*/  //  //  //  //  //  //  //  //  //  //  //
mgraphics.init();
mgraphics.relative_coords = 0;
mgraphics.autofill = 0;
//box size
var width = this.box.rect[2] - this.box.rect[0];
var height = this.box.rect[3] - this.box.rect[1];
var rowHeight = height / 7;
//spacing
function makeCols(nCols){
    this.nCols = nCols; // no of steps
    this.colWidth;
    
    this.buildCols = function(nCols){
        this.nCols = nCols;
        this.colWidth = width / this.nCols; //hit test area
   }   
    this.buildCols(this.nCols);

}

var redNCols = 16;
var orangeNCols = 16;
var yellowNCols = 16;
var greenNCols = 16;
var blueNCols = 16;
var indigoNCols = 16;
var violetNCols = 16;
var globalNCols = 16;

var redCols = new makeCols (redNCols);
var orangeCols = new makeCols (orangeNCols);
var yellowCols = new makeCols (yellowNCols);
var greenCols = new makeCols (greenNCols);
var blueCols = new makeCols (blueNCols);
var indigoCols = new makeCols (indigoNCols);
var violetCols = new makeCols (violetNCols);
var globalCols = new makeCols (globalNCols);

var nColsArray = [redCols.nCols, orangeCols.nCols, yellowCols.nCols, greenCols.nCols, blueCols.nCols, indigoCols.nCols, violetCols.nCols];
var colWidthArray = [redCols.colWidth, orangeCols.colWidth, yellowCols.colWidth, greenCols.colWidth, blueCols.colWidth, indigoCols.colWidth, violetCols.colWidth, globalCols.colWidth];
var spaceArray = [redCols.space, orangeCols.space, yellowCols.space, greenCols.space, blueCols.space, indigoCols.space, violetCols.space];

//highlight color
var hRgb = [1, .3, .3, .25];
var current = new Array(7); //array of steps
for (i = 0; i < 7; i++){
    current[i] = 0;
}
var globalCurrent = 0;

var surfaceSend = 0;

//mgraphics.redraw();

var refresh = new Task(bang, this);
/*  //  //  //  //  //  //  //  //  //  //  //
Utilities
*/  //  //  //  //  //  //  //  //  //  //  //
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
//variable function pointer used here to swap draw loops
function variFun(){
    this.pointer = function(){
        return 0;
    }
    this.update = function(newFun){
        this.pointer = newFun;
    }
    //this.pointer();
}
var drawLoop = new variFun(); //draw loop function
/*  //  //  //  //  //  //  //  //  //  //  //
Draw stuff
*/  //  //  //  //  //  //  //  //  //  //  //
function requestRefresh(){
    var check = refresh.running;
   if (check != 1){
        refresh.schedule(5);
    }
}

function bang() {
    mgraphics.redraw();
}
//sep rows draw mode
function sepLoop(){
    with (mgraphics){
        set_line_width(1);
        var drawHeight = 0;
        var colWidthPointer;
        //highlighted step
        for (h = 0; h < 7; h++){ //do once per row 
            colWidthPointer = colWidthArray[h];
            drawHeight = (drawHeight + rowHeight) * (h > 0); //accum height for y pos
            var selStep = current[h] * colWidthPointer;
            set_source_rgba(hRgb[0], hRgb[1], hRgb[2], hRgb[3]);
            rectangle(selStep, drawHeight, colWidthPointer, rowHeight);
            fill();
            stroke();
        }
    }
    
}
//global mode saves calc when sepLoop not needed
function globalLoop(){
    with (mgraphics){
        set_line_width(1);
        //highlighted step
        var colWidthPointer = colWidthArray[7]; //need pointer to update each paint
        var selStep = globalCurrent * colWidthPointer;
        set_source_rgba(hRgb[0], hRgb[1], hRgb[2], hRgb[3]);
        rectangle(selStep, 0, colWidthPointer, height);
        fill();
        stroke();
    }
}
//called to update draw loop
function globalMode(){
    drawLoop.update(globalLoop);
    requestRefresh();
}

function sepMode(){
    drawLoop.update(sepLoop);
    requestRefresh();
}
/*
var INIT = sepMode();
delete INIT;
*/

function paint() {
    drawLoop.pointer(); //paint whatever the pointer is presently
}

function onresize() {
    width = box.rect[2] - box.rect[0];
    height = box.rect[3] - box.rect[1];
    rowHeight = height / 7;
    //colWidth = width / nCols;
    requestRefresh(); 
}
onresize.local = 1;

/*  //  //  //  //  //  //  //  //  //  //  //
Input -- Messages
*/  //  //  //  //  //  //  //  //  //  //  //
function surfaceSel(){
    var s;
    if (arguments[0] > -1 && arguments[0] < 7){
        s = arguments[0]
        }
        else{
            s = -1;
        }
    surfaceSend = s; 
}

//highlight a step
function globalStep(i){
    //i = i - 1;
    if ( i > 64 || i < 1){ //out of bounds
        i = -1;
        } 
        else {
            i = i;
    }
    globalCurrent = (i - 1);
    if (surfaceSend > -1 && surfaceSend < 7) sendState(globalCurrent);
    bang();
}

function step(row, i){
    //i = i - 1;
    if ( i > 64 || i < 1){ //out of bounds
        i = -1;
        } 
        else {
            i = i;
    }
    current[row] = (i - 1);
    if (surfaceSend == row) sendState(current[row]);
    bang();
}

function sendState(){
    this.patcher.getnamed('surfaceControl').message('hStep', arguments[0]);
    //printf('sendstate ' + arguments[0]);
}

//# of columns
function columns(m, x){
    x = clamp(x, 1, 64);
    x = Math.floor(x);
    mark = x;
    switch (m) {
        case 0:
            redNCols  = x;
            redCols.nCols = redNCols;
            redCols.buildCols(redNCols);
            colWidthArray[m] = redCols.colWidth;
            break;
        case 1:
            orangeNCols  = x;
            orangeCols.nCols = orangeNCols;
            orangeCols.buildCols(orangeNCols);
            colWidthArray[m] = orangeCols.colWidth;
            break;
        case 2:
            yellowNCols  = x;
            yellowCols.nCols = yellowNCols;
            yellowCols.buildCols(yellowNCols);
            colWidthArray[m] = yellowCols.colWidth;
            break;
        case 3:
            greenNCols  = x;
            greenCols.nCols = greenNCols;
            greenCols.buildCols(greenNCols);
            colWidthArray[m] = greenCols.colWidth;
            break;
        case 4:
            blueNCols  = x;
            blueCols.nCols = blueNCols;
            blueCols.buildCols(blueNCols);
            colWidthArray[m] = blueCols.colWidth;
            break;
        case 5:
            indigoNCols  = x;
            indigoCols.nCols = indigoNCols;
            indigoCols.buildCols(indigoNCols);
            colWidthArray[m] = indigoCols.colWidth;
            break;
        case 6:
            violetNCols  = x;
            violetCols.nCols = violetNCols;
            violetCols.buildCols(violetNCols);
            colWidthArray[m] = violetCols.colWidth;
            break;    
        case 7:
            globalNCols  = x;
            globalCols.nCols = globalNCols;
            globalCols.buildCols(globalNCols);
            colWidthArray[m] = globalCols.colWidth;
            break;
    }
    onresize();
    requestRefresh(); 
}
