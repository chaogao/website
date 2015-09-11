/**
 * 用户model
 * @model User
 */
var crypto = require("crypto"),
    deferred = require("deferred"),
    Dig = "hex";

var Connection = require('../db');

var User = function () {
    this.conn =  Connection.get();
}

User.prototype.validate = function (name, password) {
    var self = this;

    return (function () {
        var dfd = deferred(),
            md5Password = crypto.createHash("md5").update(password).digest(Dig),
            user;

        console.log(md5Password);

        self.conn.query('select * from blog_user where name = ?', [name], function (error, raw) {
            var result = (!error && raw[0] && raw[0].passport == md5Password) ? true : false;

            dfd.resolve({valid: result, user: raw[0]});
        });

        return dfd.promise();
    })();
}

/**
 * 存储由前端传入的用户信息
 * @param  {[type]}   user [description]
 * @param  {Function} cb   [description]
 * @return {[type]}        [description]
 */
User.prototype.saveUser = function (user, cb) {
    var passport = crypto.createHash("md5").update(user.password).digest(Dig);

    this.conn.query("INSERT INTO blog_user SET ? ", {
        name: user.name,
        passport: passport,
        create_time: (new Date()).getTime()
    }, function (error, raw) {
        cb.apply(this, arguments);
    });
}

module.exports = new User();