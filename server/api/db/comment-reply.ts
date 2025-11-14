import { getDbPool } from '~/server/utils/database';

export default defineEventHandler(async (event) => {
  const db = await getDbPool();
  
  try {
    const method = getMethod(event);
    
    if (method === 'GET') {
      // 获取评论回复
      const query = getQuery(event);
      const { url } = query;
      
      if (!url) {
        throw createError({
          statusCode: 400,
          statusMessage: 'Missing required parameter: url'
        });
      }
      
      const [rows] = await db.execute(
        'SELECT * FROM comment_replies WHERE url = ? LIMIT 1',
        [url]
      );
      
      if (rows.length === 0) {
        return {
          success: true,
          data: null
        };
      }
      
      return {
        success: true,
        data: rows[0]
      };
      
    } else if (method === 'POST') {
      // 插入或更新评论回复
      const body = await readBody(event);
      const { url, contentID, fakeid, reply_data } = body;
      
      if (!url || !contentID || !fakeid) {
        throw createError({
          statusCode: 400,
          statusMessage: 'Missing required fields: url, contentID, fakeid'
        });
      }
      
      await db.execute(
        `INSERT INTO comment_replies (url, contentID, fakeid, reply_data) 
         VALUES (?, ?, ?, ?) 
         ON DUPLICATE KEY UPDATE 
         fakeid = VALUES(fakeid),
         reply_data = VALUES(reply_data)`,
        [url, contentID, fakeid, JSON.stringify(reply_data)]
      );
      
      return {
        success: true,
        message: 'Comment reply upserted successfully'
      };
      
    } else if (method === 'DELETE') {
      // 删除评论回复
      const body = await readBody(event);
      const { url } = body;
      
      if (!url) {
        throw createError({
          statusCode: 400,
          statusMessage: 'Missing required field: url'
        });
      }
      
      await db.execute(
        'DELETE FROM comment_replies WHERE url = ?',
        [url]
      );
      
      return {
        success: true,
        message: 'Comment reply deleted successfully'
      };
    }
    
    throw createError({
      statusCode: 405,
      statusMessage: 'Method not allowed'
    });
    
  } catch (error) {
    console.error('Error handling comment reply:', error);
    throw createError({
      statusCode: 500,
      statusMessage: 'Internal server error'
    });
  }
});