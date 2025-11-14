import { InfoService } from '~/services/infoService';

export interface Info {
  fakeid: string;
  completed: boolean;
  count: number;
  articles: number;

  // 公众号昵称
  nickname?: string;
  // 公众号头像
  round_head_img?: string;

  // 公众号文章总数
  total_count: number;
  create_time?: number;
  update_time?: number;

  // 最后更新时间
  last_update_time?: number;
}

/**
 * 更新 info 缓存
 * @param info
 */
export async function updateInfoCache(info: Info): Promise<boolean> {
  try {
    let infoCache = await InfoService.getInfo(info.fakeid);
    if (infoCache) {
      if (info.completed) {
        infoCache.completed = info.completed;
      }
      infoCache.count += info.count;
      infoCache.articles += info.articles;
      infoCache.nickname = info.nickname;
      infoCache.round_head_img = info.round_head_img;
      infoCache.total_count = info.total_count;
      infoCache.update_time = Math.round(Date.now() / 1000);
    } else {
      infoCache = {
        fakeid: info.fakeid,
        completed: info.completed,
        count: info.count,
        articles: info.articles,
        nickname: info.nickname,
        round_head_img: info.round_head_img,
        total_count: info.total_count,
        create_time: Math.round(Date.now() / 1000),
        update_time: Math.round(Date.now() / 1000),
      };
    }
    await InfoService.upsertInfo(infoCache);
    return true;
  } catch (error) {
    console.error('更新info缓存失败:', error);
    return false;
  }
}

export async function updateLastUpdateTime(fakeid: string): Promise<boolean> {
  try {
    let infoCache = await InfoService.getInfo(fakeid);
    if (infoCache) {
      infoCache.last_update_time = Math.round(Date.now() / 1000);
      await InfoService.upsertInfo(infoCache);
    }
    return true;
  } catch (error) {
    console.error('更新最后更新时间失败:', error);
    return false;
  }
}

/**
 * 获取 info 缓存
 * @param fakeid
 */
export async function getInfoCache(fakeid: string): Promise<Info | undefined> {
  try {
    return await InfoService.getInfo(fakeid);
  } catch (error) {
    console.error('获取info缓存失败:', error);
    return undefined;
  }
}

export async function getAllInfo(): Promise<Info[]> {
  try {
    return await InfoService.getAllInfo();
  } catch (error) {
    console.error('获取所有info失败:', error);
    return [];
  }
}

// 获取公众号的名称
export async function getAccountNameByFakeid(fakeid: string): Promise<string | null> {
  try {
    const account = await getInfoCache(fakeid);
    if (!account) {
      return null;
    }

    return account.nickname || null;
  } catch (error) {
    console.error('获取公众号名称失败:', error);
    return null;
  }
}

// 批量导入公众号
export async function importInfos(infos: Info[]): Promise<void> {
  try {
    for (const info of infos) {
      // 导入时需要把相关数量置空
      info.completed = false;
      info.count = 0;
      info.articles = 0;
      info.total_count = 0;
      info.create_time = undefined;
      info.update_time = undefined;
      info.last_update_time = undefined;
      await updateInfoCache(info);
    }
  } catch (error) {
    console.error('批量导入公众号失败:', error);
  }
}
