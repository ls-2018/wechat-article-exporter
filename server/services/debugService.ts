import { getDbPool, type RowDataPacket, type ResultSetHeader } from '~/server/utils/database';
import type { DebugAsset } from '~/store/v2/debug';

export interface DebugRecord extends DebugAsset {
  created_at?: Date;
  updated_at?: Date;
}

/**
 * 创建或更新调试信息
 */
export async function upsertDebugInfo(debugInfo: DebugAsset): Promise<string> {
  const pool = getDbPool();
  const { url, fakeid, type, title, file } = debugInfo;
  
  const fileBuffer = Buffer.from(await file.arrayBuffer());
  const fileType = file.type || 'text/html';
  
  await pool.execute<ResultSetHeader>(
    `INSERT INTO debug_info (url, fakeid, type, title, file_data, file_type) 
     VALUES (?, ?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE
       fakeid = VALUES(fakeid), type = VALUES(type), title = VALUES(title),
       file_data = VALUES(file_data), file_type = VALUES(file_type),
       updated_at = CURRENT_TIMESTAMP`,
    [url, fakeid, type, title, fileBuffer, fileType]
  );
  
  return url;
}

/**
 * 获取调试信息
 */
export async function getDebugInfo(url: string): Promise<DebugRecord | null> {
  const pool = getDbPool();
  
  const [rows] = await pool.execute<RowDataPacket[]>(
    'SELECT url, fakeid, type, title, file_type, created_at, updated_at FROM debug_info WHERE url = ? LIMIT 1',
    [url]
  );
  
  if (rows.length === 0) return null;
  
  const row = rows[0];
  return {
    url: row.url,
    fakeid: row.fakeid,
    type: row.type,
    title: row.title,
    file: new Blob(), // 实际使用时需要从file_data字段读取
    file_type: row.file_type,
    created_at: row.created_at,
    updated_at: row.updated_at
  };
}

/**
 * 获取所有调试信息
 */
export async function getAllDebugInfo(): Promise<DebugRecord[]> {
  const pool = getDbPool();
  
  const [rows] = await pool.execute<RowDataPacket[]>(
    'SELECT url, fakeid, type, title, file_type, created_at, updated_at FROM debug_info ORDER BY created_at DESC'
  );
  
  return rows.map(row => ({
    url: row.url,
    fakeid: row.fakeid,
    type: row.type,
    title: row.title,
    file: new Blob(),
    file_type: row.file_type,
    created_at: row.created_at,
    updated_at: row.updated_at
  }));
}

/**
 * 获取调试文件数据
 */
export async function getDebugFileData(url: string): Promise<Buffer | null> {
  const pool = getDbPool();
  
  const [rows] = await pool.execute<RowDataPacket[]>(
    'SELECT file_data FROM debug_info WHERE url = ? LIMIT 1',
    [url]
  );
  
  if (rows.length === 0) return null;
  
  return rows[0].file_data;
}

/**
 * 删除指定公众号的调试信息
 */
export async function deleteDebugInfoByFakeIds(fakeIds: string[]): Promise<number> {
  const pool = getDbPool();
  
  if (fakeIds.length === 0) return 0;
  
  const placeholders = fakeIds.map(() => '?').join(',');
  const [result] = await pool.execute<ResultSetHeader>(
    `DELETE FROM debug_info WHERE fakeid IN (${placeholders})`,
    fakeIds
  );
  
  return result.affectedRows;
}