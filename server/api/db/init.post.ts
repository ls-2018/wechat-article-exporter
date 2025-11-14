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
    console.log(`📖 读取schema文件: ${schemaPath}`);
    console.log(`📖 文件是否存在: ${fs.existsSync(schemaPath)}`);
    
    if (!fs.existsSync(schemaPath)) {
      throw new Error(`Schema文件不存在: ${schemaPath}`);
    }
    
    const schemaSQL = fs.readFileSync(schemaPath, 'utf8');
    console.log(`📖 成功读取schema文件，长度: ${schemaSQL.length}`);
    
    // 分割SQL语句并逐条执行
    const rawStatements = schemaSQL.split(';');
    console.log(`📋 原始分割结果: ${rawStatements.length} 条`);
    
    const statements = rawStatements
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0);
    
    console.log(`📋 过滤后结果: ${statements.length} 条`);
    console.log(`📋 前3条语句预览:`, statements.slice(0, 3).map((s, i) => `${i}: "${s.substring(0, 50)}..."`));
    
    console.log(`🔄 准备执行 ${statements.length} 条SQL语句`);
    console.log(`📋 所有语句:`, statements.map((s, i) => `${i}: ${s.substring(0, 50)}...`));
    let executedCount = 0;
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      console.log(`🔍 检查语句 ${i}: "${statement.substring(0, 50)}..."`);
      console.log(`🔍 是否包含CREATE TABLE: ${statement.toUpperCase().includes('CREATE TABLE')}`);
      
      if (statement.toUpperCase().includes('CREATE TABLE')) {
        try {
          console.log(`🔄 正在执行: ${statement.substring(0, 100)}...`);
          const [result] = await pool.execute(statement);
          console.log(`✅ 执行成功: ${statement.substring(0, 50)}...`);
          executedCount++;
        } catch (error: any) {
          // 如果表已存在，忽略错误
          if (error.code === 'ER_TABLE_EXISTS_ERROR') {
            console.log(`ℹ️  表已存在，跳过: ${statement.substring(0, 50)}...`);
          } else {
            console.error(`❌ 执行失败: ${error.message}`);
            console.error(`❌ 失败的SQL: ${statement}`);
            throw error;
          }
        }
      }
    }
    
    console.log(`✅ 数据库初始化完成，共执行 ${executedCount} 条语句`);
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