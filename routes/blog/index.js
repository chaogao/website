var routes = {},
    Blog = require("../../models/blog.js"),
    Tag = require("../../models/tag.js"),
    async = require("async");

exports.init = function (app) {
    app.get("/", routes.index);
    app.get("/blog", routes.index);
    app.get("/blog/:id", routes.blog);
    app.get("/blog/view/:id", routes.blogView);
    app.get("/blogtag/:name", routes.blogTag);
    app.get("/blogtag", routes.blogTag);
    app.get("/blogseries", routes.blogSeries);
    app.get("/blogseries/:name", routes.blogSeries);
}

routes.index = function (req, res) {
    var id = req.params.id,
        data = {
            title: "ddg的前端世界"
        };

    async.waterfall([
        function (callback) {
            // 设置 tag 数据
            Tag.find().exec(function (error, tags) {
                data.tags = tags;
                callback(error);
            });
        }
    ], function (error) {
        if (error) {
            res.status(404).render("404.tpl");
        } else {
           if (req.query.json) {
                res.json(data);
            } else {
                res.render('blog/index.tpl', data);
            }
        }
    });
};

routes.blog = function (req, res) {
    var id = req.params.id,
        data = {};

    async.waterfall([
        function (callback) {
            Blog.findById(id).select(Blog.Const.FULL_FILEDS).exec(function (error, blog) {
                if (!blog) {
                    console.log("no blog");
                    error = {errorNo: 1, errorMsg: "no blog"};
                    callback(error, blog);
                } else {
                    // 设置 blog 数据
                    data.blog = blog;
                    data.title = blog.title;
                    callback(error, blog);
                }
            });
        },
        function (blog, callback) {
            // 设置 tag 数据
            Tag.find().exec(function (error, tags) {
                data.tags = tags;
                callback(error, blog);
            });
        },
        function (blog, callback) {
            // 设置系列数据
            if (blog.series) {
                Blog.findBySeries(blog.series, function (error, blogs) {
                    data.seriesBlogs = blogs;
                    callback(error);
                });
            } else {
                data.seriesBlogs = [];
                callback();
            }
        }
    ], function (error) {
        if (error) {
            res.status(404).render("404.tpl");
        } else {
           if (req.query.json) {
                res.json(data);
            } else {
                res.render('blog/blog.tpl', data);
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

/* 通过 tag 获取blog数据 */
routes.blogTag = function (req, res) {
    var name = req.params.name;

    Blog.findByTag(name, function (error, datas) {
        if (error) {
            res.status(404).render("404.tpl");
        } else {

            datas.forEach(function (blog) {
                blog.set("dateStr", blog.date.toFormat("YYYY-MM-DD HH24:MI:SS"));
                console.log(blog);
            });


            res.json({
                error: 0,
                content: datas,
            });
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