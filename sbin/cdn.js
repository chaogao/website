/**
 * 将静态文件发布到 cdn 上
 */

var UPYun = require('../plugin/upyun').UPYun;

var upyun = new UPYun("website-node", "doudougou0406", "4085903gougou");

var file = require("file");


        file = req.files.image;
        basename = path.basename(file.path);

        if (file.size <= 0 || file.size > 102400 * 10) {
            return res.json({code: -1, msg: "no valid input"});
        }

        buffer = fs.readFileSync(file.path);

        upyun.writeFile("/" + basename, buffer, true, function (error, msg) {
            if (!error) {
                res.json({code: 0, url: YUNDOMAIN + "/" + basename});
            } else {
                console.log(error, msg);
                res.json({code: -1, msg: "server error"});
            }
        });