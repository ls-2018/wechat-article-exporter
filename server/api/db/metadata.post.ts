import { getDbPool } from '~/server/utils/database';

export default defineEventHandler(async (event) => {
  const db = await getDbPool();
  
  try {

      // 插入或更新元数据
      const body = await readBody(event);
      const { url, fakeid, metadata } = body;
      
      if (!url || !fakeid) {
        throw createError({
          statusCode: 400,
          statusMessage: 'Missing required fields: url, fakeid'
        });
      }
      
      await db.execute(
        `INSERT INTO metadata (url, fakeid, metadata) 
         VALUES (?, ?, ?) 
         ON DUPLICATE KEY UPDATE 
         fakeid = VALUES(fakeid),
         metadata = VALUES(metadata)`,
        [url, fakeid, JSON.stringify(metadata)]
      );
      
      return {
        success: true,
        message: 'Metadata upserted successfully'
      };

  } catch (error) {
    console.error('Error handling metadata:', error);
    throw createError({
      statusCode: 500,
      statusMessage: 'Internal server error'
    });
  }
});