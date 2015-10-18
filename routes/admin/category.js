/**
 * 管理 categroy 的相关 action
 */
var Categrory = require("../../models/category"),
    util = require("./util"),
    async = require("async"),
    NEED_CHECK_ROUTES;

NEED_CHECK_ROUTES = [
    {
        "method": "get",
        "url": "/mis/categroy"
    },
    {
        "method": "get",
        "url": "/mis/addcategroy"
    }
];


exports.init = function (app) {
    if (app.get("env") == "production") {
        util.needCheckLogin(app, NEED_CHECK_ROUTES);
    }

    app.get("/mis/categroy", function (req, res) {
        Categrory.findAll(function (err, raw) {
            util.toJson(err, raw, res);
        });
    });

    app.get("/mis/addcategroy", function (req, res) {
        var name = req.param("name");

        if (name) {
            Categrory.addCategory(name, function (err, raw) {
                util.toJson(err, raw, res);
            });
        } else {
            util.toJson({
                errno: 1,
                errmsg: "no name input"
            }, null, res);
        }
    });
}