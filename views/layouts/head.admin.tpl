<!DOCTYPE html>
<html>
    <head>
        <meta charset="utf-8">
        <link rel='stylesheet' href='/public/package/all-admin.less' />
        <title><%= title %></title>
    </head>
    <body>
        <% if (user) { %>
            <a style="float:right" href="/admin/logout"><%=user.name%>, 登出</a>
        <% } %>
        <% include ./components/nav.tpl %>