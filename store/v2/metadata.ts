import { MetadataService } from '~/services/metadataService';
import type { ArticleMetadata } from '~/utils/download/types';

export type Metadata = ArticleMetadata & {
  fakeid: string;
  url: string;
  title: string;
};

/**
 * 更新 metadata
 * @param metadata
 */
export async function updateMetadataCache(metadata: Metadata): Promise<boolean> {
  try {
    await MetadataService.upsertMetadata(metadata);
    return true;
  } catch (error) {
    console.error('更新metadata缓存失败:', error);
    return false;
  }
}

/**
 * 获取 metadata
 * @param url
 */
export async function getMetadataCache(url: string): Promise<Metadata | undefined> {
  try {
    return await MetadataService.getMetadata(url);
  } catch (error) {
    console.error('获取metadata缓存失败:', error);
    return undefined;
  }
}
