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
</div>