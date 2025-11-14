import mysql from 'mysql2/promise';
import fs from 'fs';
import path from 'path';

/**
 * 初始化数据库表结构
 */
export async function initializeDatabase(pool: mysql.Pool): Promise<void> {
  try {
    // 读取schema.sql文件
    const schemaPath = path.join(process.cwd(), 'server/db/schema.sql');
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
    
    console.log(`📊 共解析出 ${statements.length} 条SQL语句`);
    if (statements.length === 0) {
      console.log('⚠️  未找到任何CREATE TABLE语句，请检查schema.sql文件');
      return;
    }
    
    for (const statement of statements) {
      if (statement.toUpperCase().includes('CREATE TABLE')) {
        try {
          console.log(`🔄 正在执行: ${statement.substring(0, 100)}...`);
          await pool.execute(statement);
          console.log(`✅ 表创建成功: ${statement.substring(0, 50)}...`);
        } catch (error: any) {
          // 如果表已存在，忽略错误
          if (error.code === 'ER_TABLE_EXISTS_ERROR') {
            console.log(`ℹ️  表已存在，跳过: ${statement.substring(0, 50)}...`);
          } else {
            console.error(`❌ 创建表失败: ${error.message}`);
            console.error(`❌ 失败的SQL: ${statement}`);
            throw error;
          }
        }
      }
    }
    
    console.log('✅ 数据库表结构初始化完成');
  } catch (error) {
    console.error('❌ 数据库初始化失败:', error);
    throw error;
  }
}