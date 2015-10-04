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

module.exports = util;