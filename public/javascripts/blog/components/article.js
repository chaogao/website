/**
 * 一片文案的处理逻辑
 */
(function() {
    var Article;

    Article = function () {
        var self = this;

        self.content = $(".blog-article");

        $(window).resize(function () {
            if (self.timer) {
                clearTimeout(self.timer);
            }

            self.timer = setTimeout(function () {
                self.resizeBg();
            }, 100);
        });

        self.deleagesEvents();
        self.getArticle();
    };

    $.extend(Article.prototype, {
        /**
         * 修正图片的宽高
         */
        resizeBg: function () {
            var self = this,
                height = parseInt($(window).height()),
                rHeight, rWidth, seed;

            rHeight = height - $(".blog-article").offset().top - 8;
            rWidth = $(".blog-article-cover").width();

            $(".blog-article-cover").height(rHeight);

            $(".blog-article-cover .read").css("left", parseInt(Math.random(0.2, 0.8) * (rWidth - 150)) + "px");
            $(".blog-article-cover .read").css("top", parseInt(Math.random(0.2, 0.8) * (rHeight - 150)) + "px");
        },
        /**
         * 获取article详情
         */
        getArticle: function () {
            var self = this;

            $.get("/public/test/article.json", function (json) {
                self.articleData = json;
                $(self).trigger("recivedata", [{data: json}]);
            });
        },
        /**
         * 绑定事件
         */
        deleagesEvents: function () {
            var self = this;

            self.content.delegate(".read, .infomation a", "click", function() {
                if (self.articleData) {
                    self.initArticle();
                } else {
                    $(self).one("recivedata", function () {
                        self.initArticle();
                    });
                }
            });
        },
        /** 
         * 初始化article
         */
        initArticle: function () {
            var self = this,
                data = self.articleData,
                dfd;

            dfd = $.Deferred(function (dfd) {
                self.content.find(".blog-article-cover").fadeOut(500, function () {
                    dfd.resolve();
                });
            }).done(function () {
                self.content.find(".blog-article-content").html(data.content);
            });
        }
    });

    new Article();
    $(window).trigger("resize");
})();