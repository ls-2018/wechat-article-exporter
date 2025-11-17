import { getDbPool, type RowDataPacket, type ResultSetHeader } from '~/server/utils/database';
import type { AppMsgExWithFakeID } from '~/types/types';

export interface ArticleRecord extends AppMsgExWithFakeID {
  id?: string;
  content?: string;
  html_content?: string;
  created_at?: Date;
  updated_at?: Date;
}

/**
 * 创建或更新文章
 */
export async function upsertArticle(article: AppMsgExWithFakeID): Promise<string> {
  const pool = getDbPool();
  const { fakeid, aid } = article;
  const id = `${fakeid}:${aid}`;
  
  // Provide default values for missing fields
  const title = article.title || '';
  const digest = article.digest || '';
  const link = article.link || '';
  const cover = article.cover || '';
  const cover_img_theme_color = article.cover_img_theme_color || null;
  const author_name = article.author_name || '';
  const create_time = article.create_time || Date.now();
  const copyright_stat = article.copyright_stat || 0;
  const copyright_type = article.copyright_type || 0;
  const is_deleted = article.is_deleted || false;
  const is_pay_subscribe = article.is_pay_subscribe || 0;
  const item_show_type = article.item_show_type || 1;
  const media_duration = article.media_duration || '';
  const mediaapi_publish_status = article.mediaapi_publish_status || 0;
  const checking = article.checking || 0;
  const ban_flag = article.ban_flag || 0;
  const has_red_packet_cover = article.has_red_packet_cover || 0;
  const album_id = article.album_id || '';
  const appmsg_album_infos = article.appmsg_album_infos || [];
  const itemidx = article.itemidx ||0;

  await pool.execute<ResultSetHeader>(
    `INSERT INTO articles (
      id, fakeid, aid, title, digest, link, cover, cover_img_theme_color,
      author_name, create_time, copyright_stat, copyright_type, is_deleted,
      is_pay_subscribe, item_show_type, media_duration, mediaapi_publish_status,
      checking, ban_flag, has_red_packet_cover, album_id, appmsg_album_infos,itemidx
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON DUPLICATE KEY UPDATE
      title = VALUES(title), digest = VALUES(digest), cover = VALUES(cover),
      cover_img_theme_color = VALUES(cover_img_theme_color), author_name = VALUES(author_name),
      copyright_stat = VALUES(copyright_stat), copyright_type = VALUES(copyright_type),
      is_deleted = VALUES(is_deleted), is_pay_subscribe = VALUES(is_pay_subscribe),
      item_show_type = VALUES(item_show_type), media_duration = VALUES(media_duration),
      mediaapi_publish_status = VALUES(mediaapi_publish_status), checking = VALUES(checking),
      ban_flag = VALUES(ban_flag), has_red_packet_cover = VALUES(has_red_packet_cover),
      album_id = VALUES(album_id), appmsg_album_infos = VALUES(appmsg_album_infos),
      updated_at = CURRENT_TIMESTAMP`,
    [
      id, fakeid, aid, title, digest, link, cover, 
      JSON.stringify(cover_img_theme_color), author_name, create_time,
      copyright_stat, copyright_type, is_deleted, is_pay_subscribe,
      item_show_type, media_duration, mediaapi_publish_status,
      checking, ban_flag, has_red_packet_cover, album_id,
      JSON.stringify(appmsg_album_infos),
      itemidx
    ]
  );
  
  return id;
}

/**
 * 批量创建或更新文章
 */
