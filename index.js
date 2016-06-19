"use strict";

var util = require("util");

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

var VBoxLayout = function(param) {
	if(param instanceof Array) {
		VBoxLayout.call(this, {
			itemsCount: function() { return param.length; },
			item: function(item) { return param[item]; }
		});
	}
	else this.callback = param;
}


VBoxLayout.prototype.renderIt = function() {
	var widget = this;

	widget.width = 0;
	widget.height = 0;
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

var HBoxLayout = function(param) {
	if(param instanceof Array) {
		HBoxLayout.call(this, {
			itemsCount: function() { return param.length; },
			item: function(item) { return param[item]; }
		});
	} else this.callback = param;
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

var Label = function(callback) {
	this.callback = callback;
}

Label.prototype.renderIt = function() {
	var widget = this;
	this.height = this.callback.height();
	this.width = this.callback.width();
	return {
		first: function() {
			this.it = 0;
		},
		next: function() {
			this.it++;
		},
		line : function() {
			return widget.callback.render(this.it, widget.width);
		},
		isDone : function() {
			return (this.it >= widget.height);
		}
	}

}

// =======================
// Grid
// =======================

 
var Grid = function(callback) {
	this.topLeftItem = { row: 0, col: 0 };
	this.currentItem = { row: 0, col: 0 };
	this.callback = callback;
}

Grid.prototype.renderIt = function() {
	var widget = this;
	this.width = this.callback.width();
	this.height = this.callback.height();

	return {
		
		first: function() {
			this.it = widget.topLeftItem.row*widget.callback.rowsHeight();
		},
		next: function() {
			this.it++;
		},
		line: function() {
			var row = Math.floor(this.it/widget.callback.rowsHeight()), col, renderWidth = 0, render = "", width = 0;
			for(col = widget.topLeftItem.col ; renderWidth < widget.width && col < widget.callback.colsCount() && row < widget.callback.rowsCount(); col++) {
				width = Math.min(widget.width - renderWidth, widget.callback.colsWidth());
				render += widget.callback.render(
					{ row: row, col: col },
					this.it % widget.callback.rowsHeight(),
					(row === widget.currentItem.row && col === widget.currentItem.col),
					width
				);
				renderWidth += width;
			}
			render += Array(Math.max(0, widget.width - renderWidth) +1).join(' ');
			return render;
		},
		isDone: function() {
			//console.log("%d, %d", widget.height, this.it);
			return (this.it >= widget.topLeftItem.row*widget.callback.rowsHeight() + widget.height);
		}
	}
};


Grid.prototype.moveCurrentItem = function(shift) {
	this.currentItem = {
		row: Math.max(0, Math.min(this.callback.rowsCount() - 1, this.currentItem.row + shift.row)),
		col: Math.max(0, Math.min(this.callback.colsCount() - 1, this.currentItem.col + shift.col))
	};
	this.topLeftItem = { 
		row: Math.max(this.currentItem.row - Math.floor(this.callback.height()/this.callback.rowsHeight()) + 1, Math.min(this.currentItem.row, this.topLeftItem.row)),
		col: Math.max(this.currentItem.col - Math.floor(this.callback.width()/this.callback.colsWidth()) + 1, Math.min(this.currentItem.col, this.topLeftItem.col))
	};
}


Grid.prototype.handleKeyEvent = function(key) {
	if (this.callback.handleKeyEvent && this.callback.handleKeyEvent(key)) { }
	else if(key.compare(cArrowUp) === 0) { this.moveCurrentItem({ row: -1, col: 0}); }
	else if(key.compare(cArrowDown) === 0) { this.moveCurrentItem({row: +1, col: 0}); }
	else if(key.compare(cArrowLeft) === 0) { this.moveCurrentItem({row: 0, col: -1}); }
	else if(key.compare(cArrowRight) === 0) { this.moveCurrentItem({row: 0, col: +1}); }
	else if(key.compare(cHome) === 0) { this.moveCurrentItem({row: 0, col: -Number.MAX_VALUE}); }
	else if(key.compare(cEnd) === 0) { this.moveCurrentItem({row: 0, col: +Number.MAX_VALUE}); }
	else if(key.compare(cPageUp) === 0) { this.moveCurrentItem({row: -Math.floor(this.callback.height()/this.callback.rowsHeight()), col: 0}); }
	else if(key.compare(cPageDown) === 0) { this.moveCurrentItem({row: Math.floor(this.callback.height()/this.callback.rowsHeight()), col: 0}); }
	else if(key.compare(cEnter) === 0) { this.callback.itemSelected(this.currentItem); }
	else return false;
	return true;
}

Grid.prototype.newHScrollBar = function(callback) {
	var widget = this;
	callback.scrollBarValues = function() { return {visibleBeg: widget.topLeftItem.col, visibleCount: Math.floor(widget.callback.width()/widget.callback.colsWidth()), totalCount: widget.callback.colsCount() } }; 
	return new HScrollBar(callback);
};

Grid.prototype.newVScrollBar = function(callback) {
	var widget = this;
	callback.scrollBarValues = function() { return {visibleBeg: widget.topLeftItem.row, visibleCount: Math.floor(widget.callback.height()/widget.callback.rowsHeight()), totalCount: widget.callback.rowsCount() } }; 
	return new VScrollBar(callback);
};



// =======================
// VMenu
// =======================

 
var VMenu = function(callback) {
	var widget = this;
	Grid.apply(this, [{
		width: callback.width,
		height: callback.height,
		colsWidth: callback.width,
		rowsHeight: callback.rowsHeight || function() { return 1; },
		rowsCount: callback.itemsCount,
		itemsCount: callback.itemsCount,
		colsCount: function() { return 1; },
		render: function(item, line, current, width) { return callback.render(item.row, line, current, width, widget.textScrollPos); },
		maxTextScroll: callback.maxTextScroll || function() { return 0; },
		handleKeyEvent: function(key) {
			if (callback.handleKeyEvent && callback.handleKeyEvent(key)) { }
                        else if(key.compare(cArrowLeft) === 0) { widget.textScrollPos = Math.max(0, widget.textScrollPos-1); }
                        else if(key.compare(cArrowRight) === 0) { widget.textScrollPos = Math.min(Math.max(0, widget.callback.maxTextScroll()-widget.callback.width()), widget.textScrollPos+1); }
                        else return false;
                        return true;

		},
		itemSelected: function(item) { return callback.itemSelected(item.row); }
	}]);
	this.textScrollPos = 0;
}
	

VMenu.prototype = new Grid();

VMenu.prototype.newHScrollBar = function(callback) {
	var widget = this;
	callback.scrollBarValues = function() { return {visibleBeg: widget.textScrollPos, visibleCount: widget.callback.width(), totalCount: widget.callback.maxTextScroll() } }; 
	return new HScrollBar(callback);
};
// =======================
// HMenu
// =======================

 
var HMenu = function(callback) {
	var widget = this;
	Grid.apply(this, [{
		width: callback.width,
		height: callback.height,
		colsWidth: callback.colsWidth,
		rowsHeight: callback.height,
		colsCount: callback.itemsCount,
		itemsCount: callback.itemsCount,
		rowsCount: function() { return 1; },
		render: function(item, line, current, width) { return callback.render(item.col, line, current, width, widget.textScrollPos); },
		maxTextScroll: callback.maxTextScroll || function() { return 0; },
		handleKeyEvent: function(key) {
			if (callback.handleKeyEvent && callback.handleKeyEvent(key)) { }
                        else if(key.compare(cArrowUp) === 0) { widget.textScrollPos = Math.max(0, widget.textScrollPos-1); }
                        else if(key.compare(cArrowDown) === 0) { widget.textScrollPos = Math.min(widget.callback.maxTextScroll()-widget.callback.height(), widget.textScrollPos+1); }
                        else return false;
                        return true;

		},
		itemSelected: function(item) { return callback.itemSelected(item.col); }
	}]);
	this.textScrollPos = 0;
}

HMenu.prototype = new Grid();


HMenu.prototype.newVScrollBar = function(callback) {
	var widget = this;
	callback.scrollBarValues = function() { return {visibleBeg: widget.textScrollPos, visibleCount: widget.callback.height(), totalCount: widget.callback.maxTextScroll() } }; 
	return new HScrollBar(callback);
};

// =======================
// VScrollBar
// =======================

 
var VScrollBar = function(callback) {
	this.callback = callback;
}

VScrollBar.prototype.renderIt = function() {
	var widget = this;
	this.width = this.callback.width();
	this.height = this.callback.height();

	return {
		
		first: function() {
			this.it = 0;
			var values = widget.callback.scrollBarValues();
			this.scrollBarInfo = scrollBarInfo(values.visibleBeg, values.visibleCount, values.totalCount, widget.height);

		},
		next: function() {
			this.it++;
		},
		line: function() {
			if(this.it < this.scrollBarInfo.beg)
				return widget.callback.render(-1, this.it, widget.width);
			else if(this.it < this.scrollBarInfo.end)
				return widget.callback.render(0, this.it - this.scrollBarInfo.beg, widget.width)
			else
				return widget.callback.render(1, this.it - this.scrollBarInfo.end, widget.width);
		},
		isDone: function() {
			return (this.it >= widget.height);
		}
	}
};

// =======================
// HScrollBar
// =======================

 
var HScrollBar = function(callback) {
	this.callback = callback;
}

HScrollBar.prototype.renderIt = function() {
	var widget = this;
	this.width = this.callback.width();
	this.height = this.callback.height();

	return {
		
		first: function() {
			this.it = 0;
			var values = widget.callback.scrollBarValues();
			this.scrollBarInfo = scrollBarInfo(values.visibleBeg, values.visibleCount, values.totalCount, widget.width);
			//console.log("-->" + values.visibleBeg + ", " + values.visibleCount + ", " + values.totalCount);
			//console.log("-->" + this.scrollBarInfo.beg + ", " + this.scrollBarInfo.end);
		},
		next: function() {
			this.it++;
		},
		line: function() {
			return widget.callback.render(-1, this.it, this.scrollBarInfo.beg)
				+ widget.callback.render(0, this.it, this.scrollBarInfo.end - this.scrollBarInfo.beg)
				+ widget.callback.render(1, this.it, widget.width - this.scrollBarInfo.end);
		},
		isDone: function() {
			return (this.it >= widget.height);
		}
	}
};

// =======================
// Input
// =======================

var Input = function(text, callback) {
	this.callback = callback;
	this.text = text;
	if(this.text.length === 0) this.text.push("");
	this.cursorPos = {line: 0, col: 0};
	this.topLeftPos = {line: 0, col: 0};
}

Input.prototype.renderIt = function() {
	var widget = this;
	this.width = this.callback.width();
	this.height = this.callback.height();
	return {
		first: function() {
			this.it = widget.topLeftPos.line;
		},
		next: function() {
			this.it++;
		},
		line : function() {
			var render = "";
			if(this.it >= widget.text.length) render = Array(widget.width+1).join(" ");
			else if(widget.cursorPos.line === this.it) {
				render += widget.callback.render(-1, this.it, widget.topLeftPos.col, widget.cursorPos.col - widget.topLeftPos.col);
				render += widget.callback.render(0, this.it, widget.cursorPos.col, 1);
				render += widget.callback.render(+1, this.it, widget.cursorPos.col+1, widget.width -(widget.cursorPos.col+1) + widget.topLeftPos.col );
			}
			else {
				render = widget.callback.render(-1, this.it, widget.topLeftPos.col, widget.width);
			}
			return render;
		},
		isDone : function() {
			return (this.it >= widget.topLeftPos.line + widget.height);
		}
	}

}

Input.prototype.moveCursor = function(shift) {
	this.cursorPos = {
		line: Math.max(0, Math.min(this.cursorPos.line+shift.line, this.text.length-1)),
		col: Math.max(0, Math.min(this.cursorPos.col+shift.col, this.text[this.cursorPos.line].length))
	};
	this.topLeftPos = {
		line: Math.max(this.cursorPos.line + 1 - this.callback.height(), Math.min(this.cursorPos.line, this.topLeftPos.line)),
		col: Math.max(this.cursorPos.col + 1 - this.callback.width(), Math.min(this.cursorPos.col, this.topLeftPos.col))
	};
}

Input.prototype.handleKeyEvent = function(key) {
	var textModified = false;
	if (this.callback.handleKeyEvent && this.callback.handleKeyEvent(key)) { }
	else if(key.compare(cPageUp) === 0) { this.moveCursor({line:-this.height, col:0}); }
	else if(key.compare(cPageDown) === 0) { this.moveCursor({line:this.height, col:0}); }
	else if(key.compare(cArrowUp) === 0) { this.moveCursor({line:-1, col:0}); }
	else if(key.compare(cArrowDown) === 0) { this.moveCursor({line:+1, col:0}); }
	else if(key.compare(cArrowLeft) === 0) { this.moveCursor({line:0, col:-1}); }
	else if(key.compare(cArrowRight) === 0) { this.moveCursor({line:0, col:+1}); }
	else if(key.compare(cHome) === 0) { this.moveCursor({line: 0, col:-Number.MAX_VALUE}); }
	else if(key.compare(cEnd) === 0) { this.moveCursor({line: 0, col:Number.MAX_VALUE}); }
	else if(key == "\u007F") { // backspace
		if(this.cursorPos.col === 0) {
			if(this.cursorPos.line > 0) {
				var line = this.text[this.cursorPos.line];
				this.text.splice(this.cursorPos.line, 1);
				var col = this.text[this.cursorPos.line-1].length;
				this.text[this.cursorPos.line-1] += line;
				this.cursorPos = { line: this.cursorPos.line - 1, col: col };
			}
		} else {
			this.text[this.cursorPos.line] = this.text[this.cursorPos.line].substring(0, Math.max(0, this.cursorPos.col-1))+this.text[this.cursorPos.line].substring(this.cursorPos.col);
			this.moveCursor({ line:0, col:-1});
		}
		textModified = true;
	}
	else if(key.compare(cDelete) === 0) { // delete
		this.text[this.cursorPos.line] = this.text[this.cursorPos.line].substring(0, Math.max(0, this.cursorPos.col))+this.text[this.cursorPos.line].substring(this.cursorPos.col+1);
		textModified = true;
	}
	else if(key >= "\u0020" && key <= "\u007E") { // printable
		if(!this.callback.textMaxCols || this.text[this.cursorPos.line].length < this.callback.textMaxCols()) {
			this.text[this.cursorPos.line] = this.text[this.cursorPos.line].substring(0, Math.max(0, this.cursorPos.col))+key+this.text[this.cursorPos.line].substring(this.cursorPos.col);
			this.moveCursor({ line:0, col:1});
			textModified = true;
		}
	} 
	else if(key.compare(cEnter) === 0) {
		if(!this.callback.textMaxLines || this.text.length < this.callback.textMaxLines()) {
			var newLine = this.text[this.cursorPos.line].substring(this.cursorPos.col);
			this.text[this.cursorPos.line] = this.text[this.cursorPos.line].substring(0, Math.max(0, this.cursorPos.col));
			this.text.splice(this.cursorPos.line+1, 0, newLine); 
			this.moveCursor({ line:1, col:-Number.MAX_VALUE});
			textModified = true;
		}
	}
	else return false;
	if(textModified && this.callback.textModified)
		this.callback.textModified();
	return true;
}

Input.prototype.newHScrollBar = function(callback) {
	var widget = this;
	callback.scrollBarValues = function() {
		var longestTextLine = Math.max.apply(null, widget.text.map( function(item) { return item.length+1; })); // +1 for the cursor
		//console.log("%d, %d, %d", widget.topLeftPos.col, widget.callback.width(), longestTextLine);
		return {visibleBeg: widget.topLeftPos.col, visibleCount: widget.callback.width(), totalCount: longestTextLine };
	}; 
	return new HScrollBar(callback);
};

Input.prototype.newVScrollBar = function(callback) {
	var widget = this;
	callback.scrollBarValues = function() { return {visibleBeg: widget.topLeftItem.row, visibleCount: widget.callback.height(), totalCount: widget.text.length } }; 
	return new VScrollBar(callback);
};
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
	if(this.linesWritten > 0) {
		process.stdout.write("\u001b["+(this.linesWritten-1)+"A");	
		process.stdout.write("\u001b[J");
		this.linesWritten = 0;
	}
}


WidgetContext.prototype.draw = function() {
	if(this.linesWritten > 0) process.stdout.write("\u001b["+(this.linesWritten)+"A");	
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



var scrollBarInfo = function(itemBeg, itemWindow, itemsCount, scrollBarLength) {
	return {
		beg: Math.floor(itemBeg*scrollBarLength/itemsCount),
		end: Math.min(scrollBarLength, Math.floor(itemBeg*scrollBarLength/itemsCount) + Math.ceil(itemWindow*scrollBarLength/itemsCount))
	};
};


module.exports = {
	VMenu: VMenu,
	HMenu: HMenu,
	Label: Label,
	VBoxLayout: VBoxLayout,
	HBoxLayout: HBoxLayout,
	Input: Input,
	WidgetContext: WidgetContext,
	padRight: padRight,
	padRightStop: padRightStop,
	padBoth: padBoth,
	scrollBarInfo: scrollBarInfo,
	VScrollBar: VScrollBar,
	HScrollBar: HScrollBar,
	Grid: Grid
};

