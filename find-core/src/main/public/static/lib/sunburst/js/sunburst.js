define([
    './transition',
    'd3',
    'jquery',
    'raphael'
], function(Transition) {

    return function Sunburst(el, opts) {
        this.i18n = opts.i18n || {};
        this.resize = resize;
        this.redraw = redraw;
        var chartEl = $(el).css('position', 'relative');
        var sizeProp = opts.sizeAttr || 'size';
        var nameProp = opts.nameAttr || 'name';
        var labelFormatter = opts.labelFormatter || function(d){ return _.escape(d[nameProp]); };

        var width, height = chartEl.height(), radius, minRadius = 70;
        var colorFn = opts.colorFn || function (d) { return color((d.children ? d : d.parent)[nameProp]); };
        var clickFn = opts.clickFn || function (d) { }

        var x = d3.scale.linear().range([0, 2 * Math.PI]), y;

        resize();

        function resize() {
            width = chartEl.width();
            height = chartEl.height();
            radius = Math.min(width, height) / 2;

            y = d3.scale.sqrt().range([0, radius]);

            if (paper) {
                paper.setSize(width, height);
                paper.setViewBox(-0.5 * width, -0.5 * height, width, height);

                Raphael.vml && vmlPositionFix();

                if (centerLabel) {
                    centerLabel.css('left',0.5 * (width - centerLabel.width()))
                        .css('top', 0.5 * (height - centerLabel.height()));
                }

                if (arcEls && arcEls.length) {
                    onClick(prevClicked || arcData[0]);
                }
            }
        }

        function vmlPositionFix() {
            // Raphael 2.1.0 has issues with setViewBox in IE6/7/8, as a workaround we set a identity transform set
            // each time the view box changes.
            arcEls.forEach(function(link){link.attr('transform', 't0,0');});
        }

        var color = d3.scale.category20c();

        var paper = Raphael(chartEl[0], width, height);
        paper.setViewBox(-0.5 * width, -0.5 * height, width, height);

        var partition = d3.layout.partition()
            .value(function(d) { return d[sizeProp]; });

        var arc = d3.svg.arc()
            .startAngle(function(d) { return Math.max(0, Math.min(2 * Math.PI, x(d.x))); })
            .endAngle(function(d) { return Math.max(0, Math.min(2 * Math.PI, x(d.x + d.dx))); })
            .innerRadius(function(d) { return Math.max(0, y(d.y)); })
            .outerRadius(function(d) { return Math.max(0, y(d.y + d.dy)); });

        var prevClicked, prevHovered;
        var animationTime = 1000;
        var arcEls = [], arcData = [];
        var lastTransition;

        redraw(opts.data, false, true);

        function redraw(json, retainZoom, animate) {
            lastTransition && lastTransition.cancel();
            lastTransition = null;
            _.each(arcEls, function(arc){ arc.remove(); });

            arcData = partition.nodes(json);

            if (!retainZoom) {
                x.domain([0,1]);
                y.domain([0,1]).range([0, radius]);
            } else if (prevClicked) {
                // should zoom onto the current el
                x.domain([prevClicked.x, prevClicked.x + prevClicked.dx]);
                y.domain([prevClicked.y, 1]).range([prevClicked.y ? minRadius : 0, radius]);
            }

            // on the existing elements
            arcEls = arcData.map(function(d, idx){
                return paper.path(arc(d)).attr('fill', colorFn(d)).attr('stroke', 'none').click(function(evt){
                    if (clickFn && clickFn(d, evt) === false) {
                        return
                    }
                    d !== prevClicked && onClick(arcData[idx]);
                }).hover(function(){
                    hover(arcData[idx]);
                }, mouseout);
            });

            if (animate) {
                if (arcData.length < 200 && Raphael.svg) {
                    paper.set(arcEls).attr('opacity', 0).animate({opacity: 1}, animationTime);
                }
            }

        }

        hideCenterLabel();

        var centerLabel;

        function onClick(d){
            prevClicked = d;

            var xd = d3.interpolate(x.domain(), [d.x, d.x + d.dx]),
                yd = d3.interpolate(y.domain(), [d.y, 1]),
                yr = d3.interpolate(y.range(), [d.y ? minRadius : 0, radius]);

            if (Raphael.svg) {
                lastTransition && lastTransition.cancel();
                lastTransition = new Transition(animationTime, onTick);
            }
            else {
                onTick(1);
            }

            function onTick(t){
                x.domain(xd(t)); y.domain(yd(t)).range(yr(t));

                for (var ii = 0, max = arcData.length; ii < max; ++ii) {
                    arcEls[ii].attr('path', arc(arcData[ii]));
                }
            }
        }

        function hover(d) {
            if (prevHovered === d) {
                return;
            }

            prevHovered = d;

            showCenterLabel(d);
        }

        function mouseout() {
            prevHovered = null;
        }

        function showCenterLabel(d) {
            var innerHTML = labelFormatter(d, prevClicked);

            if (!centerLabel) {
                centerLabel = $('<div>'+innerHTML+'</div>').css({
                    position: 'absolute',
                    'text-align': 'center',
                    'text-overflow': 'ellipsis',
                    'pointer-events': 'none',
                    color: 'white'
                }).appendTo(chartEl);
            }
            else {
                centerLabel.html(innerHTML);
            }

            centerLabel.css('left',0.5 * (chartEl.width() - centerLabel.width()))
                .css('top', 0.5 * (chartEl.height() - centerLabel.height()));
        }

        function hideCenterLabel() {
            if (centerLabel) {
                centerLabel.remove();
                centerLabel = null;
            }
        }
    }
});