<% include ../../layouts/head.admin.tpl %>
    <h2>列表</h2>

    <div class="admin-blog-list">
        <% articles.forEach(function(article) { %>
            <p data-id="<%= article.id %>" data-title="<%= article.title %>">
                <% if (article.top) { %>
                    <span class="top">【顶】</span>
                <% } %>
                <% if (article.draft) { %>
                    <span class="draft">【草】</span>
                <% } %>
                <a class="title" href="/admin/article/<%= article.id %>"><%= article.title %></a>
                <span class="time"><%= article.update_time %></span>
                <span class="actions">
                    <a class="admin-article-top" href="javascript:void(0)">置顶</a>
                    <a class="admin-article-del" href="javascript:void(0)">删除</a>
                </span>
            </p>
        <% }) %>
    </div>

    <h2>操作</h2>
    <a href="/admin/blog/create">增加日志</a>

    <h2>Tags</h2>
    
<% include ../../layouts/footer.tpl %>
<script src="/public/javascripts/admin/index.js"></script>