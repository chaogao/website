/**
 * @module models/tag
 */
var Connection = require('../db');
var async = require("async");

var TABLE_NAME = 'blog_category';

var FIELDS = ["id", "name", "fid", "count"];

/**
 * 分类 model
 */
var Category = function (argument) {
    this.conn = Connection.get();
}

/**
 * 修改 tag 中存储日志的个数
 */
Category.prototype.findAll = function (cb) {
    var self = this;

    this.conn.query("select ?? from ??", [FIELDS, TABLE_NAME], function (err, raw) {
        cb(err, raw);
    });  
}

/**
 * 通过 id 进行查询
 */
Category.prototype.findById = function (id, cb) {
    this.conn.query("select ?? from ?? where id=?", [FIELDS, TABLE_NAME, id], function (err, raw) {
        cb(err, raw);
    });
}

/**
 * 增加分类
 */
Category.prototype.addCategory = function (name, cb) {
    var data = {
        name: name,
        create_time: (new Date).getTime()
    };

    this.conn.query("insert into ?? set ?", [TABLE_NAME, data], function (err, raw) {
        cb(err, raw);
    });
}

/**
 * 修改数据
 */
Category.prototype.modfityCount = function (id, count, cb) {
    this.conn.query("update ?? set count = count + ? where id=?", [TABLE_NAME, count, id], function (err, raw) {
        cb(err, raw);
    });
}


module.exports = new Category();