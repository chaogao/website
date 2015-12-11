/**
 * @module models/blog
 */
var Connection = require("../db");
var Conf = require("../db/conf");
var async = require("async");
var blogUtil = require("./components/util");
var Tag = require("./tag");
var Category = require("./category");

var TABLE_NAME = 'blog_article';

var FIELDS_CONST = {
    LITE_FILEDS: ['id', 'title', 'category_name', 'category_id', 'tag',
        'description', 'author',
        'ext', 'update_time', 'create_time', 'top', 'draft', 'content_html_lite'],
    FULL_FILEDS: [
        'id', 'title', 'category_name', 'category_id', 'tag',
        'description', 'author', 'content', 'content_html', 'content_html_lite',
        'ext', 'update_time', 'create_time', 'top', 'draft'
    ],
    EXT_FIELDS: ['bg', 'titleBg']
}

/**
 * article model
 */
var Article = function (argument) {
    this.conn = Connection.get();
    this.conf = FIELDS_CONST;
}

/**
 * 获取全部的 article 并进行排序
 * @param  {[type]}   fields [description]
 * @param  {Function} cb     [description]
 * @return {[type]}          [description]
 */
Article.prototype.adminBlogs = function (fields, withDraft, cb) {
    var result = [],
        self = this;

    async.waterfall([
        function (callback) {
            self.conn.query('select ?? from ?? where top=?' + (withDraft ? '' : ' and draft=0') + ' and del=0',
                [fields, TABLE_NAME, 1], function (error, raw) {
                    callback(error, raw);
                }
            );
        },
        function (raw, callback) {
            raw[0] && (result.push(raw[0]));

            self.conn.query('select ?? from ?? where top=?' + (withDraft ? '' : ' and draft=0') + ' and del=0 order by create_time desc',
                [fields, TABLE_NAME, 0], function (error, raw) {
                    if (raw) {
                        result = result.concat(raw);
                    }

                    // 处理 ext 数据
                    result.forEach(function (item) {
                        blogUtil.transBlog(item);
                    });

                    callback(error, result);
                }
            );
        }
    ], function (error, ret) {
        cb(error, ret);
    });
}

/**
 * 获取关于的 blog
 */
Article.prototype.findAbout = function (fileds, cb) {
    var id = Conf.aboutId;
    this.findById(id, fileds, cb);
}

/**
 * 通过 tag 获取日志
 */
Article.prototype.findByTag = function (name, fields, cb) {
    var self = this,
        filter;

    // 不传入 tag 属性直接走全量即可
    if (!name) {
        self.adminBlogs(fields, 0, cb);
    } else {
        this.conn.query("select ?? from blog_article where del=0 and draft=0 and `tag` like ? order by create_time desc", [fields, "%" + name + "%"], function (err, raw) {
            // 处理日志数据
            raw && raw.length && raw.forEach(function (item) {
                blogUtil.transBlog(item);
            });

            cb(err, raw);
        });
    }
}

/**
 * 通过单位 category 获取日志
 */
Article.prototype.findByCategory = function (id, fields, cb) {
    this.conn.query("select ?? from ?? where del=0 and draft=0 and category_id=? order by create_time desc", [fields, TABLE_NAME, id], function (err, raw) {
        raw && raw.forEach(function (item) {
            blogUtil.transBlog(item);
        });

        cb(err, raw);
    });
}

/**
 * 通过 tag 获取日志
 */
Article.prototype.findById = function (id, fields, cb) {
    this.conn.query("SELECT ?? FROM blog_article where id=?", [fields, id], function (err, raw) {
        raw.forEach(function (item) {
            blogUtil.transBlog(item);
        });
        cb(err, raw);
    });
}

/**
 * 获取置顶的日志
 */
Article.prototype.findTop = function (fields, cb) {
    this.conn.query("SELECT ?? FROM blog_article where top=?", [fields, 1], function (err, raw) {
        var blog;

        // 处理日志数据
        raw && raw.length && raw.forEach(function (item) {
            blogUtil.transBlog(item);
        });
        blog = raw && raw.length && raw[0];

        cb(err, blog);
    });
}

