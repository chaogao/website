
/**
 * Module dependencies.
 */

var express = require('express'),
    flash = require("connect-flash"),
    blog = require('./routes/blog'),
    admin = require('./routes/admin'),
    http = require('http'),
    path = require('path'),
    app;

require("./db");

app = express();
app.engine('tpl', require('ejs').renderFile);

// all environments
app.set('port', process.env.PORT || 3000);
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');
app.use(flash());
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.bodyParser());
app.use(express.methodOverride());
app.use(app.router);

// development only
if ('development' == app.get('env')) {
    app.use(express.errorHandler());
    app.use("/public", express.static(__dirname + '/public'));
}

blog.init(app);
admin.init(app);

http.createServer(app).listen(app.get('port'), function(){
    console.log('Express server listening on port ' + app.get('port'));
});