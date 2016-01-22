
var  lorem = {
        limeGreen: "#3cd52e",
        lightBlue: "#00a7ce",
        darkGrey: "#2a2a2a",
        lightGrey: "#e6e6e6",
        white: "#ffffff",
        darkGrey02: "#13131b",
        orange: "#ff8030",
        pink: "#ef3fa9",
        transparent: 0,
        gradientGreenBlue: ["#3cd52e", "#00a7ce"],
        lineStyle : {
            none: 0,
            dashed: ("4, 4")
        },
        lineStyleMobile : {
            none: 0,
            dashed: ("1, 1")
        },
        stroke: {
            thin: 4,
            normal: 8
        },
        strokeMobile: {
            thin: 2,
            normal: 4
        }
    },

    loremLineStyle = [ lorem.lineStyle.dashed, lorem.lineStyle.none],
    loremLineStyleMobile = [ lorem.lineStyleMobile.dashed, lorem.lineStyleMobile.none],
    loremColors = [lorem.orange, lorem.limeGreen],
    loremLineStroke = [lorem.stroke.thin, lorem.stroke.normal],
    loremLineStrokeMobile = [lorem.strokeMobile.thin, lorem.strokeMobile.normal],
    loremNodeColors = [lorem.pink, lorem.lightBlue],
    loremNodeSize = [5, 9],
    loremNodeSizeMobile = [4, 5],
    loremNodeColorsTargetStripe01 = [lorem.pink, lorem.darkGrey02], //creates target effect for FOT node
    loremNodeTargetStripe01Size = [5, 7],
    loremNodeTargetStripe01SizeMobile = [2, 4],
    loremNodeTargetStripe02Size = [4, 3],
    loremNodeTargetStripe02SizeMobile = [3, 2],
    loremGradient = ["url(#gradientPinkOrange)", "url(#gradientGreenBlue)"];


var DigitsAnimate = function() {
    this.init = function(elem, initialValue, value, time, string) {
        $({digits: initialValue}).animate({digits: value}, {
            duration: time,
            easing: 'swing',
            step: function () {
                if (string === undefined) {
                    string = '';
                }
                $(elem).text(Math.round(Math.ceil(this.digits * 100)/100) + string);
            }
        });
    }
};

