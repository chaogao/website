/**
 * 一片文案的处理逻辑
 */
(function() {
    var Article;

    Article = function () {
        var self = this;

        $(window).resize(function () {
            if (self.timer) {
                clearTimeout(self.timer);
            }

            self.timer = setTimeout(function () {
                self.resizeBg();
            }, 100);
        });
    };

    $.extend(Article.prototype, {
        /**
         * 修正图片的宽高
         */
        resizeBg: function () {
            var self = this,
                height = parseInt($(window).height()),
                rHeight, rWidth, seed;

            rHeight = height - $(".blog-article").offset().top - 28;
            rWidth = $(".blog-article-cover").width();

            $(".blog-article-cover").height(rHeight);

            $(".blog-article-cover .read").css("left", parseInt(Math.random(0.2, 0.8) * (rWidth - 100)) + "px");
            $(".blog-article-cover .read").css("top", parseInt(Math.random(0.2, 0.8) * (rHeight - 100)) + "px");
        }
    });

    new Article();
    $(window).trigger("resize");
})();