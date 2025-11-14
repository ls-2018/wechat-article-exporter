import type { Article } from '~/server/services/articleService';
import type { AppMsgExWithFakeID } from '~/types/types';

/**
 * 文章服务
 */
export class ArticleService {
  /**
   * 创建或更新文章
   */
  static async upsertArticle(article: Omit<Article, 'id'>) {
    const response = await $fetch('/api/db/articles', {
      method: 'POST',
      body: article
    });
    return response;
  }

  /**
   * 批量创建或更新文章
   */
  static async batchUpsertArticles(articles: Omit<Article, 'id'>[]) {
    const response = await $fetch('/api/db/articles', {
      method: 'POST',
      body: { articles }
    });
    return response;
  }

  /**
   * 通过链接获取文章
   */
  static async getArticleByLink(link: string) {
    const response = await $fetch('/api/db/articles', {
      method: 'GET',
      query: { link }
    });
    return response.data;
  }

  /**
   * 获取历史文章
   */
  static async getArticleHistory(fakeid: string, limit = 10) {
    const response = await $fetch('/api/db/articles', {
      method: 'GET',
      query: { fakeid, limit }
    });
    return response.data;
  }

  /**
   * 获取缓存计数
   */
  static async getCacheCount(fakeid: string, time?: number) {
    const response = await $fetch('/api/db/articles/cache', {
      method: 'GET',
      query: { fakeid, time }
    });
    return response.data;
  }

  /**
   * 通过fakeid获取文章列表
   */
  static async getArticlesByFakeId(fakeid: string) {
    const response = await $fetch('/api/db/articles', {
      method: 'GET',
      query: { fakeid }
    });
    return response.data.articles;
  }

  /**
   * 标记文章为已删除
   */
  static async markArticleDeleted(url: string) {
    const response = await $fetch('/api/db/articles', {
      method: 'DELETE',
      body: { url }
    });
    return response;
  }

  /**
   * 删除文章
   */
  static async deleteArticle(url: string) {
    const response = await $fetch('/api/db/articles', {
      method: 'DELETE',
      body: { url, hardDelete: true }
    });
    return response;
  }

  /**
   * 批量删除文章
   */
  static async deleteArticlesByFakeIds(fakeids: string[]) {
    const response = await $fetch('/api/db/articles', {
      method: 'DELETE',
      body: { fakeids }
    });
    return response;
  }
}