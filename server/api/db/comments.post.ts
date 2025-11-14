import { upsertComment, getComment } from '~/server/services/commentService';
import type { CommentAsset } from '~/store/v2/comment';

/**
 * 创建或更新评论
 */
export default defineEventHandler(async (event) => {
  try {
    const body = await readBody<CommentAsset>(event);
    const { url, fakeid, title, data } = body;
    
    if (!url || !fakeid || !title || !data) {
      throw createError({
        statusCode: 400,
        statusMessage: '缺少必需参数'
      });
    }
    
    const resultUrl = await upsertComment(body);
    
    return {
      success: true,
      data: { url: resultUrl },
      message: '评论更新成功'
    };
  } catch (error) {
    console.error('评论更新失败:', error);
    throw createError({
      statusCode: 500,
      statusMessage: '评论更新失败'
    });
  }
});