var terminalWidgets = require('../index.js'), chalk = require("chalk");


var widgetContext = new terminalWidgets.WidgetContext();

var uiWidth = function() { return process.stdout.columns; };
var uiHeight = function() { return 30; }
var nostyle = function(str) { return str; };

var grid = new terminalWidgets.Grid({
		height: function() { return Math.max(0, uiHeight()-hScrollBar.callback.height()); },
		width: function() { return Math.max(0, uiWidth()-vScrollBar.callback.width()); },
		colsWidth: function() { return  7 },
		rowsHeight: function() { return 5 },
		rowsCount: function() { return 100; },
		colsCount: function() { return 50; },
		render: function(item, line, current, width) {
			 return (current ? chalk.black.bold.bgGreen : nostyle) (terminalWidgets.padBoth(line === 2 ? (item.row + "," + item.col) : "", width));
		},
		itemSelected: function(item) {
		}
	});


var destination = "";

var vScrollBar = grid.newVScrollBar({
	height: function() { return grid.callback.height(); },
	width: function() { return 2; },
	render: function(component, line, width) {
		return (component === 0 ? chalk.bgBlue : nostyle)(terminalWidgets.padRight("", width));
	}
});


var hScrollBar = grid.newHScrollBar({
	height: function() { return 2; },
	width: function() { return Math.max(0, grid.callback.width()); },
	render: function(component, line, width) {
		return (component === 0 ? chalk.bgBlue : nostyle)(terminalWidgets.padRight("", width));
	}
});

var layout = new terminalWidgets.VBoxLayout ([ 
	new terminalWidgets.HBoxLayout( [ grid, vScrollBar ]),
	hScrollBar
]);

widgetContext.setWidget(layout);
widgetContext.setFocus(grid);

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
process.stdout.on('resize', function() { widgetContext.draw(); });

widgetContext.draw();
        

