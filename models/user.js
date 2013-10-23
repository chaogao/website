/**
 * 用户model
 * @model User
 */
var mongoose = require("mongoose"),
    crypto = require("crypto"),
    deferred = require("deferred"),
    Dig = "doudougou", schema, User;

schema = mongoose.Schema({
    name: String,
    password: String,
    root: Boolean
});

schema.statics.validate = function (name, password) {
    var self = this;

    return (function () {
        var dfd = deferred(),
            md5Password = crypto.createHash("md5").update(password).digest(Dig),
            user;

        user = self.find({name: name}, function (erro, user) {
            var result = (user.password == md5Password && !erro) ? true : false;

            dfd.resolve(result);
        });

        return dfd.promise();
    })();
}

schema.methods.saveUser = function (cb) {
    this.password = crypto.createHash("md5").update(this.password).digest(Dig);
    this.save(cb);
}

module.exports = User = mongoose.Model("User", schema);