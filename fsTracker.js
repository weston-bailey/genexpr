//autowatch = 1;

outlets = 2;

var thisTrack_num = 0;
var thisTrack_name;
var thisTrack_id = 'null';
var selTrack_id = 0;
var thisDevice_name;

var liveObj_selTrack;
var liveObj_thisDevice;
var liveObj_thisTrack;

updateDevice = new Task (thisDevice, this);
updateSelTrack = new Task (selTrack, this);

function bang(){
	thisDevice();
	thisTrack();
	selTrack();
	outlet(1, 'bang');
}

//observe selected track
function selTrack() {
	liveObj_selTrack = new LiveAPI(trackSelObs, "live_set", "view");
	liveObj_selTrack.property = "selected_track";
}
//update slected track && schedule device check
function trackSelObs(args){
	selTrack_id = args[2];
	//updateDevice.schedule(20);
	hasMoved(1);
}

function thisDevice() {
	liveObj_thisDevice = new LiveAPI("this_device");
	//checkThisDevice();
}

function checkThisDevice(){
	track_num = liveObj_thisDevice.path.split(" "); 
	thisTrack_num = parseInt(track_num[2]);
	thisDevice_name = liveObj_thisDevice.get("name");
}

function thisTrack(){
	liveObj_thisTrack = new LiveAPI();
	liveObj_thisTrack.path = ["live_set", "tracks", thisTrack_num];
	thisTrack_id = liveObj_thisTrack.id;
	thisTrack_name = liveObj_thisTrack.get("name");
}
//chack device update current track number name and id and call a comparison of ids
//maybe not do all this crap each time?
function hasMoved() {
	checkThisDevice();
	liveObj_thisTrack.path = ["live_set", "tracks", thisTrack_num];
	//only proceed if the device has not moved, otherwise update and restart
	if (thisTrack_id != liveObj_thisTrack.id){
		//printf(' device has moved! ' + ' assumed name/id ' + thisTrack_name + " " + thisTrack_id 
		//+ ' observed name/id ' + liveObj_thisTrack.id + " " +liveObj_thisTrack.get("name"));
		thisTrack_id = liveObj_thisTrack.id;
		thisTrack_name = liveObj_thisTrack.get("name");
		checkThisDevice();
		//trackCheck();
		}
		else{
			//trackCheck();
			//printf('has not moved proceeding to check selcted track');
	}
	if (arguments[0]) trackCheck(1);
	//thisTrack_name =liveObj.get("name");
	//printf(thisTrack_name);
	//trackCheck();
}

function trackCheck(){
    if(arguments[0]){
		var check = thisTrack_id == selTrack_id;
		(check) ? check = 1 : check = 0;
		outlet(0, ["trackSel", check]);
		outlet(0, ["thisTrack", thisTrack_num]);
	}
}
/*
red: 16725558
orange: 16753961 
yellow: 16773172 
green: 1769263 
blue: 1698303 
indigo: 11958214 
violet: 16726484 
*/ 

function newTrack(){
	hasMoved(0);
    var newT = thisTrack_num + 1;
	var colors = [16725558, 16753961, 16773172, 
					1769263, 1698303, 11958214, 16726484]; 
	var liveObj = new LiveAPI("live_set");
	//liveObj.call(["delete_track", newT]);
	//for unique track name
	var tracks = liveObj.get("tracks");
	tracks = Math.floor(tracks.length * .5) + 1;
	//make tracks
	liveObj.call(["create_audio_track", newT]);
	//liveObj.path = ["live_set", "tracks", thisTrack_num]; //maybe don't need
	//newT = (newT + liveObj.get("is_grouped"));
	liveObj.path = ["live_set", "tracks", newT]; //goto new track and set it up
	liveObj.set("color", colors[arguments[0]]);
	liveObj.set("name",tracks + " FS " + arguments[1] + " " + arguments[2]);
	//for routing dicts
	//input
	
	var routing = liveObj.get("available_input_routing_types"); //get types
	var type;
	if (arguments[1] == "From" || arguments[1] == "Loop"){
		routing = JSON.parse(routing); //de-string
		for (i = 0; i < routing.available_input_routing_types.length; i++){ //iterate and look for match
			var obj = routing.available_input_routing_types[i];
			if (obj.display_name == thisTrack_name) type = routing.available_input_routing_types[i];
		}
		liveObj.set("input_routing_type", type); //set
		//do it again	
		routing = liveObj.get("available_input_routing_channels");
		routing = JSON.parse(routing);
			for (i = 0; i < routing.available_input_routing_channels.length; i++){
			var obj = routing.available_input_routing_channels[i];
			if (obj.display_name == arguments[2] + '-' + thisDevice_name) type = routing.available_input_routing_channels[i];
		}
		liveObj.set("input_routing_channel", type);
		liveObj.set("current_monitoring_state", 0);
	}
	if (arguments[1] == "To" || arguments[1] == "Loop"){
		routing = liveObj.get("available_output_routing_types");
		routing = JSON.parse(routing); //de-string
		for (i = 0; i < routing.available_output_routing_types.length; i++){ //iterate and look for match
			var obj = routing.available_output_routing_types[i];
			if (obj.display_name == thisTrack_name) type = routing.available_output_routing_types[i];
		}

		liveObj.set("output_routing_type", type); //set
		//do it again	
		routing = liveObj.get("available_output_routing_channels");
		routing = JSON.parse(routing);
			for (i = 0; i < routing.available_output_routing_channels.length; i++){
			var obj = routing.available_output_routing_channels[i];
			if (obj.display_name == arguments[2] + '-' + thisDevice_name) type = routing.available_output_routing_channels[i];
		}
		liveObj.set("output_routing_channel", type);
	}
}
