var routes = {},
    Blog = require("../../models/blog.js"),
    Tag = require("../../models/tag.js");

exports.init = function (app) {
    app.get("/", routes.index);
    app.get("/blog", routes.index);
    app.get("/blog/:id", routes.blog);
    app.get("/blog/view/:id", routes.blogView);
    app.get("/blogtag/:name", routes.blogTag);
    app.get("/blogtag", routes.blogTag);
}

routes.index = function (req, res) {
    var blog, promise;

    if (req.path == "/") {
        res.redirect("/blog");
    } else {
        promise = Tag.find().exec();

        promise.then(function (tags) {
            Blog.topBlog(Blog.Const.MIDDLE_FILEDS, function (error, blog) {

                if (!error && blog) {
                    res.render('blog/index.tpl', {
                        title: blog.title,
                        blog: blog,
                        tags: tags
                    });
                } else {
                    res.status(404).render("404.tpl");
                }
            });
        });
    }
};

routes.blog = function (req, res) {
    var id = req.params.id,
        blog;

    promise = Tag.find().exec();

    promise.then(function (tags) {
        Blog.findById(id).select(Blog.Const.FULL_FILEDS).exec(function (error, blog) {
            if (error || !blog) {
                res.status(404).render("404.tpl");
            } else {
                if (req.query.json) {
                    res.json(blog);
                } else {
                    res.render('blog/index.tpl', {
                        title: blog.title,
                        blog: blog,
                        tags: tags
                    });
                }
            }
        });
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
            res.json({
                error: 0,
                content: datas,
            });
        }
    });
}