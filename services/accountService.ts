/**
 * 账户服务
 */
export class AccountService {
  /**
   * 删除账户数据
   */
  static async deleteAccountData(fakeid: string) {
    const response = await $fetch('/api/db/account', {
      method: 'DELETE',
      body: { fakeid }
    });
    return response;
  }

  /**
   * 获取数据库统计信息
   */
  static async getDatabaseStats() {
    const response = await $fetch('/api/db/stats', {
      method: 'GET'
    });
    return response.data;
  }
}