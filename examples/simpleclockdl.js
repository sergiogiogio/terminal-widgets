var tw = require("../index.js")

var context = new tw.WidgetContext();

var label = new tw.Label({
        width: function() { return process.stdout.columns; },
        height: function() { return 1; },
        item: function(line, width) {
                return tw.padBoth(String(new Date()), width);
        }
});

context.setWidget(label);

process.stdout.write("\u001b[?7l"); // disable line wrap (linewrap causes problems when resizing the window quickly: the widget is rendred with a size assumption but upon display it does not match the window size anymore)
process.on("SIGINT", function() { process.stdout.write("\u001b[?7h"); process.exit(); });

context.draw();

setInterval(function() { context.draw(); }, 1000);
process.stdout.on("resize", function() { context.draw(); });
