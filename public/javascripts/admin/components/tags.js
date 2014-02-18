define("admin/blog/components/tags", function(require, exports, module) {
    var Dialog = require("website/ui/dialog"),
        Tags;

    Tags = function (cb) {
        var self = this;

        self.dg = new Dialog({
            width: 400,
            html: Tags.Const.T_TAGS,
            title: "增加 Tag",
            buttons: [
                {
                    value: "确定",
                    callback: function () {
                        var input = self.dg.getContent().find("input[name='tag']");

                        if (input.val()) {
                            cb && cb(input.val());
                            self.dg.hide();
                        }
                    }
                },
                {
                    value: "取消",
                    callback: function () {
                        self.dg.hide();
                    }
                }
            ]
        });
    };

    Tags.prototype.open = function () {
        this.dg.show();
    }

    Tags.prototype.close = function () {
        this.dg.close();
    }

    Tags.Const = {};

    Tags.Const.T_TAGS = [
        '<div class="tags-add-container">',
            '<div class="tags-all"></div>',
            '<input name="tag" value="" placeholder="输入 tag 名称">',
        '</div>'
    ].join("");

    module.exports = Tags;

});