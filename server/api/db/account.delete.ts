import { getDbPool } from '~/server/utils/database';

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event);
    const { fakeid } = body;

    if (!fakeid) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Missing required field: fakeid'
      });
    }

    const db = await getDbPool();
    
    // 删除账户相关的所有数据
    // 由于外键约束，需要按顺序删除相关表的数据
    
    // 1. 删除评论回复
    await db.execute('DELETE FROM comment_replies WHERE fakeid = ?', [fakeid]);
    
    // 2. 删除评论
    await db.execute('DELETE FROM comments WHERE fakeid = ?', [fakeid]);
    
    // 3. 删除资源映射
    await db.execute('DELETE FROM resource_maps WHERE fakeid = ?', [fakeid]);
    
    // 4. 删除资源
    await db.execute('DELETE FROM resources WHERE fakeid = ?', [fakeid]);
    
    // 5. 删除HTML内容
    await db.execute('DELETE FROM html_content WHERE fakeid = ?', [fakeid]);
    
    // 6. 删除调试信息
    await db.execute('DELETE FROM debug_info WHERE fakeid = ?', [fakeid]);
    
    // 7. 删除元数据
    await db.execute('DELETE FROM metadata WHERE fakeid = ?', [fakeid]);
    
    // 8. 删除文章
    await db.execute('DELETE FROM articles WHERE fakeid = ?', [fakeid]);
    
    // 9. 删除API调用记录
    await db.execute('DELETE FROM api_calls WHERE account = ?', [fakeid]);
    
    // 10. 删除账户信息
    await db.execute('DELETE FROM accounts WHERE fakeid = ?', [fakeid]);
    
    // 11. 删除info表记录
    await db.execute('DELETE FROM info WHERE fakeid = ?', [fakeid]);

    return {
      success: true,
      message: 'Account data deleted successfully'
    };
  } catch (error) {
    console.error('Error deleting account data:', error);
    throw createError({
      statusCode: 500,
      statusMessage: 'Internal server error'
    });
  }
});