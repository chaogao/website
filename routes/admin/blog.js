/**
 * 管理blog的相关action
 * @module admin/blog
 */
var fs = require("fs"),
    path = require("path"),
    Blog = require("../../models/blog"),
    util = require("./util"),
    UPYun = require('../../plugin/upyun').UPYun,
    dateUtil = require("date-utils"),
    upyun, NEED_CHECK_ROUTES, YUNDOMAIN;


upyun = new UPYun("website-doudougou", "doudougou", "4085903gougou");
YUNDOMAIN = "http://website-doudougou.b0.upaiyun.com";

NEED_CHECK_ROUTES = [
    {
        "method": "get",
        "url": "/admin/blog"
    },
    {
        "method": "post",
        "url": "/admin/blog"
    },
    {
        "method": "get",
        "url": "/admin/blog/create"
    },
    {
        "method": "get",
        "url": "/admin/blog/:id"
    },
    {
        "method": "post",
        "url": "/admin/blogupdate"
    },
    {
        "method": "post",
        "url": "/admin/blogdelete"
    },
    {
        "method": "post",
        "url": "/admin/blogtop"
    },
    {
        "method": "post",
        "url": "/admin/upload"
    }
];

exports.init = function (app) {
    util.needCheckLogin(app, NEED_CHECK_ROUTES);

    /**
     * blog列表 action:get
     */
    app.get("/admin/blog", function (req, res) {
        var blogs;

        Blog.adminBlogs(Blog.Const.MIN_FILEDS, function(error, blogs) {
            debugger;

            blogs.forEach(function (blog) {
                debugger;
                blog.dateStr = blog.date.toFormat("YYYY-MM-DD HH24:MI:SS");
            });

            if (!error) {
                res.render("admin/blog/index.tpl", {title: "Blog List", blogs: blogs});
            }
        });
    });

    /**
     * 创建blog页面 action:get
     */
    app.get("/admin/blog/create", function (req, res) {
        res.render("admin/blog/create.tpl", {
            title: "创建Blog", 
            error: req.flash("error")
        });
    });

    /**
     * 创建blog action:post
     */
    app.post("/admin/blog", function (req, res) {
        var blog;

        req.body.blog.author = req.session.user.name;

        blog = new Blog(req.body.blog);
        blog.saveBlog(function (error, blog) {
            var msg;

            if (error) {
                switch (error.code) {
                    case 1000:
                        msg = error.msg;
                        break;
                    default:
                        msg = "server busy";
                        break;
                }

                req.flash("error", msg);
                return res.redirect("/admin/blog/create");
            }

            res.redirect("/admin/blog/");
        });
    });

    /**
     * 编辑页面 action:get
     */
    app.get("/admin/blog/:id", function (req, res) {
        var id = req.params.id,
            blog;

        Blog.findById(id).exec(function (error, blog) {
            if (!error && blog) {
                res.render("admin/blog/edit.tpl", {
                    blog: blog,
                    title: "编辑",
                    error: req.flash("error")
                });
            }
        });
    });

    /**
     * 修改blog action:post
     */
    app.post("/admin/blogupdate", function (req, res) {
        var blog = req.body.blog,
            id = blog.id;

        delete blog.id

        Blog.update({_id: id}, {$set: blog}).exec(function(error) {
            if (!error) {
                res.redirect("/admin/blog");
            }
        });

    });

    /**
     * 删除blog action:post
     */
    app.post("/admin/blogdelete", function (req, res) {
        var id = req.body.id;

        Blog.remove({_id: id}).exec(function (error) {
            if (!error) {
                res.json({code: 0});
            } else {
                res.json({code: -1, msg: "server error"});
            }
        });
    });

    /**
     * 设置置顶 action:post
     */
    app.post("/admin/blogtop", function (req, res) {
        var id = req.body.id;

        if (id) {
            Blog.setTop(id, function (error) {
                if (!error) {
                    res.json({code: 0});
                } else {
                    res.json({code: -1, msg: "server error"});
                }
            });
        }
    });

    /**
     * 上传文件接口
     */
    app.post("/admin/upload", function (req, res) {
        var file, buffer, basename;

        file = req.files.image;
        basename = path.basename(file.path);

        if (file.size <= 0 || file.size > 102400 * 2) {
            return res.json({code: -1, msg: "no valid input"});
        }

        buffer = fs.readFileSync(file.path);

        upyun.writeFile("/" + basename, buffer, true, function (error, msg) {
            if (!error) {
                res.json({code: 0, url: YUNDOMAIN + "/" + basename});
            } else {
                res.json({code: -1, msg: "server error"});
            }
        });
    });
}