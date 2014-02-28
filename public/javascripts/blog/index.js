EJS.config( {cache: true, type: '[', ext: '.ejs' } );
(function () {
	var Tab = require("jsmod/ui/tab"),
        Tip = require("jsmod/ui/fixElement/tip");

	var BlogList = function () {
		var self = this;

        $(window).resize(function () {
            if (self.timer) {
                clearTimeout(self.timer);
            }

            self.timer = setTimeout(function () {
                self.resizeBg();
            }, 100);
        });

        self.initTab();
        self.initTip();
	}

    var T_BLOG_LIST = '' +
        '[% $.each(content, function () { %]' +
            '<div class="content [%= this.top ? "content-top" : "" %]">' +
                '<a href="/blog/[%= this._id %]" style="background-image: url([%=this.bg%]!w320h320)" class="content-image"></a>' +
                '<div class="content-info">' + 
                    '[%= this.series ? "<p data-series=\'" + this.series + "\' class=\'series\'>所属系列：" + this.series + "</p>" : "" %]' + 
                    '<a class="title" href="/blog/[%= this._id %]">[%= this.top ? "【置顶】" : "" %][%= this.title %]</a>' + 
                    '<a class="read glyphicon glyphicon-circle-arrow-right" href="/blog/[%= this._id %]"></a>' + 
                    '<p class="date">' +
                        '[%= this.dateStr %]' +
                    '</p>' +
                    '<div class="description">' +
                        '[% if (this.titleBg) { %]' +
                            '<div class="background" style="background: url([%= this.titleBg%]) no-repeat top right"></div>' +
                        '[% } %]' +
                        '[%= this.description %]' +
                    '</div>' +
                '</div>' +
            '</div>' +
        '[% }) %]';

    var T_SERIES_TIP = '' +
        '<ul>' +
            '[% $.each(seriesBlogs, function () { %]' +
                '<li data-id="[%= this._id %]">' +
                    '<a href="/blog/[%=this._id%]">[%=this.title%]</a>' +
                    '<p class="desc">[%=this.description%]</p>' +
                '</il>' +
            '[% }); %]' +
        '</ul>';

	BlogList.prototype = {
        /**
         * 修正宽高
         */
        resizeBg: function () {
            var self = this,
                height = parseInt($(window).height()),
                top;

            top = $(".blog-index-content").offset().top;

            $(".blog-index-content").height(height - top - 8);
        },
        /**
         *
         */
        initTip: function () {
            var self = this;

            self.tip && self.tip.destroy();

            self.tip = new Tip({
                targets: ".series",
                content: "loading",
                className: "tip-series",
                targetType: "right, top, bottom"
            });

            $(self.tip).on("shown", function (e) {
                var $el = $(e.target),
                    name = $el.data("series");

                $.ajax({
                    url: "/blogseries/" + (encodeURIComponent(name) || "")
                }).done(function (json) {
                    self.tip.resetTip(e.target, {
                        content: new EJS({text: T_SERIES_TIP}).render({
                            seriesBlogs: json.content
                        })
                    })
                });
            });
        },
        /**
         * 初始化 tab
         */
        initTab: function () {
        	var self = this,
                aj;

        	self.tb = new Tab(".blog-index-nav");

            $(self.tb).on("tab", function (e) {
                var tagName = $(e.tab).data("tag");

                $(".blog-index-list").addClass("loading").html("");

                aj && aj.abort();

                aj = $.ajax({
                    url: "/blogtag/" + (tagName || "")
                }).done(function (json) {
                    $(".blog-index-list").removeClass("loading").html(new EJS({text: T_BLOG_LIST}).render(json));
                    $(".blog-index-list .content").css("opacity", 1);
                    aj = null;
                    self.initTip();
                });
            });
        }
	}

	new BlogList();
	$(window).trigger("resize");
})();