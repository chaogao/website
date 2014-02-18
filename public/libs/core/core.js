/**
 * Dialog 酒店通用dialog组建
 */
define("website/ui/dialog", function (require, exports, module) {
    var Dialog, _option,
        ModDialog, template;

    ModDialog = require("jsmod/ui/dialog");
    template = require("jsmod/main").template;

    ModDialog.setOpacity(0.2);

    _option = {
        skin: "blue",
        title: "",
        hasButtons: false
    }

    /**
     * @constructor
     * @param {object}   option                 配置项
     * @param {string}   [option.title]         dialog的标题
     * @param {string}   [option.html]          dialog的内容体
     * @param {string}   [option.width]         dialog的宽度
     * @param {string}   [option.height]        dialog的高度
     * @param {Coords}   [option.offset]        定位时的偏移  eg {top: -100, left: -100}
     * @param {array}    [option.buttons]       按钮的集合 eg. [{value: '确定', callback: function() {}}]
     * @param {string}   [option.skin=blue]     弹窗皮肤枚举
     * @param {string}   [option.customTitle]   自定义title类名
     * @param {string}   [option.customContent] 自定义Content类名
     * @param {string}   [option.customButtons] 自定义Buttons类名
     * @param {function} [option.closeBtn]      点击close按钮的回调
     */ 
    Dialog = function(option) {
        var self = this;

        self.option = $.extend({}, _option, option);
        self.init();
        return self;
    }

    Dialog.Const = {};

    // 基础模板
    Dialog.Const.T_DIALOG = [
        '<div class="dialog-ui dialog-ui-<%= skin %>">',
            '<div class="dialog-ui-title <%= customTitle%>">',
                '<a class="dialog-ui-close glyphicon glyphicon-remove-circle" href="javascript:void(0)"></a>',
                '<p><%= title %></p>',
            '</div>',
            '<div class="dialog-ui-content <%= customContent%>">',
                '<%= html %>',
            '</div>',
            '<% if (hasButtons) { %>',
                '<div class="dialog-ui-buttons <%= customButtons%>">',
            '<% } %>',
        '</div>'
    ];

    $.extend(Dialog.prototype,
        {
            /**
             * 生成按钮
             * @param {array} buttons buttons数组
             */
            setButtons: function (buttons) {
                var self = this,
                    buttonsContent;

                if (buttons && buttons.length > 0 && self.dialog) {
                    buttonsContent = self.dialog.content.find(".dialog-ui-buttons").html("");

                    $.each(buttons, function () {
                        var me = this,
                            btn;

                        if (this.value) {
                            btn = $('<a href="javascript:void(0);" class="btn-orange btn-ui-book-large btn-ui-book-large-' + (this.skin || self.option.skin) +  '">' + this.value + '</a>');
                            if (this.id) {
                                btn.prop("id", this.id);
                            }
                            btn.appendTo(buttonsContent).click(function (e) {
                                e.btn = btn;
                                me.callback && me.callback(e);
                                return false;
                            });

                            self.buttons.push(btn);
                        }
                    });
                }

                return self;
            },      
            /**
             * 初始化弹窗
             */
            init: function () {
                var self = this,
                    html;

                self.data = $.extend({}, 
                    {
                        title: self.option.title,
                        html: self.option.html,
                        hasButtons: self.option.buttons && self.option.buttons.length > 0 ? true : false,
                        customTitle: self.option.customTitle || "",
                        customContent: self.option.customContent || "",
                        customButtons: self.option.customButtons || "",
                        skin: self.option.skin
                    }
                )

                html = template(Dialog.Const.T_DIALOG.join(""), self.data);

                self.dialog = new ModDialog({
                    width: self.option.width,
                    height: self.option.height,
                    offset: self.option.offset,
                    html: html
                });

                self.dialog.content.find(".dialog-ui-close").click(function (e) {
                    self.option.closeBtn && self.option.closeBtn(e);
                    if (!e.isDefaultPrevented()) {
                        self.hide();
                    }
                });

                self.buttons = [];

                self.setButtons(self.option.buttons);
            },
            /**
             * 显示
             * @public
             */
            show: function () {
                this.dialog && this.dialog.show({fade: true});
            },
            /**
             * 隐藏
             * @public
             */
            hide: function () {
                this.dialog && this.dialog.hide({fade: true});
            },
            /**
             * 设置标题
             * @public
             * @param {string} title 标题
             */
            setTitle: function (title) {
                this.dialog.content.find(".dialog-ui-title p").html(title || "");
                return this;
            },
            /**
             * 设置内容体
             * @public
             * @param {string} html 内容
             */
            setContent: function (html) {
                this.dialog.content.find(".dialog-ui-content").html(html || "");
                return this;
            },
            /**
             * 获得内容体
             * @public
             */
            getContent: function () {
                return this.dialog && this.dialog.content;
            },
            /**
             * @public
             */
            destroy: function () {
                this.dialog.destroy();
            },
            resize: function () {
                this.dialog.adjuestPosition();
            }
        }
    )

    module.exports = Dialog;
});