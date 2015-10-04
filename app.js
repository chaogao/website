// 建立 mysql 链接
var Connection = require('./db');
Connection.create();

var express = require('express'),
    flash = require("connect-flash"),
    blog = require('./routes/blog'),
    admin = require('./routes/admin'),
    http = require('http'),
    path = require('path'),
    conf = require("./db/conf"),
    swig = require("swig"),
    app, fs, accessLog, errorLog;

// 设置日志路径
fs = require("fs");
accessLog = fs.createWriteStream('access.log', {flags: 'a'});
errorLog = fs.createWriteStream('error.log', {flags: 'a'});

app = express();

// 设置模板类型
app.engine('html', swig.renderFile);
app.set('view engine', 'html');
app.set('views', __dirname + '/views');
app.set('view cache', false);
swig.setDefaults({ cache: false });

// 端口设置
app.set('port', process.env.PORT || 3000);

// cookie session flash 设置
app.use(express.cookieParser());
app.use(express.session({
    secret: conf.cookieSecret,
    cookie: {maxAge: 1000 * 60 * 60 * 24 * 30}
}));
app.use(flash());
app.use(function (req, res, next) {
    res.locals.user = req.session.user;
    next();
});

// 基本设置
app.use(express.favicon());
app.use(express.logger({stream: accessLog}));

// 上传服务设置
app.use(express.bodyParser(
    {
        uploadDir: "./public/upload",
        keepExtensions: true
    }
));
app.use(express.methodOverride());

// development only
// if ('development' == app.get('env')) {
    app.use(express.errorHandler());
    app.use("/public", express.static(__dirname + '/public'));
// }

// 路由
app.use(app.router);

// access log
app.use(function (err, req, res, next) {
    var meta = '[' + new Date() + '] ' + req.url + '\n';

    if (err) {
        errorLog.write(meta + err.stack + '\n');
        console.error(meta + err.stack + '\n');
    } else {
        accessLog.write(meta + '\n');
    }

    next();
});

blog.init(app);
admin.init(app);

app.get("*", function (req, res, next) {
    res.status(404).render("404.tpl");
});

http.createServer(app).listen(app.get('port'), function(){
    console.log('Express server listening on port ' + app.get('port'));
});