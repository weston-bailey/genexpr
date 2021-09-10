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
outlets = 1;

var i = 0;
var stepsBuf = new Buffer("---seqSteps");
var localSteps = new Dict("---localSteps");
var saveSteps = new Dict("---saveSteps");
var bitbyteTable = new Dict("bit-byte");

var savePattern = 0;

var copyPattern = 0;
/*
var copySteps = new Array(7);
    for (i = 0; i < 7; i++){
        copySteps[i] = new Array(64);
            for (j = 0; j < 64; j++){
                copySteps[i][j] = 0;
            }
    }
*/
var firstCopy = 0; //flag for when first copy is made
var copySteps = new Array(7);
    for (i = 0; i < 7; i++){
        copySteps[i] = new Array(64);
    }

outlets = 1;

var patternRequest = new Task(patternUpdate, this);
var patternCurrent = 0;
var patternMod = new Array(128);
    for (i = 0; i  < 127; i++ ){
        patternMod[i] = 0;
    }

var clearRequest = new Task(clearUpdate, this);
var clearWrite = 0;
var clearSteps = new Array(64);
    for (i = 0; i  < 64; i++ ){
        clearSteps[i] = 0;
    }

var randomRequest = new Task(randomUpdate, this);
var randomWrite = 0;
/*
var randomSteps = new Array(7);
    for (i = 0; i  < 7; i++){
        randomSteps[i] = new Array(64);
            for (j = 0; j < 64; j++){
                randomSteps[i][j] = Math.round(Math.random());
            }
    }
*/
var bitbyteRequest = new Task(bitbyteUpdate, this);
var bitbytePattern = 0;
var bitbytePointer = 0;
var bitbyteWrite = 0;

var leftRequest = new Task(leftUpdate, this);
var leftWrite = 0;
var rightRequest = new Task(rightUpdate, this);
var rightWrite = 0;

var saveRequest = new Task(saveUpdate, this);

var buffRequest = new Task(buffInitUpdate, this);

var pasteRequest = new Task(pasteUpdate, this);
var copyRequest = new Task(copyUpdate, this);
var saveBangRequest = new Task(saveBangUpdate, this);

var requestINIT = new Task(contINIT, this);



var clients = ["Red Sequencer Grid", 
                "Orange Sequencer Grid", 
                    "Yellow Sequencer Grid", 
                        "Green Sequencer Grid", 
                            "Blue Sequencer Grid", 
                                "Indigo Sequencer Grid", 
                                    "Violet Sequencer Grid"];
var keyNames = ["Red", "Orange", 
                    "Yellow", "Green", 
                        "Blue", "Indigo", 
                            "Violet"];

var surfaceSend = 0;
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
Update Schedulers
*/  //  //  //  //  //  //  //  //  //  //  //
function saveUpdate(){
    if (!patternMod[savePattern]){
        patternMod[savePattern] = 1;
        if (surfaceSend) sendLight(savePattern, 1); 
        localSteps.replace("Program", patternMod);
    }
    messnamed(jsarguments[2], 'bang');
}
//for just the bang
function saveBangUpdate(){ 
    messnamed(jsarguments[2], 'bang');
}

function writeSteps(){
    if (!saveRequest.running){
        savePattern = patternCurrent;
        saveRequest.schedule(100);
        }
        else {
            savePattern = patternCurrent;
            saveRequest.cancel();
            saveRequest.schedule(100);
    }
}

function pattern(){
    var i = arguments[0];
    patternCurrent = i;
    if (!patternRequest.running) patternRequest.schedule(25);
}

