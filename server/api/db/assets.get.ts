import { getAsset, getAssetData } from '~/server/services/assetService';

/**
 * 获取资源文件
 */
export default defineEventHandler(async (event) => {
  try {
    const query = getQuery(event);
    const url = query.url as string;
    const download = query.download === 'true';
    
    if (!url) {
      throw createError({
        statusCode: 400,
        statusMessage: '缺少url参数'
      });
    }
    
    if (download) {
      // 下载文件数据
      const fileData = await getAssetData(url);
      if (!fileData) {
        throw createError({
          statusCode: 404,
          statusMessage: '文件不存在'
        });
      }
      
      const asset = await getAsset(url);
      const fileName = url.split('/').pop() || 'file';
      
      setHeader(event, 'Content-Type', asset?.file_type || 'application/octet-stream');
      setHeader(event, 'Content-Disposition', `attachment; filename="${fileName}"`);
      
      return fileData;
    } else {
      // 获取文件信息
      const asset = await getAsset(url);
      if (!asset) {
        throw createError({
          statusCode: 404,
          statusMessage: '文件不存在'
        });
      }
      
      return {
        success: true,
        data: asset,
        message: '资源文件获取成功'
      };
    }
  } catch (error) {
    console.error('获取资源文件失败:', error);
    throw createError({
      statusCode: 500,
      statusMessage: '获取资源文件失败'
    });
  }
});