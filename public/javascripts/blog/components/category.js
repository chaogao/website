/**
 * category 模块相关代码
 */

(function() {
    var Category, Carousel, FixElement, Pagination;

    FixElement = require("jsmod/ui/fixElement");
    Pagination = require("jsmod/ui/pagination");
    Carousel = require("jsmod/ui/carousel");

    Category = function () {
        var self = this,
            htmls;

        self.content = $(".blog-category").css("visibility", "visible");
        htmls = $(".blog-category-item").remove();

        self.count = self.content.width() > 800 ? 5 : 3;

        self.ca = new Carousel(".blog-category", {
            count: self.count, 
            htmls: htmls
        });

        self.delegatesEvents();
    };

    Category.Const = {};
    Category.Const.T_BLOG_ARTICLES = '' +
        '[% $.each(content, function () { %]' +
            '<li class="clearfix">' +
                '<div class="content">' +
                    '<a href="/blog/[%= this._id %]">[%= this.title %]</a>' + 
                    '<p class="date">' +
                        '[%= this.date %]' +
                    '</p>' +
                    '<div class="description">' +
                        '[% if (this.titleBg) { %]' +
                            '<div class="background" style="background: url([%= this.titleBg%]) no-repeat top right"></div>' +
                        '[% } %]' +
                        '[%= this.description %]' +
                    '</div>' +
                '</div>' +
            '</li>' +
        '[% }) %]';

    Category.Const.C_PAGINATION = {
        maxShowPage: 8,
        textLabel: ["First", "<", ">", "Last"],
        preventInitEvent: true
    }

    $.extend(Category.prototype, {
        delegatesEvents: function () {
            var self = this;

            self.content.delegate(".blog-category-item:not(.blog-category-item-none)", "click", function () {
                var listContainer = self.getListContainer(),
                    target = this,
                    tagName = $(this).data("tag"),
                    dfd, oWidth, overWidth;

                self.timer && clearTimeout(self.timer);
                self.timerIn && clearTimeout(self.timerIn);

                if ($(target).hasClass("active")) {
                    return;
                }

                $(target).parents("ul").find(".blog-category-item").removeClass("active");

                $(target).addClass("active");

                if (!listContainer.getDisplay()) {
                    listContainer.show();
                }

                listContainer.getElement().find(".blog-articles").html('<li class="loading">loading</li>');
                oWidth = listContainer.getElement().outerWidth();
                overWidth = $(window).width() - (oWidth + $(target).offset().left);

                if (overWidth < 20) {
                    listContainer.fixTo($(target), "bottom, left, right", {left: overWidth - (Math.random() * 40 + 20)});
                } else {
                    listContainer.fixTo($(target), "bottom, left, right");
                }
 

                $.ajax({
                    url: "/blogtag/" + (tagName || "")
                }).done(function (json) {
                    var total;

                    total = json.content.length;


                    listContainer.getElement().find(".blog-articles").html(new EJS({text: Category.Const.T_BLOG_ARTICLES}).render(json));
                });
            });

            $(document).on("click", function (e) {
                if ($(e.target).parents(".tip-blog-category").length == 0 && $(e.target).parents(".blog-category").length == 0) {
                    self.timer && clearTimeout(self.timer);
                    self.timerIn && clearTimeout(self.timerIn);

                    self.content.find(".blog-category-item").removeClass("active");
                    self.getListContainer().hide({fade: true});
                }
            });

            self.content.delegate(".tip-blog-category", "mouseenter", function () {
                if (self.timer) {
                    clearTimeout(self.timer);
                }
            });

            $(".blog-category-content .arrow-right").click(function () {
                var ca = self.ca,
                    i = ca.getCurIndex();

                ca.cur(i + self.count);
            });

            $(".blog-category-content .arrow-left").click(function () {
                var ca = self.ca,
                    i = ca.getCurIndex();

                ca.cur(i - self.count);
            });
        },
        /**
         * 获取存放list的元素
         */
        getListContainer: function () {
            var self = this,
                Scrollbar = require("jsmod/ui/scrollbar"),
                width;

            if (self.listContainer) {
                return self.listContainer;
            }

            width = $(window).width() * 0.7;

            self.listContainer = new FixElement('<div class="tip-blog-category">' +
                    '<a href="javascript:void(0)" class="glyphicon glyphicon-remove-circle action-close"></a>' +
                    '<div class="tip-category-list"><ul class="blog-articles"></ul></div>' + 
                '</div>', {
                preventShow: true,
                appendInBody: true,
                targetType: "bottom, left, right"
            });

            self.listContainer.getElement().width(width);

            self.listContainer.getElement().find(".tip-category-list").height($(".blog-article-cover").height() * 0.9);

            self.listContainer.getElement().delegate(".action-close", "click", function() {
                self.timer && clearTimeout(self.timer);
                self.timerIn && clearTimeout(self.timerIn);

                self.content.find(".blog-category-item").removeClass("active");
                self.getListContainer().hide({fade: true});
            });

            return self.listContainer;
        }
    });

    new Category();
})();