import { getDebugInfo, getAllDebugInfo, getDebugFileData } from '~/server/services/debugService';

/**
 * 获取调试信息
 */
export default defineEventHandler(async (event) => {
  try {
    const query = getQuery(event);
    const url = query.url as string;
    const download = query.download === 'true';
    const fakeid = query.fakeid as string;
    
    if (download && url) {
      // 下载调试文件数据
      const fileData = await getDebugFileData(url);
      if (!fileData) {
        throw createError({
          statusCode: 404,
          statusMessage: '调试文件不存在'
        });
      }
      
      const debugInfo = await getDebugInfo(url);
      const fileName = url.split('/').pop() || 'debug.json';
      
      setHeader(event, 'Content-Type', 'application/json');
      setHeader(event, 'Content-Disposition', `attachment; filename="${fileName}"`);
      
      return fileData;
    } else if (url) {
      // 获取单个调试信息
      const debugInfo = await getDebugInfo(url);
      return {
        success: true,
        data: { debugInfo },
        message: debugInfo ? '调试信息获取成功' : '调试信息不存在'
      };
    } else if (fakeid) {
      // 获取公众号的所有调试信息
      const debugInfoList = await getAllDebugInfo(fakeid);
      return {
        success: true,
        data: { debugInfoList },
        message: '调试信息列表获取成功'
      };
    } else {
      throw createError({
        statusCode: 400,
        statusMessage: '缺少必需参数'
      });
    }
  } catch (error) {
    console.error('获取调试信息失败:', error);
    throw createError({
      statusCode: 500,
      statusMessage: '获取调试信息失败'
    });
  }
});