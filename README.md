# terminal-widgets

Simple widgets for the terminal where content and behavior are controlled by callbacks(hence can be updated while the UI is running).
* Label
* Menu (with scrollbars)
* Input (text input)
* HBoxLayout (crate horizontal layout with multiple widgets)
* vBoxLayout (crate vertical layout with multiple widgets)

# example

A simple clock implemented as a Label refreshed via timer

``` js
var tw = require("terminal-widgets");

var context = new tw.WidgetContext();

var label = new tw.Label({
	width: function() { return 50; },
	height: function() { return 1; },
	item: function(line, width) {
		return tw.padBoth(String(new Date()), width);
	}
});

context.setWidget(label);
context.draw();

setInterval(function() { context.draw(); }, 1000);
```

# Common principles
Widgets are defined by a set of callback functions. The calling program typically does not set the state of the widget, instead the callback functions return the state when called.

The UI (drawing and input) is controlled by a WidgetContext object. The main widget must be selected in the WidgetContext before drawing.

The location of widgets on the screen cannot be precisely controlled (only their sizes). Use VBoxLayout and HBoxLayout to display widgets one on top of each other or side by side.

The callbacks *must* return text of the correct size (width). The functions padBoth, padRight and padRightStop can be used for this purpose. The callbacks can also style the text (e.g. use colors) but the result must fit in the width parameter provided.

No styling is provided by default - not even the current item in a Menu widget or the cursor in an Input widget. These stylings must be done in the callbacks, refer to examples for possible solutions.

The framework does not include an input loop, you will need to provide one yourself following the below sample:
``` js
process.stdin.setRawMode(true);
var stdinListener = function() {
        var key = process.stdin.read();
        if(key != null) {
                if(key == "\x03") process.exit();
                else widgetContext.handleKeyEvent(key);
                context.draw();
        }
};
process.stdin.on('readable', stdinListener);
context.draw();
```

The Widgets support dynamic layout (i.e. automatic resizing) through the use of width and height callbacks. For example to make a widget width dynamically follow the size of the terminal window:
- The width callback should return a dynamic size, e.g. dependent on window size
``` js
	width: function() { return process.stdout.columns; },
```
- The window resize event should be subsribed to, and the context should be redrawn upon the event
``` js
process.stdout.on('resize', function() { widgetContext.draw(); });
```
- The resize event does not interrupt other operations, so there may be cases when the window size changes while the widget is being drawn and before the event has triggered. When this happens, one or several lines of the widget may be rendered across 2 or more lines due to line wrapping, which completely breaks the layout. To avoid this situation, condier disabling line wrapping at startup and reenabling upon exit
``` js
process.stdout.write("\u001b[?7l"); // disable line wrap on startup
process.on("exit", function() { process.istdout.write("\u001b[?7h"); }); // reenable linewrap on exit
process.on("SIGINT", function() { process.exit(); }); // optional, making sure that exit event is triggered
```


# Label
Provides a static multiline Label widget
``` js
var label = new tw.Label(
    width: function() {
      //TODO: return the width of the widget
    },
    height: function() {
      //TODO: return the height of the widget
    },
    { // callback
      item: function(line, width) {
        // TODO: return the text of the Label
        // line (Number): the line number of the text to return
        // width (Number): the text should exactly fit in this width
      }
    }
);
```

# VMenu
Provides a vertical menu widget where items can be selected.
``` js
var menu = new tw.VMenu({
      width: function() {
        //TODO: return the width of the widget
      },
      height: function() {
        //TODO: return the height of the widget
      },
      itemsCount: function() {
        // TODO: return the number of items in the menu 
      },
      scrollWidth: function() {
        // Optional: return the maximum horizontal scrolling.
        // Returning 0 disables horizontal scrolling.
      },
      item: function(item, current, width, hScroll) {
        // TODO: return the text of the menu item
        // item (Number): the index of the item
        // current (Boolean): true if the cursor is currently over the item
        // width (Number): the text should exactly fit in this width
        // hScroll (Number): current horizontal scrolling value
      },
      itemSelected: function(item) {
        // Notification of an item selection (an item is selected if the user presses Enter)
        // TODO: execute action as a response to the item selection
        // item (Number): the index of the item
      },
      handleKeyEvent: function(key) {
        // Notification of a key event (recived before the key is processed by the Menu).
        // This callback is optional, remove it if not used
        // TODO: execute action as a response to the key event and
        //   return true if the key was consumed (the key will not be processed by the Menu)
        //   return false if the key was not consumed (the key will be processed by the Menu)
        return false;
      }
});
```

# HMenu
Provides a horizontal menu widget where items can be selected.
``` js
var menu = new tw.HMenu({
      width: function() {
        //TODO: return the width of the widget
      },
      height: function() {
        //TODO: return the height of the widget
      },
      itemsCount: function() {
        // TODO: return the number of items in the menu 
      },
      scrollHeight: function()  {
        // Optional: return the maximum vertical scrolling.
        // Returning 0 disables horizontal scrolling.
      },
      itemsCountPerLine: function() {
        // TODO: return the number of items in a line(row).
      },
      item: function(item, current, width, hScroll) {
        // TODO: return the text of the menu item
        // item (Number): the index of the item
        // current (Boolean): true if the cursor is currently over the item
        // width (Number): the text should exactly fit in this width
        // hScroll (Number): current horizontal scrolling value
      },
      itemSelected: function(item) {
        // Notification of an item selection (an item is selected if the user presses Enter)
        // TODO: execute action as a response to the item selection
        // item (Number): the index of the item
      },
      handleKeyEvent: function(key) {
        // Notification of a key event (recived before the key is processed by the Menu).
        // This callback is optional, remove it if not used
        // TODO: execute action as a response to the key event and
        //   return true if the key was consumed (the key will not be processed by the Menu)
        //   return false if the key was not consumed (the key will be processed by the Menu)
        return false;
      }
});
```

