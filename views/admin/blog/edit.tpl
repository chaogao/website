<% include ../../layouts/head.admin.tpl %>
    <h1>编辑</h1>

    <% if (error) { %>
        <b><%= error %></b>
    <% } %>

    <form class="blog-form" method="post" action="/admin/blogupdate">
        <p>
            <span>标题</span>
            <input name="blog[title]" value="<%= blog.title %>">
        </p>
        <p>
            <span>描述</span>
            <input name="blog[description]" value="<%= blog.description %>">
        </p>
        <p>
            <span>主背景</span>
            <input name="blog[bg]" value="<%= blog.bg %>">
        </p>
        <p>
            <span>副背景</span>
            <input name="blog[titleBg]" value="<%= blog.titleBg %>">
        </p>
        <p>
            <span>系列</span>
            <input name="blog[series]" value="<%= blog.series %>">
        </p>
        <p>
            <span>标签</span>
            <span class="tags-container">
                <input type="hidden" name="blog[tags]" value=""/>
                <% blog.tags.forEach(function(tag) { %>
                    <label>
                        <input name="blog[tags][]" value="<%= tag %>"/>
                        <a class="tag-remove glyphicon glyphicon-remove-circle" href="javascript:void(0)"></a>
                    </label>
                <% }) %>
            </span>
            <a class="tag-add" href="javascript:void(0)">增加</a>
        </p>

        <div class="editor-content">
            <span>正文</span>
            <a id="sync" href="javascript:void(0)">同步</a>
            <a id="upload" href="javascript:void(0)">图片</a>
            <input type="submit" value="提交">
            <div id="editor"></div>
            <textarea class="editor-textarea" style="display:none;" name="blog[content]"><%= blog.content %></textarea>
        </div>

        <input type="hidden" name="blog[id]" value="<%= blog.id %>">
    </form>

    <div class="marked-content"></div>

<% include ../../layouts/footer.tpl %>
<script src="/public/libs/ace/src/ace.js"></script>
<script src="/public/javascripts/admin/index.js"></script>