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
      'DELETE FROM html_content WHERE fakeid = ?',
      [fakeid]
    );

    return {
      success: true,
      message: 'HTML content deleted successfully by fakeid'
    };
  } catch (error) {
    console.error('Error deleting HTML content by fakeid:', error);
    throw createError({
      statusCode: 500,
      statusMessage: 'Internal server error'
    });
  }
});