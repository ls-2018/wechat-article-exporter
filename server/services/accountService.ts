import { getDbPool, type RowDataPacket, type ResultSetHeader } from '~/server/utils/database';

/**
 * 删除指定公众号的所有相关数据
 */
export async function deleteAccountData(fakeIds: string[]): Promise<{
  apiCalls: number;
  articles: number;
  assets: number;
  comments: number;
  commentReplies: number;
  debugInfo: number;
  htmlContent: number;
  accounts: number;
  metadata: number;
  resources: number;
  resourceMaps: number;
}> {
  const pool = getDbPool();
  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();
    
    if (fakeIds.length === 0) {
      return {
        apiCalls: 0,
        articles: 0,
        assets: 0,
        comments: 0,
        commentReplies: 0,
        debugInfo: 0,
        htmlContent: 0,
        accounts: 0,
        metadata: 0,
        resources: 0,
        resourceMaps: 0
      };
    }
    
    const placeholders = fakeIds.map(() => '?').join(',');
    
    // 删除各个表中的数据
    const [apiResult] = await connection.execute<ResultSetHeader>(
      `DELETE FROM api_calls WHERE account IN (${placeholders})`, fakeIds
    );
    
    const [articleResult] = await connection.execute<ResultSetHeader>(
      `DELETE FROM articles WHERE fakeid IN (${placeholders})`, fakeIds
    );
    
    const [assetResult] = await connection.execute<ResultSetHeader>(
      `DELETE FROM assets WHERE fakeid IN (${placeholders})`, fakeIds
    );
    
    const [commentResult] = await connection.execute<ResultSetHeader>(
      `DELETE FROM comments WHERE fakeid IN (${placeholders})`, fakeIds
    );
    
    const [commentReplyResult] = await connection.execute<ResultSetHeader>(
      `DELETE FROM comment_replies WHERE fakeid IN (${placeholders})`, fakeIds
    );
    
    const [debugResult] = await connection.execute<ResultSetHeader>(
      `DELETE FROM debug_info WHERE fakeid IN (${placeholders})`, fakeIds
    );
    
    const [htmlResult] = await connection.execute<ResultSetHeader>(
      `DELETE FROM html_content WHERE fakeid IN (${placeholders})`, fakeIds
    );
    
    const [accountResult] = await connection.execute<ResultSetHeader>(
      `DELETE FROM accounts WHERE fakeid IN (${placeholders})`, fakeIds
    );
    
    const [metadataResult] = await connection.execute<ResultSetHeader>(
      `DELETE FROM metadata WHERE fakeid IN (${placeholders})`, fakeIds
    );
    
    const [resourceResult] = await connection.execute<ResultSetHeader>(
      `DELETE FROM resources WHERE fakeid IN (${placeholders})`, fakeIds
    );
    
    const [resourceMapResult] = await connection.execute<ResultSetHeader>(
      `DELETE FROM resource_maps WHERE fakeid IN (${placeholders})`, fakeIds
    );
    
    await connection.commit();
    
    return {
      apiCalls: apiResult.affectedRows,
      articles: articleResult.affectedRows,
      assets: assetResult.affectedRows,
      comments: commentResult.affectedRows,
      commentReplies: commentReplyResult.affectedRows,
      debugInfo: debugResult.affectedRows,
      htmlContent: htmlResult.affectedRows,
      accounts: accountResult.affectedRows,
      metadata: metadataResult.affectedRows,
      resources: resourceResult.affectedRows,
      resourceMaps: resourceMapResult.affectedRows
    };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

/**
 * 获取数据库统计信息
 */
export async function getDatabaseStats(): Promise<{
  totalApiCalls: number;
  totalArticles: number;
  totalAssets: number;
  totalComments: number;
  totalDebugInfo: number;
  totalAccounts: number;
  databaseSize: string;
}> {
  const pool = getDbPool();
  
  // 获取各个表的记录数
  const [[apiRows], [articleRows], [assetRows], [commentRows], [debugRows], [accountRows]] = 
    await Promise.all([
      pool.execute<RowDataPacket[]>('SELECT COUNT(*) as count FROM api_calls'),
      pool.execute<RowDataPacket[]>('SELECT COUNT(*) as count FROM articles'),
      pool.execute<RowDataPacket[]>('SELECT COUNT(*) as count FROM assets'),
      pool.execute<RowDataPacket[]>('SELECT COUNT(*) as count FROM comments'),
      pool.execute<RowDataPacket[]>('SELECT COUNT(*) as count FROM debug_info'),
      pool.execute<RowDataPacket[]>('SELECT COUNT(*) as count FROM accounts')
    ]);
  
  // 获取数据库大小（MySQL特定查询）
  let databaseSize = '0 MB';
  try {
    const [sizeRows] = await pool.execute<RowDataPacket[]>(
      `SELECT ROUND(SUM(data_length + index_length) / 1024 / 1024, 2) as size 
       FROM information_schema.tables 
       WHERE table_schema = DATABASE()`
    );
    databaseSize = sizeRows[0]?.size ? `${sizeRows[0].size} MB` : '0 MB';
  } catch (error) {
    console.warn('无法获取数据库大小:', error);
  }
  
  return {
    totalApiCalls: apiRows[0]?.count || 0,
    totalArticles: articleRows[0]?.count || 0,
    totalAssets: assetRows[0]?.count || 0,
    totalComments: commentRows[0]?.count || 0,
    totalDebugInfo: debugRows[0]?.count || 0,
    totalAccounts: accountRows[0]?.count || 0,
    databaseSize
  };
}