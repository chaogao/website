<% include ../layouts/head.admin.tpl %>
    <h1>管理员添加</h1>

    <form method="post" action="/admin/add">
        用户名: <input name="user[name]">
        密码: <input name="user[password]" type="password">
        <input type="submit" value="登入">
    </form>
<% include ../layouts/footer.tpl %>