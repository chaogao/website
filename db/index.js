var mysql = require('mysql');
var conn;

var Connection = {
    create: function (conf) {
        conn = mysql.createPool({
            host     : conf.host,
            user     : conf.user,
            password : conf.pass,
            database : conf.db
        });

        this.listen(conn);
    },
    get: function () {
        return conn;
    },
    /**
     * 连接的监听
     * @param  {[type]} conn [description]
     * @return {[type]}      [description]
     */
    listen: function (conn) {
        conn.on('connection', function (connection) {
            console.log('etabish connection');
        });

        conn.on('enqueue', function () {
          console.log('Waiting for available connection slot');
        });
    }
}

module.exports = Connection;