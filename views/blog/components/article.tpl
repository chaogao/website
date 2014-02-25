<div class="blog-article">
    <div class="blog-main">
        <div class="blog-article-category" data-spy="affix" data-offset-top="200"></div>
        <div class="blog-article-category-hide"></div>
        <div class="blog-article-content">
            <div class="blog-article-markdown"></div>
            <div class="blog-article-comment">
                <div id="uyan_frame"></div>
                <script type="text/javascript" src="http://v2.uyan.cc/code/uyan.js?uid=1894956"></script>
            </div>
            <div class="blog-article-suggest"></div>
        </div>
    </div>
    <div class="blog-article-cover" data-image="<%= blog.bg %>">
        <div class="bg-wrap"></div>
        <div class="infomation">
            <h2>
                <a href="javascript:void(0);"><%= blog.title %></a>
            </h2>
            <% if (blog.series) { %>
                <p class="series" id="series-tip-target">所属系列：<b><%= blog.series %></b></p>
            <% } %>
            <span class="description">
                <a class="read" style="display:none;" id="action-read" data-id="<%= blog.id %>" href="javascript:void(0);"></a>
                <%= blog.description %>
            </span>
        </div>
    </div>
</div>
<script type="text/javascript">
    window.__data = {
        seriesBlogs: <%- JSON.stringify(seriesBlogs) %>
    };
</script>