var RadarChart = function(){
    this.draw = function(id, d, options) {
        var cfg = {
            radius: 5,
            w: 500,
            h: 500,
            factor: 1,
            factorLegend: .85,
            levels: 3,
            maxValue: 0,
            radians: 2 * Math.PI,
            opacityArea: 0.5,
            ToRight: 5,
            TranslateX: 50,
            TranslateY: 50,
            ExtraWidthX: 200,
            ExtraWidthY: 200,
            color: d3.scale.category10(),
        };

        if ('undefined' !== typeof options) {
            for (var i in options) {
                if ('undefined' !== typeof options[i]) {
                    cfg[i] = options[i];
                }
            }
        }
        cfg.maxValue = Math.max(cfg.maxValue, d3.max(d, function (i) {
            return d3.max(i.map(function (o) {
                return o.value;
            }))
        }));
        var allAxis = (d[0].map(function (i, j) {
            return i.axis
        }));
        var total = allAxis.length;
        var radius = cfg.factor * Math.min(cfg.w / 2, cfg.h / 2);
        var Format = d3.format('%');
        d3.select(id).select("svg").remove();

        var g = d3.select(id)
            .append("svg")
            .attr("width", cfg.w + cfg.ExtraWidthX)
            .attr("height", cfg.h + cfg.ExtraWidthY)
            .append("g")
            .attr("transform", "translate(" + cfg.TranslateX + "," + cfg.TranslateY + ")");

        var tooltip;

        for (var j = 0; j < cfg.levels - 1; j++) {
            var levelFactor = cfg.factor * radius * ((j + 1) / cfg.levels);
            g.selectAll(".levels")
                .data(allAxis)
                .enter()
                .append("svg:line")
                .attr("x1", function (d, i) {
                    return levelFactor * (1 - cfg.factor * Math.sin(i * cfg.radians / total));
                })
                .attr("y1", function (d, i) {
                    return levelFactor * (1 - cfg.factor * Math.cos(i * cfg.radians / total));
                })
                .attr("x2", function (d, i) {
                    return levelFactor * (1 - cfg.factor * Math.sin((i + 1) * cfg.radians / total));
                })
                .attr("y2", function (d, i) {
                    return levelFactor * (1 - cfg.factor * Math.cos((i + 1) * cfg.radians / total));
                })
                .attr("class", "line")
                .style("stroke", lorem.darkGrey)
                .style("fill", "none")
                .style("stroke-dasharray", ("2, 2"))
                .attr("transform", "translate(" + (cfg.w / 2 - levelFactor) + ", " + (cfg.h / 2 - levelFactor) + ")");
        }


        series = 0;

        var axis = g.selectAll(".axis")
            .data(allAxis)
            .enter()
            .append("g")
            .attr("class", "axis");

        axis.append("line")
            .attr("x1", cfg.w / 2)
            .attr("y1", cfg.h / 2)
            .attr("x2", function (d, i) {
                return cfg.w / 2 * (1 - cfg.factor * Math.sin(i * cfg.radians / total));
            })
            .attr("y2", function (d, i) {
                return cfg.h / 2 * (1 - cfg.factor * Math.cos(i * cfg.radians / total));
            })
            .attr("class", "line")
            .style("stroke-dasharray", ("2, 2"))
            .style("stroke", lorem.darkGrey)
            .style("stroke-width", "1px");

        axis.append("text")
            .attr("class", function (d) {
                return "radar-label-" + d.toLowerCase() + ' radar-label';
            })
            .text(function (d) {
                return d
            })
            .attr("dy", "1.5em")
            .attr({
                "text-anchor": "middle",
                "font-family": "TradeGothicLT-BoldCondTwenty",
                fill: "#ffffff",
                "font-size": 18
            })
            .attr("x", function (d, i) {
                return cfg.w / 2 * (1 - cfg.factorLegend * Math.sin(i * cfg.radians / total)) - 60 * Math.sin(i * cfg.radians / total);
            })
            .attr("y", function (d, i) {
                return cfg.h / 2 * (1 - Math.cos(i * cfg.radians / total)) - 20 * Math.cos(i * cfg.radians / total);
            });

        g.selectAll(".radar-label-power")
            .attr("y", -50);

        g.selectAll(".radar-label-strength")
            .attr("transform", "rotate(60)")
            .attr("x", 341)
            .attr("y", -393);

        g.selectAll(".radar-label-reaction")
            .attr("transform", "rotate(300)")
            .attr("x", -90)
            .attr("y", 600);


        g.selectAll(".radar-label-acceleration")
            .attr("y", 510);

        g.selectAll(".radar-label-technique")
            .attr("transform", "rotate(60)")
            .attr("x", 343)
            .attr("y", 167);

        g.selectAll(".radar-label-accuracy")


            .attr("transform", "rotate(300)")
            .attr("x", -92)
            .attr("y", 40);


        //strokes and fill

        d.forEach(function (y, x, i) {
            dataValues = [];
            g.selectAll(".nodes")
                .data(y, function (j, i) {
                    dataValues.push([
                        cfg.w / 2 * (1 - (parseFloat(Math.max(j.value, 0)) / cfg.maxValue) * cfg.factor * Math.sin(i * cfg.radians / total)),
                        cfg.h / 2 * (1 - (parseFloat(Math.max(j.value, 0)) / cfg.maxValue) * cfg.factor * Math.cos(i * cfg.radians / total))
                    ]);
                });
            dataValues.push(dataValues[0]);
            g.selectAll(".area")
                .data([dataValues])
                .enter()
                .append("polygon")
                .attr("class", "radar-chart-serie" + series)
                .transition()
                .duration(1000)
                .style("stroke-width", loremLineStroke[x])
                .style("stroke", loremGradient[x])
                .style("stroke-dasharray", loremLineStyle[x])
                .attr("points", function (d) {
                    var str = "";
                    for (var pti = 0; pti < d.length; pti++) {
                        str = str + d[pti][0] + "," + d[pti][1] + " ";
                    }
                    return str;
                })
                .style("fill", lorem.transparent)
                .style("fill-opacity", lorem.transparent);
        });
        series++;
    }
}
series=0;

