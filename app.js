
/**
 * Module dependencies.
 */

var express = require('express'),
    flash = require("connect-flash"),
    blog = require('./routes/blog'),
    admin = require('./routes/admin'),
    http = require('http'),
    path = require('path'),
    MongoStore = require('connect-mongo')(express),
    conf = require("./db/conf"),
    app, fs, accessLog, errorLog;

fs = require("fs");
accessLog = fs.createWriteStream('access.log', {flags: 'a'});
errorLog = fs.createWriteStream('error.log', {flags: 'a'});
require("./db");

app = express();
app.engine('tpl', require('ejs').renderFile);

// all environments
app.set('port', process.env.PORT || 3000);
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');
app.use(express.cookieParser());
app.use(express.session({
    secret: conf.cookieSecret,
    cookie: {maxAge: 1000 * 60 * 60 * 24 * 30},
    store: new MongoStore({
        db: conf.db,
        host: conf.host,
        username: conf.user,
        password: conf.pass
    })
}));
app.use(flash());
app.use(express.favicon());
app.use(express.logger({stream: accessLog}));
app.use(express.bodyParser(
    {
        uploadDir: "./public/upload",
        keepExtensions: true
    }
));
app.use(express.methodOverride());
app.use(function (req, res, next) {
    res.locals.user = req.session.user;
    next();
});
// development only
if ('development' == app.get('env')) {
    app.use(express.errorHandler());
    app.use("/public", express.static(__dirname + '/public'));
}
app.use(app.router);
// app.use(function (err, req, res, next) {
//     var meta = '[' + new Date() + '] ' + req.url + '\n';
//     errorLog.write(meta + err.stack + '\n');
//     next();
// });

blog.init(app);
admin.init(app);

app.get("*", function (req, res, next) {
    res.status(404).render("404.tpl");
});

http.createServer(app).listen(app.get('port'), function(){
    console.log('Express server listening on port ' + app.get('port'));
});