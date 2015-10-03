var terminalWidgets = require('../index.js'), chalk = require("chalk");

var uiWidth = function () { return process.stdout.columns };

var widgetContext = new terminalWidgets.WidgetContext();

var lines = [];
var input = new terminalWidgets.Input(lines, {
		width: function() { return Math.floor(uiWidth()/2); },
		height: function() { return 4; },
		maxColumns: function() { return 200; },
		maxLines: function() { return 20; },
		item: function(line, cursorColumn, width, hScrollPos) {
			var line = terminalWidgets.padRight(line, width, hScrollPos);
			if(cursorColumn >= 0 && (cursorColumn-hScrollPos) < line.length)
				line = line.substring(0, cursorColumn-hScrollPos) + chalk.bgBlue(line[cursorColumn-hScrollPos]) + line.substring(cursorColumn-hScrollPos+1);
			return line;
		}
	});
var label = new terminalWidgets.Label({
		width: function() { return Math.floor(uiWidth()/2); },
		height: function() { return 1; },
		item: function(item, width) {
			return terminalWidgets.padRight("line:" + (input.cursorPos.line+1) + "/" + lines.length  + ", col:" + (input.cursorPos.column+1), width);
		}
	});

var hScrollBar = new terminalWidgets.HScrollBar({
        height: function() { return 1; },
        width: function() { return input.callback.width(); },
        scrollBarInfo: function(size) {
                return terminalWidgets.scrollBarInfo(input.hScrollPos, input.callback.width(), input.callback.maxColumns(), size);
        },
        item: function(beg, end, width) {
                return terminalWidgets.padRight("", beg) + chalk.bgGreen(terminalWidgets.padRight("", end-beg)) + terminalWidgets.padRight("", width-end);
        }
});


var layoutWidgets = [ input, hScrollBar, label ];
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
process.stdout.on('resize', function() { widgetContext.clear(); input.moveCursor({line: 0, column: 0}); widgetContext.draw(); });

widgetContext.draw();
        

