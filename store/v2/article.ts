import type { PublishInfo, PublishPage, AppMsgExWithFakeID } from '~/types/types';
import { ArticleService } from '~/services/articleService';
import { type Info, updateInfoCache } from './info';

export type ArticleAsset = AppMsgExWithFakeID;

/**
 * 更新文章缓存
 * @param account
 * @param publish_page
 */
export async function updateArticleCache(account: Info, publish_page: PublishPage) {
  const fakeid = account.fakeid;
  const total_count = publish_page.total_count;
  const publish_list = publish_page.publish_list.filter(item => !!item.publish_info);

  // 统计本次缓存成功新增的数量
  let msgCount = 0;
  let articleCount = 0;

  // 获取现有文章
  const existingArticles = await ArticleService.getArticlesByFakeId(fakeid);
  const existingIds = new Set(existingArticles.map(article => `${fakeid}:${article.aid}`));

  for (const item of publish_list) {
    let publish_info: PublishInfo;
    try {
      publish_info = JSON.parse(item.publish_info);
    } catch (error) {
      console.error('解析 publish_info 失败:', error);
      console.error('原始数据:', item.publish_info);
      continue; // 跳过这个条目
    }
    let newEntryCount = 0;

    for (const article of publish_info.appmsgex) {
      const articleId = `${fakeid}:${article.aid}`;
      const articleData = { ...article, fakeid };
      
      try {
        await ArticleService.upsertArticle(articleData);
        if (!existingIds.has(articleId)) {
          newEntryCount++;
          articleCount++;
        }
      } catch (error) {
        console.error('保存文章失败:', error);
      }
    }

    if (newEntryCount > 0) {
      // 新增成功
      msgCount++;
    }
  }

  await updateInfoCache({
    fakeid: fakeid,
    completed: publish_list.length === 0,
    count: msgCount,
    articles: articleCount,
    nickname: account.nickname,
    round_head_img: account.round_head_img,
    total_count: total_count,
  });
}

/**
 * 检查是否存在指定时间之前的缓存
 * @param fakeid 公众号id
 * @param create_time 创建时间
 */
export async function hitCache(fakeid: string, create_time: number): Promise<boolean> {
  try {
    const articles = await ArticleService.getArticlesByFakeId(fakeid);
    const count = articles.filter(article => article.create_time < create_time).length;
    return count > 0;
  } catch (error) {
    console.error('检查缓存失败:', error);
    return false;
  }
}

/**
 * 读取缓存中的指定时间之前的历史文章
 * @param fakeid 公众号id
 * @param create_time 创建时间
 */
export async function getArticleCache(fakeid: string, create_time: number): Promise<AppMsgExWithFakeID[]> {
  try {
    const articles = await ArticleService.getArticlesByFakeId(fakeid);
    return articles
      .filter(article => article.create_time < create_time)
      .sort((a, b) => b.create_time - a.create_time);
  } catch (error) {
    console.error('读取文章缓存失败:', error);
    return [];
  }
}

/**
 * 根据 url 获取文章对象
 * @param url
 */
export async function getArticleByLink(url: string): Promise<AppMsgExWithFakeID> {
  try {
    const article = await ArticleService.getArticleByLink(url);
    if (!article) {
      throw new Error(`Article(${url}) does not exist`);
    }
    return article;
  } catch (error) {
    console.error('获取文章失败:', error);
    throw error;
  }
}

/**
 * 文章被删除
 * @param url
 */
export async function articleDeleted(url: string): Promise<void> {
  try {
    const article = await ArticleService.getArticleByLink(url);
    if (article) {
      await ArticleService.upsertArticle({
        ...article,
        is_deleted: true
      });
    }
  } catch (error) {
    console.error('标记文章删除失败:', error);
  }
}
