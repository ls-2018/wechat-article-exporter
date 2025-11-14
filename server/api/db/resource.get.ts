import { getDbPool } from '~/server/utils/database';

export default defineEventHandler(async (event) => {
  const db = await getDbPool();
  
  try {
      // 获取资源
      const query = getQuery(event);
      const { url } = query;
      
      if (!url) {
        throw createError({
          statusCode: 400,
          statusMessage: 'Missing required parameter: url'
        });
      }
      
      const [rows] = await db.execute(
        'SELECT * FROM resources WHERE url = ? LIMIT 1',
        [url]
      );

      if (!Array.isArray(rows) || rows.length === 0) {
        return {
          success: true,
          data: null
        };
      }
      
      return {
        success: true,
        data: rows[0]
      };

    
  } catch (error) {
    console.error('Error handling resource:', error);
    throw createError({
      statusCode: 500,
      statusMessage: 'Internal server error'
    });
  }
});