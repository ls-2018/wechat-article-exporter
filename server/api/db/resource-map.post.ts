import { getDbPool } from '~/server/utils/database';

export default defineEventHandler(async event => {
  const db = await getDbPool();

  try {
    // 插入或更新资源映射
    const body = await readBody(event);
    const { url, fakeid, resource_map } = body;

    if (!url || !fakeid) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Missing required fields: url, fakeid',
      });
    }

    await db.execute(
      `INSERT INTO resource_maps (url, fakeid, resource_map) 
         VALUES (?, ?, ?) 
         ON DUPLICATE KEY UPDATE 
         fakeid = VALUES(fakeid),
         resource_map = VALUES(resource_map)`,
      [url, fakeid, JSON.stringify(resource_map)]
    );

    return {
      success: true,
      message: 'Resource map upserted successfully',
    };
  } catch (error) {
    console.error('Error handling resource map:', error);
    throw createError({
      statusCode: 500,
      statusMessage: 'Internal server error',
    });
  }
});
