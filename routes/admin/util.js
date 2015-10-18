/**
 * 管理后台公用工具类
 */
module.exports = {
    /**
     * 检查用户是否已经登入
     * @private
     */
    checkLogin: function (req, res, next) {
        if (!req.session.user) {
            req.flash("error", "请登入");
            return res.redirect("/mis/login");
        }

        next();
    },
    /**
     * 设置session，同时设置locals中的user，作为render中的默认参数
     * @public
     */
    setSesstion: function (req, app, user) {
        req.session.user = user;
        app.locals.user = user;
    },
    /**
     * 删除session，同时删除locals
     * @public
     */
    removeSession: function (req, app) {
        req.session.user = null;
        app.locals.user = null;
    },
    /**
     * 传入需要检测用户是否登入的数组路由
     * @public
     */
    needCheckLogin: function (app, routes) {
        var self = this;

        routes.forEach(function (route) {
            var method = route.method || "get";

            app[method](route.url, self.checkLogin);
        });
    },
    /**
     * 显示为 json 数据
     */
    toJson: function (err, raw, res) {
        var ret;

        ret = {
            data: raw,
            errno: 0
        }

        // 如果有错误则返回错误信息
        if (err) {
            // 解析 mysql 错误码
            ret.errno = (-1 && err.errno);
            // 解析 mysql 错误信息
            ret.errmsg = ("server error" && (err.errmsg || err.code));
            ret._errobj_ = err;
        }

        res.json(ret);
    }
}