function patternUpdate(){   
    if (surfaceSend) sendPattern();
    for(i = 0; i < 7; i++){
        this.patcher.getnamed(clients[i]).message('pattern', patternCurrent);
    }
    //if (surfaceSend) sendPattern();
}
/*
function clearUpdate(){
    for(x = 0; x < 7; x++){
        this.patcher.getnamed(clients[x]).message('clear', 0); //handle write requests local incase it came from the push
    }
    if (surfaceSend) sendLight(clearPattern, 0);
    patternMod[clearPattern] = 0;
    localSteps.replace("Program", patternMod);
    if (clearWrite == 1 && !saveRequest.running) saveBangRequest.schedule(100); //no rush
}
*/
//maybe do buffer stuffer in a loop before ui?
function clearUpdate(){
    var writePos = clearPattern * 64;
    patternMod[clearPattern] = 0;
    for(i = 0; i < 7; i++){
        localSteps.replace(keyNames[i] + ' ' + clearPattern, clearSteps) //handle write requests local incase it came from the push
        stepsBuf.poke((i + 1), writePos, clearSteps);
        this.patcher.getnamed(clients[i]).message('updateState'); //handle write requests local incase it came from the push
    }
    if (surfaceSend) sendLight(clearPattern, 0);
    patternMod[clearPattern] = 0;
    localSteps.replace("Program", patternMod);
    if (clearWrite == 1 && !saveRequest.running) saveBangRequest.schedule(25); //no rush

}

function clear(){
    if (!clearRequest.running){
        clearPattern = patternCurrent;
        clearRequest.schedule(25);
        (arguments[0]) ? clearWrite = 1 : clearWrite = 0;
    }
}

function randomUpdate(){
    for(i = 0; i < 7; i++){
        this.patcher.getnamed(clients[i]).message('random', randomWrite);
    }

}

function random(){
    if (!randomRequest.running){
        randomPattern = patternCurrent;
        randomRequest.schedule(25);
        (arguments[0]) ? randomWrite = 1 : randomWrite = 0;
    }
}

function bitbyteUpdate(){
    for(i = 0; i < 7; i++){
        this.patcher.getnamed(clients[i]).message('bitbyte', [bitbytePointer, bitbyteWrite]);
    }
}

function bitbyte(){ 
    if (!bitbyteRequest.running){
        var i = arguments[0];
        i = clamp(i, -255, 255);
        bitbytePointer = i;
        bitbytePattern = patternCurrent;
        bitbyteRequest.schedule(25);
        (arguments[1]) ? bitbyteWrite = 1  : bitbyteWrite = 0;
    }   
}

function leftUpdate(){   
    for(i = 0; i < 7; i++){
        this.patcher.getnamed(clients[i]).message('left', leftWrite);
        }
}

function left(){
    if (!leftRequest.running){ 
        leftRequest.schedule(25);
        (arguments[0]) ? leftWrite = 1 : leftWrite = 0;
    }    
}

function rightUpdate(){   
    for(i = 0; i < 7; i++){
        this.patcher.getnamed(clients[i]).message('right', rightWrite);
    }
}

function right(){
    if (!rightRequest.running) {
        rightRequest.schedule(25);
        (arguments[0]) ? rightWrite = 1 : rightWrite = 0;
    }
}
/*  //  //  //  //  //  //  //  //  //  //  //
COPY PASTE
*/  //  //  //  //  //  //  //  //  //  //  //
function copy(){
    if (!copyRequest.running) {
        copyPattern = arguments[0];
        copyRequest.schedule(25);
    }
}

function copyUpdate(){
    firstCopy = 1;
    for (i = 0; i < 7; i++){
        copySteps[i] = localSteps.get(keyNames[i] + " " + copyPattern);
    }
}

function paste(){
    if (!pasteRequest.running && firstCopy) {
        pastePattern = arguments[0];
        pasteRequest.schedule(25);
        }
        else if (!firstCopy && surfaceSend){
            this.patcher.getnamed('surfaceControl').message('noCopyMess');
    }
}

