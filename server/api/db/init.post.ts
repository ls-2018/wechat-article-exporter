import { getDbPool } from '~/server/utils/database';
import fs from 'fs';
import path from 'path';

/**
 * 初始化数据库表结构
 */
export default defineEventHandler(async (event) => {
  try {
    const pool = getDbPool();
    
    // 读取schema.sql文件
    const schemaPath = path.join(process.cwd(), 'server/db/schema.sql');

    if (!fs.existsSync(schemaPath)) {
      throw new Error(`Schema文件不存在: ${schemaPath}`);
    }
    
    const schemaSQL = fs.readFileSync(schemaPath, 'utf8');

    // 分割SQL语句并逐条执行
    const rawStatements = schemaSQL.split(';');

    const statements = rawStatements
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0);
    
    let executedCount = 0;
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];

      if (statement.toUpperCase().includes('CREATE TABLE')) {
        try {
          const [result] = await pool.execute(statement);
          executedCount++;
        } catch (error: any) {
          // 如果表已存在，忽略错误
          if (error.code === 'ER_TABLE_EXISTS_ERROR') {
          } else {
            throw error;
          }
        }
      }
    }
    
    return {
      success: true,
      message: `数据库表结构初始化完成，共执行 ${executedCount} 条语句`
    };
  } catch (error) {
    console.error('数据库初始化失败:', error);
    throw createError({
      statusCode: 500,
      statusMessage: '数据库初始化失败'
    });
  }
});