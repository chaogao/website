/**
 * category 模块相关代码
 */
(function() {
    var Category, FixElement;

    FixElement = require("jsmod/ui/fixElement");

    Category = function () {
        var self = this;

        self.content = $(".blog-category");
        self.delegatesEvents();
    };

    $.extend(Category.prototype, {
        delegatesEvents: function () {
            var self = this;

            self.content.delegate(".blog-category-item", "mouseenter", function () {
                var listContainer = self.getListContainer(),
                    target = this,
                    dfd;

                dfd = $.Deferred(function(dfd) {
                    setTimeout(function() {
                        dfd.resolve();
                    }, 1000);
                }).done(function () {
                    listContainer.show();
                    listContainer.fixTo($(target), "bottom", {left: 200, top: 0});
                });
            });
        },
        /**
         * 获取存放list的元素
         */
        getListContainer: function () {
            var self = this;

            if (self.listContainer) {
                return self.listContainer;
            }

            self.listContainer = new FixElement('<div class="tip-blog-category">Hello</div>', {
                preventShow: true,
                targetType: "bottom"
            });

            return self.listContainer;
        }
    });

    new Category();
})();