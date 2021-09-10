
/* jsarguments[i]
[1] string unique post id / key for save dict
[2] float R rgb
[3] float G rgb
[4] float B rgb
[5] string 
*/
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

//autowatch = 1;

var refresh = new Task(bang, this);

/*  //  //  //  //  //  //  //  //  //  //  //
UI INIT
*/  //  //  //  //  //  //  //  //  //  //  //
mgraphics.init();
mgraphics.relative_coords = 0;
mgraphics.autofill = 0;
//main color
//var rgb = [jsarguments[2], jsarguments[3], jsarguments[4], .8];

/* This is the prototyping stuff for the color arrays */
//rgb values to be OO-ified and used in the loop
var red = [1.00, 0.00, 0.00, .8];
var orange = [1.00, 0.47, 0.00, .8];
var yellow = [1.00, 1.00, 0.00, .8];
var green = [0.00, 1.00, 0.00, .8];
var blue = [0.00, 1.00, 1.00, .8];
var indigo = [0.76, 0.00, 0.89, .8]; 
var violet = [1.00, 0.00, .5, .8]; 
//var rgb = [red, orange, yellow, green, blue, indigo, violet];

//maybe dont need sep variables for these?
var redMark = 4; //less than 1 causes crash
var orangeMark = 4;
var yellowMark = 4;
var greenMark = 4;
var blueMark = 4;
var indigoMark = 4;
var violetMark = 4;

//make objects
function makeBoxColors(rgb, mark){ 
    this.mark = mark;
    //outline
    this.boxRgb = new Array(64);
    //background color
    this.bgRgb = new Array(64);
    //build it
    this.buildBoxes = function(){
        for (i = 0; i  < 64; i++ ){
            this.boxRgb[i] = new Array;
            this.boxRgb[i] = [rgb[0], rgb[1], rgb[2], (rgb[3] * .5)];
        }
        for (i = 0; i < 64; i = i + this.mark){
            this.boxRgb[i][3] = rgb[3]; 
        }
        for (i = 0; i  < 64; i++ ){
            this.bgRgb[i] = new Array;
            this.bgRgb[i] = [.25, .25, .25, .15];
        }
        //darker step
        for (i = 0; i < 64; i = i + this.mark){
            this.bgRgb[i] = [.12, .12, .12, .15];; 
        }
    }
    //call it
    this.buildBoxes();
}

//objects
var redBoxes = new makeBoxColors(red, redMark);
var orangeBoxes = new makeBoxColors(orange, orangeMark);
var yellowBoxes = new makeBoxColors(yellow, yellowMark);
var greenBoxes = new makeBoxColors(green, greenMark);
var blueBoxes = new makeBoxColors(blue, blueMark);
var indigoBoxes = new makeBoxColors(indigo, indigoMark);
var violetBoxes = new makeBoxColors(violet, violetMark);

//array of objects to iterate thru during draw loop
var boxArray = [redBoxes.boxRgb, orangeBoxes.boxRgb, yellowBoxes.boxRgb, greenBoxes.boxRgb, blueBoxes.boxRgb, indigoBoxes.boxRgb, violetBoxes.boxRgb];
var bgArray = [redBoxes.bgRgb, orangeBoxes.bgRgb, yellowBoxes.bgRgb, greenBoxes.bgRgb, blueBoxes.bgRgb, indigoBoxes.bgRgb, violetBoxes.bgRgb];

/* ^^ This is OO stuff for the color arrays  ^^ */

//box size
var width = this.box.rect[2] - this.box.rect[0];
var height = this.box.rect[3] - this.box.rect[1];
var rowHeight = height / 7;

/* for oo columning */

