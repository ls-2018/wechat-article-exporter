import { getArticleByLink, checkArticleCache, getArticleCache, getArticlesByFakeId } from '~/server/services/articleService';

/**
 * 查询文章
 */
export default defineEventHandler(async (event) => {
  try {
    const query = getQuery(event);
    const url = query.url as string;
    const fakeid = query.fakeid as string;
    const create_time = query.create_time ? parseInt(query.create_time as string) : undefined;
    const check_cache = query.check_cache === 'true';
    
    // 检查缓存是否存在
    if (check_cache && fakeid && create_time) {
      const exists = await checkArticleCache(fakeid, create_time);
      return {
        success: true,
        data: { exists },
        message: '缓存检查完成'
      };
    }
    
    // 获取文章缓存
    if (fakeid && create_time) {
      const articles = await getArticleCache(fakeid, create_time);
      return {
        success: true,
        data: { articles },
        message: '文章缓存获取成功'
      };
    }
    
    // 根据fakeid获取所有文章
    if (fakeid && !create_time) {
      const articles = await getArticlesByFakeId(fakeid);
      return {
        success: true,
        data: { articles },
        message: '文章列表获取成功'
      };
    }
    
    // 根据链接获取文章
    if (url) {
      const article = await getArticleByLink(url);
      return {
        success: true,
        data: { article },
        message: '文章获取成功'
      };
    }
    
    throw createError({
      statusCode: 400,
      statusMessage: '缺少查询参数'
    });
  } catch (error) {
    console.error('文章查询失败:', error);
    throw createError({
      statusCode: 500,
      statusMessage: '文章查询失败'
    });
  }
});