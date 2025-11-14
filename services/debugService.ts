import type { DebugAsset } from '~/store/v2/debug';

/**
 * 调试信息服务
 */
export class DebugService {
  /**
   * 创建或更新调试信息
   */
  static async upsertDebugInfo(debugInfo: Omit<DebugAsset, 'id' | 'created_at'>) {
    const response = await $fetch('/api/db/debug', {
      method: 'POST',
      body: debugInfo
    });
    return response;
  }

  /**
   * 获取调试信息
   */
  static async getDebugInfo(url: string) {
    const response = await $fetch('/api/db/debug', {
      method: 'GET',
      query: { url }
    });
    return response.data;
  }

  /**
   * 获取所有调试信息
   */
  static async getAllDebugInfo(fakeid: string) {
    const response = await $fetch('/api/db/debug', {
      method: 'GET',
      query: { fakeid }
    });
    return response.data;
  }

  /**
   * 下载调试文件数据
   */
  static async downloadDebugFile(url: string) {
    const response = await $fetch('/api/db/debug', {
      method: 'GET',
      query: { url, download: 'true' }
    });
    return response;
  }

  /**
   * 批量删除调试信息
   */
  static async deleteDebugInfoByFakeIds(fakeids: string[]) {
    const response = await $fetch('/api/db/debug', {
      method: 'DELETE',
      body: { fakeids }
    });
    return response;
  }
}