"use strict";

var cETX = new Buffer([ 3 ]);
var cEnter = new Buffer([ 13 ]);
var cArrowUp = new Buffer( [27, 91, 65] );
var cArrowDown = new Buffer( [27, 91, 66] );
var cArrowLeft = new Buffer( [27, 91, 68] );
var cArrowRight = new Buffer( [27, 91, 67] );
var cHome = new Buffer( [27, 79, 72] );
var cEnd = new Buffer( [27, 79, 70] );
var cPageUp = new Buffer( [27, 91, 53, 126] );
var cPageDown = new Buffer( [27, 91, 54, 126] );
var cDelete = new Buffer( [27, 91, 51, 126] ) // '\u001b[3~';

// =======================
// VBoxLayout
// =======================

var VBoxLayout = function(callback) {
	this.callback = callback;
}

VBoxLayout.prototype.renderIt = function() {
	var widget = this;

	widget.width = widget.height = 0;
	for(var i = 0 ; i < widget.callback.itemsCount() ; ++i) {
		widget.callback.item(i).renderIt();
		widget.width = Math.max(widget.width, widget.callback.item(i).width);
		widget.height += widget.callback.item(i).height;
	}

	return {
		first: function() {
			this.widgetIt = -1;
			this.widgetRenderIt = {
				next: function() {},
				isDone: function() { return true; }
			};
			this.next();
		},
		next: function() {
			this.widgetRenderIt.next();
			while(this.widgetRenderIt.isDone() && this.widgetIt < widget.callback.itemsCount() - 1) {
				this.widgetRenderIt = widget.callback.item(++this.widgetIt).renderIt();
				this.widgetRenderIt.first();
			}
		},
		line: function() {
			return this.widgetRenderIt.line();
		},
		isDone: function() {
			return (this.widgetIt === widget.callback.itemsCount() - 1 && this.widgetRenderIt.isDone());
		}
	}

}

// =======================
// HBoxLayout
// =======================

var HBoxLayout = function(callback) {
	this.callback = callback;
}

HBoxLayout.prototype.renderIt = function() {
	var widget = this;

	widget.width = widget.height = 0;
	for(var i = 0 ; i < widget.callback.itemsCount() ; ++i) {
		widget.callback.item(i).renderIt();
		widget.width += widget.callback.item(i).width;
		widget.height = Math.max(widget.height, widget.callback.item(i).height);
	}

	return {
		first: function() {
			this.widgetItArray = Array(widget.callback.itemsCount());
			for(var i = 0 ; i < widget.callback.itemsCount() ; ++i) {
				this.widgetItArray[i] = widget.callback.item(i).renderIt();
				this.widgetItArray[i].first();
			}
		},
		next: function() {
			this.widgetItArray.map( function(widgetIt) { if(!widgetIt.isDone()) widgetIt.next();  } );
		},
		line: function() {
			var line = "";
			for(var i = 0 ; i < this.widgetItArray.length ; ++i) {
				var widgetIt = this.widgetItArray[i];
				var widgetLine = (widgetIt.isDone() ? Array(widget.callback.item(i).width + 1).join(" ") : widgetIt.line());
				line += widgetLine;
			}
			return line;
		},
		isDone: function() {
			return this.widgetItArray.every( function(widgetIt) { return widgetIt.isDone();  } );
		}
	}

}

// =======================
// Label
// =======================

var Label = function(width, height, callback) {
	this.width = width;
	this.height = height;
	this.callback = callback;
}

Label.prototype.renderIt = function() {
	var widget = this;
	return {
		first: function() {
			this.it = 0;
		},
		next: function() {
			this.it++;
		},
		line : function() {
			return widget.callback.item(this.it, widget.width);
		},
		isDone : function() {
			return (this.it >= widget.height);
		}
	}

}

// =======================
// Menu
// =======================

 
var Menu = function(width, height, callback) {
	this.width = width;
	this.height = height;
	this.topItem = 0;
	this.currentItem = 0;
	this.hScrollPos = 0;
	this.callback = callback;
}

