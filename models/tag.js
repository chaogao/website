/**
 * @module models/tag
 */

var mongoose = require("mongoose"),
    schema, Tag;

schema = mongoose.Schema({
    name: {type: String, default: ""},
    date: {type: Date}
});

/**
 * 保存blog
 */
schema.methods.saveTag = function (cb) {
    var self = this;

    self.date = new Date();

    if (this.name) {
        Tag.count({name: this.name}, function (err, count) {
            if (err) {
                console.log({msg: "count error", code: 1001});
            } else {
                if (count == 0) {
                    self.save(cb);
                } else {
                    cb && cb();
                }
            }
        });
    } else {
        cb && cb({msg: "invalid data", code: 1000});
    }
}

Tag = mongoose.model("Tag", schema);

module.exports = Tag;