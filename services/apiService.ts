import type { ApiCall } from '~/server/services/apiService';

/**
 * API调用记录服务
 */
export class ApiService {
  /**
   * 创建API调用记录
   */
  static async createApiCall(apiCall: Omit<ApiCall, 'id' | 'created_at'>) {
    const response = await $fetch('/api/db/api', {
      method: 'POST',
      body: apiCall,
    });
    return response;
  }

  /**
   * 获取API调用记录
   */
  static async getApiCalls(fakeids?: string[], limit?: number) {
    const response = await $fetch('/api/db/api', {
      method: 'GET',
      query: {
        fakeids: fakeids?.join(','),
        limit:limit,
      },
    });
    return response.data;
  }
  /**
   * queryAPICall
   */
  static async queryAPICall(account: string, start: number, end: number) {
    const response = await $fetch('/api/db/api', {
      method: 'GET',
      query: {
        fakeids: account,
        start: start,
        end: end,
      },
    });
    return response.data;
  }

  /**
   * 删除API调用记录
   */
  static async deleteApiCalls(fakeids: string[]) {
    const response = await $fetch('/api/db/api', {
      method: 'DELETE',
      body: { fakeids },
    });
    return response;
  }

  /**
   * 清理旧的API调用记录
   */
  static async cleanupOldApiCalls(daysToKeep = 7) {
    const response = await $fetch('/api/db/api/cleanup', {
      method: 'POST',
      body: { daysToKeep },
    });
    return response;
  }
}
