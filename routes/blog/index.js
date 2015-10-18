var routes = {},
    blog = require("../../models/blog.js"),
    tag = require("../../models/tag.js"),
    Category = require("../../models/category"),
    commonUtil = require("../components/common.js"),
    async = require("async"),
    count = 0;

exports.init = function (app) {
    app.get("/", routes.index);
    app.get("/about", routes.about);
    app.get("/blog", routes.index);
    app.get("/blog/:id", routes.blog);
    app.get("/blog/view/:id", routes.blogView);
    app.get("/blogtag/:name", routes.blogTag);
    app.get("/blogtag", routes.blogTag);
    app.get("/blogcategory/:id", routes.blogCategory);
    app.get("/blogseries", routes.blogSeries);
    app.get("/blogseries/:name", routes.blogSeries);

    // 检索相关页面
    app.get("/search", routes.search);
    app.get("/search/:type/:key", routes.search);
}

routes.about = function (req, res) {
    async.waterfall([function (next) {
        blog.findAbout(blog.conf.FULL_FILEDS, function (err, raw) {
            next(err, raw);
        });
    }], function (err, raw) {
        if (!err && raw.length) {
            res.render('web/about.html', {
                blog: raw[0]
            });
        } else {
            res.status(404).render("404.html");
        }
    });
}

routes.index = function (req, res) {
    var id = req.params.id,
        data = {
            title: "我的前端世界"
        };

    async.waterfall([
        // 获取所有的 tag
        function (next) {
            tag.find(null, function (err, raw) {
                data.tag = raw;

                next(err);
            });
        },

        // 获取所有的 category
        function (next) {
            Category.findAll(function (err, raw) {
                data.category = raw;

                next(err);
            });
        },

        // 获取置顶 blog
        function (next) {
            blog.findTop(blog.conf.FULL_FILEDS, function (err, raw) {
                next(err, raw);
            });
        }

    ], function (err, blog) {
        if (err) {
            res.json(err);
        } else {
            data.blog = blog;

           if (req.query.json) {
                res.json(data);
            } else {
                res.render('web/index.html', data);
            }
        }
    });
};

/**
 * 查询页面
 */
routes.search = function (req, res) {
    var ret = {},
        type = req.params.type,
        key = req.params.key;

    if (type && ['keyword', 'category', 'tag'].indexOf(type) > -1) {
        ret.type = {};
        ret.type[type] = 1;
    }

    async.waterfall([
        // 查询所有的 cateogry 信息
        function (next) {
            Category.findAll(function (err, raw) {
                ret.category = raw;

                next(err);
            });
        },

        // 查询所有的 tag 信息
        function (next) {
            tag.find(null, function (err, raw) {
                ret.tag = raw;

                next(err);
            });
        },

        // 查询使用的 bg
        function (next) {
            // todo search
            ret.searchBg = "http://website-node.b0.upaiyun.com/1484-1uexc0b.jpg";

            next();
        },

        // 对数据的处理
        function (next) {
            if (ret.type && key) {
                // category 相关的处理
                if (ret.type.category) {
                    ret.category.forEach(function (item) {
                        if (item.id == key) {
                            item.active = 1;
                            return false;
                        }
                    });
                }

                // category 相关的处理
                if (ret.type.tag) {
                    ret.tag.forEach(function (item) {
                        if (item.name == key) {
                            item.active = 1;
                            return false;
                        }
                    });
                }
            }

            next();
        },

        // 获取日志数据
        function (next) {
            if (ret.type && key) {
                if (ret.type.category) {
                    blog.findByCategory(key, blog.conf.LITE_FILEDS, function (err, raw) {
                        ret.blog = raw;

                        next(err);
                    });
                }

                if (ret.type.tag) {
                    blog.findByTag(key, blog.conf.LITE_FILEDS, function (err, raw) {
                        ret.blog = raw;

                        next(err);
                    });
                }
            }

            next();
        }
    ], function (err) {
        if (req.query.json) {
            commonUtil.toJson(err, ret, res);
        } else {
            res.render("web/search.html", ret);
        }
    });
}
    

/* 通过 tag 获取blog数据 */
routes.blogCategory = function (req, res) {
    var id = req.params.id;

    console.log(id);

    blog.findByCategory(id, blog.conf.FULL_FILEDS, function (err, raw) {
        if (err) {
            res.status(404).render("404.tpl");
        } else {
            res.json({
                errno: 0,
                content: raw,
            });
        }
    });
}

/* 通过 tag 获取blog数据 */
routes.blogTag = function (req, res) {
    var name = req.params.name;

    blog.findByTag(name, blog.conf.FULL_FILEDS, function (err, datas) {
        if (err) {
            res.status(404).render("404.tpl");
        } else {
            res.json({
                errno: 0,
                content: datas,
            });
        }
    });
}

routes.blog = function (req, res) {
    var id = req.params.id,
        data = {};

    async.waterfall([
        // 查询对应 blog
        function (next) {
            blog.findById(id, blog.conf.FULL_FILEDS, function (err, raw) {
                var blog = raw && raw[0];

                next(err, blog);
            });
        },
        // function (blog, callback) {
        //     // 设置 tag 数据
        //     Tag.find().exec(function (error, tags) {
        //         data.tags = tags;
        //         callback(error, blog);
        //     });
        // },
        // 设置系列数据 todo
        function (blog, next) {
            // if (blog.series) {
            //     Blog.findBySeries(blog.series, function (error, blogs) {
            //         data.seriesBlogs = blogs;
            //         callback(error);
            //     });
            // } else {
            //     data.seriesBlogs = [];
            //     callback();
            // }
            next(null, blog)
        }
    ], function (err, blog) {
        var data;

        if (err) {
            res.status(404).render("404.html");
        } else {
            data = {
                blog: blog
            }

           if (req.query.json) {
                res.json(data);
            } else {
                res.render('web/blog.html', data);
            }
        }
    });
}

/* 获取当前blog的详细信息，并包括上一个、下一个的简略信息 */
routes.blogView = function (req, res) {
    var id = req.params.id,
        blog;

    Blog.viewBlog(id, function (error, datas) {
        if (error) {
            res.status(404).render("404.tpl");
        } else {
            datas.blog.set("dateStr", datas.blog.date.toFormat("YYYY-MM-DD HH24:MI:SS"));
            res.json(datas);
        }
    });
}


/* 通过 series 获取blog数据 */
routes.blogSeries = function (req, res) {
    var name = req.params.name;

    Blog.findBySeries(name, function (error, datas) {
        if (error) {
            res.status(404).render("404.tpl");
        } else {
            datas.forEach(function (blog) {
                blog.set("dateStr", blog.date.toFormat("YYYY-MM-DD HH24:MI:SS"));
            });

            res.json({
                error: 0,
                content: datas,
            });
        }
    });
}