//nodes
d.forEach(function(y, x){
    g.selectAll(".nodes")
        .data(y).enter()
        .append("svg:circle")
        .attr("class", "radar-chart-serie"+series)
        .attr('r', loremNodeSize[x] )
        .attr("alt", function(j){return Math.max(j.value, 0)})
        .attr("cx", function(j, i){
            dataValues.push([
                cfg.w/2*(1-(parseFloat(Math.max(j.value, 0))/cfg.maxValue)*cfg.factor*Math.sin(i*cfg.radians/total)),
                cfg.h/2*(1-(parseFloat(Math.max(j.value, 0))/cfg.maxValue)*cfg.factor*Math.cos(i*cfg.radians/total))
            ]);
            return cfg.w/2*(1-(Math.max(j.value, 0)/cfg.maxValue)*cfg.factor*Math.sin(i*cfg.radians/total));
        })
        .attr("cy", function(j, i){
            return cfg.h/2*(1-(Math.max(j.value, 0)/cfg.maxValue)*cfg.factor*Math.cos(i*cfg.radians/total));
        })
        .attr("data-id", function(j){return j.axis})
        .style("fill", loremNodeColors[x]).style("fill-opacity", '1');

    series++;
});


//nodes hollow
d.forEach(function(y, x){
    g.selectAll(".nodes")
        .data(y).enter()
        .append("svg:circle")
        .attr("class", "radar-chart-serie2"+series)
        .attr('r', loremNodeTargetStripe01Size[x] )
        .attr("alt", function(j){return Math.max(j.value, 0)})
        .attr("cx", function(j, i){
            dataValues.push([
                cfg.w/2*(1-(parseFloat(Math.max(j.value, 0))/cfg.maxValue)*cfg.factor*Math.sin(i*cfg.radians/total)),
                cfg.h/2*(1-(parseFloat(Math.max(j.value, 0))/cfg.maxValue)*cfg.factor*Math.cos(i*cfg.radians/total))
            ]);
            return cfg.w/2*(1-(Math.max(j.value, 0)/cfg.maxValue)*cfg.factor*Math.sin(i*cfg.radians/total));
        })
        .attr("cy", function(j, i){
            return cfg.h/2*(1-(Math.max(j.value, 0)/cfg.maxValue)*cfg.factor*Math.cos(i*cfg.radians/total));
        })
        .attr("data-id", function(j){return j.axis})
        .style("fill", loremNodeColorsTargetStripe01[x]).style("fill-opacity", '1')

    series++;
});


//nodes hollow pinPoint
d.forEach(function(y, x){
    g.selectAll(".nodes")
        .data(y).enter()
        .append("svg:circle")
        .attr("class", "radar-chart-serie3"+series)
        .attr('r', loremNodeTargetStripe02Size[x] )
        .attr("alt", function(j){return Math.max(j.value, 0)})
        .attr("cx", function(j, i){
            dataValues.push([
                cfg.w/2*(1-(parseFloat(Math.max(j.value, 0))/cfg.maxValue)*cfg.factor*Math.sin(i*cfg.radians/total)),
                cfg.h/2*(1-(parseFloat(Math.max(j.value, 0))/cfg.maxValue)*cfg.factor*Math.cos(i*cfg.radians/total))
            ]);
            return cfg.w/2*(1-(Math.max(j.value, 0)/cfg.maxValue)*cfg.factor*Math.sin(i*cfg.radians/total));
        })
        .attr("cy", function(j, i){
            return cfg.h/2*(1-(Math.max(j.value, 0)/cfg.maxValue)*cfg.factor*Math.cos(i*cfg.radians/total));
        })
        .attr("data-id", function(j){return j.axis})
        .style("fill", loremNodeColors[x]).style("fill-opacity", x);

    series++;
});

