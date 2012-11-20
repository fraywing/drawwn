/*
 *Copyright 2012 Dyologic LLC.
 *Author: Austin Anderson
 *Use under MIT license
 *
 *uses oCanvas by koggdal : https://github.com/koggdal/ocanvas,
 color picker by eyecon :  http://www.eyecon.ro/colorpicker/,
 and simple slider by loopj: https://github.com/loopj/jquery-simple-slider
 */

(function ($) {
    var methods = {
        loaded: false,
        global: null,
        objectList: null,
        opts: {
            "tools": {
                "circle": true,
                    "arrow": true,
                    "line": true,
                    "text": true,
                    "magnify": true,
                    "freehand": true,
                    "selector" : true
            },
                "loadImage": true,
                "exportImage": function (image) {

            },
                "zoom": true,
                "colors": true,
                "height": "500",
                "width": "500",
                "brushSize": 3,
                "brushColor": "#00AAAA"
        },
        init: function (o, el) {

            var self = this;
            this.opts = $.extend(this.opts, o);
            this.global = el.data();
            this.global.options = this.opts;
            this.global.id = el.attr('id');
            this.global.currentTool = undefined;
            this.global.selectors = [];
            if (!el.html()) {
                el.attr('class', 'drawwn');
                el.html("<canvas id='draw_" + el.attr('id') + "'></canvas>");

            }
            $("#draw_" + el.attr('id')).css({
                "cursor": "crosshair"
            });
            $('#draw_' + el.attr('id')).css({
                "height": self.global.options.height,
                "width": self.global.options.width
            });

            $('#draw_' + el.attr('id')).after('<div class="drawwn_under"><div class="drawwn_other"></div></div>');
            $('#' + el.attr('id')).find('.drawwn_other').append("<div class='export_image'>Finished</div>")
                .append('<div class="draw_undo">Undo</div>')
                .append("<div class='clear_image'>Clear</div>");
            self.loadTools(self.global);

            $('#' + el.attr('id')).find('.drawwn_under').after('<div class="drawwn_settings"><div class="drawwn_slider"><input type="text" data-slider="true" value="3" data-slider-range="2,12" data-slider-step="1"><span>15%</span></div><div class="drawwn_colorpicker"></div></div>');
            $.getScript('inc/colorpicker/js/colorpicker.js', function () {
                $('#' + el.attr('id')).find('.drawwn_colorpicker').ColorPicker({
                    onShow: function (colpkr) {
                        $(colpkr).fadeIn(500);
                        return false;
                    },
                    onHide: function (colpkr) {
                        $(colpkr).fadeOut(500);
                        return false;
                    },
                    onChange: function (hsb, hex, rgb) {
                        $('#' + el.attr('id')).find('.drawwn_colorpicker').css('backgroundColor', '#' + hex);
                        self.opts.brushColor = '#' + hex;
                    }
                });
            });

            $.getScript('inc/slider/js/simple-slider.min.js', function () {

                $('#' + el.attr('id')).find('.drawwn_slider input')
                    .bind("slider:changed", function (event, data) {
                    // The currently selected value of the slider
                    self.opts.brushSize = data.value;
                    var size = ~~(data.ratio * 100)+"%";
                    $(this).siblings('span').html(size) ;

                });



            });

            $('#' + self.global.id).find('.draw_undo').click(function () { //undo function
                self.undo(self.objectList);
            });
            $('#' + self.global.id).find('.export_image').click(function () { //export image callback handler
                var notif = confirm("Are you sure you are done with your changes?");
                if (notif == true) {
                    var can = $('#' + self.global.id).find('canvas')[0].toDataURL();
                    self.opts.exportImage(can);
                }
            });
            $('#' + self.global.id).find('.clear_image').click(function () { 

                var notif = confirm("Are you sure you want to remove Everything?");
                if (notif == true) {
                    self.canvas.reset();
                } else {

                }
            });
            $.getScript("js/ocanvas.js", function () { //get oscanvas, on load, do everything else
                var canvas = oCanvas.create({
                    canvas: "#draw_" + self.global.id,
                    background: self.global.options.background,
                    fps: 40,
                    disableScrolling: true
                });
                canvas.width = self.global.options.width;
                canvas.height = self.global.options.height;
                self.canvas = canvas;
                self.loaded = true;

                self.canvas.bind("mousedown touchstart", function (e) {

                    var canv = self.canvas;
                    var point = canv.pointer;
                    var curtool = self.global.currentTool !== undefined ? self.global.currentTool : "nope";
                    var drawthing = self.tools[curtool](self.canvas, e, self.opts);
                    if (drawthing) {

                        if (drawthing.jquery !== undefined) {

                        } else if (drawthing.children !== undefined) {

                            canv.addChild(drawthing);


                        } else if(drawthing !== "selector"){
                            canv.addChild(drawthing.line);
                            canv.addChild(drawthing.arrow);

                        }else{
                            
                        }

                        if (curtool == "drawwn_tool_line") {
                            canv.mouse.hide();
                             drawthing.bind("click tap", function(e){
                              self.select(self.global,drawthing,e,self.canvas)
                              });
                            canv.setLoop(function () {

                                drawthing.end = {
                                    x: point.x,
                                    y: point.y
                                };
                            }).start();
                        } else if (curtool == "drawwn_tool_freehand") {

                            canv.setLoop(function () {
                                var newdraw = self.tools[curtool](self.canvas, e, self.opts);

                                newdraw.end = {
                                    x: point.x,
                                    y: point.y
                                };
                            }).start();

                        } else if (curtool == "drawwn_tool_circle") {
                           drawthing.bind("click tap", function(e){
                              self.select(self.global,drawthing,e,self.canvas)
                              });
                            try {
                                canv.mouse.hide();
                                var thisX = drawthing.x;
                                var thisY = drawthing.y;

                                canv.setLoop(function () {

                                    drawthing.radius_x = (canv.pointer.x - drawthing.x);
                                    drawthing.radius_y = (canv.pointer.y - drawthing.y);

                                }).start();
                            } catch (e) {

                            }
                        } else if (curtool == "drawwn_tool_arrow") {
                            canv.mouse.hide();
                             drawthing.arrow.bind("click tap", function(e){
                              self.select(self.global,drawthing.arrow,e,self.canvas)
                              });
                             drawthing.line.bind("click tap", function(e){
                              self.select(self.global,drawthing.line,e,self.canvas)
                              });
                            line = drawthing.line,
                            arrow = drawthing.arrow;
                           
                            canv.setLoop(function () {

                                line.end = {
                                    x: point.x,
                                    y: point.y
                                };
                                arrow.x = line.end.x;
                                arrow.y = line.end.y;
                                arrow.rotation = Math.atan2(line.start.y - arrow.y, line.start.x - arrow.x) * (180 / Math.PI) - 60; //math atan2 outputs radians, to get degrees we multiply by 180 and divide by Math PI

                            }).start();

                        } else if (curtool == "drawwn_tool_text") {
                            var px = point.x;
                            var py = point.y;
                            
                            $(drawthing).unbind('click').
                            bind('click', function () {
                                //console.log(self.opts.brushSize);
                                var val = $(this).siblings('input').val();
                                var text = canv.display.text({
                                    size: self.opts.brushSize + 'px',
                                    text: val,
                                    origin: {
                                        x: "center",
                                        y: "top"
                                    },
                                    font: "bold " + (self.opts.brushSize * 12) + 'px' + " sans-serif",
                                    fill: self.opts.brushColor,
                                    x: px,
                                    y: py
                                });
                                 text.bind("click tap", function(e){
                              self.select(self.global,text,e,self.canvas)
                              });
                                canv.addChild(text);
                                $(drawthing).parent().remove();
                            });

                        } else if (curtool == "drawwn_tool_selector") {
                           
                        } else {
                            alert('no tool selected');
                        }
                    } else {
                        alert('no tool selected');
                    }
                });

                self.canvas.bind("mouseup touchend", function (e) { //resets the mouse and stops the loop timeline
                    self.canvas.timeline.stop();
                    self.canvas.mouse.show();
                      $("#draw_" + el.attr('id')).css({
                "cursor": "crosshair"
            });
                    self.objectList = self.canvas;
                });
            });
            var drawwn = {};
            var loadImage = function (o) {
                var img = new Image();
                img.onload = function () {
                    var width = this.width;
                    var height = this.height;
                    var heightpx = this.height + "px";
                    var widthpx = this.width + "px";
                    var cImg = self.canvas.display.image({
                        x: 0,
                        y: 0,
                        orgin: {
                            x: "center",
                            y: "center"
                        },
                        image: o
                    });
                    //console.log(cImg.width);
                    self.canvas.addChild(cImg);
                    var cImg = self.canvas.display.image({
                        x: 0,
                        y: 0,
                        orgin: {
                            x: "center",
                            y: "center"
                        },
                        image: o
                    });
                    self.canvas.addChild(cImg);
                    self.objectList = self.canvas;
                    self.canvas.width = width;
                    self.canvas.height = height;

                    $('#' + self.global.id).find('canvas').css({
                        "width": width,
                        "height": height
                    });
                }
                img.src = o;


            };
            var exportImage = function (o) {


            };
            var waitTillReady = function (fun) {
                var tim;
                tim = setInterval(function () {
                    if (self.loaded == true) {
                        clearInterval(tim);
                        fun({
                            canvas: self.canvas,
                            exportImage: exportImage,
                            loadImage: loadImage,
                            loaded: self.loaded
                        });
                    }
                }, 200);
            };

            drawwn.waitTillReady = waitTillReady;

            return drawwn;
        },
        select : function(global,drawthing,event,canvas){
            if(global.currentTool == "drawwn_tool_selector"){
               if(drawthing.family !== undefined){
                  var globalx = drawthing.width;
                   var globaly = drawthing.height;
                   
               }
               else if(drawthing.radius_y == 0 && drawthing.radius_x == 0){
                  var globalx = drawthing.width;
                   var globaly = drawthing.height;
             
               }else if(drawthing.type == "ellipse"){
                 var  globalx = drawthing.radius_x;
                  var globaly = drawthing.radius_y;
                  
               }else{
                  var  globalx = drawthing.radius;
                  var globaly = drawthing.radius;
                       
               }

	                   var rect = canvas.display.rectangle({
                              x : drawthing.x - globalx - 5,
                              y : drawthing.y - globaly - 5,
                              width : globalx * 2 + 10,
                              opacity : 0.3,
                              height : globaly * 2 + 10,
                              stroke : "2px red"
                              
                              });
                           if(global.selectors.length != 0){
                              for(var x = 0; x<global.selectors.length;x++){
                                 canvas.removeChild(global.selectors[x]);
                              }
                           }
                           
                                                      canvas.addChild(rect);
                                                      rect.bind('mousedown touchstart', function(e){
                                                         rect.unbind('mouseup touchend');
                                                           canvas.setLoop(function () {
                                                         
                                                               drawthing.x = canvas.pointer.x;
                                                              drawthing.y = canvas.pointer.y;
                                                                rect.x = drawthing.x - globalx - 5;
                                                              rect.y = drawthing.y - globaly - 5;
                                                            
                                                            }).start();
                                                         })
                                                      canvas.unbind('keydown').bind("keydown", function(e){
                                                         if(e.which == 46){
                                                            canvas.removeChild(rect);
                                                            canvas.removeChild(drawthing);
                                                         }
                                                         });
                                                      canvas.bind('mouseup touchend', function(){
                                                      canvas.timeline.stop();
                                                      rect.unbind('mousedown touchstart');
                                                         });
                                                      global.selectors.push(rect);
                                                     
                           }
                           

         
        },
        undo: function (o) {
            var self = this;

            var child = o.children[o.children.length - 1];

            if (child === undefined) {
                return false;
            } else if (child.sides !== undefined && child.sides == 3) {
                o.removeChild(o.children[o.children.length - 1]);
                o.removeChild(o.children[o.children.length - 1]);
            } else {
                o.removeChild(o.children[o.children.length - 1]);
            }

        },
        loadTools: function (o) {
            var self = this;
            var id = o.id,
                tool = "tools_" + id;

            $('#' + id).find('.drawwn_under').append("<div class='drawwn_toolset'></div>");
            $('#' + id).find('.drawwn_toolset').append("<div class='" + tool + "'></div>");
            self.tools.global = self.global;
            for (var i in o.options.tools) {
                if (o.options.tools[i] == true) {
                    $('.' + tool).append("<div class='drawwn_tool' value='drawwn_tool_" + i + "'>" + i + "</div>");
                }
            }
            $('#' + id).find(".drawwn_tool").bind('click', function () {
               $(this).parents('.drawwn').find('.drawwn_textbox').remove();
               if(self.global.selectors.length != 0){
                              for(var x = 0; x<self.global.selectors.length;x++){
                                 self.canvas.removeChild(self.global.selectors[x]);
                              }
                           }
               if(!$(this).hasClass('drawwn_select')){
                $('#' + id).find('.drawwn_tool').removeClass('drawwn_select');
                $(this).addClass('drawwn_select');
                if (self.loaded) {
                    var cal = $(this).attr('value');
                    self.global.currentTool = cal;
                } else {

                }
                }else{
                  $('#' + id).find('.drawwn_tool').removeClass('drawwn_select');
                  self.global.currentTool = undefined;
                }
                
            });

        },
        tools: {
            global: null,
            drawwn_tool_line: function (canvas, o, global) {
                // console.log(global.brushSize);
                posX = canvas.pointer.x;
                posY = canvas.pointer.y;
                var line = canvas.display.line({
                    start: {
                        x: posX,
                        y: posY
                    },
                    end: {
                        x: posX,
                        y: posY
                    },
                    stroke: global.brushSize + " " + global.brushColor,
                    cap: "round"
                });
                return line;
            },
            drawwn_tool_arrow: function (canvas, o, global) {

                posX = canvas.pointer.x;
                posY = canvas.pointer.y;
                var line = canvas.display.line({
                    start: {
                        x: posX,
                        y: posY
                    },
                    end: {
                        x: posX,
                        y: posY
                    },
                    stroke: global.brushSize + " " + global.brushColor,
                    cap: "flat"
                });
                var arrow = canvas.display.polygon({
                    sides: 3,
                    radius: global.brushSize * 3 + 4,
                    rotation: 360,
                    x: posX,
                    y: posY,
                    fill: global.brushColor
                });
                return {
                    "line": line,
                    "arrow": arrow
                };
            },
            drawwn_tool_magnify: function (o) {

            },
            drawwn_tool_circle: function (canvas, o, global) {
                try {
                    posX = canvas.pointer.x;
                    posY = canvas.pointer.y;
                    var circle = canvas.display.ellipse({
                        x: posX,
                        y: posY,
                        stroke: global.brushSize + " " + global.brushColor
                    });
                    console.log(circle);
                    return circle;
                } catch (e) {

                }
            },
            drawwn_tool_freehand: function (canvas, o, global) {

                posX = canvas.pointer.x;
                posY = canvas.pointer.y;
                var freehand = canvas.display.ellipse({
                    start: {
                        x: posX,
                        y: posY
                    },
                    end: {
                        x: posX,
                        y: posY
                    },
                    stroke: global.brushSize + " " + global.brushColor,
                    cap: "round"
                });
                return freehand;

            },
            drawwn_tool_text: function (canvas, o, global) {
                posX = canvas.pointer.x;
                posY = canvas.pointer.y;

                var parentr = $('#' + this.global.id);
                parentr.append('<div class="drawwn_textbox">\
                                     <input type="text">\
                                     <button>done</button>\
                                     </div>');
                parentr.find('.drawwn_textbox').css({
                    "left": canvas.pointer.x,
                    "top": canvas.pointer.y
                });
                var dog = $(parentr).find('.drawwn_textbox button');
                return dog;

            },
            drawwn_tool_selector : function(canvas, o, global){
           
               return "selector";
            },
            nope: function (o) {
                return false;

            }

        }

    };


    $.fn.drawwn = function (opts) {
        var self = this;

        var drawwn = methods.init(opts, self);
        return drawwn;

    }
}(jQuery));