var terminalWidgets = require('../index.js'), chalk = require("chalk");


var widgetContext = new terminalWidgets.WidgetContext();

var uiWidth = function() { return process.stdout.columns; };

var menuItems = [ "Russia", "Ukraine", "France", "Spain", "Sweden", "Germany", "Finland", "Norway", "Poland", "Italy", "United Kingdom", "Romania", "Belarus", "Kazakhstan*", "Greece", "Bulgaria", "Iceland", "Hungary", "Portugal", "Azerbaijan", "Ireland", "Austria", "Czech Republic", "Serbia", "Georgia", "Lithuania", "Latvia", "Croatia", "Bosnia and Herzegovina", "Slovakia", "Estonia", "Denmark", "Netherlands", "Switzerland", "Moldova", "Belgium", "Armenia", "Albania", "Republic of Macedonia", "Turkey*", "Slovenia", "Montenegro", "Cyprus", "Luxembourg", "Andorra", "Malta", "Liechtenstein", "San Marino", "Monaco", "Vatican City" ];
var menu = new terminalWidgets.VMenu({
		height: function() { return 10; },
		width: function() { return Math.max(0, uiWidth() - vScrollBar.callback.width()); },
		rowsHeight: function() { return 1; },
		itemsCount: function() { return menuItems.length; },
		maxTextScroll: function() { return 0; },
		render: function(row, line, current, width) {
			 return (current ? chalk.black.bold.bgGreen : chalk.white.bgBlack) (terminalWidgets.padBoth(menuItems[row], width));
		},
		itemSelected: function(item) {
			destination = menuItems[item];
			widgetContext.setFocus(confirmMenu);
		}
	});

var nostyle = function(str) { return str; };

var destination = "";

var vScrollBar = menu.newVScrollBar({
        height: function() { return menu.callback.height(); },
        width: function() { return 2; },
        render: function(component, line, width) {
                return (component === 0 ? chalk.bgBlue : nostyle)(terminalWidgets.padRight("", width));
        }
});


var hScrollBar = menu.newHScrollBar({
        height: function() { return 2; },
        width: function() { return Math.max(0, menu.callback.width()); },
        render: function(component, line, width) {
                return (component === 0 ? chalk.bgBlue : nostyle)(terminalWidgets.padRight("", width));
        }
});

var confirmMenuItems = [ "Yes", "No", "Maybe", "Probably", "Possibly", "Perhaps" ];
var confirmMenu = new terminalWidgets.HMenu({
		height: function() { return (widgetContext.focusedWidget === confirmMenu) ? 1 : 0; },
		width: function() { return Math.floor(uiWidth()*70/100); },
		itemsCount: function() { return confirmMenuItems.length; },
		colsWidth: function() { return Math.floor(confirmMenu.callback.width()/3); },
		maxTextScroll: function() { return 0; },
		render: function(col, line, current, width) {
			 return (current ? chalk.black.bold.bgGreen : chalk.white.bgBlack) (terminalWidgets.padBoth(confirmMenuItems[col], width));
		},
		itemSelected: function(item) {
			if(confirmMenuItems[item] == "Yes") { 
				console.log("Selected: " + destination);
				process.exit();
			} else {
				widgetContext.setFocus(menu);
				widgetContext.clear();
			}
		}
	});


var hConfirmMenuScrollBar = confirmMenu.newHScrollBar({
        height: function() { return confirmMenu.callback.height() > 0 ? 2 : 0; },
        width: function() { return Math.max(0, confirmMenu.callback.width()); },
        render: function(component, line, width) {
                return (component === 0 ? chalk.bgBlue : nostyle)(terminalWidgets.padRight("", width));
        }
});

var confirmLabel = new terminalWidgets.Label({
		height: function() { return (widgetContext.focusedWidget === confirmMenu) ? 1 : 0; },
		width: function() { return Math.floor(uiWidth()*30/100); },
		render: function(line, width) {
			return terminalWidgets.padRight("Going to " + destination + "?", width);
		}
});

var layout = new terminalWidgets.VBoxLayout ([ 
	new terminalWidgets.HBoxLayout( [ menu, vScrollBar ]),
	new terminalWidgets.HBoxLayout( [ confirmLabel, 
		new terminalWidgets.VBoxLayout( [confirmMenu, hConfirmMenuScrollBar ])
	])
]);

widgetContext.setWidget(layout);
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
process.stdout.on('resize', function() { widgetContext.draw(); });

widgetContext.draw();
        