function redraw() {
    g.attr("transform",
        "translate(" + d3.event.translate + ")"
        + " scale(" + d3.event.scale + ")");
}



//Tooltip
tooltip = g.append('text')
    .style('opacity', 0)
    .style('font-family', 'sans-serif')
    .style('font-size', '13px');

var gradientGreenBlue = g.append("svg:defs")
    .append("svg:linearGradient")
    .attr("id", "gradientGreenBlue")
    .attr("x1", "0%")
    .attr("y1", "0%")
    .attr("x2", "100%")
    .attr("y2", "100%")
    .attr("spreadMethod", "pad");

// Define the gradient colors
gradientGreenBlue.append("svg:stop")
    .attr("offset", "0%")
    .attr("stop-color", lorem.lightBlue)
    .attr("stop-opacity", 1);

gradientGreenBlue.append("svg:stop")
    .attr("offset", "100%")
    .attr("stop-color", lorem.limeGreen)
    .attr("stop-opacity", 1);


var gradientPinkOrange = g.append("svg:defs")
    .append("svg:linearGradient")
    .attr("id", "gradientPinkOrange")
    .attr("x1", "0%")
    .attr("y1", "0%")
    .attr("x2", "100%")
    .attr("y2", "100%")
    .attr("spreadMethod", "pad");

// Define the gradient colors
gradientPinkOrange.append("svg:stop")
    .attr("offset", "0%")
    .attr("stop-color", lorem.pink)
    .attr("stop-opacity", 1);

gradientPinkOrange.append("svg:stop")
    .attr("offset", "100%")
    .attr("stop-color", lorem.orange)
    .attr("stop-opacity", 1)

var LinearChartSimple = function(){
    this.draw = function(id, data, options) {
        var cfg =  {
            w: 1000,
            h: 100,
            padding: 5
        };

        graph_data = [{
            x: 0,
            y: 0
        }, {
            x: 80,
            y: 0
        }];

        // General definitions
        var HEIGHT, MARGINS, WIDTH, lineFunc, graph, graph_data, x, y;
        WIDTH = 900;
        HEIGHT = 10;
        MARGINS = {
            top: 20,
            right: 30,
            bottom: 20,
            left: 30
        };
        var unit;

        if (options.unit) {
            unit = options.unit;
        } else {
            unit = 'CM';
        }


        lineChart = d3.select(options.id);

        x = d3.scale.linear().range([MARGINS.left, WIDTH - MARGINS.right]).domain([
            d3.min(graph_data, function(d) {
                return d.x;
            }), d3.max(graph_data, function(d) {
                return d.x + 1;
            })
        ]);

        y = d3.scale.linear().range([HEIGHT - MARGINS.top, MARGINS.bottom]).domain([
            d3.min(graph_data, function(d) {
                return d.y;
            }), d3.max(graph_data, function(d) {
                return d.y;
            })
        ]);

        // Define Line Gradient
        lineChart.append("linearGradient")
            .attr("id", options.gradient.id)
            .attr("gradientUnits", "userSpaceOnUse")
            .attr("x1", 400) //TODO get gradient blend position
            .attr("y1", y(400))
            .attr("x2", 0)
            .attr("y2", y(0))
            .selectAll("stop")
            .data([
                {
                    offset: "0%",
                    color: options.gradient.color.start
                }, {
                    offset: "50%",
                    color: options.gradient.color.end
                }
            ]).enter().append("stop").attr("offset", function(d) {
            return d.offset;
        }).attr("stop-color", function(d) {
            return d.color;
        });

        // Draw Line
        var lineDraw = d3.svg.line()
            .x(function(d) {return d})
            .y(function(d) {return 0})
            .interpolate("linear");


        lineChart.append("svg:path")
            .attr("class","chartpath")
            .attr({"d": lineDraw(data),
                "stroke": "url(#" + options.gradient.id + ")",
                "stroke-width": 40,
                "fill": "none",
                "stroke-dasharray": function(){
                    if (options.style !== undefined) {
                        return options.style.dashArray
                    }
                }
            });

        //add digit labels
        lineChart.selectAll('text')
            .data(function(){
                var dataBuffer = data;
                var array = dataBuffer.splice(0, 1);
                return array;
            })
            .enter()
            .append('text')
            .text(function(d) {
                var moveDigits = new DigitsAnimate();
                moveDigits.init('.label-animate', 0, d, 1000, unit);
                moveDigits.init('.label-animate', 0, d, 1000, unit);
                return d;
            })
            .attr("class", "label-animate")
            .attr({
                "text-anchor": "right",
                x: function(d){
                    return 820;
                },
                y: 18,
                "font-family": "TradeGothicLT-BoldCondTwenty",
                fill: "#ffffff",
                "font-size": 24
            });
    }
};

