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

var names = new Array(7);
var UIs = new Array(7);


//gather fx names for dump request
function fxName(){
    var index = arguments[0];
    var name = arguments[1];
    names[index] = name;
}
//gather fx interface needs for dump request
function fxUI(){
    var index = arguments[0];
    var UI = arguments[1];
    UIs[index] = UI;
}

function dump(){
    for(i = 0; i < 7; i++){
        outlet(0, ['fxName', i, names[i]]);
        outlet(0, ['fxUI', i, UIs[i]]);
    }
}
