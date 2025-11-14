import { DebugService } from '~/services/debugService';

export interface DebugAsset {
  type: string;
  url: string;
  file: Blob;
  title: string;
  fakeid: string;
}

/**
 * 更新 html 缓存
 * @param html 缓存
 */
export async function updateDebugCache(html: DebugAsset): Promise<boolean> {
  try {
    await DebugService.upsertDebugInfo(html);
    return true;
  } catch (error) {
    console.error('更新debug缓存失败:', error);
    return false;
  }
}

/**
 * 获取 asset 缓存
 * @param url
 */
export async function getDebugCache(url: string): Promise<DebugAsset | undefined> {
  try {
    return await DebugService.getDebugInfo(url);
  } catch (error) {
    console.error('获取debug缓存失败:', error);
    return undefined;
  }
}

export async function getDebugInfo(): Promise<DebugAsset[]> {
  try {
    return await DebugService.getAllDebugInfo();
  } catch (error) {
    console.error('获取所有debug信息失败:', error);
    return [];
  }
}