/**
 * 保存blog
 */
Article.prototype.saveBlog = function (arr, cb) {
    var article = {},
        ext = {};

    // 判断归档文章
    if (!arr.create_time) {
        arr.create_time = parseInt((new Date).getTime() / 1000);
    } else {
        ext.history = 1;
    }

    this.conf.FULL_FILEDS.forEach(function (key) {
        if (arr[key]) {
            article[key] = arr[key];
        }
    });

    // 处理 ext 数据
    this.conf.EXT_FIELDS.forEach(function (key) {
        if (arr[key] !== undefined) {
            ext[key] = arr[key];
        }
    });
    article.ext = JSON.stringify(ext);

    article.content_html = blogUtil.transMarkdown(article);
    article.content_html_lite = blogUtil.transLiteMarkdown(article);

    if (!article.title || !article.content || !article.category_id) {
        cb({msg: "invalid data", code: 1000});
    } else {
        this.conn.query("INSERT INTO blog_article SET ?", article, function (error, raw) {
            cb.apply(this, arguments);
        });
    }
}

/**
 * 更新日志
 */
Article.prototype.updateBlog = function (id, arr, cb) {
    var article = {},
        ext = {};

    this.conf.FULL_FILEDS.forEach(function (key) {
        if (arr[key]) {
            article[key] = arr[key];
        }
    });

    // 处理 ext 数据
    this.conf.EXT_FIELDS.forEach(function (key) {
        if (arr[key] !== undefined) {
            ext[key] = arr[key];
        }
    });
    article.ext = JSON.stringify(ext);
    // 处理 markdown 数据
    article.content_html = blogUtil.transMarkdown(article);
    article.content_html_lite = blogUtil.transLiteMarkdown(article);
    
    if (!article.title || !article.content || !id) {
        cb({msg: "invalid data", code: 1000});
    } else {
        this.conn.query("UPDATE blog_article SET ? WHERE id = ?", [article, id], function (error, raw) {
            cb.apply(this, arguments);
        });
    }
}

/**
 * 删除
 */
Article.prototype.delArticle = function (id, cb) {
    var self = this;

    async.waterfall([
        // 查询到日志数据
        function (next) {
            self.findById(id, self.conf.FULL_FILEDS, function (err, raw) {
                next(err, raw);
            });
        },
        // 进行 tag 个数减
        function (raw, next) {
            // 判断有 tag 数据
            if (raw && raw.length && raw[0].tag && raw[0].tag.length) {
                Tag.modfityCount(raw[0].tag, -1, function (err, raw) {
                     next(err, raw[0]);
                });
            } else {
                next(null, raw[0]);
            }
        },
        // 进行 category 删除
        function (blog, next) {
            Category.modfityCount(blog.category_id, -1, function (err, raw) {
                next(err);
            });
        },
        // 进行日志的删除
        function (next) {
            self.conn.query("UPDATE blog_article SET ? WHERE id=?", [{del: 1}, id], function (err, raw) {
                next(err);
            })        
        }
    ], function (err) {
        cb(err);
    });
}

/**
 * 置顶
 */
Article.prototype.topArticle = function (id, cb) {
    var self = this;

    async.waterfall([
        function (callback) {
            // 把以前的置顶改回去
            self.conn.query("UPDATE blog_article SET ? WHERE ?", [{top: 0}, {top: 1}], function (error, raw) {
                callback(error, raw);
            });
        },
        function (raw, callback) {
            self.conn.query("UPDATE blog_article SET ? WHERE id=?", [{top: 1}, id], function (error, raw) {
                callback(error, raw);
            });
        }
    ], function (error) {
        cb(error);
    });
}

/**
 * 日志的上下线
 */
Article.prototype.draft = function (id, flag, cb) {
    var self = this;

    async.waterfall([
        function (callback) {
            self.conn.query("UPDATE blog_article set ? where id = ?", [{draft: flag}, id], function (err, raw) {
                callback(err, raw);
            });
        }
    ], function (err, raw) {
        cb(err, raw);
    });
}

module.exports = new Article();