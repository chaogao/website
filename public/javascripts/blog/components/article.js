/**
 * 一片文案的处理逻辑
 */
(function() {
    var Article, TreeView, Tip;

    TreeView = require("jsmod/ui/treeView");
    Tip = require("jsmod/ui/fixElement/tip");

    Article = function (id) {
        var self = this;

        self.content = $(".blog-article");
        self.seriesBlogs = window.__data.seriesBlogs;

        $(window).resize(function () {
            if (self.timer) {
                clearTimeout(self.timer);
            }

            self.timer = setTimeout(function () {
                self.resizeBg();
            }, 100);
        });

        $(".blog-article-category").on("fixed", function () {
            $(".blog-article-category-hide").show();
        });

        $(".blog-article-category").on("nofixed", function () {
            $(".blog-article-category-hide").hide();
        });

        self.deleagesEvents();
        self.getArticle(id);
        self.initTip();
        self.getBg();
    };

    Article.Const = {};
    Article.Const.T_SUGGESTION = '' +
        '[% if (seriesBlogs.length > 0) { %]' +
            '<div class="series-content">' +
                '<h3><b>[%=series%]系列</b>的所有文章</h3>' +
                '<ul>' +
                    '[% $.each(seriesBlogs, function () { %]' +
                        '<li data-id="[%= this._id %]">' +
                            '<a href="/blog/[%=this._id%]">[%=this.title%]</a>' +
                            '<p class="desc">[%=this.description%]</p>' +
                        '</il>' +
                    '[% }); %]' +
                '</ul>' +
            '</div>' +
        '[% } %]' +
        '<h3>相关推荐</h3>' +
        '[% if (pre) { %]' +
            '<dl class="pre" data-id="[%= pre._id %]">' +
                '<dt><a href="/blog/[%=pre._id%]">上一篇：[%=pre.title%]</a></dt>' +
                '<dd>[%=pre.description%]</dd>' +
            '</dl>' +
        '[% } %]' +
        '[% if (next) { %]' +
            '<dl class="next" data-id="[%= next._id %]">' +
                '<dt><a href="/blog/[%=next._id%]">下一篇：[%=next.title%]</a></dt>' +
                '<dd>[%=next.description%]</dd>' +
            '</dl>' +
        '[% } %]';
    Article.Const.T_SERIES_TIP = '' +
        '<ul>' +
            '[% $.each(seriesBlogs, function () { %]' +
                '<li data-id="[%= this._id %]">' +
                    '<a href="/blog/[%=this._id%]">[%=this.title%]</a>' +
                    '<p class="desc">[%=this.description%]</p>' +
                '</il>' +
            '[% }); %]' +
        '</ul>';

    $.extend(Article.prototype, {
        /**
         * 初始化 tip
         */
        initTip: function () {
            var self = this;

            if ($(".series").length) {
                new Tip({
                    targets: "#series-tip-target",
                    targetType: "right, top, bottom",
                    className: "tip-series",
                    content: new EJS({text: Article.Const.T_SERIES_TIP}).render({
                        seriesBlogs: self.seriesBlogs
                    })
                });
            }
        },
        /**
         * 获取背景图片
         */
        getBg: function () {
            var url = $(".blog-article-cover").data("image"),
                img = new Image();

            img.onload = function () {
                $(".blog-article-cover .bg-wrap").css("background-image", "url(" + url + ")").hide().fadeIn(1000);
                $("#action-read").fadeIn(1000);
            }

            img.onerror = function () {
                $("#action-read").show();
            }
            img.src = url;
        }, 
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

            $(".blog-article-cover .bg-wrap").height(rHeight);

            $(".blog-article-cover .infomation").show()
                .css("top", rHeight * 0.1)
                .css("height", rHeight * 0.65);
        },
        /**
         * 获取article详情
         */
        getArticle: function (id) {
            var self = this;

            $.ajax({
                url: "/blog/view/" + id,
                dataType: "json",
                data: {json: true},
                success: function (json) {
                    self.json = json;
                    $(self).trigger("recivedata", [{data: json}]);
                }
            });
        },
        /**
         * 绑定事件
         */
        deleagesEvents: function () {
            var self = this;

            self.content.delegate(".read, .infomation a", "click", function() {
                if (self.json) {
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
                dfd;

            dfd = $.Deferred(function (dfd) {
                self.content.find(".blog-article-cover").fadeOut(500, function () {
                    dfd.resolve();
                });
            }).done(function () {
                self.content.find(".blog-main").addClass("blog-main-show");
                self.content.find(".blog-article-content .blog-article-markdown").html(marked(self.json.blog.content));
                self.analyseCategory();
                self.initSuggestions();
                self.titleAndFooter();
                $(".blog-footer").addClass("blog-footer-article");
            });
        },
        /**
         * 初始化建议模块
         */
        initSuggestions: function () {
            var self = this,
                html;
                
            if (!self.json.next && !self.json.pre) {
                return false;
            }

            html = new EJS({text: Article.Const.T_SUGGESTION}).render({
                pre: self.json.pre,
                next: self.json.next,
                seriesBlogs: self.json.seriesBlogs,
                series: self.json.blog.series
            });

            self.content.find(".blog-article-suggest").html(html).show();
        },
        /**
         * 生成title和footer
         */
        titleAndFooter: function () {
            var self = this,
                blog = self.json.blog;

            self.content.find(".blog-article-content").prepend([
                '<h2 style="background: url(' + blog.titleBg + ') no-repeat top right" class="blog-article-title">',
                    blog.title,
                '</h2>',
                blog.series ? '<h4 class="blog-article-series">' + blog.series + '</h4>' : "",
                '<p class="blog-article-date">',
                    '<b>' + blog.author + '</b>' + ' post at: ' + blog.dateStr,
                '</p>'
            ].join(""));
        },
        /**
         * 分析目录
         */
        analyseCategory: function () {
            var self = this,
                article = self.content.find(".blog-article-content .blog-article-markdown"),
                count = 8, i = 1, datas = [], treeDatas = [], titles, id = 0,
                reg = /<span class="tree-menu">(.*)<\/span>/;

            for (i; i <= 8; i++) {
                titles = article.find("h" + i);

                $(titles).each(function () {
                    $(this).attr("data-title-id", id++);
                });

                if (titles.length > 0) {
                    datas.push(titles);
                }
            }

            function getTreeNode (root, level, rootNode) {
                var key, levelMenuText, allAllowTrees, nodeName, selectNodeName, children;

                if (!datas[level]) {
                    return;
                }

                root.children = [];
                levelMenuText = reg.exec(root.text)[1];

                nodeName = $(rootNode).prop("nodeName"); // 获取nodename
                selectNodeName = $(datas[level][0]).prop("nodeName"); //获取将要选择的nodename
 
                allAllowTrees = $(rootNode).nextUntil(nodeName); // 获取同级兄弟元素到相同的nodename（同级）处停止
                children = allAllowTrees.find(selectNodeName);


                $.each(children, function (i) {
                    var node = {
                        text: '<span class="tree-menu">' + levelMenuText + "." + (i + 1) + "</span>" + $(this).text(),
                        id: $(this).data("title-id")
                    };

                    root.children.push(node);
                    getTreeNode(node, (level + 1), this);
                });
            }

            if (datas.length == 0) {
                return false;
            }

            $.each(datas[0], function (i) {
                var root = {};

                root.text = '<span class="tree-menu">' + (i + 1) + '</span>' + $(this).text();
                root.id = $(this).data("title-id");

                getTreeNode(root, 1, this);

                treeDatas.push(root);
            });

            self.treeView = new TreeView(treeDatas, {
                content: ".blog-article-category",
                getText: function (treeNode) {
                    var text = /<span class="tree-menu">.*<\/span>(.*)/.exec(treeNode.text)[1];

                    return '<a href="javascript:void(0)" data-cate-id="' + treeNode.id + '" title="' + text + '" >' + treeNode.text + '</a>';
                }
            });

            self.treeView.content.delegate(".treeview-node", "click", function (e) {
                var target = $(this).find("a"),
                    id = target.data("cate-id");

                if ($(e.target).hasClass("treeview-toggle")) {
                    e.stopPropagation();
                    return;
                }

                $("html, body").animate({
                    scrollTop: self.content.find("[data-title-id=" + id + "]").offset().top
                });

                e.stopPropagation();
            });
        },
        /**
         * 获取文字长度
         */
        getStrLength: function (str) {
            var cArr = str.match(/[^\x00-\xff]/ig);
            return str.length + (cArr == null ? 0 : cArr.length);
        },
        /**
         * 无乱码字符串截取，如： var a="www.cnblogs.com";SubString(a,3)//返回www
         * @param {String} str 字符串
         */
        SubString: function (str, n) {
            var r = /[^\x00-\xff]/g;
            if (str.replace(r, "mm").length <= n) return str;
            var m = Math.floor(n / 2);
            for (var i = m; i < str.length; i++) {
                if (str.substr(0, i).replace(r, "mm").length >= n) {
                    return str.substr(0, i);
                }
            }
            return str;
        }
    });

    new Article($("#action-read").data("id"));
    $(window).trigger("resize");
})();