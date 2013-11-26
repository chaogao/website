<% include ../../layouts/head.admin.tpl %>
    <h2>列表</h2>

    <div class="admin-blog-list">
        <% blogs.forEach(function(blog) { %>
            <p data-id="<%= blog.id %>" data-title="<%= blog.title %>">
                <% if (blog.top) { %>
                    <span class="top">【顶】</span>
                <% } %>
                <% if (blog.draft) { %>
                    <span class="draft">【草】</span>
                <% } %>
                <a class="title" href="/admin/blog/<%= blog.id %>"><%= blog.title %></a>
                <span class="time"><%= blog.dateStr %></span>
                <span class="actions">
                    <a class="admin-blog-top" href="javascript:void(0)">置顶</a>
                    <a class="admin-blog-del" href="javascript:void(0)">删除</a>
                </span>
            </p>
        <% }) %>
    </div>

    <h2>操作</h2>
    <a href="/admin/blog/create">增加日志</a>

    <h2>Tags</h2>
    
<% include ../../layouts/footer.tpl %>
<script src="/public/javascripts/admin/index.js"></script>