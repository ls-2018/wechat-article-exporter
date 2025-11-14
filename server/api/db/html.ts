import { getDbPool } from '~/server/utils/database';

export default defineEventHandler(async (event) => {
  const db = await getDbPool();
  
  try {
    const method = getMethod(event);
    
    if (method === 'GET') {
      // 获取HTML内容
      const query = getQuery(event);
      const { url } = query;
      
      if (!url) {
        throw createError({
          statusCode: 400,
          statusMessage: 'Missing required parameter: url'
        });
      }
      
      const [rows] = await db.execute(
        'SELECT * FROM html_content WHERE url = ? LIMIT 1',
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
      // 插入或更新HTML内容
      const body = await readBody(event);
      const { url, fakeid, html_data } = body;
      
      if (!url || !fakeid) {
        throw createError({
          statusCode: 400,
          statusMessage: 'Missing required fields: url, fakeid'
        });
      }
      
      await db.execute(
        `INSERT INTO html_content (url, fakeid, html_data) 
         VALUES (?, ?, ?) 
         ON DUPLICATE KEY UPDATE 
         fakeid = VALUES(fakeid),
         html_data = VALUES(html_data)`,
        [url, fakeid, JSON.stringify(html_data)]
      );
      
      return {
        success: true,
        message: 'HTML content upserted successfully'
      };
      
    } else if (method === 'DELETE') {
      // 删除HTML内容
      const body = await readBody(event);
      const { url } = body;
      
      if (!url) {
        throw createError({
          statusCode: 400,
          statusMessage: 'Missing required field: url'
        });
      }
      
      await db.execute(
        'DELETE FROM html_content WHERE url = ?',
        [url]
      );
      
      return {
        success: true,
        message: 'HTML content deleted successfully'
      };
    }
    
    throw createError({
      statusCode: 405,
      statusMessage: 'Method not allowed'
    });
    
  } catch (error) {
    console.error('Error handling HTML content:', error);
    throw createError({
      statusCode: 500,
      statusMessage: 'Internal server error'
    });
  }
});