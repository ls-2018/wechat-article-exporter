import { getApiCalls } from '~/server/services/apiService';

/**
 * 查询API调用记录
 */
export default defineEventHandler(async (event) => {
  try {
    const query = getQuery(event);
    const account = query.account as string;
    const start = parseInt(query.start as string) || 0;
    const end = parseInt(query.end as string) || Date.now();
    
    if (!account) {
      throw createError({
        statusCode: 400,
        statusMessage: '缺少account参数'
      });
    }
    
    const records = await getApiCalls(account, start, end);
    
    return {
      success: true,
      data: records,
      message: 'API调用记录查询成功'
    };
  } catch (error) {
    console.error('查询API调用记录失败:', error);
    throw createError({
      statusCode: 500,
      statusMessage: '查询API调用记录失败'
    });
  }
});