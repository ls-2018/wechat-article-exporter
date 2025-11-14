import { ApiService } from '~/services/apiService';

export type ApiName = 'searchbiz' | 'appmsgpublish';

interface APICall {
  name: ApiName;
  account: string;
  call_time: number;
  is_normal: boolean;
  payload: Record<string, any>;
}

export type { APICall };

/**
 * 写入调用记录
 * @param record
 */
export async function updateAPICache(record: APICall) {
  try {
    await ApiService.createApiCall(record);
    return true;
  } catch (error) {
    console.error('更新API调用记录失败:', error);
    return false;
  }
}

export async function queryAPICall(
  account: string,
  start: number,
  end: number = new Date().getTime()
): Promise<APICall[]> {
  try {
    return await ApiService.queryAPICall(account,start,end );
  } catch (error) {
    console.error('查询API调用记录失败:', error);
    return [];
  }
}
