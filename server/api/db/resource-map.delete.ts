import { getDbPool } from '~/server/utils/database';

export default defineEventHandler(async event => {
  const db = await getDbPool();

  try {
    // 删除资源映射
    const body = await readBody(event);
    const { url } = body;

    if (!url) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Missing required field: url',
      });
    }

    await db.execute('DELETE FROM resource_maps WHERE url = ?', [url]);

    return {
      success: true,
      message: 'Resource map deleted successfully',
    };
  } catch (error) {
    console.error('Error handling resource map:', error);
    throw createError({
      statusCode: 500,
      statusMessage: 'Internal server error',
    });
  }
});
