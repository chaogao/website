fis.config.merge({
    modules : {
        parser : {
            less : 'less'
        }
    },
    roadmap : {
        ext : {
            less : 'css'
        },
        path : [
            {
                reg : /^\/views\/(.*\.ejs)/i,
                release : '/views/$1',
                useCompil: true,
                useMap: true,
                isHtmlLike: true,
                isJsLike: true,
                isCssLike: true,
            },
            {
                reg : /^\/public\/(.*\..*)$/i,
                release : '/public/$1',
                useCache: false
            },
            {
                reg : /^\/public\/(.*\..*)$/i,
                release : '/public/$1',
                useCache: false
            },
            {
                reg : /^\/(db|node_modules|routes|app.js|models|plugin)/i,
                useCompile: false,
                isHtmlLike: false,
                isJsLike: false,
                isCssLike: false,
                useHash: false,
                useDomain: false,
                useMap: false,
                useSprite: false
            }
        ]
    }
});