# VScrollBar
Provides a vertical scrollbar widget.
``` js
var menu = new tw.VScrollBar({
      width: function() {
        //TODO: return the width of the widget
      },
      height: function() {
        //TODO: return the height of the widget
      },
      scrollBarInfo: function(size) {
	//TODO: return scrollbar information using the scrollBarInfo function
	//size (Number): height of the widget
      },
      item: function(item, current, width) {
        // TODO: return the text of scrollbar
        // item (Number): the index of the line
        // current (Boolean): true if the current line should display the bar
        // width (Number): the text should exactly fit in this width
      }

});
```


# HScrollBar
Provides a vertical scrollbar widget.
``` js
var menu = new tw.HScrollBar({
      width: function() {
        //TODO: return the width of the widget
      },
      height: function() {
        //TODO: return the height of the widget
      },
      scrollBarInfo: function(size) {
	//TODO: return scrollbar information using the scrollBarInfo function
	//size (Number): width of the widget
      },
      item: function(beg, end, width) {
        // TODO: return the text of scrollbar
        // beg (Number): the beginning column of the bar
        // end (Number): the ending column of the bar
        // width (Number): the text should exactly fit in this width
      }

});
```

# Input
Provides a multiline text input widget.
``` js
var input = new tw.Input(
    lines, // An array of lines which will be modified by the Widget as the user types
      {
      width: function() {
        //TODO: return the width of the widget
      },
      height: function() {
        //TODO: return the height of the widget
      },
      maxColumns: function() {
        // TODO: return the max number of columns 
      },
      maxLines: function() {
        // TODO: return the max number of lines 
      },
      itemsCount: function() {
        // TODO: return the number of items in the menu 
      },
      item: function(line, cursorColumn, width, hScrollPos) {
        // TODO: return the text to display in the widget
        // Note: the cursor must be styled here if required to be displayed (refer to examples)
        // line (String): the line to display
        // cursorColumn (Number): position of the cursor in the line (or undefined if there's no cursor on the line) 
        // width (Number): the text should exactly fit in this width
        // hScrollPos (Number): current horizontal scrolling value
      },
      textModified: function() {
        // Notification that the text has been modified
        // The text is always available in the variable this.lines (Array of strings)
      },
      handleKeyEvent: function(key) {
        // Notification of a key event (recived before the key is processed by the Input).
        // This callback is optional, remove it if not used
        // TODO: execute action as a response to the key event and
        //   return true if the key was consumed (the key will not be processed by the Input)
        //   return false if the key was not consumed (the key will be processed by the Input)
        return false;
      }
});
```

# HBoxLayout
Enables to display several widgets side by side.
Note: Layouts are widgets, they do however not have width and height callbacks, their dimensions are determined by their content.
``` js
var layout = new tw.HBoxLayout({
        itemsCount: function() {
          // TODO: return the number of widgets in the layout
        },
        item: function(item) {
          // TODO: return a specific widget
          // item (Number): the index of the item to return
        }
});
```

# VBoxLayout
Enables to display several widgets vertically.
Note: Layouts are widgets, they do however not have width and height callbacks, their dimensions are determined by their content.
``` js
var layout = new tw.VBoxLayout({
        itemsCount: function() {
          // TODO: return the number of widgets in the layout
        },
        item: function(item) {
          // TODO: return a specific widget
          // item (Number): the index of the item to return
        }
});
```

# WidgetContext
WidgetContext objects control the display and input of the widgets.
``` js
// select the widget which will be displayed when context.draw is called
context.setWidget(widget); 

// select the widget which will receive keyboard input when context.handleKeyEvent is called
context.setFocus(widget);

// draws the widget on the console at always the same location. 
context.draw();

// sends a key to be processed by the widget currently in focus
context.handleKeyEvent(key);
```

# Padding
Utility functions to use to return text with correct width
``` js

// Pads or truncate a string, left justifiction
// str (String): the input string
// width (Number): the target width
// hScrollPos (Number): the current horizontal scrolling position. the input will be shifter to the left as a result of the horizontal scrolling.
// padChar (String): the character to use for padding (space is the default)
tw.padRight(str, width, hScrollPos, padChar);

// Pads or truncate a string, center justifiction
// str (String): the input string
// width (Number): the target width
// padChar (String): the character to use for padding (space is the default)
tw.padBoth(str, width, padChar);
```

# ScrollBar functions
Utility functions used in ScrollBars' scrollBarInfo callback.
``` js
// Returns the scrollbar information in an internal format used to render the scrollbar
// itemTop(Number): the index of the item as the top of window
// windowHeight(Number): the height of the window
// itemsCount(Number): the total number of items
// scrollBarSize(Number): the size of teh scrollbar (width of horizontal, height for vertical)
var scrollBarInfo = tw.scrollBarInfo(itemTop, windowHeight, itemsCount, scrollBarSize) 
```

# install

```
npm install terminal-widgets
```
