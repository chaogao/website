/**
 * 管理登入相关action
 * @module admin/indexd
 */
var User = require("../../models/user"),
    blogRoutes = require("./blog"),
    categoryRoutes = require("./category"),
    util = require("./util"),
    NEED_CHECK_ROUTES;

NEED_CHECK_ROUTES = [
    {
        "method": "get",
        "url": "/mis"
    },
    {
        "method": "get",
        "url": "/admin/logout"
    }
]

exports.init = function (app) {
    if (app.get("env") == "production") {
        util.needCheckLogin(app, NEED_CHECK_ROUTES);
    }

    /**
     * 管理首页 action:get
     */
    app.get("/mis", function (req, res) {
        res.render("mis/index.html", {title: "mis"});
    });

    /**
     * 登录 action:get
     */
    app.get("/mis/login", function (req, res) {
        res.render("mis/user/login.html", {title: "管理登入", error: req.flash("error")});
    });

    /**
     * 登录 action:post
     */
    app.post("/mis/login", function (req, res) {
        var user = req.body.user;

        if (user.name && user.password) {
            User.validate(user.name, user.password).done(function (e) {
                if (e.valid) {
                    util.setSesstion(req, app, e.user);
                    res.redirect("/mis");
                } else {
                    req.flash("error", "密码错");
                    res.redirect("/mis/login");
                }
            });
        } else {
            req.flash("error", "有数据为空");
            res.redirect("/mis/login");
        }
    });

    /**
     * 退出登录 action:get
     */
    app.get("/mis/logout", function (req, res) {
        util.removeSession(req, app);
        res.redirect("/mis/login");
    });

    // 只有开发环境下才可用
    // if (app.get('env') == "development") {
    app.get("/mis/add", function (req, res) {
        res.render("mis/user/add.html", {title: "管理员添加"});
    });

    app.post("/mis/add", function (req, res) {
        var user = req.body.user;

        if (user.name && user.password) {
            User.saveUser(user, function (err, user) {
                if (!err) {
                    res.redirect("/mis");
                }
            });
        }
    });

    blogRoutes.init(app);
    categoryRoutes.init(app);
}