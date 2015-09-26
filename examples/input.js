var terminalWidgets = require('../index.js'), chalk = require("chalk");


var widgetContext = new terminalWidgets.WidgetContext();

var input = new terminalWidgets.Input(30, 4, {
		maxColumns: function() { return 50; },
		maxLines: function() { return 20; },
		item: function(line, cursorColumn, width, hScrollPos) {
			var line = terminalWidgets.padRight(line, width, hScrollPos);
			if(cursorColumn >= 0)
				line = line.substring(0, cursorColumn-hScrollPos) + chalk.bgBlue(line[cursorColumn-hScrollPos]) + line.substring(cursorColumn-hScrollPos+1);
			return line;
		}
	});
var label = new terminalWidgets.Label(30,1, {
		item: function(item, width) {
			return terminalWidgets.padRight("line:" + (input.cursorPos.line+1) + ", col:" + (input.cursorPos.column+1), width);
		}
	});

var layoutWidgets = [ input, label ];
var layout = new terminalWidgets.VBoxLayout({
	itemsCount: function() { return layoutWidgets.length; },
	item: function(item) { return layoutWidgets[item]; }
});


widgetContext.setWidget(layout);
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
        

