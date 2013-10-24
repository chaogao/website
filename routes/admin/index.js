var User = require("../../models/user"),
    checkLogin;

/**
 * 检查用户是否已经登入
 */
checkLogin = function (req, res, next) {
    if (!req.session.user) {
        req.flash("error", "请登入");
        return res.redirect("/admin/login");
    }

    next();
}

/**
 * 设置session，同时设置locals为渲染做准备
 */
setSesstion = function (req, app, user) {
    req.session.user = user;
    app.locals.user = user;
}

/**
 * 删除session，同时删除locals
 */
removeSession = function (req, app) {
    req.session.user = null;
    app.locals.user = null;
}

exports.init = function (app) {
    app.locals.user = null;

    app.get("/admin/login", function (req, res) {
        res.render("admin/login.tpl", {title: "管理登入", error: req.flash("error")});
    });

    app.post("/admin/login", function (req, res) {
        var user = req.body.user;

        if (user.name && user.password) {
            User.validate(user.name, user.password).done(function (e) {
                if (e.valid) {
                    setSesstion(req, app, e.user);
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

    // 只有开发环境下才可用
    if (app.get('env') == "development") {
        app.get("/admin/add", function (req, res) {
            res.render("admin/add.tpl", {title: "管理员添加"});
        });

        app.post("/admin/add", function (req, res) {
            var user = req.body.user;

            if (user.name && user.password) {
                u = new User(user);
                u.saveUser(function (err, user) {
                    if (!err) {
                        res.redirect("/admin");
                    }
                });
            }
        });
    }

    app.get("/admin/logout", checkLogin);
    app.get("/admin/logout", function (req, res) {
        removeSession(req, app);
        res.redirect("/admin/login");
    });

    app.get("/admin", checkLogin);
    app.get("/admin", function (req, res) {
        res.render("admin/index.tpl", {title: "admin", user: req.session.user});
    });
}