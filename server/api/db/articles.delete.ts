import { markArticleDeleted } from '~/server/services/articleService';

/**
 * 标记文章为已删除
 */
export default defineEventHandler(async (event) => {
  try {
    const body = await readBody<{ url: string }>(event);
    const { url } = body;
    
    if (!url) {
      throw createError({
        statusCode: 400,
        statusMessage: '缺少url参数'
      });
    }
    
    const success = await markArticleDeleted(url);
    
    return {
      success: true,
      data: { success },
      message: success ? '文章标记删除成功' : '文章不存在'
    };
  } catch (error) {
    console.error('标记文章删除失败:', error);
    throw createError({
      statusCode: 500,
      statusMessage: '标记文章删除失败'
    });
  }
});