Menu.prototype.vScrollbarPos = function(currentItem, itemsCount, windowSize) {
	var 	pos = Math.floor(currentItem*windowSize/itemsCount),
		size = Math.max(1, Math.min(windowSize, Math.floor(windowSize * windowSize/itemsCount))),
		start = Math.max(0, Math.min(pos - Math.floor(size/2), windowSize-size));
	return { start: start, end: start+size };
}


Menu.prototype.hScrollbarPos = function(currentItem, itemsCount, windowSize) {
	var 	pos = Math.floor(currentItem*windowSize/itemsCount),
		size = Math.max(1, Math.min(windowSize, Math.ceil(windowSize * windowSize/itemsCount))),
		start = pos;
	return { start: start, end: start+size };
}

Menu.prototype.renderIt = function() {
	var widget = this;

	return {
		
		first: function() {
			this.it = 0;
			this.hScrollBarHeight = (widget.callback.scrollWidth() > 0 ) ? 1 : 0;
			this.vScrollbarPos = widget.vScrollbarPos(widget.currentItem, widget.callback.itemsCount(), widget.height-this.hScrollBarHeight);
			this.vScrollBarWidth = (widget.height-this.hScrollBarHeight < widget.callback.itemsCount() ) ? 1 : 0;
		},
		next: function() {
			this.it++;
		},
		line: function() {
			if(this.it < widget.height-this.hScrollBarHeight) {
				var vScroll = 	(this.vScrollBarWidth === 0) ? "" :  (
						(this.it >= this.vScrollbarPos.start && this.it < this.vScrollbarPos.end) ? "\u001b[47m \u001b[39;49m" : 
						" ");
				var item = ((this.it + widget.topItem) < widget.callback.itemsCount()) ? widget.callback.item(this.it + widget.topItem, this.it + widget.topItem === widget.currentItem, widget.width - this.vScrollBarWidth, widget.hScrollPos) : Array(widget.width+1-this.vScrollBarWidth).join(' ');
				return item + vScroll;
			}
			if(this.hScrollBarHeight > 0) {
				var hScrollbarPos = widget.hScrollbarPos(widget.hScrollPos, widget.callback.scrollWidth(), (widget.width-this.vScrollBarWidth));
				return Array(hScrollbarPos.start+1).join(' ') + "\u001b[47m" + Array(hScrollbarPos.end-hScrollbarPos.start+1).join(' ') + "\u001b[39;49m" + Array((widget.width-this.vScrollBarWidth) - hScrollbarPos.end + 1).join(' ') + " ";
			}
		},
		isDone: function() {
			return (this.it >= widget.height);
		}
	}
};


Menu.prototype.shiftVCursor = function(shift) {
	var hScrollBarHeight = (this.callback.scrollWidth() > 0 ) ? 1 : 0;
	this.currentItem = Math.max(0, Math.min(this.callback.itemsCount() - 1, this.currentItem + shift)); 
	this.topItem = Math.max(0, Math.min(this.callback.itemsCount() - (this.height-hScrollBarHeight), this.currentItem - Math.floor((this.height-hScrollBarHeight)/2)));
}

Menu.prototype.shiftHScroll = function(shift) {
	var hScrollBarHeight = (this.callback.scrollWidth() > 0 ) ? 1 : 0;
	var vScrollBarWidth = (this.height-hScrollBarHeight < this.callback.itemsCount() ) ? 1 : 0;
	this.hScrollPos = Math.max(0, Math.min(this.callback.scrollWidth() - this.width + vScrollBarWidth, this.hScrollPos + shift)); 
}

