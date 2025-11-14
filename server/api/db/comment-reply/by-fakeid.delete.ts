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
    
    await db.execute(
      'DELETE FROM comment_replies WHERE fakeid = ?',
      [fakeid]
    );

    return {
      success: true,
      message: 'Comment replies deleted successfully by fakeid'
    };
  } catch (error) {
    console.error('Error deleting comment replies by fakeid:', error);
    throw createError({
      statusCode: 500,
      statusMessage: 'Internal server error'
    });
  }
});