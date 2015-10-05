var marked = require("markdown");
var hl = require("highlight").Highlight;

/**
 * 日志数据处理工具类
 */
var util = {};


/**
 * 对数据库中取出来的数据进行处理
 */
util.transBlog = function (blog) {
    blog.ext = blog.ext && JSON.parse(blog.ext) || {};
    blog.tag = blog.tag && blog.tag.split(",");

    return blog;
}

util.transMarkdown = function (blog) {
     var html = marked.parse(blog.content);

     html = hl(html, false, true);

     return html;
}


module.exports = util;