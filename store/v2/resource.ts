import { ResourceService } from '~/services/resourceService';

export interface ResourceAsset {
  fakeid: string;
  url: string;
  file: Blob;
}

/**
 * 更新 resource 缓存
 * @param resource 缓存
 */
export async function updateResourceCache(resource: ResourceAsset): Promise<boolean> {
  try {
    await ResourceService.upsertResource(resource);
    return true;
  } catch (error) {
    console.error('更新resource缓存失败:', error);
    return false;
  }
}

/**
 * 获取 resource 缓存
 * @param url
 */
export async function getResourceCache(url: string): Promise<ResourceAsset | undefined> {
  try {
    return await ResourceService.getResource(url);
  } catch (error) {
    console.error('获取resource缓存失败:', error);
    return undefined;
  }
}
