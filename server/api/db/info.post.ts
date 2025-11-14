import { getDbPool } from '~/server/utils/database';

export default defineEventHandler(async event => {
  try {
    const body = await readBody(event);

    const infoCache = {
      fakeid: body.fakeid,
      completed: body?.completed ?? false,
      count: body?.count ?? 0,
      articles: body?.articles ?? 0,
      nickname: body?.nickname ?? '',
      round_head_img: body?.round_head_img ?? '',
      total_count: body?.total_count ?? 0,
      create_time: Math.round(Date.now() / 1000),
      update_time: Math.round(Date.now() / 1000),
    };

    if (!body.fakeid) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Missing required fields: fakeid and value',
      });
    }

    const db = await getDbPool();

    // 使用 INSERT ... ON DUPLICATE KEY UPDATE 来实现 upsert
    await db.execute(
      `INSERT INTO info (\`fakeid\`, \`completed\`, \`count\`, \`articles\`, \`nickname\`, \`round_head_img\`, \`total_count\`, \`create_time\`, \`update_time\`, \`last_update_time\`) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?) 
       ON DUPLICATE KEY UPDATE 
       \`completed\` = VALUES(\`completed\`),
       \`count\` = VALUES(\`count\`),
       \`articles\` = VALUES(\`articles\`),
       \`nickname\` = VALUES(\`nickname\`),
       \`round_head_img\` = VALUES(\`round_head_img\`),
       \`total_count\` = VALUES(\`total_count\`),
       \`update_time\` = VALUES(\`update_time\`),
       \`last_update_time\` = VALUES(\`last_update_time\`)`,
      [
        infoCache.fakeid,
        infoCache.completed,
        infoCache.count,
        infoCache.articles,
        infoCache.nickname,
        infoCache.round_head_img,
        infoCache.total_count,
        infoCache.create_time,
        infoCache.update_time,
        infoCache.update_time,
      ]
    );

    return {
      success: true,
      message: 'Info upserted successfully',
    };
  } catch (error) {
    console.error('Error upserting info:', error);
    throw createError({
      statusCode: 500,
      statusMessage: 'Internal server error',
    });
  }
});
