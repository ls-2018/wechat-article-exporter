import mysql from 'mysql2/promise';
import fs from 'fs';
import path from 'path';

/**
 * 初始化数据库表结构
 */
export async function initializeDatabase(pool: mysql.Pool): Promise<void> {
  try {
    // 读取schema.sql文件
    const schemaPath = path.resolve(process.cwd(), 'server/db/schema.sql');
    const schemaSQL = fs.readFileSync(schemaPath, 'utf8');
    
    // 更智能的SQL语句分割
    const statements = [];
    let currentStatement = '';
    let inComment = false;
    
    const lines = schemaSQL.split('\n');
    
    for (const line of lines) {
      const trimmedLine = line.trim();
      
      // 跳过空行和单行注释
      if (trimmedLine.length === 0 || trimmedLine.startsWith('--')) {
        continue;
      }
      
      // 处理多行注释开始
      if (trimmedLine.startsWith('/*')) {
        inComment = true;
        continue;
      }
      
      // 处理多行注释结束
      if (inComment && trimmedLine.endsWith('*/')) {
        inComment = false;
        continue;
      }
      
      // 如果在注释中，跳过
      if (inComment) {
        continue;
      }
      
      // 累积SQL语句
      currentStatement += line + '\n';
      
      // 如果遇到分号，完成当前语句
      if (trimmedLine.endsWith(';')) {
        const finalStatement = currentStatement.trim();
        if (finalStatement.toUpperCase().includes('CREATE TABLE') && finalStatement.length > 0) {
          statements.push(finalStatement);
        }
        currentStatement = '';
      }
    }
    
    if (statements.length === 0) {
      return;
    }
    
    for (const statement of statements) {
      if (statement.toUpperCase().includes('CREATE TABLE')) {
        try {
          await pool.execute(statement);
        } catch (error: any) {
          // 如果表已存在，忽略错误
          if (error.code === 'ER_TABLE_EXISTS_ERROR') {
          } else {
            throw error;
          }
        }
      }
    }
    
  } catch (error) {
    throw error;
  }
}