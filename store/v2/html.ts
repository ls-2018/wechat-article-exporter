import { HtmlService } from '~/services/htmlService';

export interface HtmlAsset {
  fakeid: string;
  url: string;
  file: Blob;
  title: string;
  commentID: string | null;
}

/**
 * 更新 html 缓存
 * @param html 缓存
 */
export async function updateHtmlCache(html: HtmlAsset): Promise<boolean> {
  try {
    await HtmlService.upsertHtml(html);
    return true;
  } catch (error) {
    console.error('更新html缓存失败:', error);
    return false;
  }
}

/**
 * 获取 asset 缓存
 * @param url
 */
export async function getHtmlCache(url: string): Promise<HtmlAsset | undefined> {
  try {
    return await HtmlService.getHtml(url);
  } catch (error) {
    console.error('获取html缓存失败:', error);
    return undefined;
  }
}