var ArcChart = function(){
    this.draw = function(id, data, options) {
        var width = 80,
            height = 80,
            tt = 2 * Math.PI; // http://tauday.com/tau-manifesto

        var arc = d3.svg.arc()
            .innerRadius((width/2) - 4)
            .outerRadius(width/2)
            .cornerRadius(12)
            .startAngle(0);

        var arcBackground = d3.svg.arc()
            .innerRadius((width/2) - 4)
            .outerRadius(width/2)
            .cornerRadius(12)
            .startAngle(0);

        var svg = d3.select(id).append("svg")
            .attr("width", width)
            .attr("height", height)
            .append("g")
            .attr("transform",  "translate(" + width / 2 + "," + height / 2 + ") rotate(-144)" );

        var arcLabel = svg.selectAll('text')
            .data([40])
            .enter()
            .append('text')
            .text(function(d){
                var moveDigits = new DigitsAnimate();
                moveDigits.init('.label-arc-chart', 0, d, 1000);
                return d;
            })

            .attr("class", "label-arc-chart")
            .attr({
                "text-anchor": "middle",
                x: 0,
                y: 13,
                "font-family": "TradeGothicLT-BoldCondTwenty",
                fill: "#ffffff",
                "font-size": 40
            })
            .attr("transform","rotate(144)");

        var arcLabelDescription = svg.append('text')
            .text("OVR")
            .attr("class", "label-arc-decription")
            .attr({
                "text-anchor": "middle",
                x: 0,
                y: 37,
                "font-family": "TradeGothicLT-BoldCondTwenty",
                fill: lorem.lightBlue,
                "font-size": 12
            })
            .attr("transform","rotate(144)");

        // Add the background arc, from 0 to 100% (tt).
        var background = svg.append("path")
            .datum({endAngle:.8 * tt})
            .style("fill", "#2a2a2a")
            .attr("d", arcBackground);

        // Add the foreground arc
        var foreground = svg.append("path")
            .datum({endAngle: .127 * tt})
            .style("fill", "url(#gradientGreenBlue)")
            .style("stroke-linecap","round")
            .attr("d", arc);

        //pass data here
        foreground.transition()
            .duration(750)
            .call(arcTween, 40/100 * tt ); // .8 limits the chart

        function getRandomArbitrary(min, max) {
            return Math.random() * (max - min) + min;
        }

        function arcTween(transition, newAngle) {

            transition.attrTween("d", function(d) {
                var interpolate = d3.interpolate(d.endAngle, newAngle);

                return function(t) {

                    d.endAngle = interpolate(t);
                    return arc(d);
                };
            });
        }
    };
};

