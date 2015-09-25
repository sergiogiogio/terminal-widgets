var terminalWidgets = require('../index.js'), chalk = require("chalk");


var widgetContext = new terminalWidgets.WidgetContext();



var menuItems = [ "Russia", "Ukraine", "France", "Spain", "Sweden", "Germany", "Finland", "Norway", "Poland", "Italy", "United Kingdom", "Romania", "Belarus", "Kazakhstan*", "Greece", "Bulgaria", "Iceland", "Hungary", "Portugal", "Azerbaijan", "Ireland", "Austria", "Czech Republic", "Serbia", "Georgia", "Lithuania", "Latvia", "Croatia", "Bosnia and Herzegovina", "Slovakia", "Estonia", "Denmark", "Netherlands", "Switzerland", "Moldova", "Belgium", "Armenia", "Albania", "Republic of Macedonia", "Turkey*", "Slovenia", "Montenegro", "Cyprus", "Luxembourg", "Andorra", "Malta", "Liechtenstein", "San Marino", "Monaco", "Vatican City" ];
var menu = new terminalWidgets.Menu(30, 10, {
		itemsCount: function() { return menuItems.length; },
		scrollWidth: function() { return 0; },
		item: function(item, current, width, hScroll) {
			 return (current ? chalk.black.bold.bgGreen : chalk.white.bgBlack) (terminalWidgets.padBoth(menuItems[item], width));
		},
		itemSelected: function(item) {
			console.log("Selected: " + menuItems[item]);
			process.exit();
		}
	});

widgetContext.setWidget(menu);
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

widgetContext.draw();
        