Menu.prototype.handleKeyEvent = function(key) {
	var hScrollBarHeight = (this.callback.scrollWidth() > 0 ) ? 1 : 0;
	if (this.callback.handleKeyEvent && this.callback.handleKeyEvent(key)) { }
	else if(key.compare(cArrowUp) === 0) { this.shiftVCursor(-1); }
	else if(key.compare(cArrowDown) === 0) { this.shiftVCursor(+1); }
	else if(key.compare(cArrowLeft) === 0) { this.shiftHScroll(-1); }
	else if(key.compare(cArrowRight) === 0) { this.shiftHScroll(+1); }
	else if(key.compare(cHome) === 0) { this.shiftVCursor(-Number.MAX_VALUE); }
	else if(key.compare(cEnd) === 0) { this.shiftVCursor(Number.MAX_VALUE); }
	else if(key.compare(cPageUp) === 0) { this.shiftVCursor(-this.height+hScrollBarHeight); }
	else if(key.compare(cPageDown) === 0) { this.shiftVCursor(this.height-hScrollBarHeight); }
	else if(key.compare(cEnter) === 0) { this.callback.itemSelected(this.currentItem); }
	else return false;
	return true;
}

// =======================
// Input
// =======================

var Input = function(width, height, callback) {
	this.width = width;
	this.height = height;
	this.callback = callback;
	this.lines = [ "" ];
	this.cursorPos = {line: 0, column: 0};
	this.topLine = 0;
	this.hScrollPos = 0;
}

Input.prototype.setLines = function(lines) {
	this.lines = lines;
}

Input.prototype.renderIt = function() {
	var widget = this;
	return {
		first: function() {
			this.it = widget.topLine;
		},
		next: function() {
			this.it++;
		},
		line : function() {
			return (this.it < widget.lines.length) ? widget.callback.item(widget.lines[this.it], (widget.cursorPos.line === this.it) ? widget.cursorPos.column : undefined, widget.width, widget.hScrollPos) : Array(widget.width+1).join(" ");
		},
		isDone : function() {
			return (this.it >= widget.topLine + widget.height);
		}
	}

}

Input.prototype.moveCursor = function(shift) {
	this.cursorPos.line = Math.max(0, Math.min(this.cursorPos.line+shift.line, this.lines.length-1));
	this.cursorPos.column = Math.max(0, Math.min(this.cursorPos.column+shift.column, this.lines[this.cursorPos.line].length));
	this.topLine = Math.max(this.cursorPos.line + 1 - this.height, Math.min(this.cursorPos.line, this.topLine));
	this.hScrollPos = Math.max(this.cursorPos.column + 1 - this.width, Math.min(this.cursorPos.column, this.hScrollPos));
}

Input.prototype.handleKeyEvent = function(key) {
	var textModified = false;
	if (this.callback.handleKeyEvent && this.callback.handleKeyEvent(key)) { }
	else if(key.compare(cPageUp) === 0) { this.moveCursor({line:-this.height, column:0}); }
	else if(key.compare(cPageDown) === 0) { this.moveCursor({line:this.height, column:0}); }
	else if(key.compare(cArrowUp) === 0) { this.moveCursor({line:-1, column:0}); }
	else if(key.compare(cArrowDown) === 0) { this.moveCursor({line:+1, column:0}); }
	else if(key.compare(cArrowLeft) === 0) { this.moveCursor({line:0, column:-1}); }
	else if(key.compare(cArrowRight) === 0) { this.moveCursor({line:0, column:+1}); }
	else if(key.compare(cHome) === 0) { this.moveCursor({line: 0, column:-Number.MAX_VALUE}); }
	else if(key.compare(cEnd) === 0) { this.moveCursor({line: 0, column:Number.MAX_VALUE}); }
	else if(key == "\u007F") { // backspace
		this.lines[this.cursorPos.line] = this.lines[this.cursorPos.line].substring(0, Math.max(0, this.cursorPos.column-1))+this.lines[this.cursorPos.line].substring(this.cursorPos.column);
		this.moveCursor({ line:0, column:-1});
		textModified = true;
	}
	else if(key.compare(cDelete) === 0) { // delete
		this.lines[this.cursorPos.line] = this.lines[this.cursorPos.line].substring(0, Math.max(0, this.cursorPos.column))+this.lines[this.cursorPos.line].substring(this.cursorPos.column+1);
		textModified = true;
	}
	else if(key >= "\u0020" && key <= "\u007E") { // printable
		if(!this.callback.maxColumns || this.lines[this.cursorPos.line].length < this.callback.maxColumns()) {
			this.lines[this.cursorPos.line] = this.lines[this.cursorPos.line].substring(0, Math.max(0, this.cursorPos.column))+key+this.lines[this.cursorPos.line].substring(this.cursorPos.column);
			this.moveCursor({ line:0, column:1});
			textModified = true;
		}
	} 
	else if(key.compare(cEnter) === 0) {
		if(!this.callback.maxLines || this.lines.length < this.callback.maxLines()) {
			var newLine = this.lines[this.cursorPos.line].substring(this.cursorPos.column);
			this.lines[this.cursorPos.line] = this.lines[this.cursorPos.line].substring(0, Math.max(0, this.cursorPos.column));
			this.lines.splice(this.cursorPos.line+1, 0, newLine); 
			this.moveCursor({ line:1, column:-Number.MAX_VALUE});
			textModified = true;
		}
	}
	else return false;
	if(textModified && this.callback.textModified)
		this.callback.textModified();
	return true;
}