export async function batchUpsertArticles(articles: AppMsgExWithFakeID[]): Promise<string[]> {
  if (articles.length === 0) return [];
  
  const pool = getDbPool();
  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();
    
    const ids: string[] = [];
    for (const article of articles) {
      const id = await upsertArticle(article);
      ids.push(id);
    }
    
    await connection.commit();
    return ids;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

/**
 * 根据链接获取文章
 */
export async function getArticleByLink(url: string): Promise<ArticleRecord | null> {
  const pool = getDbPool();
  
  const [rows] = await pool.execute<RowDataPacket[]>(
    'SELECT * FROM articles WHERE link = ? LIMIT 1',
    [url]
  );
  
  if (rows.length === 0) return null;
  
  const row = rows[0];
  return {
    id: row.id,
    fakeid: row.fakeid,
    aid: row.aid,
    title: row.title,
    digest: row.digest,
    link: row.link,
    cover: row.cover,
    cover_img_theme_color: row.cover_img_theme_color,
    author_name: row.author_name,
    create_time: row.create_time,
    copyright_stat: row.copyright_stat,
    copyright_type: row.copyright_type,
    is_deleted: Boolean(row.is_deleted),
    is_pay_subscribe: Boolean(row.is_pay_subscribe),
    item_show_type: row.item_show_type,
    media_duration: row.media_duration,
    mediaapi_publish_status: row.mediaapi_publish_status,
    checking: row.checking,
    ban_flag: row.ban_flag,
    has_red_packet_cover: row.has_red_packet_cover,
    album_id: row.album_id,
    appmsg_album_infos: row.appmsg_album_infos,
    content: row.content,
    html_content: row.html_content,
    created_at: row.created_at,
    updated_at: row.updated_at
  };
}

/**
 * 检查缓存是否存在
 */
export async function checkArticleCache(fakeid: string, create_time: number): Promise<boolean> {
  const pool = getDbPool();
  
  const [rows] = await pool.execute<RowDataPacket[]>(
    'SELECT COUNT(*) as count FROM articles WHERE fakeid = ? AND create_time < ?',
    [fakeid, create_time]
  );
  
  return rows[0].count > 0;
}

/**
 * 获取指定时间之前的历史文章
 */
export async function getArticleCache(fakeid: string, create_time: number): Promise<ArticleRecord[]> {
  const pool = getDbPool();
  
  const [rows] = await pool.execute<RowDataPacket[]>(
    `SELECT * FROM articles 
     WHERE fakeid = ? AND create_time < ? 
     ORDER BY create_time DESC`,
    [fakeid, create_time]
  );
  
  return rows.map(row => ({
    id: row.id,
    fakeid: row.fakeid,
    aid: row.aid,
    title: row.title,
    digest: row.digest,
    link: row.link,
    cover: row.cover,
    cover_img_theme_color: (() => {
      try {
        return row.cover_img_theme_color ? JSON.parse(row.cover_img_theme_color) : null;
      } catch (error) {
        console.error('解析 cover_img_theme_color 失败:', error, '数据:', row.cover_img_theme_color);
        return null;
      }
    })(),
    author_name: row.author_name,
    create_time: row.create_time,
    copyright_stat: row.copyright_stat,
    copyright_type: row.copyright_type,
    is_deleted: Boolean(row.is_deleted),
    is_pay_subscribe: Boolean(row.is_pay_subscribe),
    item_show_type: row.item_show_type,
    media_duration: row.media_duration,
    mediaapi_publish_status: row.mediaapi_publish_status,
    checking: row.checking,
    ban_flag: row.ban_flag,
    has_red_packet_cover: row.has_red_packet_cover,
    album_id: row.album_id,
    appmsg_album_infos: (() => {
      try {
        return row.appmsg_album_infos ? JSON.parse(row.appmsg_album_infos) : [];
      } catch (error) {
        console.error('解析 appmsg_album_infos 失败:', error, '数据:', row.appmsg_album_infos);
        return [];
      }
    })(),
    content: row.content,
    html_content: row.html_content,
    created_at: row.created_at,
    updated_at: row.updated_at
  }));
}

/**
 * 标记文章为已删除
 */
export async function markArticleDeleted(url: string): Promise<boolean> {
  const pool = getDbPool();
  
  const [result] = await pool.execute<ResultSetHeader>(
    'UPDATE articles SET is_deleted = TRUE WHERE link = ?',
    [url]
  );
  
  return result.affectedRows > 0;
}

/**
 * 根据fakeid获取所有文章
 */
export async function getArticlesByFakeId(fakeid: string): Promise<ArticleRecord[]> {
  const pool = getDbPool();
  
  const [rows] = await pool.execute<RowDataPacket[]>(
    'SELECT * FROM articles WHERE fakeid = ? ORDER BY create_time DESC',
    [fakeid]
  );
  
  return rows.map(row => ({
    id: row.id,
    fakeid: row.fakeid,
    aid: row.aid,
    title: row.title,
    digest: row.digest,
    link: row.link,
    cover: row.cover,
    cover_img_theme_color: row.cover_img_theme_color,
    author_name: row.author_name,
    create_time: row.create_time,
    copyright_stat: row.copyright_stat,
    copyright_type: row.copyright_type,
    is_deleted: Boolean(row.is_deleted),
    is_pay_subscribe: Boolean(row.is_pay_subscribe),
    item_show_type: row.item_show_type,
    media_duration: row.media_duration,
    mediaapi_publish_status: row.mediaapi_publish_status,
    checking: row.checking,
    ban_flag: row.ban_flag,
    has_red_packet_cover: row.has_red_packet_cover,
    album_id: row.album_id,
    appmsg_album_infos: row.appmsg_album_infos,
    // appmsg_album_infos: (() => {
    //   try {
    //     return row.appmsg_album_infos ? JSON.parse(row.appmsg_album_infos) : [];
    //   } catch (error) {
    //     console.error('解析 appmsg_album_infos 失败:', error, '数据:', row.appmsg_album_infos);
    //     return [];
    //   }
    // })(),
    content: row.content,
    html_content: row.html_content,
    created_at: row.created_at,
    updated_at: row.updated_at,
    itemidx: row.itemidx,
  }));
}

/**
 * 删除指定公众号的文章
 */
export async function deleteArticlesByFakeIds(fakeIds: string[]): Promise<number> {
  const pool = getDbPool();
  
  if (fakeIds.length === 0) return 0;
  
  const placeholders = fakeIds.map(() => '?').join(',');
  const [result] = await pool.execute<ResultSetHeader>(
    `DELETE FROM articles WHERE fakeid IN (${placeholders})`,
    fakeIds
  );
  
  return result.affectedRows;
}