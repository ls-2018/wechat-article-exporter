import { AccountService } from '~/services/accountService';

// 删除公众号数据
export async function deleteAccountData(ids: string[]): Promise<void> {
  // 调用后端服务删除账户数据
  for (const fakeid of ids) {
    await AccountService.deleteAccountData(fakeid);
  }
}
