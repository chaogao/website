/**
 * 路由通用类
 */
module.exports = {
    /**
     * 显示为 json 数据
     */
    toJson: function (err, raw, res) {
        var ret;

        ret = {
            data: raw,
            errno: 0
        }

        // 如果有错误则返回错误信息
        if (err) {
            // 解析 mysql 错误码
            ret.errno = (-1 && err.errno);
            // 解析 mysql 错误信息
            ret.errmsg = ("server error" && (err.errmsg || err.code));
            ret._errobj_ = err;
        }

        res.json(ret);
    }
}