var OverAllChart = function(){
    this.draw = function(id, data, options){
        var php = window.php;


        var chartWidth       = 140,
            barHeight        = 10,
            groupHeight      = barHeight * data.series.length,
            gapBetweenGroups = 30,
            spaceForLabels   = 100,
            spaceForLegend   = 100;

        // Zip the series data together (first values, second values, etc.)
        var zippedData = [];
        for (var i=0; i<data.labels.length; i++) {
            for (var j=0; j<data.series.length; j++) {
                zippedData.push(data.series[j].values[i]);
            }
        }

        // Color scale
        var color = d3.scale.category20();
        var chartHeight = barHeight * zippedData.length + gapBetweenGroups * data.labels.length;

        var x = d3.scale.linear()
            .domain([0, d3.max(zippedData)])
            .range([0, chartWidth]);

        var y = d3.scale.linear()
            .range([chartHeight + gapBetweenGroups, 0]);

        var yAxis = d3.svg.axis()
            .scale(y)
            .tickFormat('')
            .tickSize(0)
            .orient("left");

        // Specify the chart area and dimensions
        var chart = d3.select(id)
            .attr("width", spaceForLabels + chartWidth + spaceForLegend)
            .attr("height", chartHeight);


        var gradientGreenBlue = chart.append("svg:defs")
            .append("svg:linearGradient")
            .attr("id", "gradientGreenBlueOverall")

            .attr("gradientUnits", "userSpaceOnUse")
            .attr("x1", "0%")
            .attr("y1", "0%")
            .attr("x2", "40%")
            .attr("y2", "40%")
            .attr("spreadMethod", "pad");

        // Define the gradient colors
        gradientGreenBlue.append("svg:stop")
            .attr("offset", "0%")
            .attr("stop-color", lorem.lightBlue)
            .attr("stop-opacity", 1);

        gradientGreenBlue.append("svg:stop")
            .attr("offset", "50%")
            .attr("stop-color", lorem.limeGreen)
            .attr("stop-opacity", 1);

        // Create bars
        var bar = chart.selectAll("g")
            .data(zippedData)
            .enter().append("g")
            .attr("transform", function(d, i) {
                return "translate(" + spaceForLabels + "," + (i * barHeight + gapBetweenGroups * (0.5 + Math.floor(i/data.series.length))) + ")";
            });

        // Create rectangles of the correct width
        bar.append("rect")
            .attr("fill", "black")
            .attr("class", "bar-bg")
            .attr("width", chartWidth )
            .attr("height", barHeight - 1);

        bar.append("rect")
            .attr("fill", "url(#gradientGreenBlueOverall)")
            .attr("class", "bar")
            .attr("width", x)
            .attr("height", barHeight - 1);

        // Add text label in bar
        bar.append("text")
            .attr("x", chartWidth + 30)
            .attr("y", barHeight / 2)
            .attr("fill", "#bcbec0")
            .attr("dy", ".35em")
            .attr("class", function(d){return "activities-label-animate"+d})
            .text(function(d) {
                var activityMoveDigits = new DigitsAnimate();
                activityMoveDigits.init('.activities-label-animate'+d, 0, d, 1000, ' PTS');
            })
            .style("font-size", 14);

        // Draw labels
        bar.append("text")
            .attr("class", "label")
            .attr("x", function(d) { return - 100; })
            .attr("y", groupHeight / 2)
            .attr("dy", ".35em")
            .text(function(d,i) {
                if (i % data.series.length === 0)
                    return data.labels[Math.floor(i/data.series.length)];
                else
                    return ""})
            .style("fill", "#bcbec0")
            .style("font-size", 14);

        chart.append("g")
            .attr("class", "y axis")
            .attr("transform", "translate(" + spaceForLabels + ", " + -gapBetweenGroups/2 + ")")
            .call(yAxis);
    }
};



