import { getDbPool } from '~/server/utils/database';

export default defineEventHandler(async (event) => {
  try {
    const query = getQuery(event);
    const { fakeid } = query;

    if (!fakeid) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Missing required parameter: fakeid'
      });
    }

    const db = await getDbPool();
    
    const [rows] = await db.execute(
      'SELECT * FROM comment_replies WHERE fakeid = ? ORDER BY created_at DESC',
      [fakeid]
    );

    return {
      success: true,
      data: rows
    };
  } catch (error) {
    console.error('Error getting comment replies by fakeid:', error);
    throw createError({
      statusCode: 500,
      statusMessage: 'Internal server error'
    });
  }
});