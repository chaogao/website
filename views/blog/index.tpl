<% include ../layouts/head.tpl %>
    <div class="blog-index-content">
        <ul class="blog-index-nav mod-tab">
            <div class="mod-tab-item mod-tab-item-active">
                all
            </div>
            <% tags.forEach(function (tag) { %>
                <div  data-tag="<%= tag.name %>" class="mod-tab-item">
                    <%= tag.name %>
                </div>
            <% }) %>
        </ul>
        <div class="blog-index-list"></div>
    </div>
<% include ../layouts/footer.tpl %>
<script src="/public/javascripts/blog/index.js"></script>