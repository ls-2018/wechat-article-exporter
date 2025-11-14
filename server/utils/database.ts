import mysql from 'mysql2/promise';
import { initializeDatabase } from './initDatabase.js';

// MySQL数据库配置
const dbConfig = {
  host: process.env.MYSQL_HOST || '127.0.0.1',
  port: parseInt(process.env.MYSQL_PORT || '3306'),
  user: process.env.MYSQL_USER || 'root',
  password: process.env.MYSQL_PASSWORD || 'root',
  database: process.env.MYSQL_DATABASE || 'crawl',
  charset: 'utf8mb4',
  timezone: '+00:00',
  connectionLimit: 10,
  queueLimit: 0,
};

// 创建连接池
let pool: mysql.Pool | null = null;

export function getDbPool(): mysql.Pool {
  if (!pool) {
    pool = mysql.createPool(dbConfig);
    // 初始化数据库表结构
    initializeDatabase(pool).catch(error => {
      console.error('数据库初始化失败:', error);
    });
  }
return pool;``
}

// 关闭连接池
export async function closeDbPool(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = null;
  }
}

// 数据库连接测试
export async function testDbConnection(): Promise<boolean> {
  try {
    const pool = getDbPool();
    const connection = await pool.getConnection();
    await connection.ping();
    connection.release();
    return true;
  } catch (error) {
    console.error('数据库连接测试失败:', error);
    return false;
  }
}

export type { RowDataPacket, FieldPacket, ResultSetHeader } from 'mysql2/promise';