/**
 * 管理登入相关action
 * @module admin/indexd
 */
var User = require("../../models/user"),
    blogAdmin = require("./blog"),
    util = require("./util"),
    NEED_CHECK_ROUTES;

NEED_CHECK_ROUTES = [
    {
        "method": "get",
        "url": "/admin"
    },
    {
        "method": "get",
        "url": "/admin/logout"
    }
]

exports.init = function (app) {


    // 配置所有需要检测登入状态的路由
    util.needCheckLogin(app, NEED_CHECK_ROUTES);

    /**
     * 管理首页 action:get
     */
    app.get("/admin", function (req, res) {
        res.render("admin/index.tpl", {title: "admin"});
    });

    /**
     * 登录 action:get
     */
    app.get("/admin/login", function (req, res) {
        res.render("admin/login.tpl", {title: "管理登入", error: req.flash("error")});
    });

    /**
     * 登录 action:post
     */
    app.post("/admin/login", function (req, res) {
        var user = req.body.user;

        if (user.name && user.password) {
            User.validate(user.name, user.password).done(function (e) {
                if (e.valid) {
                    util.setSesstion(req, app, e.user);
                    res.redirect("/admin");
                } else {
                    req.flash("error", "密码错");
                    res.redirect("/admin/login");
                }
            });
        } else {
            req.flash("error", "有数据为空");
            res.redirect("/admin/login");
        }
    });

    /**
     * 退出登录 action:get
     */
    app.get("/admin/logout", function (req, res) {
        util.removeSession(req, app);
        res.redirect("/admin/login");
    });

    // 只有开发环境下才可用
    // if (app.get('env') == "development") {
    app.get("/admin/add", function (req, res) {
        res.render("admin/add.tpl", {title: "管理员添加"});
    });

    app.post("/admin/add", function (req, res) {
        var user = req.body.user;

        if (user.name && user.password) {
            User.saveUser(user, function (err, user) {
                if (!err) {
                    res.redirect("/admin");
                }
            });
        }
    });
    // }

    blogAdmin.init(app);
}