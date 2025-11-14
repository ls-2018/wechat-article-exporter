import { getDbPool } from '~/server/utils/database';

export default defineEventHandler(async (event) => {
  try {
    const db = await getDbPool();
    
    // 获取各个表的统计信息
    const stats : Record<string, number>= {};
    
    // 统计各个表的数据量
    const tables = [
      'accounts',
      'articles', 
      'assets',
      'comments',
      'comment_replies',
      'debug_info',
      'html_content',
      'metadata',
      'resource_maps',
      'resources',
      'api_calls',
      'info'
    ];
    
    for (const table of tables) {
      try {
        const [rows] = await db.execute(`SELECT COUNT(*) as count FROM \`${table}\``);
        if (Array.isArray(rows) && rows.length !== 0) {
          stats[table] = (rows as any)[0].count;
        }
      } catch (error) {
        // 如果表不存在，跳过
        stats[table] = 0;
      }
    }
    
    // 获取公众号统计
    const [accountStats] = await db.execute(`
      SELECT 
        COUNT(*) as total_accounts,
        SUM(CASE WHEN completed = 1 THEN 1 ELSE 0 END) as completed_accounts,
        SUM(total_count) as total_articles,
        SUM(count) as synced_articles
      FROM accounts
    `);
    
    // 获取文章统计
    const [articleStats] = await db.execute(`
      SELECT 
        COUNT(*) as total_articles,
        SUM(CASE WHEN is_deleted = 1 THEN 1 ELSE 0 END) as deleted_articles,
        COUNT(DISTINCT fakeid) as unique_accounts
      FROM articles
    `);
    
    // 获取资源统计
    const [assetStats] = await db.execute(`
      SELECT 
        COUNT(*) as total_assets,
        SUM(file_size) as total_size,
        COUNT(DISTINCT fakeid) as accounts_with_assets
      FROM assets
      WHERE file_size IS NOT NULL
    `);
    
    // 获取API调用统计
    const [apiCallStats] = await db.execute(`
      SELECT 
        COUNT(*) as total_calls,
        SUM(CASE WHEN is_normal = 1 THEN 1 ELSE 0 END) as normal_calls,
        SUM(CASE WHEN is_normal = 0 THEN 1 ELSE 0 END) as error_calls,
        COUNT(DISTINCT account) as unique_accounts
      FROM api_calls
    `);
    
    return {
      success: true,
      data: {
        table_counts: stats,
        account_stats: accountStats[0],
        article_stats: articleStats[0],
        asset_stats: assetStats[0] || { total_assets: 0, total_size: 0, accounts_with_assets: 0 },
        api_call_stats: apiCallStats[0]
      }
    };
  } catch (error) {
    console.error('Error getting database stats:', error);
    throw createError({
      statusCode: 500,
      statusMessage: 'Internal server error'
    });
  }
});