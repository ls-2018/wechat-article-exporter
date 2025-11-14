-- MySQL Database Schema for WeChat Article Exporter
-- Database: wechat_exporter

-- API调用记录表
CREATE TABLE IF NOT EXISTS api_calls (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL COMMENT 'API名称: searchbiz, appmsgpublish',
    account VARCHAR(100) NOT NULL COMMENT '公众号账号',
    call_time BIGINT NOT NULL COMMENT '调用时间戳',
    is_normal BOOLEAN DEFAULT TRUE COMMENT '是否正常调用',
    payload JSON COMMENT '请求参数',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_account_call_time (account, call_time),
    INDEX idx_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='API调用记录表';

-- 文章表
CREATE TABLE IF NOT EXISTS articles (
    id VARCHAR(255) PRIMARY KEY COMMENT 'fakeid:aid 作为主键',
    fakeid VARCHAR(100) NOT NULL COMMENT '公众号ID',
    aid VARCHAR(100) NOT NULL COMMENT '文章ID',
    title text COMMENT '文章标题',
    digest text COMMENT '文章摘要',
    link VARCHAR(1000) NOT NULL COMMENT '文章链接',
    cover VARCHAR(1000) COMMENT '封面图片',
    cover_img_theme_color JSON COMMENT '封面主题色',
    author_name VARCHAR(200) COMMENT '作者名称',
    create_time BIGINT NOT NULL COMMENT '创建时间戳',
    copyright_stat INT DEFAULT 0 COMMENT '版权状态',
    copyright_type INT DEFAULT 0 COMMENT '版权类型',
    is_deleted BOOLEAN DEFAULT FALSE COMMENT '是否已删除',
    is_pay_subscribe BOOLEAN DEFAULT FALSE COMMENT '是否付费订阅',
    item_show_type INT DEFAULT 0 COMMENT '展示类型',
    media_duration VARCHAR(50) COMMENT '媒体时长',
    mediaapi_publish_status INT DEFAULT 0 COMMENT '发布状态',
    checking INT DEFAULT 0 COMMENT '审核状态',
    ban_flag INT DEFAULT 0 COMMENT '封禁标志',
    has_red_packet_cover INT DEFAULT 0 COMMENT '红包封面',
    album_id VARCHAR(100) COMMENT '专辑ID',
    appmsg_album_infos JSON COMMENT '专辑信息',
    content LONGTEXT COMMENT '文章内容',
    html_content LONGTEXT COMMENT 'HTML内容',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_fakeid_create_time (fakeid, create_time),
    INDEX idx_link (link(255)),
    INDEX idx_create_time (create_time),
    INDEX idx_fakeid (fakeid)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='文章表';

-- 资源文件表（图片、视频等）
CREATE TABLE IF NOT EXISTS assets (
    id BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '资源ID',
    url VARCHAR(1000) NOT NULL COMMENT '资源URL',
    fakeid VARCHAR(100) NOT NULL COMMENT '公众号ID',
    file_type VARCHAR(50) DEFAULT 'image' COMMENT '文件类型',
    file_size BIGINT COMMENT '文件大小',
    file_data LONGBLOB COMMENT '文件二进制数据',
    file_hash VARCHAR(64) COMMENT '文件哈希值',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uk_url (url(255)),
    INDEX idx_fakeid (fakeid),
    INDEX idx_file_hash (file_hash)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='资源文件表';

-- 评论表
CREATE TABLE IF NOT EXISTS comments (
    id BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '评论ID',
    url VARCHAR(1000) NOT NULL COMMENT '评论URL',
    fakeid VARCHAR(100) NOT NULL COMMENT '公众号ID',
    title text COMMENT '文章标题',
    data JSON COMMENT '评论数据',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uk_url (url(255)),
    INDEX idx_fakeid (fakeid)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='评论表';

-- 评论回复表
CREATE TABLE IF NOT EXISTS comment_replies (
    id BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '评论回复ID',
    url VARCHAR(1000) NOT NULL COMMENT '评论URL',
    contentID VARCHAR(100) NOT NULL COMMENT '内容ID',
    fakeid VARCHAR(100) NOT NULL COMMENT '公众号ID',
    reply_data JSON COMMENT '回复数据',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uk_url_contentid (url(255), contentID),
    INDEX idx_url (url(255)),
    INDEX idx_fakeid (fakeid),
    INDEX idx_contentid (contentID)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='评论回复表';

-- 调试信息表
CREATE TABLE IF NOT EXISTS debug_info (
    id BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '调试信息ID',
    url VARCHAR(1000) NOT NULL COMMENT '调试URL',
    fakeid VARCHAR(100) NOT NULL COMMENT '公众号ID',
    type VARCHAR(50) NOT NULL COMMENT '调试类型',
    title text COMMENT '标题',
    file_data LONGBLOB COMMENT '文件数据',
    file_type VARCHAR(50) DEFAULT 'html' COMMENT '文件类型',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uk_url (url(255)),
    INDEX idx_fakeid (fakeid),
    INDEX idx_type (type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='调试信息表';

-- HTML内容表
CREATE TABLE IF NOT EXISTS html_content (
    id BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT 'HTML内容ID',
    url VARCHAR(1000) NOT NULL COMMENT 'HTML链接',
    fakeid VARCHAR(100) NOT NULL COMMENT '公众号ID',
    html_content LONGTEXT COMMENT 'HTML内容',
    content_type VARCHAR(100) DEFAULT 'text/html' COMMENT '内容类型',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uk_url (url(255)),
    INDEX idx_fakeid (fakeid)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='HTML内容表';

-- 公众号信息表
CREATE TABLE IF NOT EXISTS accounts (
    fakeid VARCHAR(100) PRIMARY KEY COMMENT '公众号ID',
    nickname VARCHAR(200) COMMENT '公众号名称',
    alias VARCHAR(100) COMMENT '公众号别名',
    round_head_img text COMMENT '头像图片',
    service_type INT DEFAULT 0 COMMENT '服务类型',
    verify_flag INT DEFAULT 0 COMMENT '认证标志',
    user_name VARCHAR(100) COMMENT '用户名',
    principal_name VARCHAR(200) COMMENT '主体名称',
    signature VARCHAR(1000) COMMENT '公众号简介',
    total_count INT DEFAULT 0 COMMENT '文章总数',
    completed BOOLEAN DEFAULT FALSE COMMENT '是否完成同步',
    count INT DEFAULT 0 COMMENT '同步数量',
    articles INT DEFAULT 0 COMMENT '文章数量',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_nickname (nickname(100)),
    INDEX idx_alias (alias)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='公众号信息表';

-- 元数据表
CREATE TABLE IF NOT EXISTS metadata (
    id BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '元数据ID',
    url VARCHAR(1000) NOT NULL COMMENT '元数据URL',
    fakeid VARCHAR(100) NOT NULL COMMENT '公众号ID',
    metadata JSON COMMENT '元数据内容',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uk_url (url(255)),
    INDEX idx_fakeid (fakeid)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='元数据表';

-- 资源映射表
CREATE TABLE IF NOT EXISTS resource_maps (
    id BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '资源映射ID',
    url VARCHAR(1000) NOT NULL COMMENT '资源映射URL',
    fakeid VARCHAR(100) NOT NULL COMMENT '公众号ID',
    mapping_data JSON COMMENT '映射数据',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uk_url (url(255)),
    INDEX idx_fakeid (fakeid)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='资源映射表';

-- 资源表
CREATE TABLE IF NOT EXISTS resources (
    id BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '资源ID',
    url VARCHAR(1000) NOT NULL COMMENT '资源URL',
    fakeid VARCHAR(100) NOT NULL COMMENT '公众号ID',
    resource_data LONGBLOB COMMENT '资源数据',
    resource_type VARCHAR(50) DEFAULT 'binary' COMMENT '资源类型',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uk_url (url(255)),
    INDEX idx_fakeid (fakeid),
    INDEX idx_resource_type (resource_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='资源表';

CREATE TABLE `info` (
    `fakeid` VARCHAR(64) NOT NULL COMMENT '唯一ID，对应 fakeid',
    `completed` TINYINT(1) NOT NULL DEFAULT 0 COMMENT '是否完成',
    `count` INT NOT NULL DEFAULT 0 COMMENT '计数',
    `articles` INT NOT NULL DEFAULT 0 COMMENT '文章数量',
    `nickname` VARCHAR(255) DEFAULT NULL COMMENT '公众号昵称',
    `round_head_img` text DEFAULT NULL COMMENT '公众号头像URL',
    `total_count` INT NOT NULL DEFAULT 0 COMMENT '公众号文章总数',
    `create_time` BIGINT DEFAULT NULL COMMENT '创建时间（时间戳）',
    `update_time` BIGINT DEFAULT NULL COMMENT '更新时间（时间戳）',
    `last_update_time` BIGINT DEFAULT NULL COMMENT '最后文章更新时间（时间戳）',
    PRIMARY KEY (`fakeid`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
