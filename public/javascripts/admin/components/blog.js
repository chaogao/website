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
    $(".admin-blog-list").delegate(".admin-article-del", "click", function () {
        var parent = $(this).parents("p"),
            id = parent.data("id"),
            title = parent.data("title");

        r = window.confirm("确认删除" + title + "吗？");

        if (r) {
            $.ajax({
                method: "post",
                url: "/admin/articledelete",
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
    $(".admin-blog-list").delegate(".admin-article-top", "click", function () {
        var parent = $(this).parents("p"),
            id = parent.data("id"),
            title = parent.data("title");

        r = window.confirm("确认置顶" + title + "吗？");

        if (r) {
            $.ajax({
                method: "post",
                url: "/admin/articletop",
                data: {id: id}
            }).done(function (r) {
                if (r.code == 0) {
                    window.location.href = window.location.href;
                }
            });
        };
    });
})();

/**
 * 日志编辑功能
 */
(function () {
    var editor, tag;
    /**
     * markdown 同步
     */
    $("#sync").click(function () {
        var html;

        html = marked(editor.getValue());
        $(".dis-marked-view").html(html);
    });

    /**
     * 初始化ace
     */
    if ($("#editor").length > 0) {
        var val;

        $(".editor-content").height($(window).height());
        $(".dis-marked-view").height($(window).height() - 50);

        editor = ace.edit("editor");
        editor.setTheme("ace/theme/monokai");
        editor.getSession().setMode("ace/mode/markdown");
        editor.setShowPrintMargin(false);
        editor.commands.addCommand({
            name: 'myCommand',
            bindKey: {win: 'Ctrl-S',  mac: 'Command-S'},
            exec: function(editor) {
                $("#sync").click();
            },
            readOnly: true
        });
        editor.getSession().addEventListener("changeScrollTop", function (top) {
            var sHeight = editor.getSession().getLength() * editor.renderer.lineHeight,
                sPer = top / sHeight,
                height, top;

            height = $(".dis-marked-view").get(0).scrollHeight;
            top = height * sPer;
            $(".dis-marked-view").scrollTop(parseInt(top));
        });

        val = $(".blog-form .editor-textarea").val();
        editor.setValue(val);
    }

    $(".blog-form input[type=submit]").on("click", function () {
        var val = editor.getValue();

        $(".blog-form .editor-textarea").val(val);
        $(".blog-form").submit();
        return false;
    });

    /** 新增标签 */
    $(".blog-form .tag-add").on("click", function () {
        if (!tag) {
            tag = new (require("admin/blog/components/tags"))(function (name) {
                $(".blog-form .tags-container").append('<label><input name="blog[tags][]" value="' + name + '"><a class="tag-remove glyphicon glyphicon-remove-circle" href="javascript:void(0)"></a></label>');
            });
        }

        tag.open();
    });

    $(".blog-form .tags-container").on("click", ".tag-remove", function () {
        $(this).parents("label").remove();
    });
})();


/**
 * 上传图片组建
 */
(function () {
    var Dialog = require("jsmod/ui/dialog"),
        Upload, upload;

    Upload = function (option) {
        var html = [
            '<form class="pic-component" method="post" action="/admin/upload" enctype="multipart/form-data" id="pic-component">',
                '图片：<input type="file" name="image">',
                '<input type="hidden" name="blogId" value="' + option.blogId + '">',
                '<button class="submit">提交</button>&nbsp;',
                '<a class="close" href="javascript:void(0)">取消</a></br>',
                '<img height="100" class="pic-component-image">',
                '<p class="info"></p>',
            '</form>'
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

            self.file = file;
            reader = new FileReader();
            reader.onload = function (e) {
                var dataURL = e.target.result;

                self.dialog.content.find(".pic-component-image").prop("src", dataURL);
            }
            reader.readAsDataURL(file);
        });

        self.dialog.content.find(".submit").on("click", function (e) {
            if (self.file && self.file.size <= 102400 * 10 && /image/.test(self.file.type)) {
                self.upload(function (json) {
                    if (!json || json.code) {
                        self.dialog.content.find(".info").html("error");
                    } else {
                        self.dialog.content.find(".info").html("![Alt text](" + json.url + ")");
                    }
                });
            } else {
                alert("图片参数或大小有误重新选择");
            }

            return false;
        });
    }

    $.extend(Upload.prototype, 
        {
            show: function () {
                this.dialog.show();
            },
            hide: function () {
                this.dialog.hide();
            },
            upload: function (cb) {
                var xhr = new XMLHttpRequest(),
                    fd = new FormData($("#pic-component").get(0));

                if (xhr.upload) {
                    xhr.open("POST", "/admin/upload", true);
                    xhr.onreadystatechange = function(e) {
                        if (xhr.readyState == 4) {
                            if (xhr.status == 200) {
                                cb && cb(JSON.parse(xhr.responseText));
                            } else {
                                cb && cb(0);
                            }
                        }
                    };
                    xhr.send(fd);
                }
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