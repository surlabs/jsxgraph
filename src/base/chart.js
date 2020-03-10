/*
    Copyright 2008-2020
        Matthias Ehmann,
        Michael Gerhaeuser,
        Carsten Miller,
        Bianca Valentin,
        Alfred Wassermann,
        Peter Wilfahrt

    This file is part of JSXGraph.

    JSXGraph is free software dual licensed under the GNU LGPL or MIT License.

    You can redistribute it and/or modify it under the terms of the

      * GNU Lesser General Public License as published by
        the Free Software Foundation, either version 3 of the License, or
        (at your option) any later version
      OR
      * MIT License: https://github.com/jsxgraph/jsxgraph/blob/master/LICENSE.MIT

    JSXGraph is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU Lesser General Public License for more details.

    You should have received a copy of the GNU Lesser General Public License and
    the MIT License along with JSXGraph. If not, see <http://www.gnu.org/licenses/>
    and <http://opensource.org/licenses/MIT/>.
 */


/*global JXG: true, define: true, document: true*/
/*jslint nomen: true, plusplus: true*/

/* depends:
 jxg
 math/numerics
 math/statistics
 base/constants
 base/coords
 base/element
 parser/datasource
 utils/color
 utils/type
 utils/env
  elements:
   curve
   spline
   functiongraph
   point
   text
   polygon
   sector
   transform
   line
   legend
   circle
 */

