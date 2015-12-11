var marked = require("markdown");
var hl = require("highlight").Highlight;

/**
 * 计算行数
 */
function count_lines( str ) {
	var n = 0, i = -1;
	while ( ( i = str.indexOf("\n", i + 1) ) !== -1 ) n++;
	return n;
}

/**
 * 获取行数之前的字符
 */ 
function getLineStr (str, line) {
	var n = 0, i = -1;
	while ( ( i = str.indexOf("\n", i + 1) ) !== -1 && n <= line ) n++;

	return str.slice(0, i);
}

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
    blog.create_time = new Date(blog.create_time * 1000);

    return blog;
}

util.transMarkdown = function (blog) {
     var html = marked.parse(blog.content);

     html = hl(html, false, true);

     return html;
}

util.transLiteMarkdown = function (blog) {
	var str = blog.content,
		count;

	str = str.replace(/(\r\n|\n|\r)/g, "\n");

	count = count_lines(str);

	if (count > 5) {
		str = getLineStr(str, 5);
	}

	var html = marked.parse(str);

    html = hl(html, false, true);

    return html;
}


module.exports = util;