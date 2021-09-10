// save as livecode.js

var filename = "livecode.genexpr";

function bang() {
	sourcefile = new File(filename);
	sourcefile.open();
	var code = sourcefile.readstring(sourcefile.eof);
	outlet(0, "expr", code);
	sourcefile.close();
}
