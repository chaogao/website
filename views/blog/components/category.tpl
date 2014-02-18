<div class="blog-category clearfix">
    <div class="blog-category-content">
        <ul class="blog-category-list">
            <li class="blog-category-item">
                all
                <span data-tag="" class="description">所有的文章</span>
            </li>
            <% tags.forEach(function (tag) { %>
                <li  data-tag="<%= tag.name %>" class="blog-category-item">
                    <%= tag.name %>
                    <span class="description"><%= tag.name %></span>
                </li>
            <% }) %>
        </ul>
    </div>
</div>