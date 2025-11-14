import { getComment } from '~/server/services/commentService';

/**
 * 获取评论
 */
export default defineEventHandler(async (event) => {
  try {
    const query = getQuery(event);
    const url = query.url as string;
    
    if (!url) {
      throw createError({
        statusCode: 400,
        statusMessage: '缺少url参数'
      });
    }
    
    const comment = await getComment(url);
    
    return {
      success: true,
      data: { comment },
      message: comment ? '评论获取成功' : '评论不存在'
    };
  } catch (error) {
    console.error('获取评论失败:', error);
    throw createError({
      statusCode: 500,
      statusMessage: '获取评论失败'
    });
  }
});