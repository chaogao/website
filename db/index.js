/**
 * 初始化mongodb连接
 */
var conf = require("./conf"),
    mongoose = require("mongoose");

module.exports = (function() {
    return mongoose.connect("mongodb://" + conf.user + ":" + conf.pass + "@" + conf.host + "/" + conf.db);
})();