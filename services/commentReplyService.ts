export interface CommentReplyAsset {
  fakeid: string;
  url: string;
  reply_data: string;
  created_at?: Date;
  updated_at?: Date;
}

export class CommentReplyService {
  static async upsertCommentReply(commentReply: CommentReplyAsset): Promise<void> {
    await $fetch('/api/db/comment-reply', {
      method: 'POST',
      body: commentReply
    });
  }

  static async getCommentReply(url: string): Promise<CommentReplyAsset | undefined> {
    const response = await $fetch('/api/db/comment-reply', {
      method: 'GET',
      query: { url }
    });
    return response.data;
  }

  static async getCommentRepliesByFakeid(fakeid: string): Promise<CommentReplyAsset[]> {
    const response = await $fetch('/api/db/comment-reply/by-fakeid', {
      method: 'GET',
      query: { fakeid }
    });
    return response.data;
  }

  static async deleteCommentReply(url: string): Promise<void> {
    await $fetch('/api/db/comment-reply', {
      method: 'DELETE',
      body: { url }
    });
  }

  static async deleteCommentRepliesByFakeid(fakeid: string): Promise<void> {
    await $fetch('/api/db/comment-reply/by-fakeid', {
      method: 'DELETE',
      body: { fakeid }
    });
  }
}