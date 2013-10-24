var routes = {};

exports.init = function (app) {
    app.get("/", routes.index);
    app.get("/blog", routes.index);
}

routes.index = function (req, res, next) {
    if (req.path == "/") {
        res.redirect("/blog");
    } else {
        res.render('blog/index.tpl', {title: 'Blog', user: req.session.user});
    }
};