import { getDbPool } from '~/server/utils/database';

export default defineEventHandler(async (event) => {
  const db = await getDbPool();
  
  try {

      // 插入或更新资源
      const body = await readBody(event);
      const { url, fakeid, resource_data } = body;
      
      if (!url || !fakeid) {
        throw createError({
          statusCode: 400,
          statusMessage: 'Missing required fields: url, fakeid'
        });
      }
      
      await db.execute(
        `INSERT INTO resources (url, fakeid, resource_data) 
         VALUES (?, ?, ?) 
         ON DUPLICATE KEY UPDATE 
         fakeid = VALUES(fakeid),
         resource_data = VALUES(resource_data)`,
        [url, fakeid, JSON.stringify(resource_data)]
      );
      
      return {
        success: true,
        message: 'Resource upserted successfully'
      };

  } catch (error) {
    console.error('Error handling resource:', error);
    throw createError({
      statusCode: 500,
      statusMessage: 'Internal server error'
    });
  }
});