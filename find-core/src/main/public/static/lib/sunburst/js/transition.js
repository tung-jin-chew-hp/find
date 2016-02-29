define(['d3'], function(){
    // Class for animating things without a DOM element, e.g. Raphael
    return function Transition(duration, callback, transition){
        var finished, ease = d3.ease(transition || 'cubic-in-out');

        d3.timer(function(elapsed){
            if (finished) { return 1; }

            var t = elapsed > duration ? 1 : elapsed / duration;
            callback(ease(t));

            if (t >= 1) {
                return 1;
            }
        });

        this.cancel = function(){
            finished = true;
        };
    };
});