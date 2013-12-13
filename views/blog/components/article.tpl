<div class="blog-article">
    <div class="blog-article-category" data-spy="affix" data-offset-top="200"></div>
    <div class="blog-article-content"></div>
    <div class="blog-article-suggest"></div>
    <div class="blog-article-cover" data-image="<%= blog.bg %>">
        <div class="bg-wrap"></div>
        <div class="infomation">
            <h2><a href="javascript:void(0);"><%= blog.title %></a></h2>
            <span class="description"><%= blog.description %></span>
        </div>
        <a class="read" style="display:none;" id="action-read" data-id="<%= blog.id %>" href="javascript:void(0);"></a>
    </div>
</div>