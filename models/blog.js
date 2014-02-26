/**
 * @module models/blog
 */

var mongoose = require("mongoose"),
    async = require('async'),
    schema, Blog;

schema = mongoose.Schema({
    title: String,
    author: String,
    description: String,
    date: Date,
    dateStr: String,
    tags: Array,
    content: String,
    bg: {type: String, default: ""},
    titleBg: {type: String, default: ""},
    top: {type: Boolean, default: false},
    draft: {type: Boolean, default: true},
    series: {type: String, default: ""}
});

/**
 * 保存blog
 */
schema.methods.saveBlog = function (cb) {
    this.date = new Date();
    this.dateStr = this.date.toFormat("YYYY-MM-DD HH24:MI:SS");

    if (this.title && this.author && this.content) {
        this.save(cb);
    } else {
        cb({msg: "invalid data", code: 1000});
    }
}

/**
 * 获取排序后的blog列表，用于admin使用
 */
schema.statics.adminBlogs = function (fileds, cb) {
    var self = this;

    self.find({top: false}).select(fileds).sort({date: -1}).exec(function (error, blogs) {
        if (!error) {
            self.findOne({top: true}, fileds, function (error, blog) {
                if (!error) {
                    blog && blogs.unshift(blog);
                }
                cb && cb(error, blogs);
            });
        }
    });
}

/**
 * 获取置顶的blog数据
 */
schema.statics.topBlog = function (fileds, cb) {
    var self = this;

    fileds = fileds || Blog.Const.MIDDLE_FILEDS;

    self.findOne({top: true}, fileds, function (error, blog) {
        cb && cb(error, blog);
    });
}

/**
 * blog的详细信息，并包括上一个、下一个的简略信息
 */
schema.statics.viewBlog = function (id, cb) {
    var self = this,
        datas;

    datas = {};

    async.waterfall([
        function (callback) {
            self.findById(id).exec(function (error, blog) {
                datas.blog = blog;

                callback(error, blog);
            });
        },
        function (blog, callback) {
            self.find({_id: {$lt: blog.id}}).select(Blog.Const.MIN_FILEDS).sort({_id: -1}).limit(1).exec(function(error, blogs) {
                if (blogs.length > 0) {
                    datas.pre = blogs[0];
                }

                callback(error, blog);
            });
        },
        function (blog, callback) {
            self.find({_id: {$gt: blog.id}}).select(Blog.Const.MIN_FILEDS).sort({_id: 1}).limit(1).exec(function (error, blogs) {
                if (blogs.length > 0) {
                    datas.next = blogs[0];
                }

                callback(error, blog);
            });
        },
        function (blog, callback) {
            Blog.findBySeries(blog.series, function (error, blogs) {
                datas.seriesBlogs = blogs;
                callback(error);
            });
        }
    ], function (error) {
        error ? cb(error) : cb(error, datas);
    });
}

/**
 * 通过 tag 获取日志
 */
schema.statics.findByTag = function (name, cb) {
    var self = this,
        filter;
        
    if (!name) {
        filter = {};
    } else {
        filter = {tags: name};
    }

    self.find(filter).select(Blog.Const.MIN_FILEDS).sort({date: -1}).exec(function () {
        cb && cb.apply(this, arguments);
    });
}

/**
 * 通过 series 获取日志
 */
schema.statics.findBySeries = function (name, cb) {
    var self = this,
        filter;
        
    filter = {series: name};

    self.find(filter).select(Blog.Const.MIN_FILEDS).sort({date: 1}).exec(function () {
        cb && cb.apply(this, arguments);
    });
}

/**
 * 置顶blog
 * @param {string}   id   需要置顶的id
 * @param {function} [cb] 回调函数
 */
schema.statics.setTop = function (id, cb) {
    var self = this;

    self.update({top: true}, {top: false}).exec(function (error) {
        if (!error) {
            self.update({_id: id}, {$set: {top: true}}).exec(function () {
                cb && cb.apply(this, arguments);
            });
        }
    });
}

Blog = mongoose.model("Blog", schema);

Blog.Const = {};
Blog.Const.MIN_FILEDS = "title series bg tags date description top draft";
Blog.Const.MIDDLE_FILEDS = "title series author description date tags bg titleBg top draft";
Blog.Const.FULL_FILEDS = "title series author description date tags bg titleBg content top draft";

module.exports = Blog;