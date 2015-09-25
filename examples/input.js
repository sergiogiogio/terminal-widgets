var terminalWidgets = require('../index.js');


var widgetContext = new terminalWidgets.WidgetContext();

var lines = [];
var input = new terminalWidgets.Input(lines, 30, 1) {
		item: function(item, cursorPos, width) {
			var line = terminalWidgets.padRight(lines[item]+" ", width ); // " " is for cursor
			if(cusorPos.line === item)
				line = line.substring(0,cursorPos.column)+chalk.bgGreen(line[cursorPos.column])+line.substring(cursorPos.column+1);
			return line;
		}
	};

widgetContext.setWidget(input);
widgetContext.setFocus(input);

process.stdin.setRawMode(true);
var stdinListener = function() {
	var key = process.stdin.read();
	if(key != null) {
		pressedKey = key;
		if(key.compare(new Buffer([ 3 ])) == 0) process.exit(); 
		widgetContext.handleKeyEvent(key);
		widgetContext.draw();
	}
};
process.stdin.on('readable', stdinListener);

widgetContext.draw();
        

