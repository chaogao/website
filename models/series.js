/**
 * @module models/serise
 */

var mongoose = require("mongoose"),
    schema, Serise;

schema = mongoose.Schema({
    name: {type: String, default: ""},
    date: {type: Date}
});

/**
 * 保存blog
 */
schema.methods.saveSeries = function (cb) {
    var self = this;

    self.date = new Date();

    if (this.name) {
        Serise.count({name: this.name}, function (err, count) {
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

Serise = mongoose.model("Serise", schema);

module.exports = Serise;