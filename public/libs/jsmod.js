if (!window.define && !window.require) {
    var define, require;

    (function(self) {
        var head = document.getElementsByTagName('head')[0],
            loadingMap = {},
            factoryMap = {},
            modulesMap = {},
            scriptsMap = {},
            resMap, pkgMap;


        function loadScript(id, callback) {
            var res = resMap[id] || {};
            var url = res.pkg ? pkgMap[res.pkg].url : (res.url || id);

            var queue = loadingMap[id] || (loadingMap[id] = []);
            queue.push(callback);

            if (url in scriptsMap) {
                return;
            }
            scriptsMap[url] = true;
            
            var script = document.createElement('script');
            script.type = 'text/javascript';
            script.src = url;
            head.appendChild(script);
        }

        define = function(id, factory) {
            factoryMap[id] = factory;

            var queue = loadingMap[id];
            if (queue) {
                for (var i = queue.length - 1; i >= 0; --i) {
                    queue[i]();
                }
                delete loadingMap[id];
            }
        };

        require = function(id) {
            id = require.alias(id);

            var mod = modulesMap[id];
            if (mod) {
                return mod.exports;
            }

            //
            // init module
            //
            var factory = factoryMap[id];
            if (!factory) {
                throw Error('Cannot find module `' + id + '`');
            }

            mod = modulesMap[id] = {
                'exports': {}
            };

            //
            // factory: function OR value
            //
            var ret = (typeof factory == 'function') ? factory.apply(mod, [require, mod.exports, mod]) : factory;

            if (ret) {
                mod.exports = ret;
            }
            return mod.exports;
        };

        require.async = function(names, callback) {
            if (typeof names == 'string') {
                names = [names];
            }

            for (var i = names.length - 1; i >= 0; --i) {
                names[i] = require.alias(names[i]);
            }

            var needMap = {};
            var needNum = 0;

            function findNeed(depArr) {
                for (var i = depArr.length - 1; i >= 0; --i) {
                    //
                    // skip loading or loaded
                    //
                    var dep = depArr[i];
                    if (dep in factoryMap || dep in needMap) {
                        continue;
                    }

                    needMap[dep] = true;
                    needNum++;
                    loadScript(dep, updateNeed);

                    var child = resMap[dep];
                    if (child && 'deps' in child) {
                        findNeed(child.deps);
                    }
                }
            }

            function updateNeed() {
                if (0 == needNum--) {
                    var i, args = [];
                    for (i = names.length - 1; i >= 0; --i) {
                        args[i] = require(names[i]);
                    }
                    callback && callback.apply(self, args);
                }
            }

            findNeed(names);
            updateNeed();
        };

        require.resourceMap = function(obj) {
            resMap = obj['res'] || {};
            pkgMap = obj['pkg'] || {};
        };

        require.alias = function(id) {
            return id
        };

        define.amd = {
            'jQuery': true,
            'version': '1.0.0'
        };

    })(this);
}
;/**
 * jsmod 主入口，版本、配置信息
 * 获取config信息，如果设置引入的 script 有data-config=baidu 则启用兼容模式
 * 兼容未发布时的版本
 * MIT Licensed
 */
