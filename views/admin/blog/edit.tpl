<% include ../../layouts/head.admin.tpl %>

<div class="ng-app-content" ng-app="article-create" ng-controller="articleController as article">
    <p class="category-title">添加</p>

    <% if (error) { %>
        <b><%= error %></b>
    <% } %>

    <form class="blog-form" method="post" action="/admin/blog">
        <p>
            <span>标题</span>
            <input name="blog[title]" value="<%= article.title %>" ng-model="article.data.title">
        </p>
        <p>
            <span>描述</span>
            <input name="blog[description]" value="<%= article.description %>" ng-model="article.data.description">
        </p>
        <p>
            <span>主背景</span>
            <input name="blog[bg]" value="<%= article.ext.bg || '' %>" ng-model="article.data.bg">
        </p>
        <p>
            <span>副背景</span>
            <input name="blog[titleBg]" value="<%= article.ext.titleBg || '' %>" ng-model="article.data.titleBg">
        </p>
        <p>
            <span>系列</span>
            <input name="blog[series]" value="">
        </p>
        <p>
            <span>标签</span>
            <span class="tags-container">
                <input type="hidden" name="blog[tags]" value=""/>
            </span>
            <a class="tag-add" href="javascript:void(0)">增加</a>
        </p>
        
        <div class="editor-content">
            <span>正文</span>
            <a id="sync" href="javascript:void(0)">同步</a>
            <a id="upload" href="javascript:void(0)">图片</a>
            <input type="submit" value="提交">
            <div id="editor"></div>
            <textarea class="editor-textarea" style="display:none;" name="blog[content]"><%= article.content %></textarea>
        </div>
    </form>

    <div class="marked-content">
        <p class="dis-article-title">{{article.data.title || '请输入标题'}}</p>

        <div class="dis-description-view">{{article.data.description}}</div>

        <div class="dis-bg-view">
            <p>背景1</p>
            <img src="{{article.data.bg}}">
            <img src="{{article.data.titleBg}}">
        </div>

        <div class="dis-marked-view"></div>
    </div>
</div>


<% include ../../layouts/footer.tpl %>

<script type="text/javascript"></script>

<script src="/public/javascripts/admin/blog/create.js"></script>
<script src="/public/javascripts/admin/index.js"></script>
<script src="/public/libs/ace/src/ace.js"></script>