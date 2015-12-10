/**
 * 管理blog的相关action
 * @module admin/blog
 */
var fs = require("fs"),
    path = require("path"),
    article = require("../../models/blog"),
    Tag = require("../../models/tag"),
    Categrory = require("../../models/category"),
    util = require("./util"),
    UPYun = require('../../plugin/upyun').UPYun,
    dateUtil = require("date-utils"),
    async = require("async"),
    commonUtil = require("../components/common.js"),
    upyun, NEED_CHECK_ROUTES, YUNDOMAIN;


upyun = new UPYun("website-node", "doudougou0406", "4085903gougou");
YUNDOMAIN = "http://website-node.b0.upaiyun.com";

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
        "url": "/admin/article/:id"
    },
    {
        "method": "post",
        "url": "/admin/blogupdate"
    },
    {
        "method": "post",
        "url": "/admin/articledelete"
    },
    {
        "method": "post",
        "url": "/admin/articletop"
    },
    {
        "method": "post",
        "url": "/admin/articledraft"
    },
    {
        "method": "post",
        "url": "/admin/upload"
    }
];

exports.init = function (app) {
    if (app.get("env") == "production") {
        util.needCheckLogin(app, NEED_CHECK_ROUTES);
    }

    /**
     * blog列表 action:get
     */
    app.get("/mis/blog", function (req, res) {
        var blogs;

        article.adminBlogs(article.conf.LITE_FILEDS, 1, function(error, articles) {
            if (!error) {
                res.render("mis/blog/index.html", {title: "日志列表", articles: articles});
            } else {
                commonUtil.toJson(error, {}, res);
            }
        });
    });

    /**
     * 创建blog页面 action:get
     */
    app.get("/mis/blog/create", function (req, res) {
        var data;

        Categrory.findAll(function (err, raw) {
            res.render("mis/blog/create.html", {
                category: raw,
                title: "创建Blog", 
                error: req.flash("error")
            });
        });
    });

    /**
     * 创建blog action:post
     */
    app.post("/mis/blog", function (req, res) {
        var blog = req.body.blog;

        // 存入作者信息
        blog.author = app.locals.user && app.locals.user.name;

        // 必须 先保存了 tag 再进行 blog 的插入
        async.waterfall([
            // 进行基础输入检查
            function (next) {
                if (!blog.title || !blog.content || !blog.category_id) {
                    next({
                        errno: 1,
                        errmsg: "必须的字段未提供"
                    })
                } else {
                    next();
                }
            },
            // 将新增的 tag 保存
            function (next) {
                if (blog.tag) {
                    Tag.addTags(blog.tag.split(","), function (err, raw) {
                        next(err);
                    });
                } else {
                    next();
                }
            },
            // 查询分类信息
            function (next) {
                Categrory.findById(blog.category_id, function (err, raw) {
                    if (err || !raw.length) {
                        next({
                            errno: 2,
                            errmsg: "分类信息检索错误"
                        })
                    } else {
                        blog.category_id = raw[0].id;
                        blog.category_name = raw[0].name;

                        next();
                    }
                })
            },
            // 保存日志
            function (next) {
                article.saveBlog(blog, function (err, raw) {
                    next(err);
                });
            },
            // tag 进行计数操作
            function (next) {
                if (blog.tag) {
                    Tag.modfityCount(blog.tag.split(","), 1, function (err, raw) {
                        next(err);
                    });
                } else {
                    next();
                }
            },
            // categroy 技术操作
            function (next) {
                Categrory.modfityCount(blog.category_id, 1, function (err, raw) {
                    next(err);
                });
            }
        ], function (err) {
            if (err) {
                console.log(err);
                req.flash("error", err.errmsg);
                res.redirect("/mis/blog/create");
            } else {
                res.redirect("/mis/blog");
            }
        });
    });

    /**
     * 编辑页面 action:get
     */
    app.get("/mis/article/:id", function (req, res) {
        var id = req.params.id;

        article.findById(id, article.conf.FULL_FILEDS, function (error, article) {

            if (!error && article[0]) {
                res.render("mis/blog/edit.html", {
                    article: article[0],
                    title: "编辑",
                    error: req.flash("error")
                });
            }
        });
    });

    /**
     * 修改blog action:post
     */
    app.post("/mis/blogupdate", function (req, res) {
        var blog = req.body.blog,
            id = blog.id,
            sr;

        delete blog.id;

        // 必须 先保存了 tag 再进行 blog 的插入
        async.waterfall([
            function (next) {
                if (blog.tag) {
                    Tag.addTags(blog.tag.split(","), function (err, raw) {
                        next();
                    });
                } else {
                    next();
                }
            },
            function () {
                article.updateBlog(id, blog, function(error) {
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
                        return res.redirect("/mis/article/" + id);
                    }

                    res.redirect("/mis/blog");
                });
            }
        ]);
    });

    /**
     * 删除日志
     */
    app.post("/admin/articledelete", function (req, res) {
        var id = req.body.id;

        if (!id) {
            res.json({code: -1, msg: "input error"});
            return;
        }

        article.delArticle(id, function (err, raw) {
            if (!err) {
                res.json({code: 0});
            } else {
                res.json({
                    code: -1,
                    errData: err
                });
            }
        });
    });

    /**
     * 设置置顶 action:post
     */
    app.post("/admin/articletop", function (req, res) {
        var id = req.body.id;

        if (!id) {
            res.json({code: -1, msg: "input error"});
            return;
        }

        article.topArticle(id, function (error) {
            if (!error) {
                res.json({code: 0});
            } else {
                res.json({code: -1, msg: "server error"});
            }
        });
    });

    /**
     * 设置日志草稿
     */
    app.get("/admin/articledraft", function (req, res) {
        var id = req.param("id"),
            flag = req.param("flag");

        if (!id) {
            commonUtil.toJson({
                errno: 1,
                errmsg: "id param error"
            }, {}, res);

            return;
        }

        if (flag === "on") {
            flag = 1;
        } else if (flag == "off") {
            flag = 0;
        } else {
            commonUtil.toJson({
                errno: 1,
                errmsg: "flag param error"
            }, {}, res);

            return;
        }

        article.draft(id, flag, function (err, raw) {
            commonUtil.toJson(err, raw, res);
        });
    });

    /**
     * 上传文件接口
     */
    app.post("/admin/upload", function (req, res) {
        var file, buffer, basename;

        file = req.files.image;
        basename = path.basename(file.path);

        if (file.size <= 0 || file.size > 102400 * 10) {
            return res.json({code: -1, msg: "no valid input"});
        }

        buffer = fs.readFileSync(file.path);

        upyun.writeFile("/" + basename, buffer, true, function (error, msg) {
            if (!error) {
                res.json({code: 0, url: YUNDOMAIN + "/" + basename});
            } else {
                console.log(error, msg);
                res.json({code: -1, msg: "server error"});
            }
        });
    });

    /**
     * 增加一个 tag
     */
    app.get("/mis/addtag", function (req, res) {
        var tags = req.param("tags");

        if (!tags) {
            res.json({
                code: -1,
                msg: "no tags input"
            });

            return;
        }

        tags = tags.split(",");

        Tag.addTags(tags, function (err, raw) {
            res.json({
                errno: err && err.errno || 0,
                errmsg: err && err.errmsg || "",
                raw: raw
            });
        });
    });
}