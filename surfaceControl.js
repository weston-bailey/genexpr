autowatch = 1;

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

outlets = 3;

//messnamed('init', 'bang');

var track_sel = 1; //is track selected? (used to simulate various modes -- doesnt reflect selection state)
var track_selBucket = 1; //actual stored track selection state to be recalled when needed
var grabMode = 0; //how to update
var prev_grab = -1;

var user_But = 0; //can be checked to see if in Freq Seq mode or not 0 = off 1 = on
var but_Matrix = new Array(64);
    for (i = 0; i < 64; i++){
        but_Matrix[i] = new Array(2);
        but_Matrix[i] = [0, i];
    }
var globalBut_Matrix = new Array(7);
    for(i = 0; i < 7; i++){
        globalBut_Matrix[i] = new Array(64);
    }

var patternOffset = 0;
var patternCurrent = 0;
var matrixMap = patternCurrent - patternOffset;
var pat_Matrix = new Array(128);
    for (i = 0; i  < 127; i++ ){
        pat_Matrix[i] = 0;
    }
var matrix_Color = [124, 127]; //[0] off [1] on
var matrix_ColorPattern = [0, 124]; //[0] off [1] on

var clients = ["Red Sequencer Grid", 
                "Orange Sequencer Grid", 
                    "Yellow Sequencer Grid", 
                        "Green Sequencer Grid", 
                            "Blue Sequencer Grid", 
                                "Indigo Sequencer Grid", 
                                    "Violet Sequencer Grid",
                                        "globalSeq"];

var marks = ["RedMark", 
                "OrangeMark", 
                    "YellowMark", 
                        "GreenMark", 
                            "BlueMark", 
                                "IndigoMark", 
                                    "VioletMark",
                                        "globalSeq"];

var colorNames = ["Red", "Orange", 
                    "Yellow", "Green", 
                        "Blue", "Indigo", 
                            "Violet", "Global"];

var param_ids = new Array();
for (i = 0; i < 7; i++){
    param_ids[i] = new Array(7);
}
//keep track present display state
var launch_But = [[1, 68, 127], [0, 70, 3], [0, 80, 8], [0, 86, 126], [0, 96, 16], [0, 108, 22], [0, 116, 26], [0, 124, 122]];
var launchBucket = 7; //state of lb
var layoutBucket = 1; //state of layout
var globalBucket = 0; //state of globalmode page selection  

var nCols = 16; //columns
var nColsBucket = 16; //used when exiting pattern mode to to globalmode
var highlightedStep = 0;
var globalInRange = [0, 0]; //flag to detect if highlight is being shown on push matrix in global mode
var newMark = 0;
var prevBank = 0; //for if banks get called and need to know last color row

var shiftButton = 0;
var copyPattern = 0;

var colorRequest = new Task(initColors, this);
var matrixRequest = new Task(matrixLights, this);
var globalRequest = new Task(globalLights, this);
var globalViewChangeRequest = new Task(globalViewLights, this);
var patternRequest = new Task(patternLights, this);
var markRequest = new Task(sendMark, this);
var touchRequest = new Task(touching, this);

var touchBucket = 0;

var blinkOn = new Task(toggleBlink, this);
blinkOn.interval = 500; 
blinkOn.repeat();
//array of toggles
var isBlinking = new Array(7);
    for (i = 0; i < 7; i ++){
        isBlinking[i] = 0;
    }
//array of who is blinking & its len
var blinkMess = new Array();
var bMessLen = 0;
//if blink is on/off
var blinkState = 1;

//pattern mode blink for automation
var pattBlinkOn = new Task(togglePattBlink, this);
pattBlinkOn.interval = 500;
//for blinking
var pX = 0;
var pY = 0;
var pGrid = 0;

var pattBlinkState = 1;

//relight push is play button is stopped
var sequencerIdle = new Task(idleMark, this);
sequencerIdle.interval = 500;
var lastFlash = 0; //switch for blinking on idle
var currentPlayState = 1; //check for playstate on grab
var liveTransportPlayState = 0; //multiply currentPlayState by live transport 
var displayStateBucket = 1;
var idleBucket = 0; //last idle blink for reference
//for names and pattern banks
var fxNames = new Array(7);
for (i = 0; i < 7; i++){
    fxNames[i] = ['null', 'INIT']; //[name, UI];
}
var knobINIT = ['Unused', 'Unused','Unused', 'Unused', 'Unused', 'Unused', 'Unused'];
var knobNames = new Array();
for (i = 0; i < 7; i++){
    knobNames[i] = knobINIT;
}

var advTrans = 0;

//init some functions to pull in data from max
var loadBang = getNames();
loadBang = checkTrans();
/*  //  //  //  //  //  //  //  //  //  //  //
Utilities/INIT
*/  //  //  //  //  //  //  //  //  //  //  //

//check state of advTrans in load 
function checkTrans(){
        outlet(1, ['transportUI', 'sendTo', 'Advanced Transport', 'outputvalue']);
}

function scale(x, xLo, xHi, yLo, yHi) {
    percent = (x - xLo) / (xHi - xLo);
    return percent * (yHi - yLo) + yLo;
}

function splitTest(x, min, max){
    if(x >= min && x < max){ 
        return 1;
        }
        else {
            return 0;
    }
}

