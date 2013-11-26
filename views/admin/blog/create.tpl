<% include ../../layouts/head.admin.tpl %>
    <p class="category-title">添加</p>

    <% if (error) { %>
        <b><%= error %></b>
    <% } %>

    <form class="blog-form" method="post" action="/admin/blog">
        <p>
            <span>标题</span>
            <input name="blog[title]">
        </p>
        <p>
            <span>描述</span>
            <input name="blog[description]">
        </p>
        <p>
            <span>主背景</span>
            <input name="blog[bg]">
        </p>
        <p>
            <span>副背景</span>
            <input name="blog[titleBg]">
        </p>

        <p>
            <span>正文</span>
            <textarea name="blog[content]"></textarea>
            <div class="content-hidden" style="display:none;"></div>
        </p>

        <input type="submit" value="提交">
        <a id="sync" href="javascript:void(0)">同步</a>
        <span>实时</span><input class="sync-check" type="checkbox" id="sync-check"/>
    </form>

    <div class="marked-content"></div>

<% include ../../layouts/footer.tpl %>
<script src="/public/javascripts/admin/index.js"></script>