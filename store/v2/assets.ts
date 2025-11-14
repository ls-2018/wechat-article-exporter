import { AssetService } from '~/services/assetService';

interface Asset {
  url: string;
  file: Blob;
  fakeid: string;
}

export type { Asset };

/**
 * 更新 asset 缓存
 * @param asset
 */
export async function updateAssetCache(asset: Asset): Promise<boolean> {
  try {
    await AssetService.upsertAsset(asset);
    return true;
  } catch (error) {
    console.error('更新asset缓存失败:', error);
    return false;
  }
}

/**
 * 获取 asset 缓存
 * @param url
 */
export async function getAssetCache(url: string): Promise<Asset | undefined> {
  try {
    return await AssetService.getAsset(url);
  } catch (error) {
    console.error('获取asset缓存失败:', error);
    return undefined;
  }
}