define("jsmod/main", function(require, exports, module) {
    var script = $("script[src*='jsmod.js']"),
        config, template, reg;

    if (script.length > 0) {
        reg = /(^|&|\\?|#)config=([^&#]*)/

        // 两个可以进行设置config的的地方，希望后续删除此逻辑
        try {
            config = reg.exec(script.prop("src"))[2];
        } catch(e) {
            config = undefined;
        }
    }
    
    if (window.__jsmodConfig) {
        config = window.__jsmodConfig;
    }

    // Simple JavaScript Templating
    // John Resig - http://ejohn.org/ - MIT Licensed
    (function(){
      var cache = {};
     
      template = function tmpl(str, data){
        // Figure out if we're getting a template, or if we need to
        // load the template - and be sure to cache the result.
        var fn = !/\W/.test(str) ?
          cache[str] = cache[str] ||
            tmpl(document.getElementById(str).innerHTML) :
         
          // Generate a reusable function that will serve as a template
          // generator (and which will be cached).
          new Function("obj",
            "var p=[],print=function(){p.push.apply(p,arguments);};" +
           
            // Introduce the data as local variables using with(){}
            "with(obj){p.push('" +
           
            // Convert the template into pure JavaScript
            str
              .replace(/[\r\t\n]/g, " ")
              .split("<%").join("\t")
              .replace(/((^|%>)[^\t]*)'/g, "$1\r")
              .replace(/\t=(.*?)%>/g, "',$1,'")
              .split("\t").join("');")
              .split("%>").join("p.push('")
              .split("\r").join("\\'")
          + "');}return p.join('');");
       
        // Provide some basic currying to the user
        return data ? fn( data ) : fn;
      };
    })();

    module.exports = {
        version: "1.0.0",
        config: config,
        template: template,
        ie6: /msie 6/i.test(navigator.userAgent)
    }
});
;/**
 * carousel 轮播控件
 * @module jsmod/ui/carousel
 */
define("jsmod/ui/carousel", function (require, exports, module) {
    var main, _option;

    main = require("jsmod/main");

    _option = {
        count: 1,
        interval: 0,
        current: 0
    };

    /**
     * 基础的轮播控件，脱离 html、css。使用时传入基础数据，具体操作需要开发者实现
     * @constructor
     * @alias module:jsmod/ui/carousel
     * @param {string|dom} element            生成轮播控件的容器
     * @param {object}     option             配置参数
     * @param {string[]}   option.htmls       配置轮播的项目
     * @param {string}     [option.className] 自定义 className
     * @param {int}        [option.count=1]   每屏显示的个数
     * @param {int}        [option.current=0] 当前显示的位置
     */
    var Carousel = function (element, option) {
        var self = this;

        self.$element = $(element);
        self.option = $.extend({}, _option, option);
        self.total = self.option.htmls.length;

        self.init();
    }


    $.extend(Carousel.prototype, 
        /**
         * @lends module:jsmod/ui/carousel.prototype
         */
        {
            /**
             * 初始化数据等
             * @private
             */
            init: function () {
                var self = this,
                    option = self.option,
                    otherWidth, width;

                if (option.count == 1) {
                    option.htmls.push(option.htmls[0]);
                    option.htmls.unshift(option.htmls[self.total - 1]);
                }

                // 生成列表
                self.$list = $('<ul style="position: absolute; top: 0;" class="mod-carousel"></ul>')
                    .addClass(self.option.className);

                // 设置容器样式
                self.$element.css("position", "relative").css("overflow", "hidden").append(self.$list);

                // 创建列表数据
                $.each(option.htmls, function (i, str) {
                    var li;

                    if (option.count == 1) {
                        i -= 1;
                    }

                    li = $('<li style="float:left;" class="mod-carousel-item"></li>')
                        .attr("data-index", i)
                        .html(str)
                        .appendTo(self.$list);

                    if (main.ie6) {
                        li.css("overflow", "hidden");
                    }
                });

                // 取得单个 width
                otherWidth = self.getItem(0).outerWidth(true) - self.getItem(0).width();
                width = parseFloat((self.$element.width() / option.count).toFixed(2) - otherWidth);
                self.itemWidth = width + otherWidth;

                // 设置单个width、总体width
                self.$element.find(".mod-carousel-item").css("width", width);
                self.$list.css("width", self.itemWidth * option.htmls.length);

                self.cur(option.current);
            },
            /**
             * 显示前一个项目
             * @public
             * @param {function} callback 轮训动画完成后的回调
             * @param {bool}     [preventCur=false] 是否阻止设置当前项
             */
            pre: function (callback, preventCur) {
                return this.cur(this.index - 1, callback, preventCur);
            },
            /**
             * 显示下一个项目
             * @public
             * @param {function} callback 轮训动画完成后的回调
             * @param {bool}     [preventCur=false] 是否阻止设置当前项
             */
            next: function (callback, preventCur) {
                return this.cur(this.index + 1, callback, preventCur);
            },
            /**
             * 设置当前显示的项目
             * @public
             * @param {int}      index              项目索引
             * @param {function} callback           轮训动画完成后的回调
             * @param {bool}     [preventCur=false] 是否阻止设置当前项
             */
            cur: function (index, callback, preventCur) {
                var self = this,
                    option = self.option,
                    cutCount, pos, tempPos;

                if (option.count > 1 && index < 0) {
                    index = 0;
                }

                if (option.count > 1 && index > self.total - 1) {
                    index = self.total - 1;
                }

                // 两种处理逻辑
                if (option.count > 1) {
                    // 取得之前需要截取的个数
                    cutCount = Math.round((option.count / 2) - 0.001);
                    tempPos = index * self.itemWidth;

                    // 处理起始位置特殊情况
                    pos = tempPos - cutCount * self.itemWidth > 0 ? tempPos - cutCount * self.itemWidth : 0;

                    // 处理结束位置特殊情况
                    if (pos > 0 && pos + self.itemWidth * self.option.count > self.total * self.itemWidth) {
                        pos = self.total * self.itemWidth - self.itemWidth * self.option.count;
                    }

                    // 处理总数小于显示个数
                    pos = self.total <= self.option.count ? 0 : pos;

                    self.go(-pos, function () {
                        callback && callback(self.index);
                    });
                    return self.setCur(index, preventCur);
                } else {
                    // 如果是在最后一个触发向后
                    if (index == self.total) {
                        pos = (self.total + 1) * self.itemWidth;

                        self.cloneTo(0, self.total);

                        self.go(-pos, function () {
                            self.$list.css("left", -self.itemWidth);
                            callback && callback(self.index);
                        });
                        return self.setCur(0, preventCur);
                    }

                    // 如果是在第一个时触发向前
                    if (index == -1) {
                        pos = 0;

                        self.cloneTo(self.total - 1, -1);

                        self.go(-pos, function () {
                            self.$list.css("left", -((self.total - 1 + 1) * self.itemWidth));
                            callback && callback(self.index);
                        });
                        return self.setCur(self.total - 1, preventCur);
                    }

                    pos = (index + 1) * self.itemWidth;
                    self.go(-pos, function () {
                        callback && callback(self.index);
                    });
                    return self.setCur(index, preventCur);
                }
            },
            /**
             * 设置当前 item 的样式类
             * @private
             * @param {bool} [preventCur=false] 是否阻止设置当前项
             */
            setCur: function (index, preventCur) {
                var self = this, e;

                if (!preventCur) {
                    if (self.index !== undefined) {
                       self.getItem(self.index).removeClass("mod-carousel-item-cur");
                    }
                    self.index = index;
                    self.getItem(self.index).addClass("mod-carousel-item-cur");                    
                }

                /**
                 * 轮播发生时触发事件（早于动画完成）
                 * @event module:jsmod/ui/carousel#active
                 * @type {object}
                 * @property {int} index 当前 cur 状态的索引
                 */
                e = $.Event("active", {index: index});
                $(self).trigger(e);
                return index;
            },
            /**
             * 将一个 item 中内容复制到另外一个
             * @param {int} from 被复制的索引
             * @param {int} to   复制到的索引
             */
            cloneTo: function (from, to) {
                var self = this,
                    fromEl, toEl;

                fromEl = self.getItem(from);
                toEl = self.getItem(to);

                toEl.html(fromEl.html());
            },
            /**
             * 设置 left 到某个位置
             * @private
             */
            go: function (pos, cb) {
                var duration = this.index === undefined ? 0 : 300;

                this.$list.animate({
                    left: pos
                }, duration, function () {
                    cb && cb();
                });
            },
            /**
             * 获取指定位置的 item, 返回的数据中可能包括两个item
             * @public
             * @param {int} index 项目索引
             */
            getItem: function (index) {
                return this.$element.find("[data-index=" + index + "]");
            },
            /**
             * 获取整个 carousel 容器
             * @public
             */
            getElement: function () {
                return this.$element;
            },
            /**
             * 获取cur状态的项目索引
             * @public
             */
            getCurIndex: function () {
                return this.index;
            },
            /**
             * @public
             */
            destroy: function () {
                this.$list.remove();
                this.$list = null;         
            }
        }
    );

    module.exports = Carousel;
});
;/*! Copyright (c) 2010 Brandon Aaron (http://brandonaaron.net)
 * Licensed under the MIT License (LICENSE.txt).
 *
 * Version 2.1.2
 */

(function ($) {

    $.fn.bgiframe = ( /msie 6\.0/i.test(navigator.userAgent) ? function (s) {
        s = $.extend({
            top: 'auto', // auto == .currentStyle.borderTopWidth
            left: 'auto', // auto == .currentStyle.borderLeftWidth
            width: 'auto', // auto == offsetWidth
            height: 'auto', // auto == offsetHeight
            opacity: true,
            src: 'javascript:false;'
        }, s);
        var html = '<iframe class="bgiframe"frameborder="0"tabindex="-1"src="' + s.src + '"' +
            'style="display:block;position:absolute;z-index:-1;' +
            (s.opacity !== false ? 'filter:Alpha(Opacity=\'0\');' : '') +
            'top:' + (s.top == 'auto' ? 'expression(((parseInt(this.parentNode.currentStyle.borderTopWidth)||0)*-1)+\'px\')' : prop(s.top)) + ';' +
            'left:' + (s.left == 'auto' ? 'expression(((parseInt(this.parentNode.currentStyle.borderLeftWidth)||0)*-1)+\'px\')' : prop(s.left)) + ';' +
            'width:' + (s.width == 'auto' ? 'expression(this.parentNode.offsetWidth+\'px\')' : prop(s.width)) + ';' +
            'height:' + (s.height == 'auto' ? 'expression(this.parentNode.offsetHeight+\'px\')' : prop(s.height)) + ';' +
            '"/>';
        return this.each(function () {
            if ($(this).children('iframe.bgiframe').length === 0)
                this.insertBefore(document.createElement(html), this.firstChild);
        });
    } : function () {
        return this;
    });

    // old alias
    $.fn.bgIframe = $.fn.bgiframe;

    function prop(n) {
        return n && n.constructor === Number ? n + 'px' : n;
    }

})(jQuery);

/**
 * @module jsmod/ui/dialog
 */
define("jsmod/ui/dialog", function(require, exports, module) {
    var main, _option;

    main = require("jsmod/main");

    _option = {
        backgroundColor: "#FFF"
    };

    /**
     * Dialog模块，居中定位，并显示遮罩图层，不能同时打开两个弹窗，
     * 显示弹窗时会隐藏当前正打开的弹窗，
     * z-index 大于 1000 的元素不会被覆盖。
     * 默认点击 esc 关闭当前显示弹窗，opacity 为 0.7，可以通过类方法改变全局的设置
     *
     * @constructor
     * @alias module:jsmod/ui/dialog
     * @param {object} option
     * @param {int}    option.width                  宽度
     * @param {int}    option.height                 高度
     * @param {string} option.html                   html代码
     * @param {Coords} [option.offset]               定位时的偏移
     * @param {string} [option.backgroundColor=#FFF] 弹窗的背景色, 如果不要背景色则填 null
     * @expample
     * var Dialog = require("jsmod/ui/dialog");
     *
     * // 创建实例
     * new Dialog({
     *     html: "<div>dIALOG</div>",
     *     height: 300,
     *     width: 300
     * });
     */
    var Dialog = function (option) {
        var self = this;

        self.option = $.extend({}, _option, option);
        self.init();
    }

    Dialog.opacity = 0.7; // 默认的透明度

    /**
     * 重置frame窗体中的内容
     * @private
     */
    Dialog.resetFrame = function () {
        var frame = $(".mod-dialog-frame");

        if (frame.length == 0) {
            if (main.ie6) {
                Dialog.frame = $('<div class="mod-dialog-frame" style="overflow:auto; overflow-x:hidden; display:none; position: absolute; left:0; top: 0; right:0; bottom: 0; z-index: 1000;">').appendTo("body");
                Dialog.frame.css("width", $(window).width());
                Dialog.frame.css("height", $(window).height());
                Dialog.frame.bgiframe();
            } else {
                Dialog.frame = $('<div class="mod-dialog-frame" style="overflow:auto; display:none; position: fixed; left:0; top: 0; right:0; bottom: 0; z-index: 1000;"></div>').appendTo("body");
            }

            Dialog.setOpacity();
        }

        if (main.ie6) {
            Dialog.frame.css("top", $("html").scrollTop());
        }

        if (frame.find(".mod-dialog-wrap").length > 0) {
             frame.find(".mod-dialog-wrap").detach();
        }
    }

    /**
     * 类方法，禁止点击 esc 触发关闭
     * @public
     */
    Dialog.disableKeyEvent = function () {
        $(document).off("keydown.dialog");
        Dialog.keyEvent = false;
    }

    /**
     * 类方法，启用点击 esc 触发关闭
     * @public
     */
    Dialog.enableKeyEvent = function () {
        if (!Dialog.keyEvent) {
            $(document).on("keydown.dialog", function (e) {
                if (e.keyCode == 27) {
                    Dialog._instance && Dialog._instance.hide({fade: true});
                    /**
                     * 点击 esc 关闭弹窗时触发，让使用者知道用户是以何种方式关闭弹窗
                     * @event module:jsmod/ui/dialog#pressesc
                     */
                    $(Dialog._instance).trigger("pressesc");
                }
            });

            Dialog.keyEvent = true;
        }
    }

    /**
     * 类方法，恢复默认设置
     * @public
     */
    Dialog.reset = function (argument) {
        Dialog.enableKeyEvent();
        Dialog.setOpacity(0.7);
    }

    // 监听resize改变弹窗位置
    if (!Dialog.resetEvent) {
        $(window).on("resize.dialog", function () {
            if (Dialog._instance  && Dialog.frame.css("display") != "none") {
                if (main.ie6) {
                    Dialog.frame.css("width", $(window).width());
                    Dialog.frame.css("height", $(window).height());
                    Dialog.frame.css("top", $("html").scrollTop());
                }
                Dialog._instance.adjuestPosition();
            }
        });

        Dialog.resetEvent = true;
    }

    Dialog.enableKeyEvent();

    /**
     * 类方法，设置蒙层的透明度
     * @public
     * @param {double} [option.opacity=0.7]  设置蒙层的透明度
     */
    Dialog.setOpacity = function (opacity) {
        var hex;

        if (opacity !== undefined) {
            Dialog.opacity = opacity;
        }

        hex = parseInt(Dialog.opacity * 255).toString(16);

        if (hex == "0") {
            hex = "00";
        }

        if (Dialog.frame) {
            Dialog.frame.css("filter", "progid:DXImageTransform.Microsoft.gradient(startColorstr=#" + hex + "000000,endColorstr=#" + hex + "000000");

            if (!main.ie6) {
                Dialog.frame.css("background-color", "rgba(0, 0, 0," + Dialog.opacity + ")");
            }
        }
    }

    $.extend(Dialog.prototype, 
        /**
         * @lends module:jsmod/ui/dialog.prototype
         */ 
        {   
            /**
             * 初始化弹出内容，并绑定各种事件
             * @private
             */
            init: function () {
                var self = this,
                    element;

                element = $(self.option.html);
                self.content = $('<div style="overflow:hidden; position: absolute;" class="mod-dialog-wrap"></div>').append(element);

                if (self.option.backgroundColor) {
                    self.content.css("background-color", self.option.backgroundColor);
                }

                Dialog.resetFrame();
                self.setBox();
                Dialog.frame.append(self.content);
            },
            /**
             * 设置宽、高，会自动调用 adjuestPosition 函数重置位置
             * @public
             * @param {object} option          配置项, 宽度和高度可以都设置，也可以只设置其一
             * @param {int}    [option.width]  宽度
             * @param {int}    [option.height] 高度
             */
            setBox: function (option) {
                var self = this;

                $.extend(self.option, option);
                self.option.width && self.content.css("width", self.option.width);
                self.option.height && self.content.css("height", self.option.height);

                if (Dialog.frame.css("display") != "none") {
                    self.adjuestPosition();
                }
            },
            /**
             * 显示弹窗
             * @public
             * @param {object} option         配置项
             * @param {bool}   [option.fade]  渐变效果
             */
            show: function (option) {
                var self = this;

                option = option || {};

                $("html").css("overflow", "visible");
                $("body").css("overflow", "hidden");

                Dialog.resetFrame();
                Dialog.frame.show();

                if (option.fade) {
                    self.content.hide().appendTo(Dialog.frame).fadeIn("fast");
                } else {
                    Dialog.frame.append(self.content);
                }

                self.adjuestPosition();

                Dialog._instance = self;
            },
            /**
             * 隐藏弹窗
             * @public
             * @param {object} option         配置项
             * @param {bool}   [option.fade]  渐变效果
             */
            hide: function (option) {
                var self = this;

                option = option || {};

                $("html").css("overflow", "");
                $("body").css("overflow", "");

                if (option.fade) {
                    Dialog.frame.fadeOut("fast");
                } else {
                    Dialog.frame.hide();
                }
            },
            /**
             * 调整位置，当改变宽高后需要调用此函数调整位置，通过 setBox 函数设置会自动调用此函数
             * @public
             */
            adjuestPosition: function () {
                var self = this,
                    offset = self.option.offset || {},
                    wHeight, wWidth, height, width, top, left;

                wHeight = Dialog.frame.height();
                wWidth = Dialog.frame.width();

                height = self.content.height();
                width = self.content.width();

                top = wHeight / 2 - height / 2 + (offset.top || 0);
                left = wWidth / 2 - width / 2 + (offset.left || 0);
                top = top < 0 ? 0 : top;
                left = left < 0 ? 0 : left;

                self.content.css("top", top);
                self.content.css("left", left);
            },
            /**
             * 获取 content 元素
             * @public
             */
            getElement: function () {
                return this.content;
            },
            /**
             * @public
             */
            destroy: function () {
                this.hide();
                this.content.remove();
                this.content = null;
            }
        }
    );

    module.exports = Dialog;
});

;/**
 * 固定位置元素模块
 * @module jsmod/ui/fixElement
 */
define("jsmod/ui/fixElement", function(require, exports, module) {
    /**
     * 包含top、left的坐标字段
     * @typedef  {object} Coords
     * @property {int}    top     top
     * @property {int}    left    left
     */

    var _option, main;

    main = require("jsmod/main");

    _option = {
        targetType: "top",
        zIndex: 1000,
        fixed: false,
        preventResize: false,
        appendInBody: false
    };

    /**
     * 绝对定位元素为 jsmod 大多数 ui 控件基类；同时也可被外部直接使用或继承使用。
     * 其提供了将 dom 元素（html片段）定位到页面特定位置（坐标，元素附近）的基础支持
     * 
     * @constructor
     * @alias module:jsmod/ui/fixElement
     * @param {(string|dom|selector)} element                        需要定位的元素，可以是 html, dom, 选择器
     * @param {object}                option                         配置参数
     * @param {(dom|selector)}        [option.target]                定位到这个元素附近 (取选择器中获取的第一个元素作为定位元素)
     * @param {string}                [option.targetType]            用 "," 分割可传入一至三个值，每个值都可选 top, right, bottom, left, center
     * @param {Coords}                [option.offset]                定位时的偏移
     * @param {Coords}                [option.position]              没有 target 参数时, 采取绝对定位方式时传入的坐标
     * @param {bool}                  [option.fixed=false]           是否使用 fixed 定位, 仅当采用坐标定位时可用, ie6 会自动加入 hack 支持 fix 定位
     * @param {int}                   [option.zIndex=1000]           元素的 z-index
     * @param {bool}                  [option.preventShow=false]     是否阻止初始化时显示元素
     * @param {bool}                  [option.preventResize=false]   是否阻止resize时重定位元素
     * @param {bool}                  [option.appendInBody=false]    如果 target 的父元素设置 overflow:hidden 且 relative, absolute 定位时，元素会被隐藏，设置此值为 true 元素将成为 body 的子元素
     * @example
     * var FixElement = require("jsmod/ui/fixElement"), fixEl;
     *
     * // 创建实例 (绝对定位)
     * new FixElement('<div class="module">Hello World!</div>', {
     *     position: {left: 100, top: 200}
     * });
     * 
     * // 创建实例 (元素附近)
     * new FixElement('<div class="module">Hello World!</div>', {
     *     target: "#create-target"
     * });
     */
    var FixElement = function(element, option) {
        var self = this;

        // 准备数据
        self._isHide = false;
        self._element = $(element);
        self.option = $.extend({}, _option, option);
        if (self.option.target) {
            self.target = $(self.option.target);
            self.$target = $(self.option.target);
        }

        // 设置index
        self._element.css("z-Index", self.option.zIndex);

        // 绘制、主要处理定位逻辑
        self.redraw();

        // 显示或是隐藏
        option.preventShow ? self.hide() : self.show();

        // 注册屏幕变化的 redraw
        if (!option.preventResize) {
            self.resizeCb = function () {
                if (!self.resizing) {
                    self.redrawTimer = setTimeout(function () {
                        self.redraw();
                        self.resizing = false;
                    }, 0);
                }

                self.resizing = true;
            }

            $(window).on("resize.fixElement", self.resizeCb);
        }
    }

    $.extend(FixElement.prototype,
    /** @lends module:jsmod/ui/fixElement.prototype */ 
    {
        /**
         * 定位到特定的位置，定位成功后会更改原有配置
         * @public
         * @param {Coords} position      绝对定位方式时传入的坐标 - @see {@link Coords}
         * @param {bool}   [fixed=false] 是否使用 fixed 定位
         * @param {Coords} [offset]      定位时的偏移
         * @example
         * instance.fix({left: 10, top: 20}, true, {left: 2, top: 5});
         */
        fix: function(position, fixed, offset) {
            var self = this,
                element = self._element;

            $.extend(self.option, {
                fixed: fixed,
                offset: $.extend({}, offset),
                position: $.extend({}, position)
            });

            if (offset) {
                position.top += offset.top || 0;
                position.left += offset.left || 0;
            }

            if (element.parent("body").length == 0) {
                element.detach().appendTo(document.body);
            }

            if (fixed && !main.ie6) {
                element.css("position", "fixed");
                if (element.css("display") == "none") {
                    element.show().offset(position).hide();
                } else {
                    element.offset(position);
                }
            } else {
                element.css("position", "absolute");
                if (main.ie6 && fixed) {
                    element.get(0).style.cssText += ";_top: expression(eval(document.documentElement.scrollTop + " + position.top + "))";
                    element.get(0).style.cssText += ";_left: expression(eval(document.documentElement.scrollLeft + " + position.left + "))";
                } else {
                    element.css("position", "absolute");
                    if (element.css("display") == "none") {
                        element.show().offset(position).hide();
                    } else {
                        element.offset(position);
                    }
                }
            }
        },
        /**
         * 定位到指定的元素周围，定位成功后会更改原有配置
         * @public
         * @param {(string|dom)} target           定位到这个元素附近
         * @param {string}       [targetType]     用 "," 分割可传入一至三个值，每个值都可选 top, right, bottom, left, center
         * @param {Coords}       [offset]         定位时的偏移
         * @example
         * instance.fixTo("#to-fix-element", "bottom", {left: 5, top: 5});
         */
        fixTo: function (target, targetType, offset) {
            var self = this,
                element = self._element,
                bounds, rect, position, targetTypeArr, horizontalFun, verticalFun;

            /** 
             * 第一个对齐参数为 top bottom 
             * @inner
             * @param {object} pos     位置
             * @param {string} type    第二个定位参数
             * @param {string} [typeT] 第三个定位参数
             */
            horizontalFun = function (pos, type, typeT) {
                if (type === undefined || type == "left" || type == "right" || type == "center") {
                    if (type == "left") {
                        pos.left -= bounds.width / 2;
                    }

                    if (type == "right") {
                        pos.left += bounds.width / 2;
                    } 
                } else {
                    throw new RangeError("second targetType error");
                }

                // 第三个定位参数
                if (typeT === undefined || typeT == "left" || typeT == "right" || typeT == "center") {
                    if (typeT == "left") {
                        pos.left -= rect.width / 2;
                    }

                    if (typeT == "right") {
                        pos.left += rect.width / 2;
                    }
                } else {
                    throw new RangeError("third targetType error");
                }

                return pos;
            }

            /** 
             * 第一个对齐参数为 left、right 
             * @inner
             * @param {object} pos     位置
             * @param {string} type    第二个定位参数
             * @param {string} [typeT] 第三个定位参数
             */
            verticalFun = function (pos, type, typeT) {
                if (type === undefined || type == "bottom" || type == "top" || type == "center") {
                    if (type == "bottom") {
                        pos.top += bounds.height / 2;
                    }

                    if (type == "top") {
                        pos.top -= bounds.height / 2;
                    } 
                } else {
                    throw new RangeError("second targetType error");
                }

                // 第三个定位参数
                if (typeT === undefined || typeT == "bottom" || typeT == "top" || typeT == "center") {
                    if (typeT == "bottom") {
                        pos.top += rect.height / 2;
                    }

                    if (typeT == "top") {
                        pos.top -= rect.height / 2;
                    }
                } else {
                    throw new RangeError("third targetType error");
                }

                return pos;
            }

            $.extend(self.option, {
                target: target,
                targetType: targetType,
                offset: $.extend({}, offset)
            });

            if (self.option.target) {
                self.target = $(target);
                self.$target = $(self.option.target);   
            }

            targetType = targetType || self.option.targetType;

            // 将字符串转化为数组
            targetTypeArr = targetType.split(",");
            targetTypeArr = $.map(targetTypeArr, function (value) {
                return $.trim(value);
            });

            if (self.option.appendInBody) {
                element.css("position", "absolute").detach().appendTo(document.body);
            } else {
                element.css("position", "absolute").detach().insertAfter($(target).parent());
            }

            bounds = self.getBounds(target);
            rect = self.getRect(element);

            switch (targetTypeArr[0]) {
                case "top": 
                    position = {top: bounds.top - rect.height, left: bounds.left + bounds.width /2 - rect.width / 2}
                    horizontalFun(position, targetTypeArr[1], targetTypeArr[2]);
                    break;
                case "right":
                    position = {top: bounds.top + bounds.height / 2 - rect.height / 2, left: bounds.left + bounds.width}
                    verticalFun(position, targetTypeArr[1], targetTypeArr[2]);
                    break;
                case "bottom":
                    position = {top: bounds.top + bounds.height, left: bounds.left + bounds.width /2 - rect.width / 2}
                    horizontalFun(position, targetTypeArr[1], targetTypeArr[2]);
                    break;
                case "left":
                    position = {top: bounds.top + bounds.height / 2 - rect.height / 2, left: bounds.left - rect.width}
                    verticalFun(position, targetTypeArr[1], targetTypeArr[2]);
                    break;
                case "center":
                    position = {top: bounds.top + bounds.height / 2 - rect.height / 2, left: bounds.left + bounds.width /2 - rect.width / 2}
                    break;
            }

            if (offset) {
                position.top += offset.top || 0;
                position.left += offset.left || 0;
            }

            if (element.css("display") == "none") {
                element.show().offset(position).hide();
            } else {
                element.offset(position);
            }
        },
        /**
         * 获取指定元素的实际宽高
         * @private
         * @param {(string|dom)} el 指定的元素
         */
        getRect: function(el) {
            return {
                width: $(el).outerWidth(), 
                height: $(el).outerHeight()
            };
        },
        /**
         * @private
         * @description 获取一个元素的实际宽高、和定位 
         * @param {string | dom} el 指定的元素
         */
        getBounds: function(el) {
            return $.extend({}, this.getRect(el), $(el).offset());
        },
        /**
         * 绘制当前实例，可以用于重定位
         * @public
         * @param {string} [html]   如果传入了html则会重新设置element对象，不传入则只进行重定位
         */
        redraw: function(html) {
            var self = this,
                option = self.option,
                optionR = optionR || {};

            if (html) {
                self._element.remove();
                self._element = $(html);
                self._element.css("z-Index", self.option.zIndex);
            }
            
            // 保持当前的开关状态
            self._isHide ? self._element.hide() : self._element.show();

            if (option.target) {
                self.fixTo(option.target, option.targetType, option.offset);
                return;
            }

            if (option.position) {
                self.fix(option.position, option.fixed, option.offset);
                return;
            }
        },
        /**
         * 显示element元素，重写此方法，可以实现显示的不同效果
         * @public
         * @fires jsmod/ui/fixElement#shown
         * @param {object} option              配置参数
         * @param {bool}   [option.fade=false] 是否启用 fade 效果
         */
        show: function(optionR) {
            var self = this,
                option = self.option,
                optionR = optionR || {},
                evt;

            if (option.target) {
                self.fixTo(option.target, option.targetType, option.offset);
            }

            if (option.position) {
                self.fix(option.position, option.fixed, option.offset);
            }

            if (optionR.fade) {
                this._element.hide().fadeIn("fast");
            } else {
                this._element.show();  
            }

            this._isHide = false;

            /**
             * 显示时触发
             * @event module:jsmod/ui/fixElement#shown
             * @type {object}
             */
            evt = $.Event("shown");
            $(this).trigger(evt);
        },
        /**
         * 隐藏element元素，重写此方法，可以实现不同的效果
         * @public
         * @fires jsmod/ui/fixElement#hidden
         * @param {object} option              配置参数
         * @param {bool}   [option.fade=false] 是否启用 fade 效果
         */
        hide: function(optionR) {
            var evt,
                optionR = optionR || {};
            
            if (optionR.fade) {
                this._element.fadeOut("fast");
            } else {
                this._element.hide();    
            }

            this._isHide = true;

            /**
             * 隐藏时触发
             * @event module:jsmod/ui/fixElement#hidden
             * @type {object}
             */
            evt = $.Event("hidden");
            $(this).trigger(evt);
        },
        /**
         * 调用show、或hide方法
         * @public
         * @param {object} option              配置参数
         * @param {bool}   [option.fade=false] 是否启用 fade 效果
         */
        toggle: function(option) {
            this._isHide ? this.show(option) : this.hide(option);
        },
        /**
         * 移除元素、事件、释放内存
         * @public
         */
        destroy: function() {
            this._element.remove();
            this._element = null;
            
            if (!this.option.preventResize && this.resizeCb) {
                $(window).off("resize.fixElement", this.resizeCb);
                this.redrawTimer && clearTimeout(this.redrawTimer);
            }
        },
        /**
         * 获取产生的dom对象，可以对其进行事件添加等操作
         * @public
         */
        getElement: function () {
            return this._element;
        },
        /**
         * 获取当前 FixElement 的显示状态
         * @return {bool} display true 为显示 false 为隐藏
         */
        getDisplay: function () {
            return !this._isHide;
        }
    });

    module.exports = FixElement;
});
;/**
 * 下拉组建模块，为各种下拉提供支持
 * @module jsmod/ui/fixElement/dropDown
 */
define("jsmod/ui/fixElement/dropDown", function (require, exports, module) {
    /**
     * dropDown控件中一条数据的对象
     * @typedef {object} DropItem
     * @property {string} key    key参数，触发事件时的回调传递的参数之一
     * @property {string} value  value参数，注意value中不能有html标记，触发事件时的回调传递的参数之一
     * @property {string} [html] 当没有传入此参数时会用value代替
     */

    var _option, FixElement, main;

    _option = {
        targetType: "bottom",
        preventShow: true,
        keyPressShow: true,
        syncInput: true
    }

    main = require("jsmod/main");

    FixElement = require("jsmod/ui/fixElement");

    /**
     * 下拉组建，继承自 {@link module:jsmod/ui/fixElement FixElement}
     * 实例化的第一个参数为数据, 第二个为配置参数.
     * 
     * @alias module:jsmod/ui/fixElement/dropDown
     * @constructor
     * @extends module:jsmod/ui/fixElement
     * @param {(DropItem[]|object[])} items                        传入的数据集合, 如果配置了optoin.fun, 则可以传入任意对象集合
     * @param {object}                option                       配置参数
     * @param {string}                [option.className]           添加自定义的className
     * @param {function}              [option.fun]                 会将index, item作为参数传递。返回数据结构为 {@link DropItem}
     * @param {function}              [option.keyPressShow=true]   当target为input时，按上下键是否显示下拉
     * @param {function}              [option.syncInput=true]      当target为input时，按上下键选中时是否同步填充
     * 
     * @param {(dom|selector)}        [option.target]              定位到这个元素附近 (取选择器中获取的第一个元素作为定位元素)
     * @param {string}                [option.targetType=bottom]   定位方式, 可选值: center, top, bottom, right, left
     * @param {Coords}                [option.offset]              定位时的偏移
     * @param {Coords}                [option.position]            没有 target 参数时, 采取绝对定位方式时传入的坐标
     * @param {bool}                  [option.fixed=false]         是否使用 fixed 定位, 仅当采用坐标定位时可用, ie6 会自动加入 hack 支持 fix 定位
     * @param {int}                   [option.zIndex=1000]         元素的 z-index
     * @param {bool}                  [option.preventShow=true]    是否阻止初始化时显示元素
     * @param {bool}                  [option.preventResize=false] 是否阻止resize时重定位元素
     * @example
     * items 参数的配置:
     * [
     *     {"key": "fish", value: "鱼", html: "<b>一只鱼</b>"},
     *     {"key": "cat", value: "猫", html: "<b>一条猫</b>"}
     * ]
     * option.fun 的使用：
     * // items 的参数
     * [
     *     {"name": "wang", "sex": 0},
     *     {"name": "li", "sex": 1}
     * ]
     * // option.fun
     * option.fun = function(index, obj) {
     *    // obj 为 items 中的一条数据
     *    var html = obj.name + (obj.sex ? "is man" : "is woman");
     *    
     *    // 返回值为 DropItem 数据格式
     *    return {
     *        key: index,  // 对数据的唯一标识
     *        value: obj.name, // 记录原始数据的值
     *        html: html // 用于下拉控件显示时的 html
     *    }
     * }
     */
    var DropDown = function (items, option) {
        var self = this;

        self.option = $.extend({}, _option, option);
        self.items = items;
        self.element = self.generateList();

        FixElement.apply(self, [self.element, self.option]);

        // 显示、隐藏时重置上下选择
        $(self).on("hidden", function () {
            var cur = self._element.find(".mod-dropdown-item-cur");

            if (cur.length > 0) {
                cur.removeClass("mod-dropdown-item-cur");
            }
        });

        $(self).on("shown", function () {
            var cur = self._element.find(".mod-dropdown-item-cur");

            if (cur.length > 0) {
                cur.removeClass("mod-dropdown-item-cur");
            }
        });
    };

    $.extend(DropDown.prototype, {}, FixElement.prototype);
    DropDown.prototype.constructor = DropDown;

    $.extend(DropDown.prototype, 
    /** @lends module:jsmod/ui/fixElement/dropDown.prototype */
    {
        /**
         * 生成list数据
         * @private
         */
        generateList: function () {
            var self = this,
                option = self.option,
                items = self.items,
                html = [];

            if (items.length == 0) {
                return '<div class="mod-dropdown-empty"></div>';
            }

            html.push('<ul class="mod-dropdown ' + (option.className || '') + '">');

            $.each(items, function (index, item) {
                var data;

                if (option.fun && $.isFunction(option.fun)) {
                    data = option.fun(index, item);
                } else {
                    data = item;
                }

                html.push('<li class="mod-dropdown-item" data-value="' + data.value + '" data-key="' + data.key + '">' + (data.html || data.value) + '</li>');
            });

            html.push("</ul>");

            return html.join("");
        },
        /**
         * 重新添加数据进行绘制，如果不传入参数只进行重置
         * @public
         * @param {array}          [items]                    需要放到dropdown上的数组数据
         * @param {string}         [items[].key]              触发事件时的回调传递的参数之一，如果配置option.fun则无需传入
         * @param {string}         [items[].value]            实际渲染的HTML数据，如果配置option.fun则无需传入
         */
        resetItems: function (items, option) {
            var self = this,
                html;

            self.items = items || self.items;
            html = self.generateList();

            self.redraw(html);
        },
        /**
         * 选中某个 item
         * @public
         * @param {int} index item 的索引
         */
        active: function (index) {
            var self = this;

            self._element.find("li.mod-dropdown-item:eq(" + index + ")").trigger("click");
        },
        /**
         * @private
         */
        redraw: function (html, option) {
            var self = this;

            self.undelegateEvents();
            FixElement.prototype.redraw.apply(this, [html, option]);
            self.delegatesEvents();
        },
        /**
         * 生成初始化点击事件
         * @private
         */
        delegatesEvents: function () {
            var self = this;

            $(self._element).delegate("li.mod-dropdown-item", "click.dropdown", function (e) {
                var key = $(this).data("key"),
                    value = $(this).data("value"),
                    ev;

                if (self.activedItem) {
                    self.activedItem.removeClass("mod-dropdown-item-active");
                }

                self.activedItem = $(this).addClass("mod-dropdown-item-active");

                ev = $.Event("selectitem", {key: key, value: value, element: this});

                /**
                 * 点击选项时触发的事件
                 * @event module:jsmod/ui/fixElement/dropDown#selectitem
                 * @type {object}
                 * @property {string} key     DropItem 中的 key 值
                 * @property {string} value   DropItem 中的 value 值
                 * @property {dom}    element 当前选项的 dom 对象
                 */
                $(self).trigger(ev, [{key: key, value: value, element: this}]);

                if (ev.isDefaultPrevented()) {
                    e.preventDefault();
                }

                if (!ev.preventDropDownHide) {
                    self.hide();
                }
            });

            // 这个也要清除
            if (self.target && $(self.target).prop("nodeName") == "INPUT") {
                $(self.target).on("keydown.dropdown", function (e) {
                    var cur, ev, key, value;

                    if (self._isHide) {
                        if ((e.keyCode == 38 || e.keyCode == 40) && self.option.keyPressShow) {
                            self.show();
                        }
                        // 这个地方的 return 修复过两次，最后判断加入 return 原因是如果在隐藏时按上下键位
                        // 会改变 input 值
                        return;
                    }

                    // 向上一位
                    if (e.keyCode == 38) {
                        self.move("up");
                        e.preventDefault();
                    }
                    // 向下一位
                    if (e.keyCode == 40) {
                        self.move("down");
                        e.preventDefault();
                    }

                    // 确定
                    if (e.keyCode == 13) {
                        cur = self._element.find(".mod-dropdown-item-cur");

                        if (cur.length > 0) {
                            if (self.activedItem) {
                                self.activedItem.removeClass("mod-dropdown-item-active");
                            }

                            key = $(cur).data("key"),
                            value = $(cur).data("value"),
                            self.activedItem = $(cur).addClass("mod-dropdown-item-active");

                            ev = $.Event("selectitem", {key: key, value: value, element: cur.get(0)});

                            $(self).trigger(ev, [{key: key, value: value, element: cur.get(0)}]);

                            if (ev.isDefaultPrevented()) {
                                e.preventDefault();
                            }

                            if (!ev.preventDropDownHide) {
                                self.hide();
                            }
                        }
                        e.preventDefault();
                    }
                });
            }

            if (main.ie6) {
                $(self._element).delegate("li.mod-dropdown-item", "mouseenter.dropdown", function () {
                    $(this).addClass("mod-dropdown-item-hover");
                });

                $(self._element).delegate("li.mod-dropdown-item", "mouseleave.dropdown", function () {
                    $(this).removeClass("mod-dropdown-item-hover");
                });
            }
        },
        /**
         * 选中的移动
         * @private
         * @param {string} flag
         */
        move: function (flag) {
            var self = this,
                element = self._element,
                cur, index, total, lis, toIndex, toCur;

            if (self.items.length == 0) {
                return;
            }

            lis = $(element).find("li");
            total = lis.length;
            cur = $(element).find(".mod-dropdown-item-cur");
            index = $.inArray(cur.get(0), lis);

            if (index != -1) {
                if (flag == "up") {
                    toIndex = index - 1 < 0 ? total - 1 : index - 1;
                }
                if (flag == "down") {
                    toIndex = index + 1 >= total ? 0 : index + 1;
                }
            } else {
                toIndex = flag == "up" ? total - 1 : 0;
            }

            toCur = lis.eq(toIndex);

            if (cur.length > 0) {
                cur.removeClass("mod-dropdown-item-cur");
            }

            toCur.addClass("mod-dropdown-item-cur");
            /**
             * 鼠标用上下键切换到某个选项
             * @event module:jsmod/ui/fixElement/dropDown#moveto
             * @property {string} key   设置的key
             * @property {string} value 设置的value
             * @property {dom}    toCur 当前聚焦的选项
             */
            $(self).trigger("moveto", [{key: toCur.data("key"), value: toCur.data("value"), toCur: toCur}]);

            if (self.option.syncInput) {
                $(self.target).val(toCur.data("value"));
            }
        },
        /**
         * 清除事件
         * @private
         */
        undelegateEvents: function () {
            var self = this;

            if (self._element) {
                $(self._element).undelegate("li.mod-dropdown-item", "click.dropdown");

                if (main.ie6) {
                    self._element.undelegate("li.mod-dropdown-item", "mouseenter.dropdown");
                    self._element.undelegate("li.mod-dropdown-item", "mouseleave.dropdown");
                }
            }

            $(self.target).off("keydown.dropdown");
        },
        /**
         * 删除元素，释放事件
         * @public
         */
        destroy: function () {
            this.undelegateEvents();
            FixElement.prototype.destroy.call(this);
        }
    });

    module.exports = DropDown;
});
;/**
 * @module jsmod/ui/fixElement/dropDown/select
 */
define("jsmod/ui/fixElement/dropDown/select", function (require, exports, module) {
    var _option, DropDown;

    DropDown = require("jsmod/ui/fixElement/dropDown");

    _option = {
        targetType: "bottom",
        noInput: "",
        keyPressShow: true,
        syncInput: true,
        otherClickHide: true,
        trigger: "click"
    };

    /**
     * 针对 Select 元素的扩展, 继承自 [DropDown]{@link module:jsmod/ui/fixElement/dropDown}, 除可以自定义样式，其他特性与 select dom 元素保持一致的操作体验
     * @alias module:jsmod/ui/fixElement/dropDown/select
     * @extends module:jsmod/ui/fixElement/dropDown
     * @constructor
     * @param {(DropItem[]|object[])} items                        传入的数据集合, 如果配置了optoin.fun, 则可以传入任意对象集合
     * @param {object}                option                       配置参数
     * @param {string}                option.seed                  触发下拉显示的种子元素
     * @param {(dom|selector)}        option.target                定位到这个元素附近 (取选择器中获取的第一个元素作为定位元素)
     * @param {string}                [option.trigger=click]       触发的方式, 可选值: click, manual
     * @param {bool}                  [option.otherClickHide=true] trigger 为 click 时点击页面其他地方是否关闭
     * 
     * @param {string}                [option.className]           添加自定义的className
     * @param {function}              [option.fun]                 会将index, item作为参数传递。返回数据结构为 {@link DropItem}
     * @param {function}              [option.keyPressShow=true]   当target为input时，按上下键是否显示下拉
     * @param {function}              [option.syncInput=true]      当target为input时，按上下键选中时是否同步填充
     * 
     * @param {string}                [option.targetType=bottom]   定位方式, 可选值: center, top, bottom, right, left
     * @param {Coords}                [option.offset]              定位时的偏移
     * @param {Coords}                [option.position]            没有 target 参数时, 采取绝对定位方式时传入的坐标
     * @param {bool}                  [option.fixed=false]         是否使用 fixed 定位, 仅当采用坐标定位时可用, ie6 会自动加入 hack 支持 fix 定位
     * @param {int}                   [option.zIndex=1000]         元素的 z-index
     * @param {bool}                  [option.preventShow=true]    是否阻止初始化时显示元素
     * @param {bool}                  [option.preventResize=false] 是否阻止resize时重定位元素
     * @example
     * var Select = require("jsmod/ui/fixElement/dropDown/select"), sel;
     *
     * // 实例化对象
     * sel = new Select(["a", "b"], {seed: "#seed-1", target: "#input-1", fun: function (key, value) {
     *     return {
     *         key: key,
     *         value: value,
     *         html: '<a href="javascript:void(0)">我是选项：' + value + '</a>'
     *     }
     * }}); 
     */
    var Select = function (items, option) {
        var self = this;

        self.$seed = $(option.seed);

        DropDown.apply(this, [items, $.extend({}, _option, option)]);

        self.initEvents();
    }

    $.extend(Select.prototype, {}, DropDown.prototype);
    Select.prototype.constructor = Select;


    $.extend(Select.prototype, 
        /**
         * @lends module:jsmod/ui/fixElement/dropDown/select.prototype
         */
        {
            /**
             * 初始化事件
             * @private
             */
            initEvents: function () {
                var self = this;

                $(self).on("selectitem", function (e) {
                    self.$target.val(e.value);
                });

                if (self.option.trigger == "click") {
                    self.$seed.on("click.select", function () {
                        self.hideTimer && clearTimeout(self.hideTimer);

                        self.toggle();

                        if (self.getDisplay()) {
                            self.$target.focus();
                        }
                    });                    
                }

                if (self.option.trigger == "click" && self.option.otherClickHide) {
                    self.mouseDownCb = function (e) {
                        if ($(e.target).parents(".mod-dropdown").length == 0 && e.target != self.$target.get(0) && e.target != self.getElement().get(0)) {
                            self.hideTimer = setTimeout(function () {
                                self.hide();    
                            }, 200)
                        }
                    };

                    $("body").on("mousedown.select", self.mouseDownCb);
                }
            },
            /**
             * 删除元素，释放事件
             * @public
             */
            destroy: function () {
                var self = this;

                self.$seed.off("click.select");
                self.hideTimer && clearTimeout(self.hideTimer);

                if (self.option.otherClickHide) {
                    $("body").off("mousedown.select", self.mouseDownCb);
                }

                DropDown.prototype.destroy.call(self);
            }
        }
    );

    module.exports = Select;
});
;/**
 * suggestion 提供ajax调用远程数据返回结果，并自动调用下拉框
 * @module jsmod/ui/fixElement/dropDown/suggestion
 */
define("jsmod/ui/fixElement/dropDown/suggestion", function (require, exports, module) {
    /**
     * JSONP 请求时的配置项
     * @typedef {object} JSONPOption
     * @property {string} jsonp         在一个jsonp请求中重写回调函数的名字。
     * @property {string} jsonpCallback 为jsonp请求指定一个回调函数名。
     */

    var DropDown, _option;

    DropDown = require("jsmod/ui/fixElement/dropDown");

    _option = {
        targetType: "bottom",
        noInput: "",
        keyPressShow: false,
        syncInput: true,
        blurHide: true
    };

    /**
     * 使用时最好使用json请求，jsonp需要保证支持标准回调函数，不然需要在实例中重写getData方法
     * @extends module:jsmod/ui/fixElement/dropDown
     * @constructor
     * @alias module:jsmod/ui/fixElement/dropDown/suggestion
     * @param {object}           option
     * @param {(string|function)}option.url                  请求数据的地址。如果是函数时会将target中输入作为参数传递；会用返回的数据作为ajax的地址
     * @param {(dom|selector)}   option.target               定位到这个元素附近，此target必须为可输入的input
     * @param {function}         option.fun                  会将index, item作为参数传递。返回数据结构为 {@link DropItem}
     * @param {function}         option.sendData             会将target中输入作为参数传递。会用返回的数据作为ajax的数据
     * @param {function}         option.handleData           会将异步返回数据作为参数传递。需要返回数组作为渲染数据
     * @param {JSONPOption}      option.jsonpOption          如果请求是jsonp时的配置
     * @param {(string|function)}[option.noInput]            当没有输入时下拉框显示的内容
     * @param {string}           [option.className]          添加自定义的className
     * @param {string}           [option.targetType=bottom]  定位方式 - center | top | bottom | right | left
     * @param {int}              [option.zIndex=1000]        固定元素的z-index
     * @param {Coords}           [option.offset]             定位时的偏移 - @see {@link Coords}
     * @param {bool}             [option.preventShow=true]   是否阻止初始化时显示元素
     * @param {bool}             [option.syncInput=true]     当target为input时，按上下键选中时是否同步填充
     * @param {bool}             [option.blurHide=true]      触发blur事件时是否隐藏
     */
    var Suggestion = function (option) {
        var self = this,
            option;

        self.option = option = $.extend({}, _option, option);
        self.cacheDfds = {};
        
        DropDown.apply(self, [[], option]);
        option.noInput && $(self._element).html(option.noInput);

        self.initKeyPress();
        self.initFocus();
    }

    $.extend(Suggestion.prototype, {}, DropDown.prototype);
    Suggestion.prototype.constructor = Suggestion;

    $.extend(Suggestion.prototype, 
        /** @lends module:jsmod/ui/fixElement/dropDown/suggestion.prototype */
        {
            /**
             * focus, blur时的变化
             * @private
             */
            initFocus: function () {
                var self = this,
                    option = self.option;

                if (option.noInput) {
                    $(self.target).focus(function () {
                        if ($(this).val() == "") {
                            self.resetItems([]);
                            self._element.html(option.noInput);
                            self.show();
                        }
                    });
                }

                $(self.target).blur(function () {
                    if (option.blurHide) {
                        setTimeout(function () {
                            self.hide();
                        }, 200);
                    }
                });
            },
            /**
             * 初始化内容变更
             * @private
             */
            initKeyPress: function () {
                var self = this,
                    option = self.option;

                $(self.target).on("keyup.suggestion", function (e) {
                    var val = $(this).val();

                    if (e.keyCode == 13) {
                        return;
                    }

                    if (e.keyCode == 38 || e.keyCode == 40 && !self._isHide) {
                        return;
                    }

                    val = $.trim(val);

                    if (val == "") {
                        self.resetItems([]);
                        option.noInput && $(self._element).html(option.noInput);
                        self.show();
                    } else {
                        self.getData(val);
                    }

                    self.lastVal = val;
                });
            },
            /**
             * 获取数据
             * @param {string} val 输入框中的数据
             */
            getData: function (val) {
                var self = this,
                    option = self.option,
                    dfd, sendData, url;
                
                sendData = option.sendData && option.sendData(val);

                dfd = self.cacheDfds[$.param(sendData)];

                if (!dfd) {
                    url = $.isFunction(option.url) ? option.url(val) : option.url;

                    dfd = $.ajax({
                        url: url,
                        data: sendData,
                        dataType: option.jsonpOption ? "jsonp" : "json",
                        jsonp: option.jsonpOption && option.jsonpOption.jsonp ? option.jsonpOption.jsonp : undefined,
                        jsonpCallback: option.jsonpOption && option.jsonpOption.jsonpCallback ? option.jsonpOption.jsonpCallback : undefined
                    }).promise();

                    self.cacheDfds[$.param(sendData)] = dfd;
                }

                dfd.done(function (json) {
                    data = option.handleData(json);

                    if (data) {
                        self.showDropDown(data);
                    }
                });
            },
            /**
             * 显示下拉
             * @private
             * @param {array} items 处理后的数组数据
             */
            showDropDown: function (items) {
                var self = this;

                self.resetItems(items);
                self.show();
            }
        }
    );

    module.exports = Suggestion;
});
;/**
 * 实现简单的tip内容展示模块
 * @module jsmod/ui/fixElement/tip
 */
define("jsmod/ui/fixElement/tip", function(require, exports, module) {
    /**
     * 显示、隐藏的延迟对象
     * @typedef {object} Delay
     * @property {int} show 显示时的delay
     * @property {int} hide 隐藏时的delay
     */

    var FixElement = require("jsmod/ui/fixElement"), main, _option;

    _option = {
        trigger: "hover",
        targetType: "top",
        leavePreventHide: true,
        otherClickHide: true,
        preventSelfClickHide: false,
        delay: {show: 300, hide: 300}
    }

    main = require("jsmod/main");


    /**
     * [Tip]{@link module:jsmod/ui/fixElement/tip} 类依赖 [FixElement]{@link module:jsmod/ui/fixElement} 类但并未继承，前者多次对后者进行实例化并引用其对象。
     * 既 Tip 为一个或多个目标元素创建相关的 FixElement 对象，而 FixElement 则进行单一的 Dom 元素创建。
     * 两者最主要的区别：实例化 FixElement 时传入参数 target，而实例化 Tip 时传入参数 targets，对 Tip 实例的操作一般都会带上明确的 target 以标识操作哪个 FixElement 对象
     * 
     * @alias module:jsmod/ui/fixElement/tip
     * @constructor
     * @param {object}       [option]                             配置参数
     * @param {(dom|string)} option.targets                       可以触发 tip 的 targets, target 可以是一组或单个 dom 元素
     * @param {string}       [option.className]                   自定义的 className 
     * @param {string}       [option.title]                       title 部分的 html, 如果不传则获取 target 上的 data-title 属性, 优先选择 data-title
     * @param {string}       [option.content]                     content 部分的 html, 如果不传则获取 target 上的 data-content 属性, 优先选择 data-content
     * @param {string}       [option.targetType]                  用 "," 分割可传入一至三个值，每个值都可选 top, right, bottom, left, center
     * @param {Coords}       [option.offset]                      tip 的偏移, 如果不传则获取 target 上的 data-offset 属性, 优先选择 data-offset
     * @param {string}       [option.trigger=hover]               触发 tip 的事件, 可选值: hover, click, manual (manual 不为 tip 对象注册任何事状态完全由外部控制)
     * @param {Delay}        [option.delay={show:300, hide: 300}] 当选择 hover 可用, 设置延迟多少毫秒显示, 消失; 设置为 0 时取消 delay
     * @param {bool}         [option.leavePreventHide=true]       当选择 hover 可用，且设置 delay 时此参数可用，指示是否在鼠标移动到 tip 元素内是否终止隐藏
     * @param {bool}         [option.otherClickHide=true]         当选择 click 可用，当点击页面除 tip 外的 dom 则关闭 tip
     * @param {bool}         [option.preventSelfClickHide=false]  当选择 click 可用，当点击 tip 的当前 target 是否触发隐藏
     * @example
     * var Tip = require("jsmod/ui/fixElement/tip");
     * 
     * // 创建实例
     * new Tip({
     *     targets: "#target-1, #target-2",
     *     title: "标题",
     *     content: "内容"
     * });
     */ 
    var Tip = function(option) {
        var self = this,
            option;

        self.option = option = $.extend({}, _option, option);

        self.mouseenterCb = function (e) {
            self.showTip(e);
        }

        self.mouseleaveCb = function (e) {
            self.hideTip(e);
        }

        self.clickCb = function (e) {
            setTimeout(function () {
                var fix;

                if (!self.option.preventSelfClickHide) {
                    self.toggleTip(e);
                } else {
                    fix = self.getFixElement(e.data.$target);
                    if (fix && !fix.getDisplay()) {
                        self.toggleTip(e);
                    }
                }

            }, 100);
        }

        $(option.targets).each(function() {
            self.bindEvent(this);
        });

        if (option.trigger == "click" && option.otherClickHide) {
            self.otherClickEvent();
        }
    };

    $.extend(Tip.prototype, 
    /** @lends module:jsmod/ui/fixElement/tip.prototype */
    {
        /**
         * 为某个 target 绑定 tip 触发、消失事件
         * @private
         * @param {dom} el 绑定事件的dom元素
         */
        bindEvent: function (el) {
            var self = this,
                option = self.option;

            self.openedFixElements = [];

            if (option.trigger == "hover") {
                $(el).on("mouseenter.tip", null, {$target: $(el)}, self.mouseenterCb);

                $(el).on("mouseleave.tip", null, {$target: $(el)}, self.mouseleaveCb);
            }

            if (option.trigger == "click") {
                $(el).on("click.tip", null, {$target: $(el)}, self.clickCb);
            }

            self.createFixElement(el);
        },
        /**
         * 注册 body 的点击事件，确定是否关闭 tip
         * @private
         */
        otherClickEvent: function () {
            var self = this;

            self.mousedownCb = function (e) {
                var subClass = main.config == "baidu" ? "module" : "mod-tip";

                if ($(e.target).parents("." + subClass).length == 0) {
                    self.hideAllTips(e);
                }
            };

            $("body").on("mousedown.tip", self.mousedownCb);
        },
        /**
         * 隐藏所有的已经打开的 tips
         * @private
         */
        hideAllTips: function (e) {
            var self = this,
                openedFixElements = self.openedFixElements.slice(0);

            $.each(openedFixElements, function() {
                var evt;

                // 对于点击到的是某个 FixElment 的 target 时不做处理
                if (!e || this.$target.get(0) != e.target && !$.contains(this.$target.get(0), e.target)) {

                    evt = $.Event();
                    evt.data = {
                        $target: this.target
                    }

                    self.toggleTip(evt, this.target);
                }
            });
        },
        /**
         * 清除timer
         * @private
         * @param {dom} el 要清除的target
         * @param {string} 要清除的标志
         */
        clearTimer: function (el, flag) {
            var timer = $(el).data(flag + "-timer");

            timer && clearTimeout(timer);
        },
        /**
         * 获取tip拼接后的html
         * @private
         * @param {string} title
         * @param {string} content
         * @param {string} className
         * @param {bool}   inner
         */
        getTipHTML: function (title, content, className, inner) {
            if (main.config == "baidu") {
                return [
                    !inner ? '<div class="module ' + (className || "") + '">' : "",
                        title ? '<div class="module-hd">' + title + '</div>' : "",
                        content ? '<div class="module-bd">' + content + '</div>' : "",
                    !inner ? '</div>' : ""
                ].join("");
            } else {
                return [
                    !inner ? '<div class="mod-tip ' + (className || "") + '">' : "",
                        title ? '<div class="mod-tip-hd">' + title + '</div>' : "",
                        content ? '<div class="mod-tip-bd">' + content + '</div>' : "",
                    !inner? '</div>': ""
                ].join("");
            }
        },
        /**
         * 为某个 target 生成 fixElement
         * @private
         * @param {dom} el target的dom
         */
        createFixElement: function (el) {
            var self = this,
                option = self.option,
                title = $(el).data("title") || option.title,
                content = $(el).data("content") || option.content,
                offset = $(el).data("offset") || option.offset,
                targetType = $(el).data("target-type") || option.targetType,
                html, option, fix;

            if (!title && !content) {
                return false;
            }
            
            html = self.getTipHTML(title, content, option.className);

            option = {
                target: el,
                targetType: targetType,
                offset: offset,
                preventShow: true
            };

            fix = new FixElement(html, option);

            // 保存产生的 fix 对象
            $(el).data("tip", fix);
            return fix;
        },
        /**
         * 显示、隐藏某个target的tip；注意：当trigger为hover时不要使用
         * @public
         * @param {(dom|string)} target 进行操作的 target 元素
         */
        toggle: function (target) {
            var evt = $.Event();

            evt.data = {
                $target: $(target)
            }

            this.toggleTip(evt);
        },
        /**
         * 显示一个tip；注意：当 trigger 为 hover 时不要使用
         * @public
         * @param {dom} target 进行操作的 target 元素
         * @fires module:jsmod/ui/fixElement/tip#shown
         */
        show: function (target) {
            var self = this,
                evt = $.Event();

            // 组装data对象保持内外调用一致
            evt.data = {
                $target: $(target)
            }

            self.showTip(evt);

            $(target).data("shown", true);
        },
        /**
         * 隐藏一个tip；注意：当 trigger 为 hover 时不要使用
         * @public
         * @param {dom} target
         * @fires module:jsmod/ui/fixElement/tip#hidden
         */
        hide: function (target) {
            var self = this,
                evt = $.Event();

            // 组装data对象保持内外调用一致
            evt.data = {
                $target: $(target)
            }
            self.hideTip(evt);
            $(target).data("shown", false);
        },
        /**
         * 内部的toggleTip
         * @private
         * @param {event} e 包含组装后的事件对象必须含有e.data.target属性指示target
         */
        toggleTip: function (e) {
            var self = this,
                target = e.data.$target;

            if (target.data("shown")) {
                self.hideTip(e);
                target.data("shown", false);
            } else {
                self.showTip(e);
                target.data("shown", true);
            }
        },
        /**
         * 获取一个 target 对应的 FixElement 对象
         * @param {dom} target 进行操作的 target 元素
         * @return {FixElement} 对应的 FixElement 实例
         */
        getFixElement: function (target) {
            return $(target).data("tip");
        },
        /**
         * 显示某个target的tip，内部实现方法，由内部toogleTip和事件绑定函数触发，禁止外部调用
         * @private
         * @param {event} e 包含组装后的事件对象，必须含有e.data.target属性指示target
         */
        showTip: function (e) {
            var self = this,
                option = self.option,
                target = e.data.$target,
                fix, showTimer, evt;

            self.clearTimer(target, "hide");

            fix = self.getFixElement(target);
            if (!fix) {
                return
            }

            //处理需要delay的逻辑，delay在hover上可用，click、manual 不可用
            if (option.trigger == "hover" && option.delay && option.delay.show) {
                
                // 将timer存储下来了，随时可以阻止显示
                showTimer = setTimeout(function() {
                    self.showTipCore(target);
                }, option.delay.show);
                target.data("show-timer", showTimer);

                /**
                 * 当设置 trigger 为 hover，且有 delay.show 配置时会触发此事件
                 * @event module:jsmod/ui/fixElement/tip#showtimer
                 * @type {object}
                 * @property {dom} target 进行操作的 target 元素
                 * @property {int} timer  可以供阻止显示 timer，使用 clearTimeout 可以阻止显示
                 */
                evt = $.Event("showtimer", {target: target, timer: showTimer});

                $(self).trigger(evt, [{target: target, timer: showTimer}]);
            } else {
                self.showTipCore(target);
            }
            return false;
        },
        /**
         * 处理某个 target 关联的 FixElement 实例真正 show 的方法，需要做 fix 的显示，维护 openedFixElements 数组，派发 show 事件
         * @private
         * @param {dom} target
         */
        showTipCore: function (target) {
            var self = this,
                openedFixElements = self.openedFixElements,
                fix = self.getFixElement(target), evt;

            fix.show();
            //维护 openedFixElements 数组
            if ($.inArray(fix, openedFixElements) == -1) {
                openedFixElements.push(fix);
            }
            /**
             * 显示 tip 后触发的事件
             * @event module:jsmod/ui/fixElement/tip#shown
             * @type {object}
             * @property {dom} target 进行操作的 target 元素
             */
            evt = $.Event("shown", {target: target});
            $(self).trigger(evt, [{target: target}]);
        },
        /**
         * 隐藏某个 target 的 tip，内部实现方法，由内部 toogleTip 和事件绑定函数触发，禁止外部调用
         * @private
         * @param {event} e 包含组装后的事件对象，必须含有e.data.$target属性指示target
         */
        hideTip: function (e) {
            var self = this,
                option = self.option,
                target = e.data.$target,
                fix, hideTimer, evt;

            self.clearTimer(target, "show");

            fix = self.getFixElement(target);

            if (!fix) {
                return;
            }

            //处理需要delay的逻辑，delay在hover上可用，click、manual不能用
            if (option.trigger == "hover" && option.delay && option.delay.show) {
                hideTimer = setTimeout(function() {
                    self.hideTipCore(target);
                }, option.delay.hide);
                target.data("hide-timer", hideTimer);

                // 处理当用户划入fix内阻止关闭的逻辑
                if (option.leavePreventHide && !fix.leavePreventHide) {
                    fix.leavePreventHide = true;
                    fix._element.hover(function() {
                        self.clearTimer(target, "hide");
                    }, function() {
                        self.hideTip(e);
                    });
                }

                /**
                 * 当设置 trigger 为 hover，且有 delay.hide 配置时会触发此事件
                 * @event module:jsmod/ui/fixElement/tip#hidetimer
                 * @type {object}
                 * @property {dom} target 进行操作的 target 元素
                 * @property {int} timer  可以供阻止隐藏 timer，使用 clearTimeout 可以阻止显示
                 */
                evt = $.Event("hidetimer", {target: target, timer: hideTimer});
                $(self).trigger(evt, [{target: target, timer: hideTimer}]);
            } else {
                self.hideTipCore(target);
            }
            return false;
        },
        /**
         * 处理tip真正hide的方法，需要做tip的hide，维护openedFixElements数组，派发hidden事件
         * @private
         * @param {dom} target
         */
        hideTipCore: function (target) {
            var self = this,
                openedFixElements = self.openedFixElements,
                tip = $(target).data("tip"),
                index, evt;

            tip.hide();
            //维护 openedFixElements 数组
            if ((index = $.inArray(tip, openedFixElements)) > -1) {
                openedFixElements.splice(index, 1);
            }
            /**
             * 隐藏tip后触发的事件
             * @event module:jsmod/ui/fixElement/tip#hidden
             * @type {object}
             * @property {dom} target 当前tip的target
             */
            evt = $.Event("hidden", {target: target});
            $(self).trigger(evt, {target: target});
        },
        /**
         * 重新设置tip的内容，重新设置tip内容后会重新定位到正确的位置
         * @public
         * @param {(string|dom)} target            指定的target
         * @param {object}       [option]          参数
         * @param {string}       [option.title]    title部分的html
         * @param {string}       [option.content]  content 部分的html
         */
        resetTip: function (target, option) {
            var self = this,
                tip = $(target).data("tip"),
                html;

            if (tip && (option.title || option.content)) {
                var html = self.getTipHTML(option.title, option.content, self.option.className, true);

                tip.getElement().html(html);
                tip.redraw();
                $.extend(self.option, {
                    title: option.title,
                    content: option.content
                });
            }
        },
        /**
         * 移除元素注销事件
         */
        destroy: function () {
            var self = this;

            self.mousedownCb && $("body").off("mousedown.tip", self.mousedownCb);

            $(self.option.targets).each(function () {
                self.clearTimer(this, "show");
                self.clearTimer(this, "hide");

                if (self.option.trigger == "hover") {
                    self.mouseenterCb && $(this).off("mouseenter.tip", self.mouseenterCb);
                    self.mouseleaveCb && $(this).off("mouseleave.tip", self.mouseleaveCb);
                }

                if (self.option.trigger == "click") {
                    self.clickCb && $(this).off("click.tip", self.clickCb);
                }

                $(this).removeData("shown");

                self.getFixElement(this) && self.getFixElement(this).destroy();
            });
        }
    });

    module.exports = Tip;
});
;/**
 * 分页模块
 * @module jsmod/ui/pagination
 */
define("jsmod/ui/pagination", function(require, exports, module) {
    var main, _option;

    main = require("jsmod/main");

    _option = {
        currentPage: 0,
        maxShowPage: 10,
        textLabel: ['首页', '上一页', '下一页', '尾页'],
        pageLabel: '{#0}',
        preventInitEvent: false
    };

    /**
     * 分页控件，无需写 html ，提供一个 div 节点自动生成所有的分页所需标签
     * @alias module:jsmod/ui/pagination
     * @constructor
     * @param {(dom|string)}      element                                                          分页控件的容器
     * @param {object}            option                                                           分页控件配置参数
     * @param {int}               option.pageCount                                                 一共有多少页
     * @param {int}               [option.currentPage=0]                                           当前页
     * @param {int}               [option.maxShowPage=10]                                          最多显示分页个数
     * @param {array}             [option.textLabel=new Array('首页', '上一页', '下一页', '尾页')] 几个特殊关键字
     * @param {(string|function)} [option.pageLabel={#0}]                                          字符串用 {#0} 代表当前页, 函数则取返回值作为显示。函数其参数 page 为索引计数（起始0）；而替换字符串为 page + 1
     * @param {bool}              [option.preventInitEvent=false]                                  是否阻止初始化时触发事件
     * @example
     * var Pagination = require("jsmod/ui/pagination");
     *
     * // 创建实例
     * new Pagination("#page-container", {pageCount: 20});
     */
    var Pagination = function (element, option) {
        var self = this;

        self.element = $(element);
        self.option = $.extend({}, _option, option);

        self.generatePage();
    };

    Pagination.Counst = {};

    Pagination.Counst.PAGE_TPL = '' +
        '<div class="mod-page">' +
            '<% for (var i = 0; i < renderDatas.length; i++) { %>' +
                '<a href="javascript:void(0);" <% if (renderDatas[i].page !== undefined) { %> data-page="<%= renderDatas[i].page %>" <% } %> class="mod-page-item <%= renderDatas[i].className %>"><%= renderDatas[i].label %></a>' +
            '<% } %>' +
        '</div>'; 

    if (main.config == "baidu") {
        Pagination.Counst.PAGE_TPL = '' +
            '<div class="page">' +
                '<% for (var i = 0; i < renderDatas.length; i++) { %>' +
                    '<a href="javascript:void(0);" <% if (renderDatas[i].page !== undefined) { %> data-page="<%= renderDatas[i].page %>" <% } %> class="page-item <%= renderDatas[i].className %>"><%= renderDatas[i].label %></a>' +
                '<% } %>' +
            '</div>';
    }

    $.extend(Pagination.prototype, 
    /** @lends module:jsmod/ui/pagination.prototype */
    {
        /**
         * @private
         * @description 生成分页控件、包括html、event
         */
        generatePage: function () {
            var self = this,
                option = self.option,
                renderDatas, html;

            self.generateEvents();

            if (option.pageCount < option.maxShowPage) {
                option.maxShowPage = option.pageCount;
            }

            if (option.preventInitEvent) {
                self.setPage(option.currentPage);
            } else {
                // 异步处理是因为需要获取page对象并绑定事件
                setTimeout(function() {
                    self.setPage(option.currentPage);
                }, 0);
            }
        },
        /**
         * 手动设置当前页
         * @public
         * @param {int} page 当前页
         * @fires module:jsmod/ui/pagination#page
         */
        setPage: function(page) {
            var self = this,
                html, e;

            html = self.getHTML(self.getRenderDatas(page));
            self.element.html(html);
            e = $.Event("page", {page: self.currentPage});

            /**
             * 设置page触发的事件，重复设置相同page会触发多次事件
             * @event module:jsmod/ui/pagination#page
             * @type {object}
             * @property {int} page 当前设定的page值
             */
            $(self).trigger(e, [{page: self.currentPage}]);
        },
        /**
         * @private
         * @description 生成事件
         */
        generateEvents: function() {
            var self = this,
                element = self.element,
                option = self.option;

            element.delegate("[data-page]", "click.page", function(e) {
                var page = $(this).data("page");

                if ($.isNumeric(page)) {
                    self.setPage(page);
                } else if (page == "+") {
                    self.setPage(self.currentPage + 1);
                } else if (page == "-") {
                    self.setPage(self.currentPage - 1);
                }

                return false;
            });
        },
        /**
         * 哎。。之前写错字母没办法了只能留着了
         * @private
         */
        destory: function () {
            this.element.undelegate("click.page");
            this.element.html("");
        },
        /**
         * 清空分页容器，移除事件
         * @public
         */
        destroy: function () {
            this.destory();
        },
        /**
         * @private
         * @description 获取HTML代码
         * @param {array} renderDatas 渲染分页的数据
         */
        getHTML: function (renderDatas) {
            var html;

            html = main.template(Pagination.Counst.PAGE_TPL, {renderDatas: renderDatas});
            return html;
        },
        /**
         * @private
         * @description 获取分页渲染数据
         * @param {int} page 标示当前页
         * @return {array} renderDatas 渲染分页的数据
         */
        getRenderDatas: function (page) {
            var self = this,
                option = self.option,
                renderDatas = [],
                start, end, offsetEnd, offsetStart;

            page = parseInt(page);
            page = page < 0 ? 0 : page;
            page = page > option.pageCount - 1 ? option.pageCount - 1 : page;

            flag = parseInt(option.maxShowPage / 3); // 分页渲染当前页的标识位

            start = page - flag < 0 ? 0 : page - flag; // start 位置
            offsetEnd = page - flag < 0 ? Math.abs(page - flag) : 0; // end 的偏移

            end = page + (option.maxShowPage - flag) - 1 > option.pageCount - 1 ? option.pageCount - 1 : page + (option.maxShowPage - flag) -1; // end 位置
            offsetStart = page + (option.maxShowPage - flag) - 1 > option.pageCount - 1 ? Math.abs(page + (option.maxShowPage - flag) - 1 - (option.pageCount - 1)) : 0 // start 的偏移

            start -= offsetStart;
            end += offsetEnd;

            if (page != 0) {
                // 处理固定的前两个数据
                $.each(option.textLabel.slice(0, 2), function(i, label) {
                    if (i == 0 && label) {
                        renderDatas.push({
                            className: main.config == "baidu" ? 'page-item-first' : "mod-page-item-first",
                            label: label,
                            page: 0
                        });
                    }
                    if (i == 1 && label) {
                        renderDatas.push({
                            className: main.config == "baidu" ? 'page-item-prev' : "mod-page-item-prev",
                            label: label,
                            page: "-"
                        });
                    }
                });   
            }

            // 处理页面信息
            for (start; start <= end; start++) {
                renderDatas.push({
                    className: start == page ? (main.config == "baidu" ? "page-item-active" : "mod-page-item-active") : "",
                    label: $.isFunction(option.pageLabel) ? option.pageLabel(start) : option.pageLabel.replace(/{#0}/g, start + 1),
                    page: start
                });
            }

            if (page != option.pageCount - 1) {
                // 处理固定的后两个数据
                $.each(option.textLabel.slice(2, 4), function(i, label) {
                    if (i == 0 && label) {
                        renderDatas.push({
                            className: main.config == "baidu" ? 'page-item-next' : "mod-page-item-next",
                            label: label,
                            page: "+"
                        });
                    }
                    if (i == 1 && label) {
                        renderDatas.push({
                            className: main.config == "baidu" ? 'page-item-last' : "mod-page-item-last",
                            label: label,
                            page: option.pageCount - 1
                        });
                    }
                });
            }

            // 设置当前页码
            self.currentPage = page;

            return renderDatas;
        }
    });

    module.exports = Pagination;
});
;/*! Copyright (c) 2013 Brandon Aaron (http://brandon.aaron.sh)
 * Licensed under the MIT License (LICENSE.txt).
 *
 * Version: 3.1.9
 *
 * Requires: jQuery 1.2.2+
 */

(function ($) {

    var toFix  = ['wheel', 'mousewheel', 'DOMMouseScroll', 'MozMousePixelScroll'],
        toBind = ( 'onwheel' in document || document.documentMode >= 9 ) ?
                    ['wheel'] : ['mousewheel', 'DomMouseScroll', 'MozMousePixelScroll'],
        slice  = Array.prototype.slice,
        nullLowestDeltaTimeout, lowestDelta;

    if ( $.event.fixHooks ) {
        for ( var i = toFix.length; i; ) {
            $.event.fixHooks[ toFix[--i] ] = $.event.mouseHooks;
        }
    }

    var special = $.event.special.mousewheel = {
        version: '3.1.9',

        setup: function() {
            if ( this.addEventListener ) {
                for ( var i = toBind.length; i; ) {
                    this.addEventListener( toBind[--i], handler, false );
                }
            } else {
                this.onmousewheel = handler;
            }
            // Store the line height and page height for this particular element
            $.data(this, 'mousewheel-line-height', special.getLineHeight(this));
            $.data(this, 'mousewheel-page-height', special.getPageHeight(this));
        },

        teardown: function() {
            if ( this.removeEventListener ) {
                for ( var i = toBind.length; i; ) {
                    this.removeEventListener( toBind[--i], handler, false );
                }
            } else {
                this.onmousewheel = null;
            }
        },

        getLineHeight: function(elem) {
            return parseInt($(elem)['offsetParent' in $.fn ? 'offsetParent' : 'parent']().css('fontSize'), 10);
        },

        getPageHeight: function(elem) {
            return $(elem).height();
        },

        settings: {
            adjustOldDeltas: true
        }
    };

    $.fn.extend({
        mousewheel: function(fn) {
            return fn ? this.bind('mousewheel', fn) : this.trigger('mousewheel');
        },

        unmousewheel: function(fn) {
            return this.unbind('mousewheel', fn);
        }
    });


    function handler(event) {
        var orgEvent   = event || window.event,
            args       = slice.call(arguments, 1),
            delta      = 0,
            deltaX     = 0,
            deltaY     = 0,
            absDelta   = 0;
        event = $.event.fix(orgEvent);
        event.type = 'mousewheel';

        // Old school scrollwheel delta
        if ( 'detail'      in orgEvent ) { deltaY = orgEvent.detail * -1;      }
        if ( 'wheelDelta'  in orgEvent ) { deltaY = orgEvent.wheelDelta;       }
        if ( 'wheelDeltaY' in orgEvent ) { deltaY = orgEvent.wheelDeltaY;      }
        if ( 'wheelDeltaX' in orgEvent ) { deltaX = orgEvent.wheelDeltaX * -1; }

        // Firefox < 17 horizontal scrolling related to DOMMouseScroll event
        if ( 'axis' in orgEvent && orgEvent.axis === orgEvent.HORIZONTAL_AXIS ) {
            deltaX = deltaY * -1;
            deltaY = 0;
        }

        // Set delta to be deltaY or deltaX if deltaY is 0 for backwards compatabilitiy
        delta = deltaY === 0 ? deltaX : deltaY;

        // New school wheel delta (wheel event)
        if ( 'deltaY' in orgEvent ) {
            deltaY = orgEvent.deltaY * -1;
            delta  = deltaY;
        }
        if ( 'deltaX' in orgEvent ) {
            deltaX = orgEvent.deltaX;
            if ( deltaY === 0 ) { delta  = deltaX * -1; }
        }

        // No change actually happened, no reason to go any further
        if ( deltaY === 0 && deltaX === 0 ) { return; }

        // Need to convert lines and pages to pixels if we aren't already in pixels
        // There are three delta modes:
        //   * deltaMode 0 is by pixels, nothing to do
        //   * deltaMode 1 is by lines
        //   * deltaMode 2 is by pages
        if ( orgEvent.deltaMode === 1 ) {
            var lineHeight = $.data(this, 'mousewheel-line-height');
            delta  *= lineHeight;
            deltaY *= lineHeight;
            deltaX *= lineHeight;
        } else if ( orgEvent.deltaMode === 2 ) {
            var pageHeight = $.data(this, 'mousewheel-page-height');
            delta  *= pageHeight;
            deltaY *= pageHeight;
            deltaX *= pageHeight;
        }

        // Store lowest absolute delta to normalize the delta values
        absDelta = Math.max( Math.abs(deltaY), Math.abs(deltaX) );

        if ( !lowestDelta || absDelta < lowestDelta ) {
            lowestDelta = absDelta;

            // Adjust older deltas if necessary
            if ( shouldAdjustOldDeltas(orgEvent, absDelta) ) {
                lowestDelta /= 40;
            }
        }

        // Adjust older deltas if necessary
        if ( shouldAdjustOldDeltas(orgEvent, absDelta) ) {
            // Divide all the things by 40!
            delta  /= 40;
            deltaX /= 40;
            deltaY /= 40;
        }

        // Get a whole, normalized value for the deltas
        delta  = Math[ delta  >= 1 ? 'floor' : 'ceil' ](delta  / lowestDelta);
        deltaX = Math[ deltaX >= 1 ? 'floor' : 'ceil' ](deltaX / lowestDelta);
        deltaY = Math[ deltaY >= 1 ? 'floor' : 'ceil' ](deltaY / lowestDelta);

        // Add information to the event object
        event.deltaX = deltaX;
        event.deltaY = deltaY;
        event.deltaFactor = lowestDelta;
        // Go ahead and set deltaMode to 0 since we converted to pixels
        // Although this is a little odd since we overwrite the deltaX/Y
        // properties with normalized deltas.
        event.deltaMode = 0;

        // Add event and delta to the front of the arguments
        args.unshift(event, delta, deltaX, deltaY);

        // Clearout lowestDelta after sometime to better
        // handle multiple device types that give different
        // a different lowestDelta
        // Ex: trackpad = 3 and mouse wheel = 120
        if (nullLowestDeltaTimeout) { clearTimeout(nullLowestDeltaTimeout); }
        nullLowestDeltaTimeout = setTimeout(nullLowestDelta, 200);

        return ($.event.dispatch || $.event.handle).apply(this, args);
    }

    function nullLowestDelta() {
        lowestDelta = null;
    }

    function shouldAdjustOldDeltas(orgEvent, absDelta) {
        // If this is an older event and the delta is divisable by 120,
        // then we are assuming that the browser is treating this as an
        // older mouse wheel event and that we should divide the deltas
        // by 40 to try and get a more usable deltaFactor.
        // Side note, this actually impacts the reported scroll distance
        // in older browsers and can cause scrolling to be slower than native.
        // Turn this off by setting $.event.special.mousewheel.settings.adjustOldDeltas to false.
        return special.settings.adjustOldDeltas && orgEvent.type === 'mousewheel' && absDelta % 120 === 0;
    }

})(jQuery);

/**
 * @module jsmod/ui/scrollbar
 */
define("jsmod/ui/scrollbar", function (require, exports, module) {
    var _option, main;

    main = require("jsmod/main");

    _option = {
        offsetRight: 1,
        interval: 50,
        autoHide: false,
        scrollbarNodeStyle: {
            "background": "#666",
            "border-radius": "3px",
            "opacity": "0.8",
            "width": "3px",
            "border": "1px solid #444"
        },
        scrollbarNodeHoverStyle: {
            "background": "#333"
        }
    }

    /**
     * 滚动条组件，无需改变容器的形态即可实现自定义滚动条
     * 解决了各个浏览器滚动条不同宽度的困扰，absolute 定位，无需改变盒模型
     * 被传入的容器必须有且只有一个子元素，不然会报错
     * 且该子元素的定位属性会被设置为 relative
     *
     * @alias module:jsmod/ui/scrollbar
     * @param {string|dom}  element 需要创建滚动条的容器
     * @param {object}      option 配置选项
     * @param {int}         [option.offsetRight=1]           滚动条距离右侧的位置
     * @param {int}         [option.interval=50]             每次滚动的偏移
     * @param {bool}        [option.autoHide=false]          是否自动隐藏滚动条
     * @param {string}      [option.className]               自定义滚动条容器类名
     * @param {object}      [option.scrollbarNodeStyle]      添加至滚动按钮的样式
     * @param {object}      [option.scrollbarNodeHoverStyle] 添加至滚动按钮滚动中、hover时的样式
     *
     * @example
     * // 默认滚动样式
     * scrollbarNodeStyle: {
     *     "background": "#666",
     *     "border-radius": "3px",
     *     "opacity": "0.8",
     *     "width": 3,
     *     "border": "1px solid #444"
     * }
     *
     * // 默认滚动中 / hover 样式
     * scrollbarNodeHoverStyle: {
     *     "background": "#333"
     * }
     */
    var Scrollbar = function (element, option) {
        var self = this;

        self.$element = $(element);
        self.option = $.extend({}, _option, option);

        if (self.$element.children().length != 1) {
            throw new Error("container must have nur one child");
            return;
        }

        self.$child = self.$element.children().eq(0);
        self.init();
    }

    $.extend(Scrollbar.prototype, 
        /**
         * @lends module:jsmod/ui/scrollbar.prototype
         */
        {
            /**
             * 包裹容器，生成必要元素
             * @private
             */
            init: function () {
                var self = this,
                    option = self.option;

                self.$element.css("overflow", "hidden").
                    css("position", "relative");

                self.$child.css("position", "relative").css("top", 0);

                self.$scrollElement = $(
                    [
                        '<div style="cursor: pointer; top: 0; position: absolute; display: none;" class="mod-scrollbar">',
                            '<div style="position: absolute; left: 0;" class="mod-scrollbar-node"></div>',
                        '</div>'
                    ].join("")
                ).css("right", option.offsetRight);

                if (option.className) {
                    self.$scrollElement.adClass(option.className);
                }
                
                self.$scrollElement.appendTo(self.$element);

                self.$scrollNode = self.$scrollElement.find(".mod-scrollbar-node")
                    .css(option.scrollbarNodeStyle);

                self.$scrollElement.width(self.$scrollNode.outerWidth(true));

                self.resetBar();
                self.bindEvent();

                self.intervalTimer = setInterval(function () {
                    if (self.childHeight != self.$child.outerHeight(true) || self.height != self.$element.height()) {
                        self.resetBar();
                    }
                }, 500);
            },
            /**
             * 判断 scrollbar 是否显示并设置 node 高度
             * 程序内部每隔 500ms 检测一次，发生高度变化外部可以立即调用
             *
             * @public
             */
            resetBar: function (preventResize) {
                var self = this,
                    childHeight, innerHeight, height, to;

                self.childHeight = childHeight = self.$child.outerHeight(true),
                self.innerHeight = innerHeight = self.$element.innerHeight(),
                self.height = height = self.$element.height();

                if (childHeight > height) {
                    self.$scrollElement.fadeIn("fast");

                    if (!preventResize) {
                        self.nodeHeight = height / childHeight * innerHeight - (self.$scrollNode.outerHeight(true) - self.$scrollNode.height());

                        if (!self.$scrollNode.height()) {
                            self.$scrollNode.height(self.nodeHeight);
                        } else {
                            self.$scrollNode.animate({
                                height: self.nodeHeight
                            }, "fast", function () {
                                self.nodeOuterHeight = self.$scrollNode.outerHeight(true);
                            });
                        }

                        self.nodeOuterHeight = self.nodeHeight;

                        to = parseInt(self.$child.css("top").replace("px", ""));

                        if (Math.abs(to) + self.height > self.childHeight) {
                            to = -self.childHeight + self.height;
                            self.$child.css("top", to);
                        }

                        self.$scrollElement.animate({
                            top: Math.abs(to) / self.childHeight * self.innerHeight
                        }, "fast");
                    }
                } else {
                    self.$child.css("top", "0px");
                    self.$scrollElement.css("top", "0px").fadeOut(300);
                }
            },
            /**
             * 传入滚动到的位置, 将所有操作组合为一个参数，具体逻辑由程序内部判断
             *
             * @public
             * @param {string|int}  condition      传入的位置关键字可以是 top, bottom, 元素选择器, 位置数字
             * @param {bool}        [animate=true] 是否启用动画
             */
            scroll: function (condition, animate) {
                var self = this,
                    to, top;

                animate = animate === undefined ? true : animate;

                if (condition == "top" || condition == "bottom") {
                    if (condition == "top") {
                        to = 0;
                    } else {
                        to = self.childHeight - self.height;
                    }
                } else if ($.isNumeric(condition)) {
                    to = parseInt(condition);
                } else if ($(condition).length > 0 && $.contains(self.$child.get(0), $(condition).get(0))) {
                    to = self.getTop($(condition));
                }

                if (to !== undefined) {
                    to = to + self.height > self.childHeight ? self.childHeight - self.height : to;

                    if (animate) {
                        self.$child.animate({
                            top: -to
                        }, "fast");
                        self.$scrollElement.animate({
                            top: Math.abs(to) / self.childHeight * self.innerHeight
                        }, "fast");
                    } else {
                        self.$child.css("top", -to);
                        self.$scrollElement.css("top", Math.abs(to) / self.childHeight * self.innerHeight);
                    }

                }
            },
            /**
             * 递归获取 el 相对于容器可显示范围顶部的位置
             * @param {string|dom}  el  需要获取位置的元素，必须在容器内部
             */
            getTop: function (el) {
                var self = this,
                    fun;

                fun = function (dom) {
                    if (dom.offsetParent().get(0) != self.$child.get(0)) {
                        return dom.position().top + fun(dom.offsetParent());
                    } else {
                        return dom.position().top;
                    }
                }

                return fun(el) + parseInt(self.$element.css("paddingTop").replace("px", ""));
            },
            bindEvent: function () {
                var self = this,
                    seed;

                self.seed = seed = +(new Date());

                self.$element.on("mousewheel.scrollbar", function (e, delta) {
                    var top = parseInt(self.$child.css("top").replace("px", "")),
                        to;

                    if (self.$scrollElement.css("display") != "none") {
                        if (delta > 0) {
                            to = top + self.option.interval > 0 ? 0 : top + self.option.interval;
                        } else {
                            to = top - self.option.interval < -self.childHeight + self.height ? -self.childHeight + self.height : top - self.option.interval;
                        }

                        self.scroll(Math.abs(to), false);

                        e.preventDefault();                        
                    }
                });

                self.$scrollElement.on("mouseenter.scrollbar", function () {
                    self.$scrollNode.css(self.option.scrollbarNodeHoverStyle);
                });

                self.$scrollElement.on("mouseleave.scrollbar", function () {
                    !self.$scrollElement.data("dragging") && self.$scrollNode.css(self.option.scrollbarNodeStyle);
                });

                // 控制鼠标拖拽的事件组
                $(document).on("mousemove.scrollbar." + seed, function (e) {
                    var top, y, to;

                    if (!self.$scrollElement.data("dragging")) {
                        return;
                    }

                    var containerStart = self.$element.offset().top + parseInt(self.$element.css("borderTopWidth").replace("px", "")),
                        containerEnd = containerStart + self.$element.innerHeight(),
                        y, top;

                    y = e.pageY - self.$scrollElement.data("startY");

                    if (y <= containerStart) {
                        top = 0;
                    } else if (y + self.nodeOuterHeight >= containerEnd) {
                        top = self.innerHeight - self.nodeOuterHeight;
                    } else {
                        top = y - containerStart;
                    }

                    to = -(top * self.childHeight / self.innerHeight);
                    self.$child.css("top", to);

                    self.$scrollElement.css("top", top);
                    e.preventDefault();
                });

                self.$scrollElement.on("mousedown.scrollbar", function (e) {
                    if (!self.$scrollElement.data("dragging")) {
                        self.$scrollElement.data("startY", e.offsetY || e.originalEvent.layerY)
                            .data("dragging", true);
                    }
                    e.preventDefault();
                });

                $(document).on("mouseup.scrollbar." + seed, function (e) {
                    if (self.$scrollElement.data("dragging")) {
                        self.$scrollElement.data("dragging", false);
                        self.$scrollElement.trigger("mouseleave");
                    }
                    e.preventDefault();
                });

                if (self.option.autoHide) {
                    self.$element.on("mouseenter.scrollbar", function () {
                        self.hideTimer && clearTimeout(self.hideTimer);

                        self.resetBar(true);
                    });

                    self.$element.on("mouseleave.scrollbar", function () {
                        self.hideTimer && clearTimeout(self.hideTimer);

                        self.hideTimer = setTimeout(function () {
                            self.$scrollElement.fadeOut("fast");
                        }, 1000);
                    });
                }
            },
            /**
             * 移除元素和注册的事件
             * @public
             */
            destroy: function () {
                var self = this;

                clearInterval(self.intervalTimer);

                self.hideTimer && clearTimeout(self.hideTimer);

                $(document).off("mouseup.scrollbar." + self.seed);
                $(document).off("mousemove.scrollbar." + self.seed);

                self.$element.off("mouseenter.scrollbar");
                self.$element.off("mouseleave.scrollbar");
                self.$element.off("mousewheel.scrollbar");

                self.$scrollElement.remove();
            }
        }
    );
    
    module.exports = Scrollbar;
});
;/**
 * 分栏模块
 * @module jsmod/ui/tab
 */
define("jsmod/ui/tab", function(require, exports, module) {
    var main, _option, classArray;

    main = require("jsmod/main");

    _option = {
        trigger: "click",
        preventInitEvent: false,
        delay: 200
    };

    if (main.config == "baidu") {
        classArray = {
            tabItem : "tab-item",
            tabItemActive: "tab-item-active"
        }
    } else {
        classArray = {
            tabItem : "mod-tab-item",
            tabItemActive: "mod-tab-item-active"
        }
    }

    /**
     * 初始化时需要有特定的HTML结构，被标识为 mod-tab-item-active 的为当前开启状态，默认为第一个。
     * 当存在 data-target 属性时，会将当前非开启状态的 target 隐藏（当然也可以手动执行）
     * @constructor
     * @alias module:jsmod/ui/tab
     * @param {(dom|selector)} element                              需要实现 tab 的 dom 元素
     * @param {object}         [option]                             可配置项
     * @param {object}         [option.className]                   自定义 className
     * @param {string}         [option.trigger=click]               触发切换 tab 的事件，可选项：click, hover
     * @param {Delay}          [option.delay=200]                   当选择 hover 可用, 激活某个 tab 的延迟
     * @param {bool}           [option.preventInitEvent=false]      是否阻止初始化时触发事件
     * @example
     * // dom 元素
     * <ul id="tab">
     *     <li data-target="#content1" class="tab-item">分栏1</li>
     *     <li data-target="#content2" class="tab-item tab-item-active">分栏2</li>
     * </ul>
     *
     * // js 代码
     * instance = new require("jsmod/ui/tab")("#tab");
     */
    var Tab = function (element, option) {
        var self = this;

        self.element = $(element);
        self.option = $.extend({}, _option, option);
        self.init();
    }

    $.extend(Tab.prototype, 
    /** @lends module:jsmod/ui/tab.prototype */
    {
        /**
         * @private
         * @description 初始化控件
         */
        init: function () {
            var self = this,
                element = self.element,
                activedTab;

            if (self.option.className) {
                element.addClass(self.option.className);
            }

            self.tabs = element.find('.' + classArray.tabItem);
            activedTab = (self.tabs.filter('.' + classArray.tabItemActive).length == 1) ? self.tabs.filter('.' + classArray.tabItemActive) : self.tabs.first(); // 获取需要设置active的tab

            self.generateEvents();

            if (self.option.preventInitEvent) {
                self.active(activedTab);
            } else {
                setTimeout(function() {
                    self.active(activedTab);                    
                });
            }
        },
        /**
         * 手动开启某个tab
         * @public
         * @param {dom} activedTab 某个tab
         * @fires module:jsmod/ui/tab#tab
         */
        active: function(activedTab) {
            var self = this,
                content, same, e;

            if (self.activedTab && $(self.activedTab).get(0) == $(activedTab).get(0)) {
                same = true;
            }

            self.clearTabs();

            // 如果有设置的content则需要将content显示
            if ($(activedTab).data('target')) {
                content = $($(activedTab).data('target')).show();
            }

            self.activedTab && $(self.activedTab).removeClass(classArray.tabItemActive);
            self.activedTab = $(activedTab).addClass(classArray.tabItemActive);
            /**
             * @event module:jsmod/ui/tab#tab
             * @type {object}
             * @property {dom}  tab  当前actived的tab
             * @property {bool} same 开始的tab是否是已经开启
             */
            e = $.Event("tab", {tab: self.activedTab, same: same});
            $(self).trigger(e, [{tab: self.activedTab, same: same}]);
        },
        /**
         * 隐藏tab上设置的所有target
         * @private
         */
        clearTabs: function () {
            var tabs = this.tabs;

            tabs.each(function() {
                var target;

                if (target = $(this).data('target')) {
                    $(target).hide();
                }
            });
        },
        /**
         * @descriptionc 生成事件
         * @private
         */
        generateEvents: function() {
            var self = this,
                element = self.element,
                trigger = self.option.trigger == "hover" ? "mouseenter" : "click";

            // 处理 hover 且设置 delay 的情况
            if (trigger == "mouseenter" && self.option.delay) {
                element.delegate("." + classArray.tabItem, "mouseenter.tab", function () {
                    var el = this;

                    self.clearShowTimer();
                    self.showTimer = setTimeout(function () {
                        self.active(el);
                    }, self.option.delay);
                });

                element.delegate("." + classArray.tabItem, "mouseleave.tab", function () {
                    self.clearShowTimer();
                });
            } else {
                element.delegate('.' + classArray.tabItem, trigger + ".tab", function() {
                    self.active(this);
                    return false;
                });
            }
        },
        /**
         * 清除 showTimer
         * @private
         */
        clearShowTimer: function () {
            this.showTimer && clearTimeout(this.showTimer);
        },
        /**
         * 清除事件、释放内存
         * @public
         */
        destroy: function () {
            var self = this,
                element = self.element,
                trigger = self.option.trigger == "hover" ? "mouseenter" : "click";

            if (trigger == "mouseenter" && self.option.delay) {
                element.undelegate("." + classArray.tabItem, "mouseenter.tab");
                element.undelegate("." + classArray.tabItem, "mouseleave.tab");
            } else {
                element.undelegate('.' + classArray.tabItem, trigger + ".tab");
            }
            self.clearShowTimer();
            self.element = null;
        }
    });

    module.exports = Tab;
});
;/**
 * treeView 控件
 * @module jsmod/ui/treeView
 */
define("jsmod/ui/treeView", function (require, exports, module) {
    var _option = {
        isToggleElement: true
    }

    /**
     * treeView所使用的节点数据结构
     * @typedef {object} TreeNode
     * @property {string}       text             节点显示的内容
     * @property {TreeNode[]}   [children]       子节点数组，如果没有则代表叶子节点
     * @property {bool}         [expanded=false] 是否展开此节点，当本节点有子节点时设置此值才有用
     */


    /**
     * 创建treeview控件，需要准备数据以及容器
     * @constructor
     * @alias module:jsmod/ui/treeView
     * @param {(TreedNode|TreeNode[])}  datas                         树形结构的数据结构，可以是单树也可以是深林
     * @param {object}                  option                        配置选项
     * @param {(string|dom)}            option.content                树的容器
     * @param {function}                option.getText                通过TreeNode数据结构获取需要渲染的内容
     * @param {bool}                    [option.isToggleElement=true] 是否有控制toggle的元素
     */
    var TreeView = function (datas, option) {
        var self = this;

        self.option = $.extend({}, _option, option);
        self.datas = $.isArray(datas) ? datas : [datas];
        self.content = $(self.option.content);
        self.render();
        self.delegateEvents();
    }

    $.extend(TreeView.prototype,
        /** @lends module:jsmod/ui/treeView.prototype */
        {
            /**
             * 渲染树形结构的主逻辑
             * @private
             */
            render: function () {
                var self = this,
                    createTree, root;

                /**
                 * 创建树形结构的递归函数
                 * @private
                 * @param {dom}        root     当前节点的root节点
                 */
                createTree = function (root, treeNode) {
                    var li, father;

                    li = $('<li class="treeview-node"></li>').html(self.option.getText ? self.option.getText(treeNode) : treeNode.text);
                    root.append(li);

                    if (!treeNode.children || treeNode.children.length == 0) {
                        li.addClass("treevie-leaf");
                        return;
                    }

                    father = $('<ul style="display:none;" class="treeview-list-fahter"></ul>').appendTo(li);
                    li.addClass("treeview-node-father");

                    if (self.option.isToggleElement) {
                        li.prepend('<span class="treeview-toggle">');
                    }


                    if (treeNode.expanded) {
                        self.expand(li);
                    }

                    $.each(treeNode.children, function () {
                        createTree(father, this);
                    });
                };

                root = $('<ul class="treeview-list-root"></ul>').appendTo(self.content);

                $.each(self.datas, function () {
                    createTree(root, this);
                });
            },
            /**
             * 开启一个 treeview-node-father，开启后会给 treeview-node-father 加上 treeview-node-father-expanded 样式类 ，并开启所有的父元素
             * @public
             * @param {dom}  fatherNode           要开启的节点
             * @param {bool} [useAnimation=false] 是否启用动画
             */
            expand: function (fatherNode, useAnimation) {
                var self = this,
                    time = useAnimation ? "fast" : 0;

                if (fatherNode.hasClass("treeview-node-father")) {
                    fatherNode.children(".treeview-list-fahter").slideDown(time);
                    fatherNode.addClass("treeview-node-father-expanded");
                    fatherNode.children(".treeview-toggle").addClass("treeview-toggle-expanded");

                    $(self).trigger("expanded", [{node: fatherNode}]);
                }
            },
            /**
             * @public
             * @param {dom} fatherNode 要关闭的节点
             * @param {bool} [useAnimation=false] 是否启用动画
             * 关闭一个 treeview-node-father , 会删除 treeview-node-father-expanded 的样式类
             */
            contract: function (fatherNode, useAnimation) {
                var self = this,
                    time = useAnimation ? "fast" : 0;

                if (fatherNode.hasClass("treeview-node-father-expanded")) {
                    fatherNode.children(".treeview-list-fahter").slideUp(time);
                    fatherNode.removeClass("treeview-node-father-expanded");
                    fatherNode.children(".treeview-toggle-expanded").removeClass("treeview-toggle-expanded");

                    $(self).trigger("contracted", [{node: fatherNode}]);
                }
            },
            /**
             * 绑定事件
             * @private
             */
            delegateEvents: function () {
                var self = this;

                self.content.delegate(".treeview-node", "click", function (e) {
                    var target = $(this);

                    if (self.option.isToggleElement && !$(e.target).hasClass("treeview-toggle")) {
                        e.stopPropagation();
                        return;
                    }

                    if (target.hasClass("treeview-node-father")) {
                        if (target.hasClass("treeview-node-father-expanded")) {
                            self.contract(target, true);
                        } else {
                            self.expand(target, true);
                        }   
                    }

                    e.stopPropagation();
                });
            }
        }
    );

    module.exports = TreeView;
});