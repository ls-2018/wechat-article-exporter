import { 
  createApiCall, 
  getApiCalls, 
  deleteApiCallsByFakeIds,
  cleanupOldApiCalls 
} from '~/server/services/apiService';
import type { APICall } from '~/store/v2/api';

/**
 * 创建API调用记录
 */
export default defineEventHandler(async (event) => {
  try {
    const body = await readBody<APICall>(event);
    
    if (!body.name || !body.account || !body.call_time) {
      throw createError({
        statusCode: 400,
        statusMessage: '缺少必需参数'
      });
    }
    
    const id = await createApiCall(body);
    
    return {
      success: true,
      data: { id },
      message: 'API调用记录创建成功'
    };
  } catch (error) {
    console.error('创建API调用记录失败:', error);
    throw createError({
      statusCode: 500,
      statusMessage: '创建API调用记录失败'
    });
  }
});