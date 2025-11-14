import { getDbPool } from '~/server/utils/database';

export default defineEventHandler(async event => {
  const db = await getDbPool();

  try {
    // 获取元数据
    const query = getQuery(event);

    const url = query.url as string;
    const fakeid = query.fakeid as string;
    let rows: any[];
    if (fakeid) {
      rows = await db.execute('SELECT * FROM metadata WHERE fakeid = ? LIMIT 1', [fakeid]);
    } else if (url) {
      rows = await db.execute('SELECT * FROM metadata WHERE url = ? LIMIT 1', [url]);
    } else {
      throw new Error(`unknown type`);
    }

    if (!Array.isArray(rows) || rows.length === 0) {
      return {
        success: true,
        data: null,
      };
    }

    return {
      success: true,
      data: rows[0],
    };
  } catch (error) {
    console.error('Error handling metadata:', error);
    throw createError({
      statusCode: 500,
      statusMessage: 'Internal server error',
    });
  }
});
