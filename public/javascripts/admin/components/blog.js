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

    /**
     * 置顶日志
     */
    $(".admin-blog-list").delegate(".admin-blog-top", "click", function () {
        var parent = $(this).parents("p"),
            id = parent.data("id"),
            title = parent.data("title");

        r = window.confirm("确认置顶" + title + "吗？");

        if (r) {
            $.ajax({
                method: "post",
                url: "/admin/blogtop",
                data: {id: id}
            }).done(function (r) {
                if (r.code == 0) {
                    window.location.href = window.location.href;
                }
            });
        };
    });

    /**
     * markdown 同步
     */
    $("#sync").click(function () {
        var val = $(".blog-form textarea").val(),
            html;

        html = marked(val);
        $(".marked-content").html(html);
    });

    /**
     * textarea 自动增长
     */
    $(".blog-form textarea").on("keyup", function () {
        var html = $(this).val(),
            val = $(this).val(),
            height, markedHtml;

        html = html.replace(/\n/g, "</br>");
        html += "</br>";
        height = $(".content-hidden").html(html).height() + 20;
        $(this).css("height", height + "px");

        if ($("#sync-check").prop("checked")) {
            markedHtml = marked(val);
            $(".marked-content").html(markedHtml);
        }
    });

    if ($(".blog-form textarea").val()) {
        $("#sync-check").prop("checked", true);
        $(".blog-form textarea").trigger("keyup");
        $("#sync-check").prop("checked", false);
    }
})();