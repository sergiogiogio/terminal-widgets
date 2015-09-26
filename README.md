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
var tw = require("terminal-widgets")

var context = new tw.WidgetContext();

var label = new tw.Label(50, 1, {
        item: function(line, width) {
                return tw.padBoth(String(new Date()), width);
        }
});

context.setWidget(label);
context.draw();

setInterval(function() { context.draw(); }, 1000);
```

# Common principles

The UI (drawing and input) is controlled by a WidgetContext object. The main widget must be selected in the WidgetContext before drawing.

The location of widgets on the screen cannot be precisely controlled (only their sizes). Use VBoxLayout and HBoxLayout to display widgets one on top of the other or side by side.

The callbacks *must* return text of the correct size (width). The functions padBoth, padRight and padRightStop can be used for this purpose. The callbacks can also style the text (e.g. use colors) but the result must fit in the width parameter provided.

No stylying is provided by default - not event the current item in a Menu widget or the cursor in an Input widget. These stylings must be done in the callbacks, refer to examples for possible solutions.

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


# Label
Provides a static multiline Label widget
``` js
var label = new tw.Label(
    width, // Label width
    height, // Label height
    { // callback
      item: function(line, width) {
        // TODO: return the text of the Label
        // line (Number): the line number of the text to return
        // width (Number): the text should exactly fit in this width
      }
    }
);
```

# Menu
Provides a menu widget where items can be selected.
Notes: scrollbars appear when necessary
``` js
var menu = new tw.Menu(
    width, // Menu width
    height, // Menu height
    {
      itemsCount: function() {
        // TODO: return the number of items in the menu 
      },
      scrollWidth: function() {
        // TODO: return the maximum horizontal scrolling.
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
```

# Input
Provides a multiline text input widget.
``` js
var input = new tw.Input(
    width, // Input width
    height, // Input height
    {
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
);
```

# HBoxLayout
Enables to display several widgets side by side.
Note: Layouts are widgets
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
Note: Layouts are widgets
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

# install

```
npm install terminal-widgets
```
