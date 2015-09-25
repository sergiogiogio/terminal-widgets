var terminalWidgets = require('../index.js'),
	util = require("util");


var widgetContext = new terminalWidgets.WidgetContext();

// ==========
// Layout 1
// ==========
var label1 = new terminalWidgets.Label(30, 1, {
		item: function(item, width) {
			return terminalWidgets.padBoth( "=== " + (new Date()).toLocaleString() + " ===", width);
		}
	});

var menu = new terminalWidgets.Menu(30, 10, {
		itemsCount: function() { return 15; },
		scrollWidth: function() { return 100; },
		item: function(item, current, width, hScroll) {
			 return terminalWidgets.padBoth( (current ? ">" : " ") + "item #" + item, width );
		},
		itemSelected: function() { widgetContext.setWidget(layout2, false); widgetContext.setFocus(menu2);  }
	});

var pressedKey = null;
var label2 = new terminalWidgets.Label(30, 1, {
	item: function(item, width) {
		return terminalWidgets.padBoth("=== Key: " + util.inspect(pressedKey) + " ===", width);
	}
	});

var layout1Widgets = [ label1, menu, label2 ];
var layout1 = new terminalWidgets.VBoxLayout({
		itemsCount: function() { return layout1Widgets.length; },
		item: function(item) { return layout1Widgets[item]; }
	});



// ==========
// Layout 2 
// ==========
var menu2 = new terminalWidgets.Menu(30, 10, {
		itemsCount: function() { return 15; },
		scrollWidth: function() { return 100; },
		item: function(item, current, width, hScroll) {
			 return (current ? "#" : " ") + terminalWidgets.padRight("menu2 item #" + item, width); 
		},
		itemSelected: function() { process.exit(); }
	});

var layout2Widgets = [ label1, menu2, label2 ];
var layout2 = new terminalWidgets.VBoxLayout({
		itemsCount: function() { return layout2Widgets.length; },
		item: function(item) { return layout2Widgets[item]; }
	});


widgetContext.setWidget(layout1);
widgetContext.setFocus(menu);

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

var timer = setInterval(function() {
		widgetContext.draw();
	}, 1000);

widgetContext.draw();
        

