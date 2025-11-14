import { getDbPool } from '~/server/utils/database';

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event);
    const { fakeid } = body;

    if (!fakeid) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Missing key parameter'
      });
    }

    const db = await getDbPool();
    
    const [result] = await db.execute(
      'DELETE FROM info WHERE `fakeid` = ?',
      [fakeid]
    );

    return {
      success: true,
      message: 'Info deleted successfully'
    };
  } catch (error) {
    console.error('Error deleting info:', error);
    throw createError({
      statusCode: 500,
      statusMessage: 'Internal server error'
    });
  }
});