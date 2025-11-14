import { upsertAsset, getAsset, getAssetData } from '~/server/services/assetService';
import type { Asset } from '~/store/v2/assets';

/**
 * 创建或更新资源文件
 */
export default defineEventHandler(async (event) => {
  try {
    const body = await readBody<Asset>(event);
    const { url, fakeid, file } = body;
    
    if (!url || !fakeid || !file) {
      throw createError({
        statusCode: 400,
        statusMessage: '缺少必需参数'
      });
    }
    
    const resultUrl = await upsertAsset(body);
    
    return {
      success: true,
      data: { url: resultUrl },
      message: '资源文件更新成功'
    };
  } catch (error) {
    console.error('资源文件更新失败:', error);
    throw createError({
      statusCode: 500,
      statusMessage: '资源文件更新失败'
    });
  }
});