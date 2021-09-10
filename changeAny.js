//filter repetitions of anything regardless of type or length
var prev = 'null';

function changeAny(){
    var incoming = new Array();
        for (i = 0; i < arguments.length; i ++){
            incoming[i] = arguments[i];
        }
    stringy = incoming.toString();
    if (prev != stringy) outlet(0, incoming);
    prev = stringy;
}