import { getDbPool, type RowDataPacket, type ResultSetHeader } from '~/server/utils/database';
import type { Asset } from '~/store/v2/assets';

export interface AssetRecord extends Asset {
  file_type?: string;
  file_size?: number;
  file_hash?: string;
  created_at?: Date;
  updated_at?: Date;
}

/**
 * 创建或更新资源文件
 */
export async function upsertAsset(asset: Asset): Promise<string> {
  const pool = getDbPool();
  const { url, fakeid, file } = asset;
  
  const fileBuffer = Buffer.from(await file.arrayBuffer());
  const fileSize = fileBuffer.length;
  const fileType = file.type || 'application/octet-stream';
  
  // 计算文件哈希
  const crypto = await import('crypto');
  const fileHash = crypto.createHash('sha256').update(fileBuffer).digest('hex');
  
  await pool.execute<ResultSetHeader>(
    `INSERT INTO assets (url, fakeid, file_type, file_size, file_data, file_hash) 
     VALUES (?, ?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE
       file_type = VALUES(file_type), file_size = VALUES(file_size), 
       file_data = VALUES(file_data), file_hash = VALUES(file_hash),
       updated_at = CURRENT_TIMESTAMP`,
    [url, fakeid, fileType, fileSize, fileBuffer, fileHash]
  );
  
  return url;
}

/**
 * 获取资源文件
 */
export async function getAsset(url: string): Promise<AssetRecord | null> {
  const pool = getDbPool();
  
  const [rows] = await pool.execute<RowDataPacket[]>(
    'SELECT url, fakeid, file_type, file_size, file_hash, created_at, updated_at FROM assets WHERE url = ? LIMIT 1',
    [url]
  );
  
  if (rows.length === 0) return null;
  
  const row = rows[0];
  return {
    url: row.url,
    fakeid: row.fakeid,
    file: new Blob(), // 实际使用时需要从file_data字段读取
    file_type: row.file_type,
    file_size: row.file_size,
    file_hash: row.file_hash,
    created_at: row.created_at,
    updated_at: row.updated_at
  };
}

/**
 * 获取资源文件数据
 */
export async function getAssetData(url: string): Promise<Buffer | null> {
  const pool = getDbPool();
  
  const [rows] = await pool.execute<RowDataPacket[]>(
    'SELECT file_data FROM assets WHERE url = ? LIMIT 1',
    [url]
  );
  
  if (rows.length === 0) return null;
  
  return rows[0].file_data;
}

/**
 * 删除指定公众号的资源文件
 */
export async function deleteAssetsByFakeIds(fakeIds: string[]): Promise<number> {
  const pool = getDbPool();
  
  if (fakeIds.length === 0) return 0;
  
  const placeholders = fakeIds.map(() => '?').join(',');
  const [result] = await pool.execute<ResultSetHeader>(
    `DELETE FROM assets WHERE fakeid IN (${placeholders})`,
    fakeIds
  );
  
  return result.affectedRows;
}

/**
 * 清理指定大小限制的资源文件（保留最近使用的）
 */
export async function cleanupAssetsBySize(maxSizeGB: number = 10): Promise<number> {
  const pool = getDbPool();
  const maxSizeBytes = maxSizeGB * 1024 * 1024 * 1024;
  
  // 获取需要删除的文件（按更新时间排序，删除最旧的）
  const [rows] = await pool.execute<RowDataPacket[]>(
    `SELECT url, file_size FROM assets 
     ORDER BY updated_at ASC`
  );
  
  let totalSize = rows.reduce((sum, row) => sum + (row.file_size || 0), 0);
  const urlsToDelete: string[] = [];
  
  for (const row of rows) {
    if (totalSize <= maxSizeBytes) break;
    urlsToDelete.push(row.url);
    totalSize -= (row.file_size || 0);
  }
  
  if (urlsToDelete.length === 0) return 0;
  
  const placeholders = urlsToDelete.map(() => '?').join(',');
  const [result] = await pool.execute<ResultSetHeader>(
    `DELETE FROM assets WHERE url IN (${placeholders})`,
    urlsToDelete
  );
  
  return result.affectedRows;
}