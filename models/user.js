/**
 * 用户model
 * @model User
 */
var mongoose = require("mongoose"),
    crypto = require("crypto"),
    deferred = require("deferred"),
    Dig = "hex", schema, User;

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

        console.log(md5Password);

        user = self.findOne({name: name}, function (erro, user) {
            var result = (!erro && user && user.password == md5Password) ? true : false;

            dfd.resolve({valid: result, user: user});
        });

        return dfd.promise();
    })();
}

schema.methods.saveUser = function (cb) {
    this.password = crypto.createHash("md5").update(this.password).digest(Dig);
    this.save(cb);
}

module.exports = User = mongoose.model("User", schema);