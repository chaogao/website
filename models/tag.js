/**
 * @module models/tag
 */
var Connection = require('../db');
var async = require("async");

var TABLE_NAME = 'blog_tag';

/**
 * 分类 model
 */
var Tag = function (argument) {
    this.conn = Connection.get();
}

/**
 * 修改 tag 中存储日志的个数
 */
Tag.prototype.modfityCount = function (tags, count, cb) {
    this.conn.query("update blog_tag set count = count + ? where name in (?)", [count, tags], function (err, raw) {
        cb(err, raw);
    });
}


/**
 * 增加一批 tag 
 */
Tag.prototype.addTags = function (tags, cb) {
    var notExsitTags = [];

    var createTime = (new Date).getTime();

    var self = this;

    async.waterfall([
        function (next) {
            // 查询出来需要添加的 tag 集合
            self.conn.query("select id, name from blog_tag where name in (?)", [tags], function (err, raw) {
                if (!err) {
                    console.log(raw);
                    notExsitTags = tags.filter(function (name) {
                        var insert = 1;

                        raw.forEach(function (item) {

                            if (item.name == name) {
                                insert = 0;
                            }
                        });
                        return insert;
                    });

                    notExsitTags = notExsitTags.map(function (name) {
                        var fields = [name, createTime];

                        return fields;
                    });
                }

                // console.log(notExsitTags);

                next(err, notExsitTags);
            });
        },
        // 添加需要增加的 tag
        function (tags) {
            if (tags.length > 0) {
                self.conn.query("insert into blog_tag (name, create_time) values ?", [tags], function (err, raw) {
                    cb(err, tags);
                });
            } else {
                // 没有要增加的 tag
                cb(undefined, []);
            }
        }
    ], function (err) {
        cb(err);
    });
}

/**
 * 查询 tag
 * @param  {[type]} id 查询的 id 如果不传则查询全部
 * @return {[type]}    [description]
 */
Tag.prototype.find = function (id, cb) {
    this.conn.query("select * from blog_tag", function (err, raw) {
        cb.apply(this, arguments);
    });
}

/**
 * 保存blog
 */
// schema.methods.saveTag = function (cb) {
//     var self = this;

//     self.date = new Date();

//     if (this.name) {
//         Tag.count({name: this.name}, function (err, count) {
//             if (err) {
//                 console.log({msg: "count error", code: 1001});
//             } else {
//                 if (count == 0) {
//                     self.save(cb);
//                 } else {
//                     cb && cb();
//                 }
//             }
//         });
//     } else {
//         cb && cb({msg: "invalid data", code: 1000});
//     }
// }

// Tag = mongoose.model("Tag", schema);

module.exports = new Tag();