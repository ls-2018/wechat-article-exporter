import { ResourceMapService } from '~/services/resourceMapService';

export interface ResourceMapAsset {
  fakeid: string;
  url: string;
  resources: string[];
}

/**
 * 更新 resource-map 缓存
 * @param resourceMap 缓存
 */
export async function updateResourceMapCache(resourceMap: ResourceMapAsset): Promise<boolean> {
  try {
    await ResourceMapService.upsertResourceMap(resourceMap);
    return true;
  } catch (error) {
    console.error('更新resource-map缓存失败:', error);
    return false;
  }
}

/**
 * 获取 resource-map 缓存
 * @param url
 */
export async function getResourceMapCache(url: string): Promise<ResourceMapAsset | undefined> {
  try {
    return await ResourceMapService.getResourceMap(url);
  } catch (error) {
    console.error('获取resource-map缓存失败:', error);
    return undefined;
  }
}
