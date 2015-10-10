var terminalWidgets = require('../index.js'), chalk = require("chalk");

var uiWidth = function () { return process.stdout.columns };
var uiHeight = function() { return 5; };

var nostyle = function(item) { return item; }
var widgetContext = new terminalWidgets.WidgetContext();

var text = [];
var input = new terminalWidgets.Input(text, {
		width: function() { return Math.floor(uiWidth()/2); },
		height: function() { return 4; },
		textMaxCols: function() { return 200; },
		textMaxLines: function() { return 20; },
		render: function(component, line, start, width) {
			//console.log("%d, %d, %d, %d", component, line, start, width);
			return (component === 0 ? chalk.bgGreen : nostyle)(terminalWidgets.padRight(text[line].substr(start, width), width));
		}
	});
var label = new terminalWidgets.Label({
		width: function() { return Math.floor(uiWidth()/2); },
		height: function() { return 1; },
		render: function(line, width) {
			return terminalWidgets.padRight("line:" + (input.cursorPos.line+1) + "/" + text.length  + ", col:" + (input.cursorPos.col+1), width);
		}
	});

var hScrollBar = input.newHScrollBar({
        height: function() { return 1; },
        width: function() { return input.callback.width(); },
        render: function(component, line, width) {
                return (component === 0 ? chalk.bgBlue : nostyle)(terminalWidgets.padRight("", width));
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
        

