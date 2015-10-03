var tw = require("../index.js")

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
process.stdout.on("resize", function() { context.draw(); });
