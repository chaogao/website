exports.init = function (app) {
    app.get("/admin/login", function (req, res) {
        res.render("admin/login.tpl", {title: "Express"});
    });

    app.get("/admin/add", function (req, res) {
        res.render("admin/add.tpl", {title: "管理员添加"});
    });

    app.post("/admin/add", function (req, res) {
        
    });
}