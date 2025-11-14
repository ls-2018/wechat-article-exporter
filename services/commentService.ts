import type { CommentAsset } from '~/store/v2/comment';

/**
 * 评论服务
 */
export class CommentService {
  /**
   * 创建或更新评论
   */
  static async upsertComment(comment: Omit<CommentAsset, 'id' | 'created_at'>) {
    const response = await $fetch('/api/db/comments', {
      method: 'POST',
      body: comment
    });
    return response;
  }

  /**
   * 获取评论
   */
  static async getComment(url: string) {
    const response = await $fetch('/api/db/comments', {
      method: 'GET',
      query: { url }
    });
    return response.data;
  }

  /**
   * 批量删除评论
   */
  static async deleteCommentsByFakeIds(fakeids: string[]) {
    const response = await $fetch('/api/db/comments', {
      method: 'DELETE',
      body: { fakeids }
    });
    return response;
  }
}