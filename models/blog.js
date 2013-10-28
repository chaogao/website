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
    online: {}
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
 * 置顶blog
 */
schema.static.setTop = function (id) {
    

}

Blog = mongoose.model("Blog", schema);

Blog.Const = {};
Blog.Const.MIN_FILEDS = "title date";
Blog.Const.MIDDLE_FILEDS = "title author description date tags bg titleBg";
Blog.Const.FULL_FILEDS = "title author description date tags bg titleBg content";

module.exports = Blog;