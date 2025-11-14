import { upsertDebugInfo, getDebugInfo, getAllDebugInfo, getDebugFileData } from '~/server/services/debugService';
import type { DebugAsset } from '~/store/v2/debug';

/**
 * 创建或更新调试信息
 */
export default defineEventHandler(async (event) => {
  try {
    const body = await readBody<DebugAsset>(event);
    const { url, fakeid, title, data } = body;
    
    if (!url || !fakeid || !title || !data) {
      throw createError({
        statusCode: 400,
        statusMessage: '缺少必需参数'
      });
    }
    
    const resultUrl = await upsertDebugInfo(body);
    
    return {
      success: true,
      data: { url: resultUrl },
      message: '调试信息更新成功'
    };
  } catch (error) {
    console.error('调试信息更新失败:', error);
    throw createError({
      statusCode: 500,
      statusMessage: '调试信息更新失败'
    });
  }
});