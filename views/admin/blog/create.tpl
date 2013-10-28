<% include ../../layouts/head.admin.tpl %>
    <h1>添加</h1>

    <% if (error) { %>
        <b><%= error %></b>
    <% } %>

    <form method="post" action="/admin/blog">
        title: <input name="blog[title]"></br>
        description: <input name="blog[description]"></br>
        bg: <input name="blog[bg]"></br>
        content: <textarea name="blog[content]"></textarea></br>
        <input type="submit" value="提交">
    </form>

<% include ../../layouts/footer.tpl %>