CREATE TABLE `blog_tag` (
    `id` bigint(10) unsigned NOT NULL AUTO_INCREMENT COMMENT '主键 id',
    `name` varchar(32) NOT NULL COMMENT 'tag 名称',
    `create_time` int(11) NOT NULL COMMENT '创建时间',
    `update_time` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',

    PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8 COMMENT='日志 tag';


CREATE TABLE `blog_user` (
    `id` bigint(10) unsigned NOT NULL AUTO_INCREMENT COMMENT '主键 id',
    `name` varchar(32) NOT NULL COMMENT 'tag 名称',
    `passport` int(11) NOT NULL COMMENT '创建时间',
    `create_time` int(11) NOT NULL COMMENT '创建时间',
    `update_time` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',

    PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8 COMMENT='管理员';

CREATE TABLE `blog_article` (
    `id` bigint(10) unsigned   NOT NULL AUTO_INCREMENT COMMENT 'primary id',
    `title` varchar(128)       NOT NULL                COMMENT 'the article title',
    `author` varchar(32)       NOT NULL DEFAULT ''     COMMENT 'the article author',
    `description` text         NOT NULL DEFAULT ''     COMMENT 'the article description',
    `content` text             NOT NULL                COMMENT 'the article content',
    `draft` int(2)             NOT NULL DEFAULT 0      COMMENT 'is the article draft',
    `top` int(2)               NOT NULL DEFAULT 0      COMMENT 'is the article top',
    `series_id` bigint(10)                             COMMENT 'is the article top',
    `series_name` varchar(128),

    `ext` varchar(2048)        NOT NULL DEFAULT ''     COMMENT 'the article ext config',
    `create_time` int(11)      NOT NULL                COMMENT 'the article create_time',
    `update_time` timestamp    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',

    PRIMARY KEY (`id`),
    KEY `top_index` (`top`),
    KEY `draft_index` (`draft`)
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8 COMMENT='article';



schema = mongoose.Schema({
    title: String,
    author: String,
    description: String,
    date: Date,
    dateStr: String,
    tags: Array,
    content: String,
    bg: {type: String, default: ""},
    titleBg: {type: String, default: ""},
    top: {type: Boolean, default: false},
    draft: {type: Boolean, default: true},
    series: {type: String, default: ""}
});



ALTER TABLE blog_user DROP COLUMN `transfer_amount_log` 
varchar(32) NOT NULL DEFAULT '' COMMENT '用户密码';