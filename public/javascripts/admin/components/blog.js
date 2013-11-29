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


/**
 * 上传图片组建
 */
(function () {
    var Dialog = require("jsmod/ui/dialog"),
        Upload, upload;

    Upload = function (option) {
        var html = [
            '<div class="pic-component">',
                '图片：<input type="file" name="image">',
                '<input type="hidden" name="blogId" value="' + option.blogId + '">',
                '<a class="submit" href="javascript:void(0)">提交</a>&nbsp;',
                '<a class="close" href="javascript:void(0)">取消</a></br>',
                '<img height="100" class="pic-component-image">',
            '</div>'
        ].join(""), self = this;

        self.dialog = new Dialog({
            html: html
        });

        self.dialog.content.find(".close").click(function () {
            self.hide();
        });

        self.dialog.content.find("[name=image]").on("change", function (e) {
            var file = e.target.files[0],
                reader;

            reader = new FileReader();
            reader.onload = function (e) {
                var dataURL = e.target.result;

                self.dialog.content.find(".pic-component-image").prop("src", dataURL);
            }
            reader.readAsDataURL(file);
        })
    }

    $.extend(Upload.prototype, 
        {
            show: function () {
                this.dialog.show();
            },
            hide: function () {
                this.dialog.hide();
            }
        }
    );

    $("#upload").click(function () {
        if (!upload) {
            upload = new Upload({
                blogId: $(".blog-form").find("[name='blog[id]']").val()
            });
        }

        upload && upload.show();
    });
})();