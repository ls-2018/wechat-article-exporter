import { CommentReplyService } from '~/services/commentReplyService';

export interface CommentReplyAsset {
  fakeid: string;
  url: string;
  title: string;
  data: any;
  contentID: string;
}

/**
 * 更新 comment 缓存
 * @param reply 缓存
 */
export async function updateCommentReplyCache(reply: CommentReplyAsset): Promise<boolean> {
  try {
    await CommentReplyService.upsertCommentReply(reply);
    return true;
  } catch (error) {
    console.error('更新comment回复缓存失败:', error);
    return false;
  }
}

/**
 * 获取 comment 缓存
 * @param url
 * @param contentID
 */
export async function getCommentReplyCache(url: string, contentID: string): Promise<CommentReplyAsset | undefined> {
  try {
    return await CommentReplyService.getCommentReply(url, contentID);
  } catch (error) {
    console.error('获取comment回复缓存失败:', error);
    return undefined;
  }
}