function tsc_Split(x){
    if(x >= 0 && x <= 8191){
        var y;
        y = scale(x, 0, 8191, -255, 0);
        return Math.floor(y);
        }
        else if(x >= 8193 && x <= 16320){
            var y;
            y = scale(x, 8193, 16320, 0, 255);
            return Math.floor(y);
        }
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

 function redux(acc, val){
    return acc + val;
}

//variable function pointer used here to swap button matrix functions
function variFun(){
    this.pointer = function(){
        return 0;
    }
    this.update = function(newFun){
        this.pointer = newFun;
    }
    //this.pointer();
}

var matrixMode = new variFun(); //changable BM state
var highlightMode = new variFun();//for diff hilight modes

function getNames(){
    outlet(2, 'dump');
}

function initColors(){
    globalBucket = 0;
    //layout button master and select
    outlet(0, ['lo', 'toDevice', 'call', 'send_value', 127]);
    outlet(0, ['selb', 'toDevice', 'call', 'send_value', 127]);
    outlet(0, ['mb', 'toDevice', 'call', 'send_value', 127]);
    //send dim colors
    for (i = 0; i < 8; i++){
        //var j = launch_But[i][1];
        //launchMess.send(i, 0, launch_But[i][1]); //causes crash ??
        outlet(0, ['sl', 'toDevice', 'call', 'send_value', i, 0, launch_But[i][1]]);
    }
    //inform selected sequencer
    this.patcher.getnamed(clients[launchBucket]).message('surfaceSel', 1);
    this.patcher.getnamed('seqMarker').message('surfaceSel', launchBucket);
    //brightned selected
    launchMess.send(launchBucket, 0, launch_But[launchBucket][2]);
    //update matrix color
    matrix_Color[1] = launch_But[launchBucket][2];
    //request steps from selected sequencer
    this.patcher.getnamed(clients[launchBucket]).message('sendState');
    outlet(0, ['tsc', 'toDevice', 'call', 'set_mode', 2]);
    outlet(0, ['prb', 'toDevice', 'call', 'send_value', 127]);
    outlet(0, ['plb', 'toDevice', 'call', 'send_value', 127]);
    outlet(0, ['ab', 'toDevice', 'call', 'send_value', 127]);
    outlet(0, ['rb', 'toDevice', 'call', 'send_value', 127]);
    outlet(0, ['db', 'toDevice', 'call', 'send_value', 127]);
    outlet(0, ['nb', 'toDevice', 'call', 'send_value', 127]);
    outlet(0, ['oub', 'toDevice', 'call', 'send_value', 4]);
    outlet(0, ['odb', 'toDevice', 'call', 'send_value', 4]);
    outlet(0, ['sb', 'toDevice', 'call', 'send_value', 127]);
    var rCheck = isBlinking.reduce(redux);
    if(rCheck){
        blinkOn.repeat(-1);
        blinkMess = [];
        for (i = 0; i < 7; i ++){
            if(isBlinking[i]){
                blinkMess.push(i);
            }
        }
        bMessLen = blinkMess.length;
            if (!blinkOn.running) blinkOn.execute;
    }
    //update if in global mode
    if(layoutBucket){
        globalMode();
    }
    //check play state and update 
    if(!displayStateBucket){
        if(!sequencerIdle.running){
            sequencerIdle.repeat();
            sequencerIdle.execute;
        }
    }
    else if(displayStateBucket){
        if(sequencerIdle.running) sequencerIdle.cancel();
    }
}
 /*  //  //  //  //  //  //  //  //  //  //  //
Message formatting 
*/  //  //  //  //  //  //  //  //  //  //  //
//--this causes crash if used in loop. think its the push()
function deviceMessage(comp, route, fun, funArg){
    this.comp = comp;
    this.route = route;
    this.fun = fun;
    this.funArg = funArg;
    this.send = function(){
        var message = [this.comp, this.route, this.fun, this.funArg];
        for (i = 0; i < arguments.length; i++){
        message.push(arguments[i]);
        }
        outlet(0, message);
    }

}

var matrixMess = new deviceMessage ('bm', 'toDevice', 'call', 'send_value');
var launchMess = new deviceMessage ('sl', 'toDevice', 'call', 'send_value');

function knob(){
    return arguments[0] + ' ' + arguments[1];
}

function bankMessage(num, title, bank0, bank1, bank2, bank3, bank4, bank5, bank6, bank7){
    this.num = num;
    this.title = title;
    this.bank0 = bank0;
    this.bank1 = bank1;
    this.bank2 = bank2;
    this.bank3 = bank3;
    this.bank4 = bank4;
    this.bank5 = bank5;
    this.bank6 = bank6;
    this.bank7 = bank7;
    this.sendMain = function(){ //no color params
        outlet(1, 'banks', 'new', this.num, this.title, this.bank0, this.bank1, this.bank2, 
                this.bank3, this.bank4, this.bank5, this.bank6, this.bank7);
    } 
    this.sendFX = function(){ //seven color params
        var message = ['banks', 'new', this.num, arguments[0] + ' ' + this.title, arguments[0] + ' ' +  this.bank0,  
                            arguments[0] + ' ' + this.bank1, arguments[0] + ' ' + this.bank2, 
                                arguments[0] + ' ' + this.bank3, arguments[0] + ' ' + this.bank4, 
                                    arguments[0] + ' ' + this.bank5, this.bank6,
                                        this.bank7];
        outlet(1, message);
        
    }
    this.sendFX_8 = function(){ //8 color params
        var message = ['banks', 'new', this.num, arguments[0] + ' ' + this.title, arguments[0] + ' ' +  this.bank0,  
                            arguments[0] + ' ' + this.bank1, arguments[0] + ' ' + this.bank2, 
                                arguments[0] + ' ' + this.bank3, arguments[0] + ' ' + this.bank4, 
                                    arguments[0] + ' ' + this.bank5, arguments[0] + ' ' + this.bank6,
                                        arguments[0] + ' ' + this.bank7];
        outlet(1, message);
        
    }
    this.sendUtils = function(){ //three color params
        var message = ['banks', 'new', this.num, arguments[0] + ' ' + this.title, arguments[0] + ' ' +  this.bank0,  
                            arguments[0] + ' ' + this.bank1, arguments[0] + ' ' + this.bank2, 
                                this.bank3, this.bank4, this.bank5, this.bank6, this.bank7];
        outlet(1, message);
    }
    this.sendDelay = function(){ //four color params
        var message = ['banks', 'new', this.num, arguments[0] + ' ' + this.title, arguments[0] + ' ' +  this.bank0,  
                            arguments[0] + ' ' + this.bank1, arguments[0] + ' ' + this.bank2, 
                                arguments[0] + ' ' +   this.bank3, this.bank4, this.bank5, 
                                    this.bank6, this.bank7];
        outlet(1, message);
    }
}

var main1 = new bankMessage (0, 'Main-1', "Transport Play/Stop Button", "Main Transport Direction", "Main Transport Step Length", "Main Transport Bars", "Advanced Transport", '-',  "Pattern Banks", "Pattern Bank Index");
var main2 = new bankMessage (1, 'Main-2', "Main Amp Out", "Main Balance Out", "Main Dry/Wet Out", "Main Width Out", '-', "Transport Quantize", "Pattern Quantize", "Ext Input Quantize");
var fxUtils = new bankMessage (2, 'FX Transport', 'Step Length', 'Bars', 'Direction', '-', '-', '-', '-','-');
var fx3_blank = new bankMessage (3, 'Unused', '-', '-', '-', '-', '-', '-', '-', '-');
var fx3_lfo = new bankMessage (3, 'LFO', 'LFO Shape', 'LFO Duty', 'LFO Sync', '-', '-', '-', '-', '-');
var fx3_delay = new bankMessage (3, 'Delay', 'Delay Mode', 'Delay Pitch Mode', 'Delay Sync', 'Delay Filter', '-', '-', '-', '-');
var fx3_stutter = new bankMessage (3, 'Stutter', 'Stutter Change', 'Stutter Inactive Mode', 'Probability Increase', 'Stutter Switch', 'Reverse Switch', 'PS Switch', 'Filter Switch', '-');
var fx2 = new bankMessage (4, 'FX 2', 'Decay', 'FX Expand', 'FX Width', 'FX Amp', 'FX Balance', 'FX Dry/Wet','-', '-');
var fx1 = new bankMessage (5, 'FX 1', 'Knob 1', 'Knob 2', 'Knob 3', 'Knob 4', 'Knob 5', 'Knob 6', 'Knob 7', 'Fx Random Amount');
var fxChooser = new bankMessage(3, 'FX Sel', 'Red FX', 'Orange FX', 'Yellow FX', 'Green FX', 'Blue FX', 'Indigo FX', 'Violet FX', '-');

function bankDel(){
    var LiveObj =  new LiveAPI("this_device");
    count = LiveObj.call("get_bank_count");
    for (i = 2; i < count; i++){
        outlet(1, ['banks', 'delete', 2]);
    }
}

function bankINIT(){
    main1.sendMain();
    main2.sendMain();
    sendBank();
}

// lfo delay stutter
function sendBank(){
    var bankColor;
        if(launchBucket == 7){
            bankColor = prevBank;
            }
            else{
                bankColor = launchBucket;
                prevBank = launchBucket;
            }

    var color = colorNames[bankColor]; 
    bankDel(); 
    fxUtils.sendUtils(color);
    switch (fxNames[bankColor][1]){
        case 'INIT':
            fx3_blank.sendMain();
            break;
        case 'lfo':
            fx3_lfo.sendUtils(color);
            break;
        case 'delay':
            fx3_delay.sendDelay(color);
            break;
        case 'stutter':
            fx3_stutter.sendFX(color);
            break;
        case 'null':
            printf('fx name is null');
            break;
    }
    fx2.sendFX(color);
    fx1.sendFX_8(color); 
}

function sendFXChooserBank(){
    bankDel(); 
    fxChooser.sendMain()
}

 /*  //  //  //  //  //  //  //  //  //  //  //
Input -- Messages
*/  //  //  //  //  //  //  //  //  //  //  //
function togglePattBlink(){

    (pattBlinkState) ? outlet(0, ['bm', 'toDevice', 'call', 'send_value', pX, pY, 124])
    : outlet(0, ['bm', 'toDevice', 'call', 'send_value', pX, pY, 122]);
    pattBlinkState = (pattBlinkState + 1) % 2;
}

function autoBlink(){
    var bChange = arguments[0];
    var tog = arguments[1];
    if(user_But){
        if(isBlinking[bChange] != tog){
            blinkUpdate(bChange, 1);
            }
        }
        else{
            if(isBlinking[bChange] != tog){
             isBlinking[bChange] = (isBlinking[bChange] + 1) % 2;
        }
    }
}

function toggleBlink(){
    var bs = blinkState + 1;
    var bm = 0;
    for (i = 0; i < bMessLen; i++){
        bm = blinkMess[i];
        outlet(0, ['sl', 'toDevice', 'call', 'send_value', bm, 0, launch_But[bm][bs]]);
    }
    blinkState = (blinkState + 1) % 2;
}

function blinkUpdate(){
    var bChange = arguments[0];
    var light;
    isBlinking[bChange] = (isBlinking[bChange] + 1) % 2;
    if(!arguments[1]) this.patcher.getnamed('genSeq').message(colorNames[bChange] + 'Add', isBlinking[bChange]);
    outlet(1, ['performance', 'sendTo', colorNames[bChange] + ' Automation ' + 'Toggle','message', 'set', isBlinking[bChange]]);  
    (bChange == launchBucket) ? light = launch_But[bChange][2] : light = launch_But[bChange][1];
    
    outlet(0, ['sl', 'toDevice', 'call', 'send_value', bChange, 0, light]);
    var rCheck = isBlinking.reduce(redux);
    if(rCheck){
        blinkOn.repeat(-1);
        blinkMess = [];
        for (i = 0; i < 7; i ++){
            if(isBlinking[i]){
                blinkMess.push(i);
            }
        }
        bMessLen = blinkMess.length;
            if (!blinkOn.running) blinkOn.execute;
    }
    if (!rCheck){
        blinkOn.repeat(0);
        blinkOn.cancel();
        //(bChange = launchBucket) ? light = launch_But[bChange][2] : light = launch_But[bChange][1];
        for (i = 0; i < 8; i++){
            outlet(0, ['sl', 'toDevice', 'call', 'send_value', i, 0, launch_But[i][1]]);
        }
        launchMess.send(launchBucket, 0, launch_But[launchBucket][2]);
    }
}

function tempo(){
    blinkOn.interval = arguments[0];
    pattBlinkOn.interval = arguments[0];
    sequencerIdle.interval = arguments[0];
}

function updateGrabMode(){
    grabMode = arguments[0];
    //call trackSel with last check to update state just in case
    trackSel(track_selBucket);
}
//imitates different track selections for different behavior modes. 
function trackSel(){
    track_selBucket = arguments[0];
    switch (grabMode){
        case 0: //always ready
            track_sel = 1;
            grabber();
            break;
        case 1: //follows selection
            track_sel = track_selBucket;
            grabber();
            break;
        case 2: //never can be called
            track_sel = 0;
            grabber();
    }

}
//checks user button state. 
//can be called to update state(function of user button) even when not in Freq Seq mode. 
function grabber(){
    var x = track_sel * (user_But + 1);
    if (x == prev_grab){
        return 0;
        }
        else{
            switch(x){ 
                case 0: //all controls released
                    //cancel blink
                    if (blinkOn.running) blinkOn.cancel();
					if (pattBlinkOn.running) pattBlinkOn.cancel();
                    //let sequencer know
                    this.patcher.getnamed(clients[launchBucket]).message('surfaceSel', 0);
                    this.patcher.getnamed('seqMarker').message('surfaceSel', -1);
                    outlet(0, ['global', 'grab', 'call', 'release_control']);
                    outlet(0, ['global', 'off', 0]);
                    //messnamed('---pushControl', 'global grab call release_control', 'global off 0');
                    break;
                case 1: //release all and grab ub 
                    //cancel blink
                    if (blinkOn.running) blinkOn.cancel();
					if (pattBlinkOn.running) pattBlinkOn.cancel();
                    var mess = [['global', 'grab', 'call', 'release_control'], 
                                    ['ub', 'grab', 'call', 'grab_control'], 
                                        ['ub', 'toDevice', 'call', 'send_value', 4], 
                                            ['global', 'off', 0], 
                                                ['ub', 'off', 1]];
                    this.patcher.getnamed(clients[launchBucket]).message('surfaceSel', 0);
                    this.patcher.getnamed('seqMarker').message('surfaceSel', -1);
                    for (i = 0; i < 5; i++){
                        outlet(0, mess[i]);
                    }
                    break;
                case 2: //user is getting freaky
                    var mess = [['global', 'grab', 'call', 'grab_control'], 
                                        ['ub', 'toDevice', 'call', 'send_value', 127], 
                                            ['global', 'off', 1]]; 
                                                //['tsc', 'toDevice', 'call', 'set_mode', 2]];
                    for (i = 0; i < 4; i++){
                        outlet(0, mess[i]);
                    }
                    colorRequest.schedule(25);
                    //this.patcher.getnamed(clients[launchBucket]).message('sendState');
                    //matrixLights()
                    break;
            }
    }
    prev_grab = x;
}

function hStep(){
    newMark = arguments[0];
    if (!markRequest.running) markRequest.schedule(5);  
}

function idleMark(){
    if(user_But){
        lastFlash = (lastFlash + 1) % 2;
        if(layoutBucket || (launchBucket != 7)){
            (lastFlash) ? markRequest.schedule(5) : idleOff();
        }
    }
}

//for blinking off in idle mode
function idleOff(){
    var light;
    if(layoutBucket){
            for(i = 0; i < 7; i++){
                (globalBut_Matrix[i][highlightedStep]) ? light = launch_But[i][2]  : light = launch_But[i][1];
                outlet(0, ['bm', 'toDevice', 'call', 'send_value', Math.floor(highlightedStep % 8), i, light]);
            }
        }
        else if(launchBucket != 7){
            (but_Matrix[highlightedStep][0]) ? light = matrix_Color[1]  : light = matrix_Color[0];
            matrixMess.send((highlightedStep % 8),  Math.floor(highlightedStep / 8),  light);
    }
    //last idle for reference
    idleBucket = highlightedStep;

}
//resets last blink on idle for when sequencer is restarted
function idleReset(){
    var light;
    if(layoutBucket){
            for(i = 0; i < 7; i++){
                (globalBut_Matrix[i][idleBucket]) ? light = launch_But[i][2]  : light = launch_But[i][1];
                outlet(0, ['bm', 'toDevice', 'call', 'send_value', Math.floor(idleBucket % 8), i, light]);
            }
        }
        else if(launchBucket != 7){
            (but_Matrix[idleBucket][0]) ? light = matrix_Color[1]  : light = matrix_Color[0];
            matrixMess.send((idleBucket % 8),  Math.floor(idleBucket / 8),  light);
    }

}

function sendMarkRowMode(){
    var light;
    (but_Matrix[highlightedStep][0]) ? light = matrix_Color[1]  : light = matrix_Color[0];
    matrixMess.send((highlightedStep % 8),  Math.floor(highlightedStep / 8),  light);
    highlightedStep = newMark;
    matrixMess.send((highlightedStep % 8),  Math.floor(highlightedStep / 8),  122);
}

function sendMarkGlobalMode(){
    //create page bounds and check if marker is in them
    var offset = (globalBucket + 1)  * 8;
    var min = offset - 8;
    var highlightedStepCheck = splitTest(highlightedStep, min, offset);
    var newMarkCheck = splitTest(newMark, min, offset);
    //first, dim last mark if it is in range
    if(highlightedStepCheck){
        var light;
        for(i = 0; i < 7; i++){
            (globalBut_Matrix[i][highlightedStep]) ? light = launch_But[i][2]  : light = launch_But[i][1];
            outlet(0, ['bm', 'toDevice', 'call', 'send_value', Math.floor(highlightedStep % 8), i, light]);
        }
    }
    //now highlight new step if it is in range
    if (newMarkCheck){
        globalInRange = [1, newMark];
        var light;
        for(i = 0; i < 7; i++){
            outlet(0, ['bm', 'toDevice', 'call', 'send_value', Math.floor(newMark % 8), i, 118]);
        }
    }
    //mark is out of bounds
    else{ 
        globalInRange[0] = 0; 
    }
    //last, update for next step
    highlightedStep = newMark;
}

function sendMark(){
    highlightMode.pointer();
}

function updateMatrix(){
    if(layoutBucket && user_But){
        var check = (nCols == arguments[64]);
        nCols = arguments[64];
        for(i = 0; i < 64; i ++){
            globalBut_Matrix[arguments[65]][i] = arguments[i];
            }
        if(!check){ //incase columns have changed
            for(i = 0; i < 64; i ++){
                outlet(0, ['bm', 'toDevice', 'call', 'send_value', (i % 8),  Math.floor(i / 8),  0]);
                }
            
            var pages = nCols / 8;
            for(z = 0; z < pages; z++){
                outlet(0, ['bm', 'toDevice', 'call', 'send_value', z,  7,  124]);
                }
            outlet(0, ['bm', 'toDevice', 'call', 'send_value', globalBucket,  7,  122]);
            
           //globalMode();
            } //incase columns need to be recalculated
            globalLights(arguments[65]);
        }
        else if (user_But){
            nCols = arguments[64];
            for(i = 0; i < 64; i ++){
                but_Matrix[i][0] = arguments[i];
            }
        if (!matrixRequest.running) matrixRequest.schedule(25); 
    } 
}


function matrixLights(){
    var light;
    for (i = 0; i < 64; i++){
        if (i < nCols){
            (but_Matrix[i][0]) ? light = matrix_Color[1]  : light = matrix_Color[0];
            outlet(0, ['bm', 'toDevice', 'call', 'send_value', (but_Matrix[i][1] % 8),  Math.floor(but_Matrix[i][1] / 8),  light]);
            }
           else { 
            outlet(0, ['bm', 'toDevice', 'call', 'send_value', (but_Matrix[i][1] % 8), Math.floor(but_Matrix[i][1] / 8),  0]);
        }
    }

}

function globalLights(){
    if(user_But){
        var light;
        //color row
        var curRow = arguments[0];
        //pagenumber
        var offset = globalBucket + 1;
        //lowest step value on display
        var pageMin = (globalBucket * 8);
            for (j = 0; j < 8; j++){
                //only send a color if we are 
                if ((j + pageMin) < nCols){
                    (globalBut_Matrix[curRow][j * offset]) ? light = launch_But[curRow][2]  : light = launch_But[curRow][1];
                    outlet(0, ['bm', 'toDevice', 'call', 'send_value', j,  curRow,  light]);
                }
                    else{
                        (globalBut_Matrix[curRow][j * offset]) ? light = launch_But[curRow][2]  : light = launch_But[curRow][1];
                        outlet(0, ['bm', 'toDevice', 'call', 'send_value', j,  curRow,  0]);
                }
            }
    }
}

function globalViewLights(){
    var light;
    //var curRow = arguments[0];
    var offset = globalBucket  * 8;
    for(i = 0; i < 7; i++){
        for (j = 0; j < 8; j++){
            var check = splitTest(j + offset, 0, nCols);
            (globalBut_Matrix[i][j + offset]) ? light = launch_But[i][2]  : light = launch_But[i][1];
            if(!check) light = 0;
            outlet(0, ['bm', 'toDevice', 'call', 'send_value', j,  i,  light]);
        }
    }
}

function newSaved(){
    pat_Matrix[arguments[0]] = arguments[1];
    if(!layoutBucket){
        var inRange = splitTest(arguments[0], patternOffset, (patternOffset + 64));
        if(inRange){
            (arguments[0] < 64) ? matrixMess.send((arguments[0] % 8),  Math.floor(arguments[0] / 8),  matrix_ColorPattern[arguments[1]])
                : matrixMess.send(((arguments[0] - 64) % 8),  Math.floor((arguments[0] - 64) / 8),  matrix_ColorPattern[arguments[1]]);
        }
        inRange = splitTest(patternCurrent, patternOffset, (patternOffset + 64));
        if (inRange){
            (patternCurrent < 64) ? matrixMess.send((patternCurrent % 8),  Math.floor(patternCurrent / 8),  matrix_Color[1])
                : matrixMess.send(((patternCurrent - 64) % 8),  Math.floor((patternCurrent - 64) / 8),  matrix_Color[1]);
        }
    }
}

//update from global seq
function updatePattern(){
    if(layoutBucket){
        patternCurrent = arguments[0];
        }
        else if(!launchBucket == 7){
            patternCurrent = arguments[0];
        }
        else{
            var light;
            var inRange = splitTest(patternCurrent, patternOffset, (patternOffset + 64));
            //only send off message if in range of matrix
            if(pattBlinkOn.running) pattBlinkOn.cancel();
            if(inRange){
                (pat_Matrix[patternCurrent]) ? light = matrix_Color[0] : light = 0;
                (patternCurrent < 64) ? matrixMess.send((patternCurrent % 8),  Math.floor(patternCurrent / 8),  light)
                : matrixMess.send(((patternCurrent - 64) % 8),  Math.floor((patternCurrent - 64) / 8),  light);
            }
            //update & retest & send highlight if in range
            patternCurrent = arguments[0];
            inRange = splitTest(patternCurrent, patternOffset, (patternOffset + 64));
            if(inRange){
                (patternCurrent < 64) ? matrixMess.send((patternCurrent % 8),  Math.floor(patternCurrent / 8),  matrix_Color[1])
                    : matrixMess.send(((patternCurrent - 64) % 8),  Math.floor((patternCurrent - 64) / 8),  matrix_Color[1]);
        }
    }
}
//update from global seq
function patternMatrix(){
    //nCols = 64;
    patternCurrent = arguments[128];
    for(i = 0; i < 128; i ++){
        pat_Matrix[i] = arguments[i];
    }
    if (!patternRequest.running) patternRequest.schedule(25);  
}
//make light in pattern mode
function patternLights(){
    if(!layoutBucket && user_But){
        var light;
        //var matrixMap = clamp((patternCurrent - patternOffset), 0, 64);
        var inRange = splitTest(patternCurrent, patternOffset, (patternOffset + 64));
        for (i = 0; i < 64; i++){
            (pat_Matrix[(i + patternOffset)]) ? light = matrix_Color[0]  : light = 0;
            outlet(0, ['bm', 'toDevice', 'call', 'send_value', (i % 8),  Math.floor(i / 8),  light]);
        }
        if(inRange) {
            (patternCurrent < 63) ? outlet(0, ['bm', 'toDevice', 'call', 'send_value', (patternCurrent % 8),  Math.floor(patternCurrent / 8),  matrix_Color[1]])
                : outlet(0, ['bm', 'toDevice', 'call', 'send_value', ((patternCurrent - patternOffset) % 8),  Math.floor((patternCurrent - patternOffset) / 8),  matrix_Color[1]]);
        }
        if (patternOffset){
            outlet(0, ['oub', 'toDevice', 'call', 'send_value', 127]);
            outlet(0, ['odb', 'toDevice', 'call', 'send_value', 4]);
            }
            else{
                outlet(0, ['oub', 'toDevice', 'call', 'send_value', 4]);
                outlet(0, ['odb', 'toDevice', 'call', 'send_value', 127]);
        }
    }
}

/* this is funky // used for updating banks when fx view is changed by UI mouse interactions
function fxSel(){
    if (prev_grab == 3){
        rowMode(arguments[0]);
        sendBank(); //update banks
        }
        else{
            launchBucket = arguments[0];
            sendBank();
    }
}
*/
//for fx name display
function fxName(){
    fxNames[arguments[0]][0] = arguments[1];
    if (arguments[0] == launchBucket) sendBank();
}
function fxUI(){
    //printf('fxUI called');
    fxNames[arguments[0]][1] = arguments[1];
}
//user is twiddling thier knob
function knobTwiddle(){
    var num = arguments[1];
    var sendName = colorNames[launchBucket] + 'KnobGet';
    outlet(1, ['twiddle','send', sendName]); 
    //need to know if param is automated
    var liveObj = new LiveAPI("this_device"); //param_ids[launchBucket][num]);
    liveObj.id = param_ids[launchBucket][num];
    var x = liveObj.get("automation_state");
    switch(arguments[0]){
        case 127 :
            if (x == 0) outlet(1, ['twiddle', 'g' + num,  1]);
            break;
        case 0 :
            outlet(1, ['twiddle', 'g' + num,  0]);
            break;
    }
}

function setKnobNames(){
    knobNames[arguments[0]][arguments[1]] = arguments[2];
}

function INITKnobNames(){
    knobNames[arguments[0]] = ['Unused', 'Unused', 'Unused', 'Unused', 'Unused', 'Unused', 'Unused'];  
}

function knobVal(){
    var knob = knobNames[arguments[0]][arguments[1]];
    var kVal = arguments[2];  
    outlet(1, ['mess', 'call', 'show_notification', knob + " " + kVal]);
}
 //for making list of pknob param ids if new automatable params added. 
function knobParams(){
    var liveObj = new LiveAPI("this_device");
    params = liveObj.get("parameters");
    //outlet(1, 'params', params);

    
        for(i = 1; i < params.length; i = i + 2){
            //newParams.push(params[i]);
            liveObj.id = params[i];
            var check = liveObj.get("name");
            check = String(check);
            var knob = new Array();
            knob = check.split(" ");
            if (knob[1] + " " + knob[2] == "Knob 1"){
                var ind = colorNames.indexOf(knob[0]);
                for (j = 0; j < 7; j++){
                    param_ids[ind][j] = params[i] + j;
                }
                //outlet(1,'twiddler', check, params[i]);
            }

        }
     
}
//var deleteThis = knobParams();
//display messages on push screen
function noCopyMess(){
    outlet(1, ['mess', 'call', 'show_notification', 'Press the "DUPLICATE" Button to Copy a Pattern']);
}

function copyMess(){
    outlet(1, ['mess', 'call', 'show_notification', 'Pattern ' + copyPattern + ' Pasted To ' + (arguments[0] + patternOffset)]);
}
//updates liveTransportPlayState and calls playState 
function liveTransport(){
    liveTransportPlayState = arguments[0];
    if(user_But){
        playState(currentPlayState);
    }
}

//whether internal sequencer is running
function playState(){
    var ps = arguments[0];
    currentPlayState = ps;
    displayStateBucket = currentPlayState * liveTransportPlayState;
    ps = ps * liveTransportPlayState;
    if(user_But){
        if(!ps){
            if(!sequencerIdle.running){
                sequencerIdle.repeat();
                sequencerIdle.execute;
            }
            if(layoutBucket && globalInRange[0]){
                var light;
                for(i = 0; i < 7; i++){
                    (globalBut_Matrix[i][globalInRange[1]]) ? light = launch_But[i][2]  : light = launch_But[i][1];
                    outlet(0, ['bm', 'toDevice', 'call', 'send_value', Math.floor(highlightedStep % 8), i, light]);
                }
            }

        }
        else if (ps){
            if(sequencerIdle.running) sequencerIdle.cancel();
        idleReset();
        }
    }
}
 /*  //  //  //  //  //  //  //  //  //  //  //
Input -- from device
*/  //  //  //  //  //  //  //  //  //  //  //
//user button
function ub(){
    if (arguments[0]){ 
        user_But = (user_But + 1) % 2;
        grabber();
    }
}

//various button matrix modes
function bmMode_pattern(grid, x, y){
    if (shiftButton){
        this.patcher.getnamed(clients[7]).message('paste', (grid + patternOffset));
        //outlet(1, ['mess', 'call', 'show_notification', 'Pattern ' + copyPattern + ' Pasted To ' + (grid + patternOffset)]);
        }
        else{
            if(pattBlinkOn.running) pattBlinkOn.cancel();
            var light;
            (pat_Matrix[(pGrid)]) ? light = matrix_Color[0]  : light = 0;
            outlet(0, ['bm', 'toDevice', 'call', 'send_value', pX, pY,  light]);
            pX = x;
            pY = y;
            pGrid = grid;
            pattBlinkOn.repeat(500);
            //pattBlinkOn.execute;
            /*
            outlet(1, ['pattern', 'sendTo', 'Pattern', 'set', (grid % 8)]);
            outlet(1, ['pattern', 'sendTo', 'Pattern Banks', 'set', Math.floor((grid + patternOffset) / 8)]);
            this.patcher.getnamed('genSeq').message('pattern', (grid + patternOffset));
            this.patcher.getnamed('globalSeq').message('pattern', (grid + patternOffset));
            outlet(1, ['pattern', 'sendTo', 'dispPat', 'set', grid + patternOffset]);
            */
           outlet(1, ['pattern', 'sendTo', 'Pattern Bank Index',  (grid % 8) + 1]);
           outlet(1, ['pattern', 'sendTo', 'Pattern Banks', Math.floor((grid + patternOffset) / 8)]);
    }
}

function bmMode_rows(grid, x, y){
    //map to array and update
    but_Matrix[grid][0] = (but_Matrix[grid][0] + 1) % 2; 
    //update lights
    (but_Matrix[grid][0]) ? matrixMess.send(x, y, matrix_Color[1])
                            :  matrixMess.send(x, y, matrix_Color[0]);
    //update ui
    this.patcher.getnamed(clients[launchBucket]).message('surfaceUpdate', grid, but_Matrix[grid]);
    //matrixLights();
}

function bmMode_global(grid, x, y){
    var light;
    if(y == 7){
        var pages = nCols / 8;
        var check = splitTest(x, 0, pages);
            if(check){
                outlet(0, ['bm', 'toDevice', 'call', 'send_value', globalBucket,  y,  124]);
                globalBucket = x;
                outlet(0, ['bm', 'toDevice', 'call', 'send_value', globalBucket,  y,  122]);
                if(!globalViewChangeRequest.running) globalViewChangeRequest.schedule(25);
            } 
        }
        else{
        var offset = globalBucket  * 8;
        offset = x + offset;
        var check = splitTest(offset, 0, nCols);
        if(check){
            globalBut_Matrix[y][offset] = (globalBut_Matrix[y][offset] + 1) % 2; 
            (globalBut_Matrix[y][offset]) ? light = launch_But[y][2]  : light = launch_But[y][1];
            outlet(0, ['bm', 'toDevice', 'call', 'send_value', x,  y,  light]);
            this.patcher.getnamed(clients[y]).message('surfaceUpdate', offset, globalBut_Matrix[y][offset]);
        }
    }
}

//button matrix
function bm(){
    var x = arguments[1];
    var y = arguments[2];
    var grid = x + (y * 8);
    if(arguments[0] > 0){
        if(layoutBucket){
            bmMode_global(grid, x, y);           
            }
            else if(launchBucket == 7){
                bmMode_pattern(grid, x, y);            
                /*
                if (shiftButton){
                    this.patcher.getnamed(clients[7]).message('paste', (grid + patternOffset));
                    //outlet(1, ['mess', 'call', 'show_notification', 'Pattern ' + copyPattern + ' Pasted To ' + (grid + patternOffset)]);
                    }
                    else{
                        outlet(1, ['pattern', 'sendTo', 'Pattern', 'set', (grid % 8)]);
                        outlet(1, ['pattern', 'sendTo', 'Pattern Banks', 'set', Math.floor((grid + patternOffset) / 8)]);
                        this.patcher.getnamed('genSeq').message('pattern', (grid + patternOffset));
                        this.patcher.getnamed('globalSeq').message('pattern', (grid + patternOffset));
                        outlet(1, ['pattern', 'sendTo', 'disPat', 'set', grid + patternOffset]);
                }
                //messnamed('---patternChange', grid);
                */
            }
            else if (grid < nCols){
                bmMode_rows(grid, x, y);
             /*
                //map to array and update
                but_Matrix[grid][0] = (but_Matrix[grid][0] + 1) % 2; 
                //update lights
                (but_Matrix[grid][0]) ? matrixMess.send(arguments[1], arguments[2], matrix_Color[1])
                                        :  matrixMess.send(arguments[1], arguments[2], matrix_Color[0]);
                //update ui
                this.patcher.getnamed(clients[launchBucket]).message('surfaceUpdate', grid, but_Matrix[grid]);
                //matrixLights();
            */
        }
    }    
}


//touch strip control
function tsc(){
    touchBucket = arguments[0];
    if(arguments[0] != 8192){
        if(!touchRequest.running){
            touchRequest.schedule(50);
        }
    }
    outlet(0, ['tsc', 'toDevice', 'call', 'send_value', arguments[0]]);
}

function touching(){
    bitbyte = tsc_Split(touchBucket);
    var messDest = 'null';
    (launchBucket < 7) ? messDest = ['advPattern', 'sendTo', colorNames[launchBucket] + ' ' + 'Bit-Byte','message', 'set', bitbyte]
        : messDest = ['pattern', 'sendTo', 'Pattern Main Bit-Byte','message', 'set', bitbyte];
    outlet(1, messDest);
    this.patcher.getnamed(clients[launchBucket]).message('bitbyte', bitbyte, 1);
}

//touch strip tap MAY NOT USE
function tst(){
    if(!arguments[0]){ 
        outlet(0, ['tsc', 'toDevice', 'call', 'send_value', 8192]);
    }
}

//scene launch
function sl(){
    //regular
    if (arguments[0] > 0 && arguments[1] < 7){
        //check for shift
        if (shiftButton){ 
            //trigger automation trigger
            outlet(1, ['performance', 'sendTo', colorNames[arguments[1]] + ' Automation ' + 'Toggle','message', 'bang']);
            //outlet(0, ['sl', 'toDevice', 'call', 'send_value', arguments[1], 0, 124]);
            (isBlinking[arguments[1]]) ? outlet(1, ['mess', 'call', 'show_notification', colorNames[arguments[1]] + ' FX Off'])
                : outlet(1, ['mess', 'call', 'show_notification', colorNames[arguments[1]] + ' FX On']);
            }
            else{
                if(layoutBucket){ //pretty much do rowMode() w/o lights 
                    launchMess.send(launchBucket, 0, launch_But[launchBucket][1]);
                    launchBucket = arguments[1];
                    launchMess.send(launchBucket, 0, launch_But[launchBucket][2]);
                    var sendName = '---' + colorNames[launchBucket] + 'KnobGet';
                    outlet(1, ['twiddle','send', sendName]); 
                    for (i = 0; i < 7; i++){
                        outlet(1, ['twiddle', 'g' + i,  0]);
                    }
                    //switch off octave button lights
                    outlet(0, ['oub', 'toDevice', 'call', 'send_value', 4]);
                    outlet(0, ['odb', 'toDevice', 'call', 'send_value', 4]);
                    outlet(1, ['odb', 'toDevice', 'call', 'send_value', 4]); //do i need this?
                    //display fx name
                    outlet(1, ['mess', 'call', 'show_notification', fxNames[launchBucket][0]]);
                    //switch fx view
                    outlet(1, ['fxSel', 'sendTo', 'Effect Focus','list', 1, ((6 - launchBucket) + 1)]);
                    sendBank();
                    }
                    else{
                    rowMode(arguments[1]);
                    sendBank(); //update banks
                }
            }
        }
        //pattern mode
        else if (arguments[0] > 0){
            if(layoutBucket){
                launchMess.send(launchBucket, 0, launch_But[launchBucket][1]);
                launchBucket = arguments[1];
                launchMess.send(launchBucket, 0, launch_But[launchBucket][2]);
                }
                else{
                //for global
                patternMode(arguments[1]);
            }
        }
}

//scene launch (but doesn't respond to shift button)
function sl_noShift(){
    //regular
    if (arguments[0] > 0 && arguments[1] < 7){
        if(layoutBucket){ //pretty much do rowMode() w/o lights 
            launchMess.send(launchBucket, 0, launch_But[launchBucket][1]);
            launchBucket = arguments[1];
            launchMess.send(launchBucket, 0, launch_But[launchBucket][2]);
            var sendName = '---' + colorNames[launchBucket] + 'KnobGet';
            outlet(1, ['twiddle','send', sendName]); 
            for (i = 0; i < 7; i++){
                outlet(1, ['twiddle', 'g' + i,  0]);
            }
            //switch off octave button lights
            outlet(0, ['oub', 'toDevice', 'call', 'send_value', 4]);
            outlet(0, ['odb', 'toDevice', 'call', 'send_value', 4]);
            outlet(1, ['odb', 'toDevice', 'call', 'send_value', 4]); //do i need this?
            //display fx name
            outlet(1, ['mess', 'call', 'show_notification', fxNames[launchBucket][0]]);
            //switch fx view
            outlet(1, ['fxSel', 'sendTo', 'Effect Focus','list', 1, ((6 - launchBucket) + 1)]);
            sendBank();
            }
            else{
            rowMode(arguments[1]);
            sendBank(); //update banks
        }
    }
    //pattern mode
    else if (arguments[0] > 0){
        if(layoutBucket){
            launchMess.send(launchBucket, 0, launch_But[launchBucket][1]);
            launchBucket = arguments[1];
            launchMess.send(launchBucket, 0, launch_But[launchBucket][2]);
            }
            else{
            //for global
            patternMode(arguments[1]);
        }
    }
}
//modes for scene launch buttons (other fxSel fucntion calls rowMode)
function rowMode(){ //whole matrix for one color row
    //for knobs
    highlightMode.update(sendMarkRowMode);
    if(pattBlinkOn.running) pattBlinkOn.cancel();
    //var light;
    //(pat_Matrix[(pGrid)]) ? light = matrix_Color[0]  : light = 0;
    //outlet(0, ['bm', 'toDevice', 'call', 'send_value', pX, pY,  light]);
    var sendName = '---' + colorNames[launchBucket] + 'KnobGet';
    outlet(1, ['twiddle','send', sendName]); 
    for (i = 0; i < 7; i++){
        outlet(1, ['twiddle', 'g' + i,  0]);
    }
    //dim last and release 
    this.patcher.getnamed(clients[launchBucket]).message('surfaceSel', 0);
    //this.patcher.getnamed(marks[launchBucket]).message('surfaceSel', 0);
    launchMess.send(launchBucket, 0, launch_But[launchBucket][1]);
    //update && brighten/tell sequencer
    launchBucket = arguments[0];
    this.patcher.getnamed(clients[launchBucket]).message('surfaceSel', 1);
    this.patcher.getnamed('seqMarker').message('surfaceSel', launchBucket);
    launchMess.send(launchBucket, 0, launch_But[launchBucket][2]);
    //update color and request new steps
    matrix_Color[1] = launch_But[launchBucket][2];
    this.patcher.getnamed(clients[launchBucket]).message('sendState');
    //switch off octave button lights
    outlet(0, ['oub', 'toDevice', 'call', 'send_value', 4]);
    outlet(0, ['odb', 'toDevice', 'call', 'send_value', 4]);
    outlet(1, ['odb', 'toDevice', 'call', 'send_value', 4]); //do i need this?
    //display fx name
    outlet(1, ['mess', 'call', 'show_notification', fxNames[launchBucket][0]]);
    //switch fx view
    outlet(1, ['fxSel', 'sendTo', 'Effect Focus','list', 1, ((6 - launchBucket) + 1)]);

}

function patternMode(){ //pattern selction matrix
        this.patcher.getnamed(clients[launchBucket]).message('surfaceSel', 0);
        if(!layoutBucket){
            this.patcher.getnamed('seqMarker').message('surfaceSel', -1);
        }
        launchMess.send(launchBucket, 0, launch_But[launchBucket][1]);
        launchBucket = arguments[0];
        this.patcher.getnamed(clients[launchBucket]).message('surfaceSel', 1);
        launchMess.send(launchBucket, 0, launch_But[launchBucket][2]);
        matrix_Color[1] = launch_But[launchBucket][2];
        this.patcher.getnamed(clients[launchBucket]).message('sendState');
}

function globalMode(){
    if(launchBucket == 7){ 
        nCols = nColsBucket;
        this.patcher.getnamed('seqMarker').message('surfaceSel', 1); //just select any row
    }
    var pages = nCols / 8;
    if(pattBlinkOn.running) pattBlinkOn.cancel();
        highlightMode.update(sendMarkGlobalMode);
    for(x = 0; x < 7; x++){
        this.patcher.getnamed(clients[x]).message('surfaceSel', 1);
    }
    for(y = 0; y < 7; y++){
        this.patcher.getnamed(clients[y]).message('sendState');
    }
	var pageCheck = nCols / 8; //pages doesnt work
	if(launchBucket < 7 || pageCheck == 2){ //only needed when the pages aren't already displayed
    	for(i = 0; i < 8; i++){
        	outlet(0, ['bm', 'toDevice', 'call', 'send_value', i,  7,  0]);
    	}
    	for(z = 0; z < pages; z++){
        	outlet(0, ['bm', 'toDevice', 'call', 'send_value', z,  7,  124]);
    	}
	}
	if (nCols < 9){ //if only one page, just simulate a page selection because fuck it thats easy
		if(!globalViewChangeRequest.running) globalViewChangeRequest.schedule(25);
	}
    outlet(0, ['bm', 'toDevice', 'call', 'send_value', globalBucket,  7,  122]);
}

//page right button
function prb(){
    if(!arguments[0]) this.patcher.getnamed(clients[launchBucket]).message('right', 1);
}
//page left button
function plb(){
    if(!arguments[0]) this.patcher.getnamed(clients[launchBucket]).message('left', 1);
}
//just for global ab/rb
function randBin(){
    for (i = 0; i < 7; i++){
        outlet(1, ['params', colorNames[i], 'sendTo', colorNames[i] + arguments[0], 'bang']);
    }
}
//accent button
function ab(){
    if(!arguments[0]){ 
        if (shiftButton){
            (launchBucket < 7) ?outlet(1, ['params', colorNames[launchBucket], 'sendTo', colorNames[launchBucket] + ' FX Random', 'bang'])
                : randBin(' FX Random');
            }
            else {    
                this.patcher.getnamed(clients[launchBucket]).message('random', 1);
        } 
    }
}

//repeat button
function rb(){
    if(!arguments[0]){ 
        if (shiftButton){
            (launchBucket < 7) ? outlet(1, ['params', colorNames[launchBucket], 'sendTo', colorNames[launchBucket] + ' FX INIT', 'bang'])
                : randBin(' FX INIT');
            }
            else {    
                this.patcher.getnamed(clients[launchBucket]).message('clear', 1);
        } 
    }
}
//duplicate button "Copy Spot"
function db(){
    if(!arguments[0]) {
        outlet(1, ['pattern', 'sendTo', 'Copy Spot', 'message', 'set', patternCurrent]);
        this.patcher.getnamed(clients[7]).message('copy', patternCurrent);
        outlet(1, ['mess', 'call', 'show_notification', 'Pattern ' + patternCurrent + ' Copied']);
        copyPattern = patternCurrent;
    }
}

//new button
function nb(){
    post('nb');
}

//octave up button
function oub(){
    if(!layoutBucket){
        if(!arguments[0] && launchBucket == 7){ 
            patternOffset = 0;
            patternLights();
            outlet(1, ['mess', 'call', 'show_notification', 'Patterns 0 - 63']);
        }
    }
}
//octave down button
function odb(){
    if(!layoutBucket){
        if(!arguments[0] && launchBucket == 7){ 
            patternOffset = 64;
            patternLights();
            outlet(1, ['mess', 'call', 'show_notification', 'Patterns 64 - 127']);
        }
    }
}

//shift button
function sb(){
    shiftButton = arguments[0];
}

//delete button
function delb(){
    post('delb');
}

//track control touches
function tct(){
    if (launchBucket < 7 && arguments[1] < 7) knobTwiddle(arguments[0], arguments[1]);
}

//update adv transport state
function transportLock(lock){
    //display notifacation of transport state
    if(lock == 0){ 
        outlet(1, ['mess', 'call', 'show_notification', 'Advanced Transport Closed']);
        }
        else if(lock == 1){
            outlet(1, ['mess', 'call', 'show_notification', 'Advanced Transport Open']);
    }
    //make sure theres no pattern blinking
    if(pattBlinkOn.running) pattBlinkOn.repeat(0);
    //update internal reference of transport state
    advTrans = lock;
    //switch modes if in global and the advanced transport is opened
    if(advTrans){
        if(layoutBucket){
            layoutBucket = 0;
            loSwitch();
        }
    }
}
//for switching back from global mode triggered also by advTrans for simulated button presses
function loSwitch(){
    for(i = 0; i < 7; i++){
        this.patcher.getnamed(clients[i]).message('surfaceSel', 0);
    }
    sl_noShift(127, launchBucket);

}
//select button
function selb(){
    // return 0;
    // for selecting fx from push -- maybe implement later
    if(arguments[0]){
        sendFXChooserBank();
        outlet(1, ['fxSel', 'gate', 1]);
    }
    else{
        sendBank();
        outlet(1, ['fxSel', 'gate', 0]);
        outlet(1, ['fxSel', 'bangMess', 'bang']);
    }
    
}
//master button
function mb(){
    if(arguments[0]){
        outlet(1, ['transportUI', 'sendTo', 'Transport Play/Stop Button', 'bang']);
    }
}

//layout button
function lo(){
    if (arguments[0]){
        if (shiftButton){
        outlet(1, ['transportUI', 'sendTo', 'Advanced Transport', 'bang']);
            }
            else if (advTrans){
            outlet(1, ['mess', 'call', 'show_notification', 'Press "Shift" + "Layout" to close Advanced Trasport Mode']);
            }
            else {
                layoutBucket = (layoutBucket + 1) % 2;
                if(layoutBucket) { 
                    globalMode();
                    }
                    else{
                        loSwitch();
                    }
            }
                
    }
}
