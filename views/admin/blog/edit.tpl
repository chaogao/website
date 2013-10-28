<% include ../../layouts/head.admin.tpl %>
    <h1>编辑</h1>

    <% if (error) { %>
        <b><%= error %></b>
    <% } %>

    <form method="post" action="/admin/blogupdate">
        title: <input name="blog[title]" value="<%= blog.title %>"></br>
        description: <input name="blog[description]" value="<%= blog.description %>"></br>
        bg: <input name="blog[bg]" value="<%= blog.bg %>"></br>
        content: <textarea name="blog[content]"><%= blog.content %></textarea></br>
        <input type="hidden" name="blog[id]" value="<%= blog.id %>">
        <input type="submit" value="提交">
    </form>

<% include ../../layouts/footer.tpl %>