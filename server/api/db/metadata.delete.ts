import { getDbPool } from '~/server/utils/database';

export default defineEventHandler(async event => {
  const db = await getDbPool();

  try {
    // 删除元数据
    const body = await readBody(event);
    const url = body.url as string;
    const fakeid = body.fakeid as string;

    if (fakeid) {
      await db.execute('DELETE FROM metadata WHERE fakeid = ? ', [fakeid]);
    } else if (url) {
      await db.execute('DELETE FROM metadata WHERE url = ?', [url]);
    } else {
      throw new Error(`unknown type`);
    }

    return {
      success: true,
      message: 'Metadata deleted successfully',
    };
  } catch (error) {
    console.error('Error handling metadata:', error);
    throw createError({
      statusCode: 500,
      statusMessage: 'Internal server error',
    });
  }
});