//spacing
function makeCols(nCols){
    this.nCols = nCols; // no of steps
    this.colWidth;
    this.space = new Array(64);
    
    this.buildCols = function(){
        this.colWidth = width / this.nCols; //hit test area
        this.spaceAmount = .05;
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

var redCols = new makeCols (redNCols);
var orangeCols = new makeCols (orangeNCols);
var yellowCols = new makeCols (yellowNCols);
var greenCols = new makeCols (greenNCols);
var blueCols = new makeCols (blueNCols);
var indigoCols = new makeCols (indigoNCols);
var violetCols = new makeCols (violetNCols);

var nColsVarArray = [redNCols, orangeNCols, yellowNCols, greenNCols, blueNCols, indigoNCols, violetNCols];
var nColsArray = [redCols.nCols, orangeCols.nCols, yellowCols.nCols, greenCols.nCols, blueCols.nCols, indigoCols.nCols, violetCols.nCols];
var colWidthArray = [redCols.colWidth, orangeCols.colWidth, yellowCols.colWidth, greenCols.colWidth, blueCols.colWidth, indigoCols.colWidth, violetCols.colWidth];
var buildColsArray = [redCols.buildCols, orangeCols.buildCols, yellowCols.buildCols, greenCols.buildCols, blueCols.buildCols, indigoCols.buildCols, violetCols.buildCols];

/* ^^ for oo columns ^^ */

//roundishness of steps
var oval = [0, 0]; //maybe use later
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
/*  //  //  //  //  //  //  //  //  //  //  //
Draw stuff
*/  //  //  //  //  //  //  //  //  //  //  //
//limit how often the ui is redrawn
function requestRefresh(){
    var check = refresh.running;
   if (check != 1){
        refresh.schedule(50);
    }
}

function bang() {
    mgraphics.redraw();
}

function paint() {
    with (mgraphics){
    set_line_width(1);
    //declare variables for pointers  
    var drawHeight = 0;
    var boxPointer;
    var bgPointer;
    var nColsPointer;
    var colWidthPointer;
        //draw loop
        for (h = 0; h < 7; h++){ //do once per row 
        //these all reference arrays of object properties
        boxPointer = boxArray[h];
        bgPointer = bgArray[h];
        nColsPointer = nColsArray[h];
        colWidthPointer = colWidthArray[h];
        var spacer = new Array(); //cal new spacing 
        spacer[0] = clamp((colWidthArray[h] * .05), 1., 1.7);
        spacer[1] = spacer[0] * 2;
        drawHeight = (drawHeight + rowHeight) * (h > 0); //accum height for y pos
            for (i = 0; i < nColsPointer; i++){ //make steps
                var eachStep = i * colWidthPointer;
                rectangle_rounded(eachStep + spacer[0], //x
                                    drawHeight + spacer[0], //y 
                                        (colWidthPointer - spacer[1]), //width
                                            (rowHeight - spacer[1]),  //height
                                                oval[0], oval[1]); //ovalwidth, ovalheight    
                set_source_rgba(boxPointer[i][0], boxPointer[i][1], boxPointer[i][2], boxPointer[i][3]);
                stroke_preserve();
                set_source_rgba(bgPointer[i][0], bgPointer[i][1], bgPointer[i][2], bgPointer[i][3]);
                fill();
                stroke();
            }
        }
    }
}
//called to redraw cloumns too
function onresize() {
    width = box.rect[2] - box.rect[0];
    height = box.rect[3] - box.rect[1];
    rowHeight = height / 7;
    for (i = 0; i < 7; i++){
        //recalc columns
        colWidthArray[i] = width / nColsArray[i];
        buildColsArray[i];
    }
    
    requestRefresh();
}
onresize.local = 1;

/*  //  //  //  //  //  //  //  //  //  //  //
Input -- Messages
*/  //  //  //  //  //  //  //  //  //  //  //
//# of columns
function globalColumnsBG(x, m){
    if (isNaN(m) != 'false'){
        globalMarker(m);
    }
    x = clamp(x, 1, 64);

    redNCols = x;
    redCols.nCols = redNCols;
    redCols.buildCols();
    nColsArray[0] = redCols.nCols;

    orangeCols.nCols = x;
    orangeCols.buildCols();
    nColsArray[1] = orangeCols.nCols;

    yellowCols.nCols = x;
    yellowCols.buildCols();
    nColsArray[2] = yellowCols.nCols;

    greenCols.nCols = x;
    greenCols.buildCols();
    nColsArray[3] = greenCols.nCols;

    blueCols.nCols = x;
    blueCols.buildCols();
    nColsArray[4] = blueCols.nCols;

    indigoCols.nCols = x;
    indigoCols.buildCols();
    nColsArray[5] = indigoCols.nCols;

    violetCols.nCols = x;
    violetCols.buildCols();
    nColsArray[6] = violetCols.nCols;
    
    onresize();
}
//individual columns
function columnsBG(col, x, m){
    if (isNaN(m) != 'false'){
        marker(col, m);
    }
    x = clamp(x, 1, 64);
    x = Math.floor(x);
    switch (col) {
        case 0:
            redNCols = x;
            redCols.nCols = redNCols;
            redCols.buildCols();
            nColsArray[col] = redCols.nCols;
            break;
        case 1:
            orangeCols.nCols = x;
            orangeCols.buildCols();
            nColsArray[col] = orangeCols.nCols;
            break;
        case 2:
            yellowCols.nCols = x;
            yellowCols.buildCols();
            nColsArray[col] = yellowCols.nCols;
            break;
        case 3:
            greenCols.nCols = x;
            greenCols.buildCols();
            nColsArray[col] = greenCols.nCols;
            break;
        case 4:
            blueCols.nCols = x;
            blueCols.buildCols();
            nColsArray[col] = blueCols.nCols;
            break;
        case 5:
            indigoCols.nCols = x;
            indigoCols.buildCols();
            nColsArray[col] = indigoCols.nCols;
            break;
        case 6:
            violetCols.nCols = x;
            violetCols.buildCols();
            nColsArray[col] = violetCols.nCols;
            break;    
    }
    onresize();
}

//should prolly do an array now that I think about it
function marker(m, x){
    x = clamp(x, 1, 64);
    x = Math.floor(x);
    mark = x;
    switch (m) {
        case 0:
            redMark = x;
            redBoxes.mark = redMark;
            redBoxes.buildBoxes();
            break;
        case 1:
            orangeMark = x;
            orangeBoxes.mark = orangeMark;
            orangeBoxes.buildBoxes();
            break;
        case 2:
            yellowMark = x;
            yellowBoxes.mark = yellowMark;
            yellowBoxes.buildBoxes();
            break;
        case 3:
            greenMark = x;
            greenBoxes.mark = greenMark;
            greenBoxes.buildBoxes();
            break;
        case 4:
            blueMark = x;
            blueBoxes.mark = blueMark;
            blueBoxes.buildBoxes();
            break;
        case 5:
            indigoMark = x;
            indigoBoxes.mark = indigoMark;
            indigoBoxes.buildBoxes();
            break;
        case 6:
            violetMark = x;
            violetBoxes.mark = violetMark;
            violetBoxes.buildBoxes();
            break;    
    }
    requestRefresh();
}
//lazy AF todo fix
function globalMarker(x){
    x = clamp(x, 1, 64);
    x = Math.floor(x);

    redMark = x;
    redBoxes.mark = redMark;
    redBoxes.buildBoxes();

    orangeMark = x;
    orangeBoxes.mark = orangeMark;
    orangeBoxes.buildBoxes();

    yellowMark = x;
    yellowBoxes.mark = yellowMark;
    yellowBoxes.buildBoxes();

    greenMark = x;
    greenBoxes.mark = greenMark;
    greenBoxes.buildBoxes();

    blueMark = x;
    blueBoxes.mark = blueMark;
    blueBoxes.buildBoxes();

    indigoMark = x;
    indigoBoxes.mark = indigoMark;
    indigoBoxes.buildBoxes();

    violetMark = x;
    violetBoxes.mark = violetMark;
    violetBoxes.buildBoxes();

    requestRefresh();

}