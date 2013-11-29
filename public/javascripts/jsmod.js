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
 * Dialog模块，居中定位，并显示遮罩图层，不能同时打开两个Dialog
 * 当显示dialog时会判断当前是否有正在显示的dialog
 * z-index 超过1000的元素不会被覆盖
 * @module jsmod/ui/dialog
 */
define("jsmod/ui/dialog", function(require, exports, module) {
    var Dialog, _option;

    var ie6 = 'undefined' == typeof(document.body.style.maxHeight);

    _option = {};

    /**
     * @constructor
     * @alias module:jsmod/ui/dialog
     * @param {object} option
     * @param {int}    option.width     宽度
     * @param {int}    option.height    高度
     * @param {string} option.html      html代码
     * @param {object} [option.buttons] key标识button的value，参数为function标识button点击后的操作
     * @param {Coords} [option.offset]  定位时的偏移 - @see {@link Coords}
     */
    Dialog = function (option) {
        var self = this;

        self.option = $.extend({}, _option, option);
        self.init();
    }

    /**
     * 重置frame窗体中的内容
     */
    Dialog.resetFrame = function () {
        var frame = $(".mod-dialog-frame");

        if (frame.length == 0) {
            if (ie6) {
                Dialog.frame = $('<div class="mod-dialog-frame" style="overflow:hidden; display:none; position: absolute; left:0; top: 0; right:0; bottom: 0; z-index: 1000; background-color: rgba(63, 63, 63, 0.7); *background-color: #3F3F3F"></div>').appendTo("body");
                Dialog.frame.css("width", $(window).width() + "px");
                Dialog.frame.css("height", $(window).height() + "px");
            } else {
                Dialog.frame = $('<div class="mod-dialog-frame" style="overflow:hidden; display:none; position: fixed; left:0; top: 0; right:0; bottom: 0; z-index: 1000; background-color: rgba(63, 63, 63, 0.7); *background-color: #3F3F3F"></div>').appendTo("body");
            }
        }

        if (frame.find(".mod-dialog-wrap").length > 0) {
             frame.find(".mod-dialog-wrap").detach();
        }
    }

    if (!Dialog.keyEvent) {
        $(document).on("keydown.dialog", function (e) {
            if (e.keyCode == 27) {
                Dialog._instance && Dialog._instance.hide();
            }
        });

        Dialog.keyEvent = true;
    }

    /**
     * 禁止esc触发关闭
     */
    Dialog.disableKeyEvent = function () {
        $(document).off("keydown.dialog");
    }

    $.extend(Dialog.prototype, 
        /**
         * @lends module:jsmod/ui/dialog.prototype
         */ 
        {   
            /**
             * 初始化弹出内容，并绑定各种事件
             */
            init: function () {
                var self = this,
                    element;

                element = $(self.option.html);
                self.content = $('<div style="overflow:hidden; overflow-y: auto; position: absolute; background-color: #FFFFFF;" class="mod-dialog-wrap"></div>').append(element);

                self.option.width && self.content.css("width", self.option.width + "px");
                self.option.height && self.content.css("height", self.option.height + "px");
            },
            /**
             * 显示弹窗
             * @public
             * @param {object} option         配置项
             * @param {bool}   [option.fade]  渐变效果
             * @public
             */
            show: function (option) {
                var self = this;

                option = option || {};

                Dialog.resetFrame();
                $("body").css("overflow", "hidden");

                Dialog.frame.show();

                if (option.fade) {
                    self.content.hide().appendTo(Dialog.frame).fadeIn();
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
             * @public
             */
            hide: function (option) {
                var self = this;

                option = option || {};

                $("body").css("overflow", "");

                if (option.fade) {
                    Dialog.frame.fadeOut();
                } else {
                    Dialog.frame.hide();
                }
            },
            /**
             * 调整位置
             * @public
             */
            adjuestPosition: function () {
                var self = this,
                    offset = self.option.offset || {},
                    wHeight, wWidth, height, width;

                wHeight = Dialog.frame.height();
                wWidth = Dialog.frame.width();

                height = self.content.height();
                width = self.content.width();

                self.content.css("top", parseInt(wHeight / 2 - height / 2 + (offset.top || 0)) + "px");
                self.content.css("left", parseInt(wWidth / 2 - width / 2 + (offset.left || 0)) + "px");
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

    /**
     * @default 默认配置
     */
    var _option = {
        targetType: "top",
        zIndex: 1000,
        fixed: false,
        preventResize: false
    }

    var ie6 = 'undefined' == typeof(document.body.style.maxHeight);

    /**
     * @constructor
     * @alias module:jsmod/ui/fixElement
     * @param {(dom|selector)} element                      需要进行定位的元素，可以是html、dom元素、选择器
     * @param {object}         option                       需要传入的参数集合
     * @param {(dom|selector)} [option.target]              定位到这个元素附近
     * @param {string}         [option.targetType=top]      定位方式 - center | top | bottom | right | left
     * @param {Coords}         [option.position]            没有target参数时，采取绝对定位方式时传入的坐标 - @see {@link Coords}
     * @param {bool}           [option.fixed=false]         是否使用fixed定位，仅当采用坐标定位时可用，ie6会自动加入hack支持fix定位
     * @param {int}            [option.zIndex=1000]         固定元素的z-index
     * @param {Coords}         [option.offset]              定位时的偏移 - @see {@link Coords}
     * @param {bool}           [option.preventShow=false]   是否阻止初始化时显示元素
     * @param {bool}           [option.preventResize=false] 是否阻止resize时重定位元素
     */
    var FixElement = function(element, option) {
        var self = this;

        self._element = $(element);
        self.option = $.extend({}, _option, option);
        if (self.option.target) {
            self.target = $(self.option.target);
        }
        self.redraw();
        option.preventShow && self.hide();
        if (!option.preventResize) {
            $(window).resize(function () {
                setTimeout(function () {
                    self.redraw(null, {hide: self._isHide});
                });
            });
        }
    }

    $.extend(FixElement.prototype,
    /** @lends module:jsmod/ui/fixElement.prototype */ 
    {
        /**
         * @public
         * @function
         * @description 定位到特定的位置
         * @param {Coords} position 绝对定位方式时传入的坐标 - @see {@link Coords}
         * @param {bool}   [fixed]  是否使用fixed定位
         * @param {Coords} [offset] 定位时的偏移 - @see {@link Coords}
         * @example
         * instance.fix({left: 10, top: 20}, true, {left: 2, top: 5});
         */
        fix: function(position, fixed, offset) {
            var self = this,
                element = self._element,
                position = $.extend({}, position);

            if (offset) {
                position.top += offset.top || 0;
                position.left += offset.left || 0;
            }

            if (element.parent("body").length == 0) {
                element.detach().appendTo(document.body);
            }

            if (fixed && !ie6) {
                element.css("position", "fixed");
                element.offset(position);
            } else {
                element.css("position", "absolute");
                if (ie6 && fixed) {
                    element.get(0).style.cssText += ";_top: expression(eval(document.documentElement.scrollTop + " + position.top + "))";
                    element.get(0).style.cssText += ";_left: expression(eval(document.documentElement.scrollLeft + " + position.left + "))";
                } else {
                    element.css("position", "absolute");
                    element.offset(position);
                }
            }
        },
        /**
         * @public
         * @description 定位到指定的元素周围
         * @param {(string|dom)} target           定位到这个元素附近
         * @param {string}       [targetType=top] 定位方式 - center | top | bottom | right | left
         * @param {Coords}       [offset]         定位时的偏移 - @see {@link Coords}
         * @example
         * instance.fixTo("#to-fix-element", "bottom", {left: 5, top: 5});
         */
        fixTo: function(target, targetType, offset) {
            var self = this,
                element = self._element,
                bounds, rect, position;

            targetType = targetType || self.option.targetType;

            element.css("position", "absolute").detach().insertAfter(target);

            bounds = self.getBounds(target);
            rect = self.getRect(element);

            switch (targetType) {
                case "top": 
                    position = {top: bounds.top - rect.height, left: bounds.left + bounds.width /2 - rect.width / 2}
                    break;
                case "right":
                    position = {top: bounds.top + bounds.height / 2 - rect.height / 2, left: bounds.left + bounds.width}
                    break;
                case "bottom":
                    position = {top: bounds.top + bounds.height, left: bounds.left + bounds.width /2 - rect.width / 2}
                    break;
                case "left":
                    position = {top: bounds.top + bounds.height / 2 - rect.height / 2, left: bounds.left - rect.width}
                    break;
                case "center":
                    position = {top: bounds.top + bounds.height / 2 - rect.height / 2, left: bounds.left + bounds.width /2 - rect.width / 2}
                    break;
            }

            if (offset) {
                position.top += offset.top || 0;
                position.left += offset.left || 0;
            }

            element.offset(position);
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
         * @param {object} [option]            重置的配置项
         * @param {object} [option.hide=false] 重置后是否隐藏
         */
        redraw: function(html, optionR) {
            var self = this,
                option = self.option,
                optionR = optionR || {};

            if (html) {
                self._element.remove();
                self._element = $(html);
            }

            self._element.css("z-Index", option.zIndex);

            if (optionR.hide) {
                self.hide();
            } else {
                self.show();
            }

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
         */
        show: function() {
            var self = this,
                option = self.option,
                evt;

            this._element.show();
            this._element.addClass("fe-in");
            this._isHide = false;

            if (option.target) {
                self.fixTo(option.target, option.targetType, option.offset);
            } else if (option.position) {
                self.fix(option.position, option.fixed, option.offset);
            }

            /**
             * 显示时触发
             * @event module:jsmod/ui/fixElement#shown
             * @type {object}
             */
            evt = $.Event("shown");

            $(this).trigger("shown");
        },
        /**
         * 隐藏element元素，重写此方法，可以实现不同的效果
         * @public
         */
        hide: function() {
            var evt;

            this._element.hide();
            this._element.addClass("fe-out");
            this._isHide = true;

            /**
             * 隐藏时触发
             * @event module:jsmod/ui/fixElement#hidden
             * @type {object}
             */
            evt = $.Event("hidden");

            $(this).trigger("hidden");
        },
        /**
         * 调用show、或hide方法
         * @public
         */
        toggle: function() {
            this._isHide ? this.show() : this.hide();
        },
        /**
         * 移除元素、事件、释放内存
         * @public
         */
        destroy: function() {
            this._element.remove(); 
            this._element = null;
        },
        /**
         * 获取产生的dom对象，可以对其进行事件添加等操作
         * @public
         */
        getElement: function () {
            return this._element;
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

    /**
     * @default 默认设置
     */
    var _option = {},
        DropDown, FixElement, IE6;

    _option = {
        targetType: "bottom",
        preventShow: true,
        keyPressShow: true,
        syncInput: true
    }

    IE6 = 'undefined' == typeof(document.body.style.maxHeight);

    FixElement = require("jsmod/ui/fixElement");

    /**
     * 下拉组建，继承自 {@link module:jsmod/ui/fixElement}
     * @constructor
     * @alias module:jsmod/ui/fixElement/dropDown
     * @extends module:jsmod/ui/fixElement
     * @param {(DropItem[]|object[])} items                      需要传入的数据集合。如果配置了optoin.fun，则可以传入简单的对象集合
     * @param {object}                [option]                   配置选项
     * @param {(dom|selector)}        [option.target]            定位到这个元素附近
     * @param {string}                [option.targetType=bottom] 定位方式 - center | top | bottom | right | left
     * @param {Coords}                [option.position]          没有target参数时，采取绝对定位方式时传入的坐标 - @see {@link Coords}
     * @param {bool}                  [option.fixed=false]       是否使用fixed定位，仅当采用坐标定位时可用，ie6会自动加入hack支持fix定位
     * @param {int}                   [option.zIndex=1000]       固定元素的z-index
     * @param {Coords}                [option.offset]            定位时的偏移 - @see {@link Coords}
     * @param {bool}                  [option.preventShow=true]  是否阻止初始化时显示元素
     * @param {string}                [option.className]         添加自定义的className
     * @param {function}              [option.fun]               会将index, item作为参数传递。返回数据结构为：{@see DropItem}
     * @param {function}              [option.keyPressShow=true] 当target为input时，按上下键是否显示下拉
     * @param {function}              [option.syncInput=true]    当target为input时，按上下键选中时是否同步填充
     */
    var DropDown = function (items, option) {
        var self = this;

        self.option = $.extend({}, _option, option);
        self.items = items;

        self.element = self.generateList();

        FixElement.apply(self, [self.element, self.option]);

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
                html;

            if (items.length == 0) {
                return '<div class="mod-empty"></div>';
            }

            html = '<ul class="mod-dropdown ' + (option.className || '') + '">';

            $.each(items, function (index, item) {
                var data;

                if (option.fun && $.isFunction(option.fun)) {
                    data = option.fun(index, item);
                } else {
                    data = item;
                }

                html += '<li class="mod-dropdown-item" data-value="' + data.value + '" data-key="' + data.key + '">' + (data.html || data.value) + '</li>';
            });

            html += "</ul>";

            return html;
        },
        /**
         * 重新添加数据进行绘制，如果不传入参数只进行重置
         * @param {array}          [items]                    需要放到dropdown上的数组数据
         * @param {string}         [items[].key]              触发事件时的回调传递的参数之一，如果配置option.fun则无需传入
         * @param {string}         [items[].value]            实际渲染的HTML数据，如果配置option.fun则无需传入
         */
        resetItems: function (items, option) {
            var self = this,
                html;

            self.items = items || self.items;
            html = self.generateList();

            self.redraw(html, {hide: self._isHide});
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

                ev = $.Event("selectitem");

                /**
                 * 点击选项时触发的事件
                 * @event module:jsmod/ui/fixElement/dropDown#selectitem
                 * @type {object}
                 * @property {string} key     设置的key
                 * @property {string} value   设置的value
                 * @property {dom}    element 选择的那个选项
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
                        if (e.keyCode == 38 || e.keyCode == 40 && self.option.keyPressShow) {
                            self.show();
                        }
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

                            ev = $.Event("selectitem");

                            $(self).trigger(ev, [{key: key, value: value, element: cur}]);

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

            if (IE6) {
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
             * @event jsmod/ui/fixElement/dropDown#moveto
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

                if (IE6) {
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
 * suggestion 提供ajax调用远程数据返回结果，并自动调用下拉框
 * @module jsmod/ui/fixElement/dropDown/suggestion
 */
define("jsmod/ui/fixElement/dropDown/suggestion", function (require, exports, module) {
    var DropDown, _option;

    DropDown = require("jsmod/ui/fixElement/dropDown");

    /**
     * JSONP 请求时的配置项
     * @typedef {object} JSONPOption
     * @property {string} jsonp         在一个jsonp请求中重写回调函数的名字。
     * @property {string} jsonpCallback 为jsonp请求指定一个回调函数名。
     */

   /**
    * 默认配置
    */
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
     * @param {function}         option.fun                  会将index, item作为参数传递。返回数据结构为：{@see DropItem}
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

                    $(self.target).blur(function () {
                        if (option.blurHide) {
                            setTimeout(function () {
                                self.hide();
                            }, 200);
                        }
                    });
                }
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

                    if (e.keyCode == 38 || e.keyCode == 40 && option.syncInput && !self._isHide) {
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

                dfd = self.cacheDfds[val];

                if (!dfd) {
                    sendData = option.sendData && option.sendData(val);
                    url = $.isFunction(option.url) ? option.url(val) : option.url;

                    dfd = $.ajax({
                        url: url,
                        data: sendData,
                        dataType: option.jsonpOption ? "jsonp" : "json",
                        jsonp: option.jsonpOption && option.jsonpOption.jsonp ? option.jsonpOption.jsonp : undefined,
                        jsonpCallback: option.jsonpOption && option.jsonpOption.jsonpCallback ? option.jsonpOption.jsonpCallback : undefined
                    }).promise();

                    self.cacheDfds[val] = dfd;
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
    var FixElement = require("jsmod/ui/fixElement");

    /**
     * @typedef {object} Delay
     * @property {int} show 显示时的delay
     * @property {int} hide 隐藏时的delay
     */

    var _option = {
        trigger: "hover",
        targetType: "top",
        leavePreventHide: true,
        otherClickHide: true,
        delay: {show: 300, hide: 300}
    }

    /**
     * 简单的tip生成模块
     * @alias module:jsmod/ui/fixElement/tip
     * @constructor
     * @param {object}       [option]                             配置参数
     * @param {(dom|string)} [option.targets]                     可以触发tip的targets
     * @param {string}       [option.title]                       title部分的html，如果不传则获取data-title，优先data-title
     * @param {string}       [option.content]                     content部分的html，如果不传则获取data-content，优先data-content
     * @param {string}       [option.targetType=top]              相对于targets，tip的位置 - center | top | bottom | right | left，优先data-target-type
     * @param {Coords}       [option.offset]                      tip的偏移，优先data-offset
     * @param {string}       [option.className]                   附加的className
     * @param {string}       [option.trigger=hover]               触发tip的事件 -hover|click|manual
     * @param {Delay}        [option.delay={show:300, hide: 300}] 当选择hover可用, 延迟多少毫秒显示、消失，设置为0时取消delay
     * @param {bool}         [option.leavePreventHide=true]       当选择hover可用，且设置delay时此参数可用，指示是否在鼠标移动到tip内终止隐藏
     * @param {bool}         [option.otherClickHide=true]         当选择click可用，当点击页面除tip外的dom则关闭tip
     * @exmaple
     * &lt;span id="target"&gt;目标&lt;/span&gt;
     * </hr>
     * new require("jsmod/ui/fixElement/tip")({target: "#target", title: "标题", content: "内容"});
     */ 
    var Tip = function(option) {
        var self = this,
            option;

        self._option = option = $.extend({}, _option, option);

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
         * 为某个target绑定tip触发、消失事件
         * @private
         * @param {dom} el 绑定事件的dom元素
         */
        bindEvent: function(el) {
            var self = this,
                option = self._option;

            self.openedTips = [];

            if (option.trigger == "hover") {
                $(el).mouseenter({target: el}, $.proxy(self.showTip, self));
                $(el).mouseleave({target: el}, $.proxy(self.hideTip, self));
            }

            if (option.trigger == "click") {
                $(el).click({target: el}, function(e) {
                    setTimeout($.proxy(self.toggleTip, self, e), 100);
                });
            }
        },
        /**
         * 注册body的点击事件，确定是否关闭tip
         * @private
         */
        otherClickEvent: function() {
            var self = this;

            $(document.body).on("mousedown.tip.close", function(e) {
                if ($(e.target).parents(".module").length == 0) {
                    self.hideAllTips(e);
                }
            });
        },
        /**
         * 隐藏所有的已经打开的tips
         * @private
         */
        hideAllTips: function(e) {
            var self = this,
                openedTips = self.openedTips.slice(0);

            $.each(openedTips, function() {
                var evt;

                if (!e || $(this.target).get(0) != e.target && !$.contains($(this.target).get(0), e.target)) {
                    evt = $.Event();
                    evt.data = {
                        target: this.target
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
        clearTimer: function(el, flag) {
            var timer = $(el).data(flag + "-timer");

            timer && clearTimeout(timer);
        },
        /**
         * 获取tip拼接后的html
         * @private
         * @param {string} title
         * @param {string} content
         */
        getTipHTML: function(title, content, className) {
            return [
                '<div class="module ' + (className || "") + '">',
                    title ? '<div class="module-hd">' + title + '</div>' : "",
                    content ? '<div class="module-bd">' + content + '</div>' : "",
                '</div>'
            ].join("");
        },
        /**
         * 为某个target生成fixElement
         * @private
         * @param {dom} el target的dom
         */
        createFixElement: function(el) {
            var self = this,
                option = self._option,
                title = $(el).data("title") || option.title,
                content = $(el).data("content") || option.content,
                offset = $(el).data("offset") || option.offset,
                targetType = $(el).data("target-type") || option.targetType,
                html, option;

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

            return new FixElement(html, option);
        },
        /**
         * 显示、隐藏某个target的tip；注意：当trigger为hover时不要使用
         * @public
         * @param {(dom|string)} target 
         */
        toggle: function (target) {
            var evt = $.Event();

            evt.data = {
                target: $(target)
            }
            this.toggleTip(evt);
        },
        /**
         * 显示一个tip；注意：当trigger为hover时不要使用
         * @public
         * @param {dom} target
         * @fires module:jsmod/ui/fixElement/tip#shown
         */
        show: function (target) {
            var self = this,
                evt = $.Event();

            // 组装data对象保持内外调用一致
            evt.data = {
                target: $(target)
            }
            self.showTip(evt);
            $(target).data("shown", true);
        },
        /**
         * 隐藏一个tip；注意：当trigger为hover时不要使用
         * @public
         * @param {dom} target
         * @fires module:jsmod/ui/fixElement/tip#hidden
         */
        hide: function (target) {
            var self = this,
                evt = $.Event();

            // 组装data对象保持内外调用一致
            evt.data = {
                target: $(target)
            }
            self.hideTip(evt);
            $(target).data("shown", false);
        },
        /**
         * 内部的toggleTip
         * @private
         * @param {event} e 包含组装后的事件对象必须含有e.data.target属性指示target
         */
        toggleTip: function(e) {
            var self = this,
                el = $(e.data.target);

            if (el.data("shown")) {
                self.hideTip(e);
                el.data("shown", false);
            } else {
                self.showTip(e);
                el.data("shown", true);
            }
        },
        /**
         * 显示某个target的tip，内部实现方法，由内部toogleTip和事件绑定函数触发，禁止外部调用
         * @private
         * @param {event} e 包含组装后的事件对象，必须含有e.data.target属性指示target
         */
        showTip: function(e) {
            var self = this,
                option = self._option,
                target = $(e.data.target),
                tip, showTimer;

            self.clearTimer(target, "hide");

            // 产生fixElement对象
            if (!(tip = target.data("tip"))) {
                tip = self.createFixElement(target);
                //如果没有产生出来tip则直接return
                if (!tip) {
                    return;
                }
                target.data("tip", tip);
            }

            //处理需要delay的逻辑，delay在hover上可用，click、manual 不可用
            if (option.trigger == "hover" && option.delay && option.delay.show) {
                // 将timer存储下来了，随时可以阻止显示
                showTimer = setTimeout(function() {
                    self.showTipCore(target);
                }, option.delay.show);
                target.data("show-timer", showTimer);

                /**
                 * 当设置trigger为hover，且有delay.show配置时会触发此事件
                 * @event module:jsmod/ui/fixElement/tip#showtimer
                 * @type {object}
                 * @property {dom} target 当前tip的target
                 * @property {int} timer  可以供阻止显示timer，使用clearTimeout可以阻止显示
                 */
                $(self).trigger("showtimer", [{target: target, timer: showTimer}]);
            } else {
                self.showTipCore(target);
            }
            return false;
        },
        /**
         * @private
         * @description 处理tip真正show的方法，需要做tip的显示，维护openedTips数组，派发show事件
         * @param {dom} target
         */
        showTipCore: function(target) {
            var self = this,
                openedTips = self.openedTips,
                tip = $(target).data("tip");

            tip.show();
            //维护 openedTips 数组
            if ($.inArray(tip, openedTips) == -1) {
                openedTips.push(tip);
            }
            /**
             * 显示tip后触发的事件
             * @event module:jsmod/ui/fixElement/tip#shown
             * @type {object}
             * @property {dom} target 当前tip的target
             */
            $(self).trigger("shown", [{target: target}]);
        },
        /**
         * 隐藏某个target的tip，内部实现方法，由内部toogleTip和事件绑定函数触发，禁止外部调用
         * @private
         * @param {event} e 包含组装后的事件对象，必须含有e.data.target属性指示target
         */
        hideTip: function(e) {
            var self = this,
                option = self._option,
                target = $(e.data.target),
                tip, hideTimer;

            self.clearTimer(target, "show");

            tip = target.data("tip");

            if (!tip) {
                return;
            }

            //处理需要delay的逻辑，delay在hover上可用，click、manual不能用
            if (option.trigger == "hover" && option.delay && option.delay.show) {
                hideTimer = setTimeout(function() {
                    self.hideTipCore(target);
                }, option.delay.hide);
                target.data("hide-timer", hideTimer);

                //处理当用户划入tip内阻止关闭的逻辑
                if (option.leavePreventHide && !tip.leavePreventHide) {
                    tip.leavePreventHide = true;
                    tip._element.hover(function() {
                        self.clearTimer(target, "hide");
                    }, function() {
                        self.hideTip(e);
                    });
                }

                /**
                 * 当设置trigger为hover，且有delay.hide配置时会触发此事件
                 * @event module:jsmod/ui/fixElement/tip#hidetimer
                 * @type {object}
                 * @property {dom} target 当前tip的target
                 * @property {int} timer  可以供阻止隐藏timer，使用clearTimeout可以阻止显示
                 */
                $(self).trigger("hidetimer", [{target: target, timer: hideTimer}]);
            } else {
                self.hideTipCore(target);
            }
            return false;
        },
        /**
         * 处理tip真正hide的方法，需要做tip的hide，维护openedTips数组，派发hidden事件
         * @private
         * @param {dom} target
         */
        hideTipCore: function(target) {
            var self = this,
                openedTips = self.openedTips,
                tip = $(target).data("tip"),
                index;

            tip.hide();
            //维护 openedTips 数组
            if ((index = $.inArray(tip, openedTips)) > -1) {
                openedTips.splice(index, 1);
            }
            /**
             * 隐藏tip后触发的事件
             * @event module:jsmod/ui/fixElement/tip#hidden
             * @type {object}
             * @property {dom} target 当前tip的target
             */
            $(self).trigger("hidden", [target]);
        },
        /**
         * 重新设置tip的内容，重新设置tip内容后会重新定位到正确的位置
         * @public
         * @param {(string|dom)} target            指定的target
         * @param {object}       [option]          参数
         * @param {string}       [option.title]    title部分的html
         * @param {string}       [option.content]  content 部分的html
         */
        resetTip: function(target, option) {
            var self = this,
                tip = $(target).data("tip"),
                html, isHide;

            if (tip && (option.title || option.content)) {
                isHide = $(tip.getElement()).css("display") == "none" ? true : false;

                tip.redraw(self.getTipHTML(option.title, option.content, self._option.className), {hide: isHide});
            }
        }
    });

    module.exports = Tip;
});
;/**
 * 分页模块
 * @module jsmod/ui/pagination
 */
define("jsmod/ui/pagination", function(require, exports, module) {
    /**
     * @inner
     * @description 默认参数
     */
    var _option = {
        currentPage: 0,
        maxShowPage: 10,
        textLabel: ['首页', '上一页', '下一页', '尾页'],
        pageLabel: '{#0}',
        preventInitEvent: false
    };

    /**
     * 分页控件，无需写html，提供一个div自动生成所有的分页所需标签
     * @alias module:jsmod/ui/pagination
     * @constructor
     * @param {(dom|string)}      element                                                          分页控件的容器
     * @param {object}            option                                                           分页控件配置参数
     * @param {int}               option.pageCount                                                 一共有多少页
     * @param {int}               [option.currentPage=0]                                           当前页
     * @param {int}               [option.maxShowPage=10]                                          最多显示分页个数
     * @param {array}             [option.textLabel=new Array('首页', '上一页', '下一页', '尾页')] 几个特殊关键字
     * @param {(string|function)} [option.pageLabel={#0}]                                          页码替换-如果是字符串则用{#0}代表当前页, 函数则用return值
     * @param {bool}              [option.preventInitEvent=false]                                  是否阻止初始化时触发事件
     * @example
     * &lt;div id="page-container"&gt;&lt;/div&gt;
     * <hr/>
     * new require("jsmod/ui/pagination")("#page-container", {pageCount: 20});
     */
    var Pagination = function (element, option) {
        var self = this;

        self.element = $(element);
        self.option = $.extend({}, _option, option);

        self.generatePage();
    };

    Pagination.Counst = {};
    Pagination.Counst.PAGE_TPL = '' +
        '<div class="page">' +
            '<% $.each(renderDatas, function() { %>' +
                '<a href="javascript:void(0);" <% if (this.page !== undefined) { %> data-page="<%= this.page %>" <% } %> class="page-item <%= this.className %>"><%= this.label %></a>' +
            '<% }) %>' +
        '</div>';

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
                html;

            html = self.getHTML(self.getRenderDatas(page));
            self.element.html(html);
            /**
             * 设置page触发的事件，重复设置相同page会触发多次事件
             * @event module:jsmod/ui/pagination#page
             * @type {object}
             * @property {int} page 当前设定的page值
             */
            $(self).trigger("page", [{page: self.currentPage}]);
        },
        /**
         * @private
         * @description 生成事件
         */
        generateEvents: function() {
            var self = this,
                element = self.element,
                option = self.option;

            element.delegate(".page-item-first", "click.page", function() {
                self.setPage(0);
                return false;
            });
            element.delegate(".page-item-prev", "click.page", function() {
                self.setPage(self.currentPage - 1);
                return false;
            });
            element.delegate(".page-item-last", "click.page", function() {
                self.setPage(option.pageCount - 1);
                return false;
            });
            element.delegate(".page-item-next", "click.page", function() {
                self.setPage(self.currentPage + 1);
                return false;
            });
            element.delegate(".page-item[data-page]", "click.page", function() {
                var page = $(this).data("page");
                if (page !== undefined) {
                    self.setPage(page);
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

            html = _.template(Pagination.Counst.PAGE_TPL)({renderDatas: renderDatas});
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
                            className: 'page-item-first',
                            label: label
                        });
                    }
                    if (i == 1 && label) {
                        renderDatas.push({
                            className: 'page-item-prev',
                            label: label
                        });
                    }
                });   
            }

            // 处理页面信息
            for (start; start <= end; start++) {
                renderDatas.push({
                    className: start == page ? "page-item-active" : "",
                    label: $.isFunction(option.pageLabel) ? option.pageLabel(start) : option.pageLabel.replace(/{#0}/g, start + 1),
                    page: start
                });
            }

            if (page != option.pageCount - 1) {
                // 处理固定的后两个数据
                $.each(option.textLabel.slice(2, 4), function(i, label) {
                    if (i == 0 && label) {
                        renderDatas.push({
                            className: 'page-item-next',
                            label: label
                        });
                    }
                    if (i == 1 && label) {
                        renderDatas.push({
                            className: 'page-item-last',
                            label: label
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
;/**
 * 分栏模块
 * @module jsmod/ui/tab
 */
define("jsmod/ui/tab", function(require, exports, module) {
    /**
     * @inner 默认设置
     */
    var _option = {
        trigger: "click",
        preventInitEvent: false
    };

    /**
     * 初始化时需要有特定的HTML结构，被标识为 tab-item-active 的为当前开启状态，默认为第一个。
     * 当存在data-target属性时，会将当前非开启状态的target隐藏（当然也可以手动执行）
     * @constructor
     * @alias module:jsmod/ui/tab
     * @param {(dom|selector)} element                         需要实现tab的dom元素
     * @param {object}         [option]                        可配置项
     * @param {string}         [option.trigger=click]          触发切换tab的事件 - click|hover
     * @param {bool}           [option.preventInitEvent=false] 是否阻止初始化时触发事件
     * @example
     * &lt;ul id="tab"&gt;
     *     &lt;li data-target="#content1" class="tab-item"&gt;分栏1&lt;/li&gt;
     *     &lt;li data-target="#content2" class="tab-item tab-item-active"&gt;分栏2&lt;/li&gt;
     * &lt;/ul&gt;
     * <hr/>
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

            self.tabs = element.find('.tab-item');
            activedTab = (self.tabs.filter('.tab-item-active').length == 1) ? self.tabs.filter('.tab-item-active') : self.tabs.first(); // 获取需要设置active的tab

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
                content, same;

            if (self.activedTab && $(self.activedTab).get(0) == $(activedTab).get(0)) {
                same = true;
            }

            self.clearTabs();

            // 如果有设置的content则需要将content显示
            if ($(activedTab).data('target')) {
                content = $($(activedTab).data('target')).show();
            }

            self.activedTab && $(self.activedTab).removeClass('tab-item-active');
            self.activedTab = $(activedTab).addClass('tab-item-active');
            /**
             * @event module:jsmod/ui/tab#tab
             * @type {object}
             * @property {dom}  tab  当前actived的tab
             * @property {bool} same 开始的tab是否是已经开启
             */
            $(self).trigger('tab', [{tab: self.activedTab, same: same}]);
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
            var self = this;
                element = self.element,
                trigger = self.option.trigger == "hover" ? "mouseenter" : "click";

            element.delegate('.tab-item', trigger + ".tab", function() {
                self.active(this);
                return false;
            });
        },
        /**
         * 清除事件、释放内存
         * @public
         */
        destroy: function () {
            var self = this,
                trigger = self.option.trigger == "hover" ? "mouseenter" : "click";

            self.element.undelegate(".tab-item", trigger + ".tab");
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