// =======================
// Render
// =======================

var renderWidget = function(widget) {
	var it = widget.renderIt();
	var linesWritten = 0;
	for( it.first() ; !it.isDone() ; it.next() ) {
		console.log(it.line());
		linesWritten++;
	}
	//console.log("written " + linesWritten);
	return linesWritten;
}


// =======================
// WidgetContext
// =======================

var WidgetContext = function() {
	this.linesWritten = 0;
}

WidgetContext.prototype.setWidget = function(widget, replace) {
	this.widget = widget;
	if(!replace) this.linesWritten = 0;
}

WidgetContext.prototype.setFocus = function(widget) {
	this.focusedWidget = widget;
}

WidgetContext.prototype.handleKeyEvent = function(key) {
	return this.focusedWidget.handleKeyEvent(key);
}

WidgetContext.prototype.clear = function() {
	console.log("\u001b["+(this.linesWritten+1)+"A");	
	console.log("\u001b[D");	
}



WidgetContext.prototype.draw = function() {
	console.log("\u001b["+(this.linesWritten+1)+"A");	
	this.linesWritten = renderWidget(this.widget);
}

// =======
// Pad
// =======

var padRightStop = function(str, width, hScroll, padChar) {
	if(padChar === undefined) padChar = ' ';
	if(hScroll === undefined) hScroll = 0;
	var start = Math.max(0, Math.min(str.length - width, hScroll));
	return str.substr(start, width) + Array(Math.max(0, width - Math.min(width, str.length - start) + 1)).join(padChar);
}

var padBoth = function(str, width, padChar) {
	if(padChar === undefined) padChar = ' ';
	var frontPadWidth = Math.max(0, Math.floor((width-str.length)/2));
	return Array(frontPadWidth+1).join(padChar) + str.substr(0, width) + Array(width - Math.min(width, str.length) - frontPadWidth + 1).join(padChar);
}

var padRight = function(str, width, hScroll, padChar) {
	if(padChar === undefined) padChar = ' ';
	if(hScroll === undefined) hScroll = 0;
	return str.substr(hScroll, width) + Array(width - Math.max(0, Math.min(width, str.length - hScroll)) + 1).join(padChar);
}

module.exports = {
	Menu: Menu,
	Label: Label,
	VBoxLayout: VBoxLayout,
	HBoxLayout: HBoxLayout,
	Input: Input,
	WidgetContext: WidgetContext,
	padRight: padRight,
	padRightStop: padRightStop,
	padBoth: padBoth
	
};

