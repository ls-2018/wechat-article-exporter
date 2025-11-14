import { getDbPool, type RowDataPacket, type ResultSetHeader } from '~/server/utils/database';
import type { CommentAsset } from '~/store/v2/comment';

export interface CommentRecord extends CommentAsset {
  created_at?: Date;
  updated_at?: Date;
}

/**
 * 创建或更新评论
 */
export async function upsertComment(comment: CommentAsset): Promise<string> {
  const pool = getDbPool();
  const { url, fakeid, title, data } = comment;
  
  await pool.execute<ResultSetHeader>(
    `INSERT INTO comments (url, fakeid, title, data) 
     VALUES (?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE
       fakeid = VALUES(fakeid), title = VALUES(title), data = VALUES(data),
       updated_at = CURRENT_TIMESTAMP`,
    [url, fakeid, title, JSON.stringify(data)]
  );
  
  return url;
}

/**
 * 获取评论
 */
export async function getComment(url: string): Promise<CommentRecord | null> {
  const pool = getDbPool();
  
  const [rows] = await pool.execute<RowDataPacket[]>(
    'SELECT url, fakeid, title, data, created_at, updated_at FROM comments WHERE url = ? LIMIT 1',
    [url]
  );
  
  if (rows.length === 0) return null;
  
  const row = rows[0];
  return {
    url: row.url,
    fakeid: row.fakeid,
    title: row.title,
    data: typeof row.data === 'string' ? JSON.parse(row.data) : row.data,
    created_at: row.created_at,
    updated_at: row.updated_at
  };
}

/**
 * 删除指定公众号的评论
 */
export async function deleteCommentsByFakeIds(fakeIds: string[]): Promise<number> {
  const pool = getDbPool();
  
  if (fakeIds.length === 0) return 0;
  
  const placeholders = fakeIds.map(() => '?').join(',');
  const [result] = await pool.execute<ResultSetHeader>(
    `DELETE FROM comments WHERE fakeid IN (${placeholders})`,
    fakeIds
  );
  
  return result.affectedRows;
}