define([
    'jxg', 'math/numerics', 'math/statistics', 'base/constants', 'base/coords', 'base/element', 'parser/datasource',
    'utils/color', 'utils/type', 'utils/env', 'base/curve', 'base/point', 'base/text', 'base/polygon', 'element/sector',
    'base/transformation', 'base/line', 'base/circle'
], function (JXG, Numerics, Statistics, Const, Coords, GeometryElement, DataSource, Color, Type, Env, Curve, Point, Text,
        Polygon, Sector, Transform, Line, Circle) {

    "use strict";

     /**
      *
      * TODO
      * Chart plotting
      *
      * The Chart class is a basic class for the chart object.
      * @class Creates a new basic chart object. Do not use this constructor to create a chart.
      * Use {@link JXG.Board#create} with
      * type {@link Chart} instead.
      * @constructor
      * @augments JXG.GeometryElement
      * @param {String,JXG.Board} board The board the new chart is drawn on.
      * @param {Array} parent data arrays for the chart
      * @param {Object} attributes Javascript object containing attributes like name, id and colors.
      */
    JXG.Chart = function (board, parents, attributes) {
        this.constructor(board, attributes);

        var x, y, i, c, style, len;

        if (!Type.isArray(parents) || parents.length === 0) {
            throw new Error('JSXGraph: Can\'t create a chart without data');
        }

        /**
         * Contains pointers to the various subelements of the chart.
         */
        this.elements = [];

        if (Type.isNumber(parents[0])) {
            // parents looks like [a,b,c,..]
            // x has to be filled

            y = parents;
            x = [];
            for (i = 0; i < y.length; i++) {
                x[i] = i + 1;
            }
        } else if (parents.length === 1 && Type.isArray(parents[0])) {
            // parents looks like [[a,b,c,..]]
            // x has to be filled

            y = parents[0];
            x = [];

            len = Type.evaluate(y).length;
            for (i = 0; i < len; i++) {
                x[i] = i + 1;
            }
        } else if (parents.length === 2) {
            // parents looks like [[x0,x1,x2,...],[y1,y2,y3,...]]
            len = Math.min(parents[0].length, parents[1].length);
            x = parents[0].slice(0, len);
            y = parents[1].slice(0, len);
        }

        if (Type.isArray(y) && y.length === 0) {
            throw new Error('JSXGraph: Can\'t create charts without data.');
        }

        // does this really need to be done here? this should be done in createChart and then
        // there should be an extra chart for each chartstyle
        style = attributes.chartstyle.replace(/ /g, '').split(',');
        for (i = 0; i < style.length; i++) {
            switch (style[i]) {
            case 'bar':
                c = this.drawBar(board, x, y, attributes);
                break;
            case 'line':
                c = this.drawLine(board, x, y, attributes);
                break;
            case 'fit':
                c = this.drawFit(board, x, y, attributes);
                break;
            case 'spline':
                c = this.drawSpline(board, x, y, attributes);
                break;
            case 'pie':
                c = this.drawPie(board, y, attributes);
                break;
            case 'point':
                c = this.drawPoints(board, x, y, attributes);
                break;
            case 'radar':
                c = this.drawRadar(board, parents, attributes);
                break;
            }
            this.elements.push(c);
        }
        this.id = this.board.setId(this, 'Chart');

        return this.elements;
    };
    JXG.Chart.prototype = new GeometryElement();

    JXG.extend(JXG.Chart.prototype, /** @lends JXG.Chart.prototype */ {
        /**
         * anonymous function - description
         *
         * @param  {String,JXG.Board} board      description
         * @param  {type} x          description
         * @param  {type} y          description
         * @param  {type} attributes description
         * @returns {type}            description
         */
        drawLine: function (board, x, y, attributes) {
            // we don't want the line chart to be filled
            attributes.fillcolor = 'none';
            attributes.highlightfillcolor = 'none';

            return board.create('curve', [x, y], attributes);
        },

        /**
         * anonymous function - description
         *
         * @param  {String,JXG.Board} board      description
         * @param  {type} x          description
         * @param  {type} y          description
         * @param  {type} attributes description
         * @returns {type}            description
         */
        drawSpline: function (board, x, y, attributes) {
            // we don't want the spline chart to be filled
            attributes.fillColor = 'none';
            attributes.highlightfillcolor = 'none';

            return board.create('spline', [x, y], attributes);
        },

        /**
         * anonymous function - description
         *
         * @param  {type} board      description
         * @param  {type} x          description
         * @param  {type} y          description
         * @param  {type} attributes description
         * @returns {type}            description
         */
        drawFit: function (board, x, y, attributes) {
            var deg = attributes.degree;

            deg = Math.max(parseInt(deg, 10), 1) || 1;

            // never fill
            attributes.fillcolor = 'none';
            attributes.highlightfillcolor = 'none';

            return board.create('functiongraph', [Numerics.regressionPolynomial(deg, x, y)], attributes);
        },

        /**
         * anonymous function - description
         *
         * @param  {type} board      description
         * @param  {type} x          description
         * @param  {type} y          description
         * @param  {type} attributes description
         * @returns {type}            description
         */
        drawBar: function (board, x, y, attributes) {
            var i, strwidth, text, w, xp0, xp1, xp2, yp, colors,
                pols = [],
                p = [],
                attr, attrSub,

                makeXpFun = function (i, f) {
                    return function () {
                        return x[i]() - f * w;
                    };
                },

                hiddenPoint = {
                    fixed: true,
                    withLabel: false,
                    visible: false,
                    name: ''
                };

            attr = Type.copyAttributes(attributes, board.options, 'chart');

            // Determine the width of the bars
            if (attr && attr.width) {  // width given
                w = attr.width;
            } else {
                if (x.length <= 1) {
                    w = 1;
                } else {
                    // Find minimum distance between to bars.
                    w = x[1] - x[0];
                    for (i = 1; i < x.length - 1; i++) {
                        w = (x[i + 1] - x[i] < w) ? x[i + 1] - x[i] : w;
                    }
                }
                w *= 0.8;
            }

            attrSub = Type.copyAttributes(attributes, board.options, 'chart', 'label');

            for (i = 0; i < x.length; i++) {
                if (Type.isFunction(x[i])) {
                    xp0 = makeXpFun(i, -0.5);
                    xp1 = makeXpFun(i, 0);
                    xp2 = makeXpFun(i, 0.5);
                } else {
                    xp0 = x[i] - w * 0.5;
                    xp1 = x[i];
                    xp2 = x[i] + w * 0.5;
                }
                if (Type.isFunction(y[i])) {
                    yp = y[i]();
                } else {
                    yp = y[i];
                }
                yp = y[i];

                if (attr.dir === 'horizontal') {  // horizontal bars
                    p[0] = board.create('point', [0, xp0], hiddenPoint);
                    p[1] = board.create('point', [yp, xp0], hiddenPoint);
                    p[2] = board.create('point', [yp, xp2], hiddenPoint);
                    p[3] = board.create('point', [0, xp2], hiddenPoint);

                    if (Type.exists(attr.labels) && Type.exists(attr.labels[i])) {
                        attrSub.anchorY = 'middle';
                        text = board.create('text', [
                            yp,
                            xp1,
                            attr.labels[i]], attrSub);
                        text.visProp.anchorx = (function(txt) { return function() {
                            return (txt.X() >= 0) ? 'left' : 'right';
                        }; })(text);

                    }
                } else { // vertical bars
                    p[0] = board.create('point', [xp0, 0], hiddenPoint);
                    p[1] = board.create('point', [xp0, yp], hiddenPoint);
                    p[2] = board.create('point', [xp2, yp], hiddenPoint);
                    p[3] = board.create('point', [xp2, 0], hiddenPoint);

                    if (Type.exists(attr.labels) && Type.exists(attr.labels[i])) {
                        attrSub.anchorX = 'middle';

                        text = board.create('text', [
                            xp1,
                            yp,
                            attr.labels[i]], attrSub);

                        text.visProp.anchory = (function(txt) {
                            return function() {
                                    return (txt.Y() >= 0) ? 'bottom' : 'top';
                                };
                            })(text);

                    }
                }

                if (Type.isArray(attr.colors)) {
                    colors = attr.colors;
                    attr.fillcolor = colors[i % colors.length];
                }

                pols[i] = board.create('polygon', p, attr);
                if (Type.exists(attr.labels) && Type.exists(attr.labels[i])) {
                    pols[i].text = text;
                }
            }

            return pols;
        },

        /**
         * anonymous function - description
         *
         * @param  {type} board      description
         * @param  {type} x          description
         * @param  {type} y          description
         * @param  {type} attributes description
         * @returns {type}            description
         */
        drawPoints: function (board, x, y, attributes) {
            var i,
                points = [],
                infoboxArray = attributes.infoboxarray;

            attributes.fixed = true;
            attributes.name = '';

            for (i = 0; i < x.length; i++) {
                attributes.infoboxtext = infoboxArray ? infoboxArray[i % infoboxArray.length] : false;
                points[i] = board.create('point', [x[i], y[i]], attributes);
            }

            return points;
        },

        /**
         * anonymous function - description
         *
         * @param  {type} board      description
         * @param  {type} y          description
         * @param  {type} attributes description
         * @returns {type}            description
         */
        drawPie: function (board, y, attributes) {
            var i, center,
                p = [],
                sector = [],
                s = Statistics.sum(y),
                colorArray = attributes.colors,
                highlightColorArray = attributes.highlightcolors,
                labelArray = attributes.labels,
                r = attributes.radius || 4,
                radius = r,
                cent = attributes.center || [0, 0],
                xc = cent[0],
                yc = cent[1],

                makeRadPointFun = function (j, fun, xc) {
                    return function () {
                        var s, i, rad,
                            t = 0;

                        for (i = 0; i <= j; i++) {
                            t += parseFloat(Type.evaluate(y[i]));
                        }

                        s = t;
                        for (i = j + 1; i < y.length; i++) {
                            s += parseFloat(Type.evaluate(y[i]));
                        }
                        rad = (s !== 0) ? (2 * Math.PI * t / s) : 0;

                        return radius() * Math[fun](rad) + xc;
                    };
                },

                highlightHandleLabel = function (f, s) {
                    var dx = -this.point1.coords.usrCoords[1] + this.point2.coords.usrCoords[1],
                        dy = -this.point1.coords.usrCoords[2] + this.point2.coords.usrCoords[2];

                    if (Type.exists(this.label)) {
                        this.label.rendNode.style.fontSize = (s * Type.evaluate(this.label.visProp.fontsize)) + 'px';
                        this.label.fullUpdate();
                    }

                    this.point2.coords = (Const.COORDS_BY_USER, [
                        this.point1.coords.usrCoords[1] + dx * f,
                        this.point1.coords.usrCoords[2] + dy * f
                    ], this.board);
                    this.fullUpdate();
                },

                highlightFun = function () {
                    if (!this.highlighted) {
                        this.highlighted = true;
                        this.board.highlightedObjects[this.id] = this;
                        this.board.renderer.highlight(this);

                        highlightHandleLabel.call(this, 1.1, 2);
                    }
                },

                noHighlightFun = function () {
                    if (this.highlighted) {
                        this.highlighted = false;
                        this.board.renderer.noHighlight(this);

                        highlightHandleLabel.call(this, 0.90909090, 1);
                    }
                },

                hiddenPoint = {
                    fixed: true,
                    withLabel: false,
                    visible: false,
                    name: ''
                };

            if (!Type.isArray(labelArray)) {
                labelArray = [];
                for (i = 0; i < y.length; i++) {
                    labelArray[i] = '';
                }
            }

            if (!Type.isFunction(r)) {
                radius = function () {
                    return r;
                };
            }

            attributes.highlightonsector = attributes.highlightonsector || false;
            attributes.straightfirst = false;
            attributes.straightlast = false;

            center = board.create('point', [xc, yc], hiddenPoint);
            p[0] = board.create('point', [
                function () {
                    return radius() + xc;
                },
                function () {
                    return yc;
                }
            ], hiddenPoint);

            for (i = 0; i < y.length; i++) {
                p[i + 1] = board.create('point', [makeRadPointFun(i, 'cos', xc), makeRadPointFun(i, 'sin', yc)], hiddenPoint);

                attributes.name = labelArray[i];
                attributes.withlabel = attributes.name !== '';
                attributes.fillcolor = colorArray && colorArray[i % colorArray.length];
                attributes.labelcolor = colorArray && colorArray[i % colorArray.length];
                attributes.highlightfillcolor = highlightColorArray && highlightColorArray[i % highlightColorArray.length];

                sector[i] = board.create('sector', [center, p[i], p[i + 1]], attributes);

                if (attributes.highlightonsector) {
                    // overwrite hasPoint so that the whole sector is used for highlighting
                    sector[i].hasPoint = sector[i].hasPointSector;
                }
                if (attributes.highlightbysize) {
                    sector[i].highlight = highlightFun;

                    sector[i].noHighlight = noHighlightFun;
                }

            }

            // Not enough! We need points, but this gives an error in setAttribute.
            return {sectors: sector, points: p, midpoint: center};
        },

        /*
         * labelArray=[ row1, row2, row3 ]
         * paramArray=[ paramx, paramy, paramz ]
         * parents=[[x1, y1, z1], [x2, y2, z2], [x3, y3, z3]]
         */

        /**
         * anonymous function - description
         *
         * @param  {type} board      description
         * @param  {Array} parents    description
         * @param  {type} attributes description
         * @returns {type}            description
         */
        drawRadar: function (board, parents, attributes) {
            var i, j, paramArray, numofparams, maxes, mins,
                la, pdata, ssa, esa, ssratio, esratio,
                sshifts, eshifts, starts, ends,
                labelArray, colorArray, highlightColorArray, radius, myAtts,
                cent, xc, yc, center, start_angle, rad, p, line, t,
                xcoord, ycoord, polygons, legend_position, circles, lxoff, lyoff,
                cla, clabelArray, ncircles, pcircles, angle, dr, sw, data,
                len = parents.length,

                get_anchor = function () {
                    var x1, x2, y1, y2,
                        relCoords = Type.evaluate(this.visProp.label.offset).slice(0);

                    x1 = this.point1.X();
                    x2 = this.point2.X();
                    y1 = this.point1.Y();
                    y2 = this.point2.Y();
                    if (x2 < x1) {
                        relCoords[0] = -relCoords[0];
                    }

                    if (y2 < y1) {
                        relCoords[1] = -relCoords[1];
                    }

                    this.setLabelRelativeCoords(relCoords);

                    return new Coords(Const.COORDS_BY_USER, [this.point2.X(), this.point2.Y()], this.board);
                },

                get_transform = function (angle, i) {
                    var t, tscale, trot;

                    t = board.create('transform', [-(starts[i] - sshifts[i]), 0], {type: 'translate'});
                    tscale = board.create('transform', [radius / ((ends[i] + eshifts[i]) - (starts[i] - sshifts[i])), 1], {type: 'scale'});
                    t.melt(tscale);
                    trot = board.create('transform', [angle], {type: 'rotate'});
                    t.melt(trot);

                    return t;
                };

            if (len <= 0) {
                JXG.debug("No data");
                return;
            }
            // labels for axes
            paramArray = attributes.paramarray;
            if (!Type.exists(paramArray)) {
                JXG.debug("Need paramArray attribute");
                return;
            }
            numofparams = paramArray.length;
            if (numofparams <= 1) {
                JXG.debug("Need more than 1 param");
                return;
            }

            for (i = 0; i < len; i++) {
                if (numofparams !== parents[i].length) {
                    JXG.debug("Use data length equal to number of params (" + parents[i].length + " != " + numofparams + ")");
                    return;
                }
            }

            maxes = [];
            mins = [];

            for (j = 0; j < numofparams; j++) {
                maxes[j] = parents[0][j];
                mins[j] = maxes[j];
            }

            for (i = 1; i < len; i++) {
                for (j = 0; j < numofparams; j++) {
                    if (parents[i][j] > maxes[j]) {
                        maxes[j] = parents[i][j];
                    }

                    if (parents[i][j] < mins[j]) {
                        mins[j] = parents[i][j];
                    }
                }
            }

            la = [];
            pdata = [];

            for (i = 0; i < len; i++) {
                la[i] = '';
                pdata[i] = [];
            }

            ssa = [];
            esa = [];

            // 0 <= Offset from chart center <=1
            ssratio = attributes.startshiftratio || 0;
            // 0 <= Offset from chart radius <=1
            esratio = attributes.endshiftratio || 0;

            for (i = 0; i < numofparams; i++) {
                ssa[i] = (maxes[i] - mins[i]) * ssratio;
                esa[i] = (maxes[i] - mins[i]) * esratio;
            }

            // Adjust offsets per each axis
            sshifts = attributes.startshiftarray || ssa;
            eshifts = attributes.endshiftarray || esa;
            // Values for inner circle, minimums by default
            starts = attributes.startarray || mins;

            if (Type.exists(attributes.start)) {
                for (i = 0; i < numofparams; i++) {
                    starts[i] = attributes.start;
                }
            }

            // Values for outer circle, maximums by default
            ends = attributes.endarray || maxes;
            if (Type.exists(attributes.end)) {
                for (i = 0; i < numofparams; i++) {
                    ends[i] = attributes.end;
                }
            }

            if (sshifts.length !== numofparams) {
                JXG.debug("Start shifts length is not equal to number of parameters");
                return;
            }

            if (eshifts.length !== numofparams) {
                JXG.debug("End shifts length is not equal to number of parameters");
                return;
            }

            if (starts.length !== numofparams) {
                JXG.debug("Starts length is not equal to number of parameters");
                return;
            }

            if (ends.length !== numofparams) {
                JXG.debug("Ends length is not equal to number of parameters");
                return;
            }

            // labels for legend
            labelArray = attributes.labelarray || la;
            colorArray = attributes.colors;
            highlightColorArray = attributes.highlightcolors;
            radius = attributes.radius || 10;
            sw = attributes.strokewidth || 1;

            if (!Type.exists(attributes.highlightonsector)) {
                attributes.highlightonsector = false;
            }

            myAtts = {
                name: attributes.name,
                id: attributes.id,
                strokewidth: sw,
                polystrokewidth: attributes.polystrokewidth || sw,
                strokecolor: attributes.strokecolor || 'black',
                straightfirst: false,
                straightlast: false,
                fillcolor: attributes.fillColor || '#FFFF88',
                fillopacity: attributes.fillOpacity || 0.4,
                highlightfillcolor: attributes.highlightFillColor || '#FF7400',
                highlightstrokecolor: attributes.highlightStrokeColor || 'black',
                gradient: attributes.gradient || 'none'
            };

            cent = attributes.center || [0, 0];
            xc = cent[0];
            yc = cent[1];
            center = board.create('point', [xc, yc], {name: '', fixed: true, withlabel: false, visible: false});
            start_angle = Math.PI / 2 - Math.PI / numofparams;
            start_angle = attributes.startangle || 0;
            rad = start_angle;
            p = [];
            line = [];

            for (i = 0; i < numofparams; i++) {
                rad += 2 * Math.PI / numofparams;
                xcoord = radius * Math.cos(rad) + xc;
                ycoord = radius * Math.sin(rad) + yc;

                p[i] = board.create('point', [xcoord, ycoord], {name: '', fixed: true, withlabel: false, visible: false});
                line[i] = board.create('line', [center, p[i]], {
                    name: paramArray[i],
                    strokeColor: myAtts.strokecolor,
                    strokeWidth: myAtts.strokewidth,
                    strokeOpacity: 1.0,
                    straightFirst: false,
                    straightLast: false,
                    withLabel: true,
                    highlightStrokeColor: myAtts.highlightstrokecolor
                });
                line[i].getLabelAnchor = get_anchor;
                t = get_transform(rad, i);

                for (j = 0; j < parents.length; j++) {
                    data = parents[j][i];
                    pdata[j][i] = board.create('point', [data, 0], {name: '', fixed: true, withlabel: false, visible: false});
                    pdata[j][i].addTransform(pdata[j][i], t);
                }
            }

            polygons = [];
            for (i = 0; i < len; i++) {
                myAtts.labelcolor = colorArray && colorArray[i % colorArray.length];
                myAtts.strokecolor = colorArray && colorArray[i % colorArray.length];
                myAtts.fillcolor = colorArray && colorArray[i % colorArray.length];
                polygons[i] = board.create('polygon', pdata[i], {
                    withLines: true,
                    withLabel: false,
                    fillColor: myAtts.fillcolor,
                    fillOpacity: myAtts.fillopacity,
                    highlightFillColor: myAtts.highlightfillcolor
                });

                for (j = 0; j < numofparams; j++) {
                    polygons[i].borders[j].setAttribute('strokecolor:' + colorArray[i % colorArray.length]);
                    polygons[i].borders[j].setAttribute('strokewidth:' + myAtts.polystrokewidth);
                }
            }

            legend_position = attributes.legendposition || 'none';
            switch (legend_position) {
            case 'right':
                lxoff = attributes.legendleftoffset || 2;
                lyoff = attributes.legendtopoffset || 1;

                this.legend = board.create('legend', [xc + radius + lxoff, yc + radius - lyoff], {
                    labels: labelArray,
                    colors: colorArray
                });
                break;
            case 'none':
                break;
            default:
                JXG.debug('Unknown legend position');
            }

            circles = [];
            if (attributes.showcircles) {
                cla = [];
                for (i = 0; i < 6; i++) {
                    cla[i] = 20 * i;
                }
                cla[0] = "0";
                clabelArray = attributes.circlelabelarray || cla;
                ncircles = clabelArray.length;

                if (ncircles < 2) {
                    JXG.debug("Too less circles");
                    return;
                }

                pcircles = [];
                angle = start_angle + Math.PI / numofparams;
                t = get_transform(angle, 0);

                myAtts.fillcolor = 'none';
                myAtts.highlightfillcolor = 'none';
                myAtts.strokecolor = attributes.strokecolor || 'black';
                myAtts.strokewidth = attributes.circlestrokewidth || 0.5;
                myAtts.layer = 0;

                // we have ncircles-1 intervals between ncircles circles
                dr = (ends[0] - starts[0]) / (ncircles - 1);

                for (i = 0; i < ncircles; i++) {
                    pcircles[i] = board.create('point', [starts[0] + i * dr, 0], {
                        name: clabelArray[i],
                        size: 0,
                        fixed: true,
                        withLabel: true,
                        visible: true
                    });
                    pcircles[i].addTransform(pcircles[i], t);
                    circles[i] = board.create('circle', [center, pcircles[i]], myAtts);
                }

            }
            this.rendNode = polygons[0].rendNode;
            return {
                circles: circles,
                lines: line,
                points: pdata,
                midpoint: center,
                polygons: polygons
            };
        },

         /**
          * Uses the boards renderer to update the chart.
          * @private
          */
        updateRenderer: function () {
            return this;
        },

         // documented in base/element
        update: function () {
            if (this.needsUpdate) {
                this.updateDataArray();
            }

            return this;
        },

        /**
         * Template for dynamic charts update.
         * This method is used to compute new entries
         * for the arrays this.dataX and
         * this.dataY. It is used in update.
         * Default is an empty method, can be overwritten
         * by the user.
         *
         * @returns {JXG.Chart} Reference to this chart object.
         */
        updateDataArray: function () { return this; }
    });

    /**
     * @class Constructor for a chart.
     * @pseudo
     * @description
     * @name Chart
     * @augments JXG.Chart
     * @constructor
     * @type JXG.Chart
     * @throws {Exception} If the element cannot be constructed with the given parent objects an exception is thrown.
     * @param {JXG.Point,array,function_JXG.Point,array,function} point1,point2 Parent elements can be two elements either of type {@link JXG.Point} or array of
     * numbers describing the coordinates of a point. In the latter case the point will be constructed automatically as a fixed invisible point.
     * It is possible to provide a function returning an array or a point, instead of providing an array or a point.
     * @param {Number,function_Number,function_Number,function} c,a,b A line can also be created providing three numbers. The line is then described by
     * the set of solutions of the equation <tt>a*x+b*y+c*z = 0</tt>. It is possible to provide three functions returning numbers, too.
     * @param {function} f This function must return an array containing three numbers forming the line's homogeneous coordinates.
     * <p>
     * Additionally, a line can be created by providing a line and a transformation (or an array of transformations).
     * Then, the result is a line which is the transformation of the supplied line.
     * @example
     * // Create a line using point and coordinates/
     * // The second point will be fixed and invisible.
     * var p1 = board.create('point', [4.5, 2.0]);
     * var l1 = board.create('line', [p1, [1.0, 1.0]]);
     * </pre><div class="jxgbox" id="JXGc0ae3461-10c4-4d39-b9be-81d74759d122" style="width: 300px; height: 300px;"></div>
     * <script type="text/javascript">
     *   var glex1_board = JXG.JSXGraph.initBoard('JXGc0ae3461-10c4-4d39-b9be-81d74759d122', {boundingbox: [-1, 7, 7, -1], axis: true, showcopyright: false, shownavigation: false});
     *   var glex1_p1 = glex1_board.create('point', [4.5, 2.0]);
     *   var glex1_l1 = glex1_board.create('line', [glex1_p1, [1.0, 1.0]]);
     * </script><pre>
     */
    JXG.createChart = function (board, parents, attributes) {
        var data, row, i, j, col,
            charts = [],
            w, x, showRows, attr,
            originalWidth, name, strokeColor, fillColor,
            hStrokeColor, hFillColor, len,
            table = Env.isBrowser ? board.document.getElementById(parents[0]) : null;

        if ((parents.length === 1) && (Type.isString(parents[0]))) {
            if (Type.exists(table)) {
                // extract the data
                attr = Type.copyAttributes(attributes, board.options, 'chart');

                table = (new DataSource()).loadFromTable(parents[0], attr.withheaders, attr.withheaders);
                data = table.data;
                col = table.columnHeaders;
                row = table.rowHeaders;

                originalWidth = attr.width;
                name = attr.name;
                strokeColor = attr.strokecolor;
                fillColor = attr.fillcolor;
                hStrokeColor = attr.highlightstrokecolor;
                hFillColor = attr.highlightfillcolor;

                board.suspendUpdate();

                len = data.length;
                showRows = [];
                if (attr.rows && Type.isArray(attr.rows)) {
                    for (i = 0; i < len; i++) {
                        for (j = 0; j < attr.rows.length; j++) {
                            if ((attr.rows[j] === i) || (attr.withheaders && attr.rows[j] === row[i])) {
                                showRows.push(data[i]);
                                break;
                            }
                        }
                    }
                } else {
                    showRows = data;
                }

                len = showRows.length;

                for (i = 0; i < len; i++) {

                    x = [];
                    if (attr.chartstyle && attr.chartstyle.indexOf('bar') !== -1) {
                        if (originalWidth) {
                            w = originalWidth;
                        } else {
                            w = 0.8;
                        }

                        x.push(1 - w / 2 + (i + 0.5) * w / len);

                        for (j = 1; j < showRows[i].length; j++) {
                            x.push(x[j - 1] + 1);
                        }

                        attr.width = w / len;
                    }

                    if (name && name.length === len) {
                        attr.name = name[i];
                    } else if (attr.withheaders) {
                        attr.name = col[i];
                    }

                    if (strokeColor && strokeColor.length === len) {
                        attr.strokecolor = strokeColor[i];
                    } else {
                        attr.strokecolor = Color.hsv2rgb(((i + 1) / len) * 360, 0.9, 0.6);
                    }

                    if (fillColor && fillColor.length === len) {
                        attr.fillcolor = fillColor[i];
                    } else {
                        attr.fillcolor = Color.hsv2rgb(((i + 1) / len) * 360, 0.9, 1.0);
                    }

                    if (hStrokeColor && hStrokeColor.length === len) {
                        attr.highlightstrokecolor = hStrokeColor[i];
                    } else {
                        attr.highlightstrokecolor = Color.hsv2rgb(((i + 1) / len) * 360, 0.9, 1.0);
                    }

                    if (hFillColor && hFillColor.length === len) {
                        attr.highlightfillcolor = hFillColor[i];
                    } else {
                        attr.highlightfillcolor = Color.hsv2rgb(((i + 1) / len) * 360, 0.9, 0.6);
                    }

                    if (attr.chartstyle && attr.chartstyle.indexOf('bar') !== -1) {
                        charts.push(new JXG.Chart(board, [x, showRows[i]], attr));
                    } else {
                        charts.push(new JXG.Chart(board, [showRows[i]], attr));
                    }
                }

                board.unsuspendUpdate();

            }
            return charts;
        }

        attr = Type.copyAttributes(attributes, board.options, 'chart');
        return new JXG.Chart(board, parents, attr);
    };

    JXG.registerElement('chart', JXG.createChart);

    /**
     * Legend for chart
     * TODO
     *
     * The Chart class is a basic class for all kind of line objects, e.g. line, arrow, and axis. It is usually defined by two points and can
     * be intersected with some other geometry elements.
     * @class Creates a new basic line object. Do not use this constructor to create a line.
     * Use {@link JXG.Board#create} with
     * type {@link Line}, {@link Arrow}, or {@link Axis} instead.
     * @constructor
     * @augments JXG.GeometryElement
     * @param {String,JXG.Board} board The board the new line is drawn on.
     * @param {Point} p1 Startpoint of the line.
     * @param {Point} p2 Endpoint of the line.
     * @param {String} id Unique identifier for this object. If null or an empty string is given,
     * an unique id will be generated by Board
     * @param {String} name Not necessarily unique name. If null or an
     * empty string is given, an unique name will be generated.
     * @param {Boolean} withLabel construct label, yes/no
     * @param {Number} layer display layer [0-9]
     * @see JXG.Board#generateName
     */
    JXG.Legend = function (board, coords, attributes) {
        var attr;

        /* Call the constructor of GeometryElement */
        this.constructor();

        attr = Type.copyAttributes(attributes, board.options, 'legend');

        this.board = board;
        this.coords = new Coords(Const.COORDS_BY_USER, coords, this.board);
        this.myAtts = {};
        this.label_array = attr.labelarray || attr.labels;
        this.color_array = attr.colorarray || attr.colors;
        this.lines = [];
        this.myAtts.strokewidth = attr.strokewidth || 5;
        this.myAtts.straightfirst = false;
        this.myAtts.straightlast = false;
        this.myAtts.withlabel = true;
        this.myAtts.fixed = true;
        this.style = attr.legendstyle || attr.style;

        if (this.style === 'vertical') {
            this.drawVerticalLegend(board, attr);
        } else {
            throw new Error('JSXGraph: Unknown legend style: ' + this.style);
        }
    };

    JXG.Legend.prototype = new GeometryElement();

    JXG.Legend.prototype.drawVerticalLegend = function (board, attributes) {
        var i,
            line_length = attributes.linelength || 1,
            offy = (attributes.rowheight || 20) / this.board.unitY,

            getLabelAnchor = function () {
                this.setLabelRelativeCoords(this.visProp.label.offset);
                return new Coords(Const.COORDS_BY_USER, [this.point2.X(), this.point2.Y()], this.board);
            };

        for (i = 0; i < this.label_array.length; i++) {
            this.myAtts.strokecolor = this.color_array[i];
            this.myAtts.highlightstrokecolor = this.color_array[i];
            this.myAtts.name = this.label_array[i];
            this.myAtts.label = {
                offset: [10, 0],
                strokeColor: this.color_array[i],
                strokeWidth: this.myAtts.strokewidth
            };

            this.lines[i] = board.create('line', [
                [this.coords.usrCoords[1], this.coords.usrCoords[2] - i * offy],
                [this.coords.usrCoords[1] + line_length, this.coords.usrCoords[2] - i * offy]],
                this.myAtts);

            this.lines[i].getLabelAnchor = getLabelAnchor;

        }
    };

    /**
     * TODO Legend docs
     * @class This element is used to provide a constructor for a general line. A general line is given by two points. By setting additional properties
     * a line can be used as an arrow and/or axis.
     * @pseudo
     * @description
     * @name Line
     * @augments JXG.Line
     * @constructor
     * @type JXG.Line
     * @throws {Exception} If the element cannot be constructed with the given parent objects an exception is thrown.
     * @param {JXG.Point,array,function_JXG.Point,array,function} point1,point2 Parent elements can be two elements either of type {@link JXG.Point} or array of
     * numbers describing the coordinates of a point. In the latter case the point will be constructed automatically as a fixed invisible point.
     * It is possible to provide a function returning an array or a point, instead of providing an array or a point.
     * @param {Number,function_Number,function_Number,function} c,a,b A line can also be created providing three numbers. The line is then described by
     * the set of solutions of the equation <tt>a*x+b*y+c*z = 0</tt>. It is possible to provide three functions returning numbers, too.
     * @param {function} f This function must return an array containing three numbers forming the line's homogeneous coordinates.
     * <p>
     * Additionally, a line can be created by providing a line and a transformation (or an array of transformations).
     * Then, the result is a line which is the transformation of the supplied line.
     * @example
     * // Create a line using point and coordinates/
     * // The second point will be fixed and invisible.
     * var p1 = board.create('point', [4.5, 2.0]);
     * var l1 = board.create('line', [p1, [1.0, 1.0]]);
     * </pre><div class="jxgbox" id="JXGc0ae3461-10c4-4d39-b9be-81d74759d122" style="width: 300px; height: 300px;"></div>
     * <script type="text/javascript">
     *   var glex1_board = JXG.JSXGraph.initBoard('JXGc0ae3461-10c4-4d39-b9be-81d74759d122', {boundingbox: [-1, 7, 7, -1], axis: true, showcopyright: false, shownavigation: false});
     *   var glex1_p1 = glex1_board.create('point', [4.5, 2.0]);
     *   var glex1_l1 = glex1_board.create('line', [glex1_p1, [1.0, 1.0]]);
     * </script><pre>
     */
    JXG.createLegend = function (board, parents, attributes) {
        //parents are coords of left top point of the legend
        var start_from = [0, 0];

        if (Type.exists(parents)) {
            if (parents.length === 2) {
                start_from = parents;
            }
        }

        return new JXG.Legend(board, start_from, attributes);
    };

    JXG.registerElement('legend', JXG.createLegend);

    return {
        Chart: JXG.Chart,
        Legend: JXG.Legend,
        createChart: JXG.createChart,
        createLegend: JXG.createLegend
    };
});
