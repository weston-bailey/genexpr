/* message format:
[sendTo, 'Name', method(), value0]
    ^       ^       ^        ^ Value to Send
    ^       ^       ^ Object's method
    ^       ^ Scritping name of Object
    ^ Call the Fucntion  
&*/
function sendTo(){
    var message = new Array();
    for(var i = 2, len = arguments.length; i < len; i++){
        var temp = arguments[i];
        message.push(temp); 
    }
    this.patcher.getnamed(arguments[0]).message(arguments[1], message);
}