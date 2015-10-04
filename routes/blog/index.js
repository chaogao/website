var routes = {},
    blog = require("../../models/blog.js"),
    tag = require("../../models/tag.js"),
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
    app.get("/blogseries", routes.blogSeries);
    app.get("/blogseries/:name", routes.blogSeries);
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
                next(err, raw);
            });
        },

        // 获取置顶 blog
        function (tag, next) {
            blog.findTop(blog.conf.FULL_FILEDS, function (err, raw) {
                next(err, tag, raw);
            });
        }
    ], function (err, tag, blog) {
        if (err) {
            res.json(err);
        } else {
            data.tag = tag;
            data.blog = blog;

           if (req.query.json) {
                res.json(data);
            } else {
                res.render('web/index.html', data);
            }
        }
    });
};

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