function pasteUpdate(){
    for (i = 0; i < 7; i++){
        localSteps.replace(keyNames[i] + " " + pastePattern, copySteps[i]);
    }
    var pasteWritePos = pastePattern * 64;
    for (i = 0; i < 7; i++){
        stepsBuf.poke((i + 1), pasteWritePos, copySteps[i]);
    }
    for (i = 0; i < 7; i++){
        this.patcher.getnamed(clients[i]).message('updateState');
    }
    if (!patternMod[pastePattern]){
        patternMod[pastePattern] = 1;
        if (surfaceSend){ 
            sendLight(pastePattern, 1);
            this.patcher.getnamed('surfaceControl').message('copyMess', pastePattern);
        }
        localSteps.replace("Program", patternMod);
    }
    writeSteps();
}

/*  //  //  //  //  //  //  //  //  //  //  //
Surface
*/  //  //  //  //  //  //  //  //  //  //  //
function surfaceSel(){
    surfaceSend = arguments[0]; 
}

function sendPattern(){
    this.patcher.getnamed('surfaceControl').message('updatePattern', patternCurrent);
}

function sendLight(){
    post(arguments)
    this.patcher.getnamed('surfaceControl').message('newSaved', [arguments[0], arguments[1]]);
}

function sendState(){
    this.patcher.getnamed('surfaceControl').message('patternMatrix', patternMod, patternCurrent);
}
/*  //  //  //  //  //  //  //  //  //  //  //
INIT
*/  //  //  //  //  //  //  //  //  //  //  //
function nuclearOption(){
//for init step values
    var initPrgm = new Array(128);
    var initSteps = new Array(64);
        for (i = 0; i < 128; i++){
            //localSteps.setparse(i, '{ "INIT" : 0, "Red" : " ", "Orange" : " ", "Yellow" : " ", "Green" : " ", "Blue" : " ", "Indigo" : " ", "Violet" : " "}');
            initPrgm[i] = 0;
        }
        for (i = 0; i < 64; i++){
            initSteps[i] = 0;
        }
    saveSteps.replace("Program", initPrgm);
        for (i = 0; i < 128; i++){
            for (j= 0; j < 7; j++){
                saveSteps.replace(keyNames[j] + " " + i, initSteps);
            }
        }
        this.patcher.getnamed("localSteps").message('clear');
        this.patcher.getnamed("seqSteps").message('clear');

}

function loadINIT(){
    messnamed('---INITRecall', 'bang');
    //open load gates for transports
    outlet(0, ['transportUI', 'loadGate', 1]);
    outlet(0, ['advTransportUI', 'loadGate', 1]);
    //bang to get values before load
    outlet(0, ['transportUI', 'sendTo', 'Main Transport Bars',  'bang']);
    for (i = 0; i < 7; i++){
        outlet(0, ['advTransportUI', 'sendTo', keyNames[i] + ' Bars',  'bang']);
    }
    requestINIT.schedule(25); //just in case things are running slow
}

function contINIT(){
    for(i = 0; i < 7; i++){
        this.patcher.getnamed(clients[i]).message('updateState', ' ');
    }    
    buffInitUpdate();
    patternMod = localSteps.get("Program");
    //paste_Pntr = firstFlag();
}

function buffInitUpdate(){
    var recall = new Array();
    for(x = 1; x < 8; x++){
        for (y = 0; y < 128; y++){
            var temp = localSteps.get(keyNames[(x - 1)] + " " + y);
                for (z = 0; z < 64; z++){
                    recall.push(temp[z]);
                }
        }
        stepsBuf.poke(x, 0, recall);
		recall = []; //AHAHAHAHAHAHA 
    }
    drawINIT();
}

function drawINIT(){
    //BG
    this.patcher.getnamed('seqBackground').message('bang');
    //Steps
    for(i = 0; i < 7; i++){
        this.patcher.getnamed(clients[i]).message('updateState', ' ');
    }
    //Highlight
    this.patcher.getnamed('seqMarker').message('bang');  
    //just in case
    for(i = 0; i < 7; i++){
        this.patcher.getnamed(clients[i]).message('bang');
    } 
    outlet(0, ['js', 'done', 'Loading']);
}