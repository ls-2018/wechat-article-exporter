import { upsertArticle, batchUpsertArticles, getArticleByLink, checkArticleCache, getArticleCache, markArticleDeleted } from '~/server/services/articleService';
import type { AppMsgExWithFakeID } from '~/types/types';

/**
 * 创建或更新文章
 */
export default defineEventHandler(async (event) => {
  try {
    const body = await readBody<AppMsgExWithFakeID | AppMsgExWithFakeID[]>(event);
    
    let result: string | string[];
    
    if (Array.isArray(body)) {
      // 批量操作
      if (body.length === 0) {
        return {
          success: true,
          data: [],
          message: '批量文章更新成功'
        };
      }
      result = await batchUpsertArticles(body);
    } else {
      // 单个操作
      if (!body.fakeid || !body.aid) {
        throw createError({
          statusCode: 400,
          statusMessage: '缺少必需参数'
        });
      }
      result = await upsertArticle(body);
    }
    
    return {
      success: true,
      data: { ids: result },
      message: Array.isArray(body) ? '批量文章更新成功' : '文章更新成功'
    };
  } catch (error) {
    console.error('文章更新失败:', error);
    throw createError({
      statusCode: 500,
      statusMessage: '文章更新失败'
    });
  }
});