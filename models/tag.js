/**
 * @module models/tag
 */

var Connection = require('../db');

/**
 * 分类 model
 */
var Tag = function (argument) {
    this.conn = Connection.get();
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