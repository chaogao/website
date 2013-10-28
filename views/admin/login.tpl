<% include ../layouts/head.admin.tpl %>
    <h1>登入</h1>

    <% if (error) { %>
        <b><%= error %></b>
    <% } %>
    
    <form method="post" action="/admin/login">
        用户名: <input name="user[name]">
        密码: <input name="user[password]" type="password">
        <input type="submit" value="登入">
    </form>
    
<% include ../layouts/footer.tpl %>