/**
 * @module models/blog
 */

var mongoose = require("mongoose"),
    schema, Blog;

schema = mongoose.Schema({
    title: String,
    author: String,
    description: String,
    date: Date,
    tags: Array,
    content: String,
    bg: String,
    titleBg: String,
    top: {type: Boolean, default: false},
    draft: {type: Boolean, default: true}
});

/**
 * 保存blog
 */
schema.methods.saveBlog = function (cb) {
    this.date = new Date();
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
 * 置顶blog
 * @param {string}   id   需要置顶的id
 * @param {function} [cb] 回调函数
 */
schema.statics.setTop = function (id, cb) {
    var self = this;

    self.update({top: true}, {top: false}).exec(function (error) {
        if (!error) {
            self.update({_id: id}, {$set: {top: true}}).exec(function () {
                debugger;
                cb && cb.apply(this, arguments);
            });
        }
    });
}

Blog = mongoose.model("Blog", schema);

Blog.Const = {};
Blog.Const.MIN_FILEDS = "title date top draft";
Blog.Const.MIDDLE_FILEDS = "title author description date tags bg titleBg top draft";
Blog.Const.FULL_FILEDS = "title author description date tags bg titleBg content top draft";

module.exports = Blog;