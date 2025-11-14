import { CommentService } from '~/services/commentService';

export interface CommentAsset {
  fakeid: string;
  url: string;
  title: string;
  data: any;
}

/**
 * 更新 comment 缓存
 * @param comment 缓存
 */
export async function updateCommentCache(comment: CommentAsset): Promise<boolean> {
  try {
    await CommentService.upsertComment(comment);
    return true;
  } catch (error) {
    console.error('更新comment缓存失败:', error);
    return false;
  }
}

/**
 * 获取 comment 缓存
 * @param url
 */
export async function getCommentCache(url: string): Promise<CommentAsset | undefined> {
  try {
    return await CommentService.getComment(url);
  } catch (error) {
    console.error('获取comment缓存失败:', error);
    return undefined;
  }
}
