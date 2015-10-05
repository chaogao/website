/**
 * @module models/blog
 */
var Connection = require("../db");
var Conf = require("../db/conf");
var async = require("async");
var blogUtil = require("./components/util");
var Tag = require("./tag");

var TABLE_NAME = 'blog_article';

var FIELDS_CONST = {
    LITE_FILEDS: ['id', 'title', 'series_name', 'series_id', 'description', 'author', 'ext', 'update_time', 'top', 'draft'],
    FULL_FILEDS: ['id', 'title', 'series_name', 'series_id', 'description', 'author', 'content', 'content_html', 'ext', 'update_time', 'create_time', 'top', 'draft', 'tag'],
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
Article.prototype.adminBlogs = function (fields, cb) {
    var result = [],
        self = this;

    async.waterfall([
        function (callback) {
            self.conn.query('select ?? from ?? where top=? and del=0',
                [fields, TABLE_NAME, 1], function (error, raw) {
                    callback(error, raw);
                }
            );
        },
        function (raw) {
            raw[0] && (result.push(raw[0]));

            self.conn.query('select ?? from ?? where top=? and del=0 order by id desc',
                [fields, TABLE_NAME, 0], function (error, raw) {
                    result = result.concat(raw);

                    // 处理 ext 数据
                    result.forEach(function (item) {
                        blogUtil.transBlog(item);
                    });

                    cb.apply(this, [error, result]);
                }
            );
        }
    ], function (error) {
        // todo logo
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
        self.adminBlogs(fields, cb);
    } else {
        this.conn.query("select ?? from blog_article where del=0 and `tag` like ?", [fields, "%" + name + "%"], function (err, raw) {
            // 处理日志数据
            raw && raw.length && raw.forEach(function (item) {
                blogUtil.transBlog(item);
            });

            cb(err, raw);
        });
    }
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

    arr.create_time = (new Date).getTime();

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
    
    if (!article.title || !article.content) {
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
                     next(err);
                });
            } else {
                next(null)
            }
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
 * 删除记录
 */

// schema = mongoose.Schema({
//     title: String,
//     author: String,
//     description: String,
//     date: Date,
//     dateStr: String,
//     tags: Array,
//     content: String,
//     bg: {type: String, default: ""},
//     titleBg: {type: String, default: ""},
//     top: {type: Boolean, default: false},
//     draft: {type: Boolean, default: true},
//     series: {type: String, default: ""}
// });



/**
 * 获取排序后的blog列表，用于admin使用
 */
// schema.statics.adminBlogs = function (fileds, cb) {
//     var self = this;

//     self.find({top: false}).select(fileds).sort({date: -1}).exec(function (error, blogs) {
//         if (!error) {
//             self.findOne({top: true}, fileds, function (error, blog) {
//                 if (!error) {
//                     blog && blogs.unshift(blog);
//                 }
//                 cb && cb(error, blogs);
//             });
//         }
//     });
// }

/**
 * 获取置顶的blog数据
 */
// schema.statics.topBlog = function (fileds, cb) {
//     var self = this;

//     fileds = fileds || Blog.Const.MIDDLE_FILEDS;

//     self.findOne({top: true}, fileds, function (error, blog) {
//         cb && cb(error, blog);
//     });
// }

/**
 * blog的详细信息，并包括上一个、下一个的简略信息
 */
// schema.statics.viewBlog = function (id, cb) {
//     var self = this,
//         datas;

//     datas = {};

//     async.waterfall([
//         function (callback) {
//             self.findById(id).exec(function (error, blog) {
//                 datas.blog = blog;

//                 callback(error, blog);
//             });
//         },
//         function (blog, callback) {
//             self.find({_id: {$lt: blog.id}}).select(Blog.Const.MIN_FILEDS).sort({_id: -1}).limit(1).exec(function(error, blogs) {
//                 if (blogs.length > 0) {
//                     datas.pre = blogs[0];
//                 }

//                 callback(error, blog);
//             });
//         },
//         function (blog, callback) {
//             self.find({_id: {$gt: blog.id}}).select(Blog.Const.MIN_FILEDS).sort({_id: 1}).limit(1).exec(function (error, blogs) {
//                 if (blogs.length > 0) {
//                     datas.next = blogs[0];
//                 }

//                 callback(error, blog);
//             });
//         },
//         function (blog, callback) {
//             Blog.findBySeries(blog.series, function (error, blogs) {
//                 datas.seriesBlogs = blogs;
//                 callback(error);
//             });
//         }
//     ], function (error) {
//         error ? cb(error) : cb(error, datas);
//     });
// }

// /**
//  * 通过 tag 获取日志
//  */
// schema.statics.findByTag = function (name, cb) {
//     var self = this,
//         filter;
        
//     if (!name) {
//         Blog.adminBlogs(Blog.Const.MIN_FILEDS, cb);
//         return;
//     } else {
//         filter = {tags: name};
//     }

//     self.find(filter).select(Blog.Const.MIN_FILEDS).sort({date: -1}).exec(function () {
//         cb && cb.apply(this, arguments);
//     });
// }

// /**
//  * 通过 series 获取日志
//  */
// schema.statics.findBySeries = function (name, cb) {
//     var self = this,
//         filter;
        
//     filter = {series: name};

//     self.find(filter).select(Blog.Const.MIN_FILEDS).sort({date: 1}).exec(function () {
//         cb && cb.apply(this, arguments);
//     });
// }

// /**
//  * 置顶blog
//  * @param {string}   id   需要置顶的id
//  * @param {function} [cb] 回调函数
//  */
// schema.statics.setTop = function (id, cb) {
//     var self = this;

//     self.update({top: true}, {top: false}).exec(function (error) {
//         if (!error) {
//             self.update({_id: id}, {$set: {top: true}}).exec(function () {
//                 cb && cb.apply(this, arguments);
//             });
//         }
//     });
// }

// Blog = mongoose.model("Blog", schema);

// Blog.Const = {};
// Blog.Const.MIN_FILEDS = "title series bg tags date description top draft";
// Blog.Const.MIDDLE_FILEDS = "title series author description date tags bg titleBg top draft";
// Blog.Const.FULL_FILEDS = "title series author description date tags bg titleBg content top draft";

module.exports = new Article();