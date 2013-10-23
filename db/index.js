/**
 * 初始化mongodb连接
 */
var conf = require("./conf"),
    mongoose = require("mongoose");

module.exports = (function() {
    return mongoose.connect(conf.host);
})();