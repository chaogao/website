/**
 * category 模块相关代码
 */

(function() {
    var CATAGRORY_TEST_DATAS = {
        error: 0,
        articles: [
            {
                title: "canvas 设计渲染器",
                description: "Canvas（片假名：フォーチュン アテリアル）是日本动画公司minori（オーガスト）制作的美少女动画，及其改编的小说、漫画等。简称Canvas。继前作《水夏～SUIKA～》之后minori的第五作。小说的标题是《Canvas -a fairy tale of the two another tale-》，电视动画版的标题是《Canvas -a tale of memories-》，PlayStation 3移植版游戏和PSP版标题则为《Canvas -a fairy tale of the two-》。以吸血鬼题材的校园恋爱故事。",
                titleBg: "/public/upload/canvas-logo-small.png",
                date: "2013-06-15"   
            },
            {
                title: "less——可编程的css语言",
                titleBg: "/public/upload/less-logo.png",
                description: "LESSCSS是一种动态样式语言，属于CSS预处理语言的一种，它使用类似CSS的语法，为CSS的赋予了动态语言的特性，如变量、继承、运算、函数等，更方便CSS的编写和维护。",
                date: "2013-07-16"
            },
            {
                title: "canvas 设计渲染器",
                titleBg: "/public/upload/canvas-logo-small.png",
                description: "Canvas（片假名：フォーチュン アテリアル）是日本动画公司minori（オーガスト）制作的美少女动画，及其改编的小说、漫画等。简称Canvas。继前作《水夏～SUIKA～》之后minori的第五作。小说的标题是《Canvas -a fairy tale of the two another tale-》，电视动画版的标题是《Canvas -a tale of memories-》，PlayStation 3移植版游戏和PSP版标题则为《Canvas -a fairy tale of the two-》。以吸血鬼题材的校园恋爱故事。",
                date: "2013-06-15"   
            },
            {
                title: "canvas 设计渲染器",
                titleBg: "/public/upload/canvas-logo-small.png",
                description: "Canvas（片假名：フォーチュン アテリアル）是日本动画公司minori（オーガスト）制作的美少女动画，及其改编的小说、漫画等。简称Canvas。继前作《水夏～SUIKA～》之后minori的第五作。小说的标题是《Canvas -a fairy tale of the two another tale-》，电视动画版的标题是《Canvas -a tale of memories-》，PlayStation 3移植版游戏和PSP版标题则为《Canvas -a fairy tale of the two-》。以吸血鬼题材的校园恋爱故事。",
                date: "2013-06-15"   
            }
        ]
    };

    var Category, FixElement, Pagination;

    FixElement = require("jsmod/ui/fixElement");
    Pagination = require("jsmod/ui/pagination");

    Category = function () {
        var self = this;

        self.content = $(".blog-category");
        self.delegatesEvents();
    };

    Category.Const = {};
    Category.Const.T_BLOG_ARTICLES = '<ul class="blog-articles">' +
        '[% $.each(articles, function () { %]' +
            '<li class="clearfix">' +
                '<div class="content">' +
                    '<a href="javascript:void(0)">[%= this.title %]</a>' + 
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
        '[% }) %]' + 
    '</ul>' +
    '<div class="blog-articles-page"></div>';
    Category.Const.C_PAGINATION = {
        pageCount: 20,
        maxShowPage: 3,
        textLabel: ["F", "<", ">", "L"],
        preventInitEvent: true
    }

    $.extend(Category.prototype, {
        delegatesEvents: function () {
            var self = this;

            self.content.delegate(".blog-category-item", "mouseenter", function () {
                var listContainer = self.getListContainer(),
                    target = this,
                    dfd;

                if (self.timer) {
                    clearTimeout(self.timer);
                }

                if ($(target).hasClass("active")) {
                    return;
                }

                $(target).parents("ul").find(".blog-category-item").removeClass("active");

                $(target).addClass("active");

                dfd = $.Deferred(function(dfd) {
                    setTimeout(function() {
                        dfd.resolve(CATAGRORY_TEST_DATAS);
                    }, 100);
                }).done(function (json) {
                    listContainer.show();
                    listContainer.pager && listContainer.pager.destroy();

                    listContainer.fixTo($(target), "bottom", {left: 150, top: 0});
                    listContainer.getElement().html(new EJS({text: Category.Const.T_BLOG_ARTICLES}).render(json));
                    listContainer.pager = new Pagination(listContainer.getElement().find(".blog-articles-page"), Category.Const.C_PAGINATION);
                });
            });

            self.content.on("mouseleave", function () {
                var target = this;

                if (self.timer) {
                    clearTimeout(self.timer);
                }

                self.timer = setTimeout(function () {
                    $(target).find(".blog-category-item").removeClass("active");
                    self.getListContainer().hide();
                }, 300);
            });

            self.content.delegate(".tip-blog-category", "mouseenter", function () {
                if (self.timer) {
                    clearTimeout(self.timer);
                }
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

            self.listContainer = new FixElement('<div class="tip-blog-category"></div>', {
                preventShow: true,
                targetType: "bottom"
            });

            return self.listContainer;
        }
    });

    new Category();
})();