/**
 * 日志的控制
 */

/**
 * 删、置顶功能
 */
(function () {
    /**
     * 删除日志
     */
    $(".admin-blog-list").delegate(".admin-blog-del", "click", function () {
        var parent = $(this).parents("p"),
            id = parent.data("id"),
            title = parent.data("title");

        r = window.confirm("确认删除" + title + "吗？");

        if (r) {
            $.ajax({
                method: "post",
                url: "/admin/blogdelete",
                data: {id: id}
            }).done(function (r) {
                if (r.code == 0) {
                    window.location.href = window.location.href;
                }
            });
        };
    });
})();