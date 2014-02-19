<!DOCTYPE html>
<html>
    <head>
        <meta charset="utf-8" />
        <meta content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=0;" name="viewport" />
        <meta conent="yes" name="apple-mobile-web-app-capable" />
        <meta content="black" name="apple-mobile-web-app-status-bar-style" />
        <meta content="telephone=no" name="format-detection" />
        <meta content="email=no" name="format-detection" />
        <link rel='stylesheet' href='/public/package/all-blog.less' />
        <title><%= title %></title>
    </head>
    <body>
        <% if (user) { %>
            <a style="float:right" href="/admin/logout"><%=user.name%>, 登出</a>
        <% } %>
        <% include ./components/nav.tpl %>