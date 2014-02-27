EJS.config( {cache: true, type: '[', ext: '.ejs' } );
(function () {
	var Tab = require("jsmod/ui/tab");

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
	}

    var T_BLOG_LIST = '' +
        '[% $.each(content, function () { %]' +
            '<div class="content [%= this.top ? "content-top" : "" %]">' +
                '<div style="background-image: url([%=this.bg%]!w320h320)" class="content-image"></div>' +
                '<div class="content-info">' + 
                    '[%= this.series ? "<p class=\'series\'>所属系列：" + this.series + "</p>" : "" %]' + 
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
                });
            });
        }
	}

	new BlogList();
	$(window).trigger("resize");
})();