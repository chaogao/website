var routes = {},
    Blog = require("../../models/blog.js");

exports.init = function (app) {
    app.get("/", routes.index);
    app.get("/blog", routes.index);
    app.get("/blog/:id", routes.blog);
}

routes.index = function (req, res) {
    var blog;

    if (req.path == "/") {
        res.redirect("/blog");
    } else {
        Blog.topBlog(Blog.Const.MIDDLE_FILEDS, function (error, blog) {
            if (!error) {
                res.render('blog/index.tpl', {
                    title: blog.title,
                    blog: blog
                });
            } else {
                res.send(404, 'Sorry, we cannot find that!');
            }
        });
    }
};

routes.blog = function (req, res) {
    var id = req.params.id,
        blog;

    Blog.findById(id).select(Blog.Const.FULL_FILEDS).exec(function (error, blog) {
        if (error) {
            res.send(404, 'Sorry, we cannot find that!');
        } else {
            if (req.query.json) {
                res.json(blog);
            } else {
                res.render('blog/index.tpl', {
                    title: blog.title,
                    blog: blog
                });
            }
        }
    });
}