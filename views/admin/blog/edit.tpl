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
            <span>正文</span>
            <textarea name="blog[content]"><%= blog.content %></textarea>
            <div class="content-hidden" style="display:none;"></div>
        </p>

        <input type="submit" value="提交">
        <a id="sync" href="javascript:void(0)">同步</a>
        <span>实时</span><input class="sync-check" type="checkbox" id="sync-check"/>

        <input type="hidden" name="blog[id]" value="<%= blog.id %>">
    </form>

    <div class="marked-content"></div>

<% include ../../layouts/footer.tpl %>
<script src="/public/javascripts/admin/index.js"></script>