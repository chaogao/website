/**
 * 一片文案的处理逻辑
 */
(function() {
    var Article, TreeView;

    TreeView = require("jsmod/ui/treeView");

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

            $(".blog-article-cover .read").css("left", parseInt(Math.random() * (rWidth - 150)) + "px");
            $(".blog-article-cover .read").css("top", parseInt(Math.abs(rHeight - 150 - 240)  * Math.random() + 240) + "px");
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
                self.analyseCategory();
            });
        },
        /**
         * 分析目录
         */
        analyseCategory: function () {
            var self = this,
                article = self.content.find(".blog-article-content"),
                count = 8, i = 1, datas = [], treeDatas = [], titles, id = 0;

            for (i; i <= 8; i++) {
                titles = article.find("h" + i);

                $(titles).each(function () {
                    $(this).attr("data-title-id", id++);
                });

                if (titles.length > 0) {
                    datas.push(titles);
                }
            }

            function getTreeNode (root, level) {
                var reg, key;

                if (!datas[level] || !/^\[(.*)\]/.test(root.text)) {
                    return;
                }

                key = /^\[(.*)\]/.exec(root.text)[1];

                reg = new RegExp("\\[" + key + ".*\\]");

                root.children = [];

                $.each(datas[level], function () {
                    var node = {
                        text: $(this).text(),
                        id: $(this).data("title-id")
                    };

                    if (reg.test(node.text)) {
                        root.children.push(node);
                        getTreeNode(node, ++level);
                    }
                });
            }

            $.each(datas[0], function () {
                var root = {};

                root.text = $(this).text();
                root.id = $(this).data("title-id");

                getTreeNode(root, 1);

                treeDatas.push(root);
            });

            self.treeView = new TreeView(treeDatas, {
                content: ".blog-article-category",
                getText: function (treeNode) {
                    var text = self.getStrLength(treeNode.text) > 50 ? self.SubString(treeNode.text, 47) + '...' : treeNode.text;

                    return '<a href="javascript:vodi(0)" data-cate-id="' + treeNode.id + '" title="' + treeNode.text + '" >' + text + '</a>';
                }
            });

            self.treeView.content.delegate(".treeview-node", "click", function (e) {
                var target = $(this).find("a"),
                    id = target.data("cate-id");

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

    new Article();
    $(window).trigger("resize");
})();