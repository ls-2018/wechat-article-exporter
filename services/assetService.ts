import type { Asset } from '~/store/v2/assets';

/**
 * 资源文件服务
 */
export class AssetService {
  /**
   * 创建或更新资源文件
   */
  static async upsertAsset(asset: Omit<Asset, 'id' | 'created_at'>) {
    const response = await $fetch('/api/db/assets', {
      method: 'POST',
      body: asset
    });
    return response;
  }

  /**
   * 获取资源文件信息
   */
  static async getAsset(url: string) {
    const response = await $fetch('/api/db/assets', {
      method: 'GET',
      query: { url }
    });
    return response.data;
  }

  /**
   * 下载资源文件数据
   */
  static async downloadAsset(url: string) {
    const response = await $fetch('/api/db/assets', {
      method: 'GET',
      query: { url, download: 'true' }
    });
    return response;
  }

  /**
   * 清理资源文件
   */
  static async cleanupAssets(maxSize: number) {
    const response = await $fetch('/api/db/assets/cleanup', {
      method: 'POST',
      body: { maxSize }
    });
    return response;
  }
}