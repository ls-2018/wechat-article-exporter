import { getDbPool } from '~/server/utils/database';

export default defineEventHandler(async event => {
  try {
    const query = getQuery(event);
    const { fakeid } = query;
    const db = await getDbPool();

    if (!fakeid) {
      const [rows] = await db.execute('SELECT * FROM info');
      return {
        success: true,
        data: rows,
      };
    }

    const [rows] = await db.execute('SELECT * FROM info WHERE `fakeid` = ?', [fakeid]);

    if (Array.isArray(rows) && rows.length > 0) {
      return {
        success: true,
        data: rows[0],
      };
    } else {
      return {
        success: true,
        data: undefined,
      };
    }
  } catch (error) {
    console.error('Error getting info:', error);
    throw createError({
      statusCode: 500,
      statusMessage: 'Internal server error',
    });
  }
});
