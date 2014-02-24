<div class="blog-category-content">
    <div class="arrow-left">
        <a class="glyphicon glyphicon-circle-arrow-left" href="javascript:void(0)"></a>
    </div>
    <div class="arrow-right">
        <a class="glyphicon glyphicon-circle-arrow-right" href="javascript:void(0)"></a>
    </div>
    <div class="blog-category clearfix">
        <div class="blog-category-item">
            all
            <span data-tag="" class="description">所有的文章</span>
        </div>
        <% tags.forEach(function (tag) { %>
            <div  data-tag="<%= tag.name %>" class="blog-category-item">
                <%= tag.name %>
                <span class="description"><%= tag.name %></span>
            </div>
        <% }) %>
        <div class="blog-category-item blog-category-item-none">
            none
            <span data-tag="" class="description">没有更多了</span>
        </div>
    </div>
</div>