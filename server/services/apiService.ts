import { getDbPool, type RowDataPacket, type ResultSetHeader } from '~/server/utils/database';
import type { APICall } from '~/store/v2/api';

export interface ApiCallRecord extends APICall {
  id?: number;
  created_at?: Date;
  updated_at?: Date;
}

/**
 * 创建API调用记录
 */
export async function createApiCall(record: Omit<APICall, 'id'>): Promise<number> {
  const pool = getDbPool();
  const { name, account, call_time, is_normal, payload } = record;
  
  const [result] = await pool.execute<ResultSetHeader>(
    `INSERT INTO api_calls (name, account, call_time, is_normal, payload) 
     VALUES (?, ?, ?, ?, ?)`,
    [name, account, call_time, is_normal, JSON.stringify(payload)]
  );
  
  return result.insertId;
}

/**
 * 查询API调用记录
 */
export async function getApiCalls(account: string, start: number, end: number = Date.now()): Promise<ApiCallRecord[]> {
  const pool = getDbPool();
  
  const [rows] = await pool.execute<RowDataPacket[]>(
    `SELECT id, name, account, call_time, is_normal, payload, created_at, updated_at
     FROM api_calls 
     WHERE account = ? AND call_time > ? AND call_time < ?
     ORDER BY call_time DESC`,
    [account, start, end]
  );
  
  return rows.map(row => ({
    id: row.id,
    name: row.name,
    account: row.account,
    call_time: row.call_time,
    is_normal: Boolean(row.is_normal),
    payload: typeof row.payload === 'string' ? JSON.parse(row.payload) : row.payload,
    created_at: row.created_at,
    updated_at: row.updated_at
  }));
}

/**
 * 删除指定账号的API调用记录
 */
export async function deleteApiCallsByFakeIds(fakeIds: string[]): Promise<number> {
  const pool = getDbPool();
  
  if (fakeIds.length === 0) return 0;
  
  const placeholders = fakeIds.map(() => '?').join(',');
  const [result] = await pool.execute<ResultSetHeader>(
    `DELETE FROM api_calls WHERE account IN (${placeholders})`,
    fakeIds
  );
  
  return result.affectedRows;
}

/**
 * 清理90天前的API调用记录
 */
export async function cleanupOldApiCalls(daysToKeep: number = 90): Promise<number> {
  const pool = getDbPool();
  const cutoffTime = Date.now() - (daysToKeep * 24 * 60 * 60 * 1000);
  
  const [result] = await pool.execute<ResultSetHeader>(
    'DELETE FROM api_calls WHERE call_time < ?',
    [cutoffTime]
  );
  
  return result.affectedRows;
}