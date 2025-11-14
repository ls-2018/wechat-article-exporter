export interface Info {
  fakeid: string;
  value: any;
  created_at?: Date;
  updated_at?: Date;
}

export class InfoService {
  static async upsertInfo(info: Info): Promise<void> {
    await $fetch('/api/db/info', {
      method: 'POST',
      body: info
    });
  }

  static async getInfo(fakeid: string): Promise<Info | undefined> {
    const response = await $fetch('/api/db/info', {
      method: 'GET',
      query: { fakeid }
    });
    return response.data;
  }

  static async getAllInfo(): Promise<Info[]> {
    const response = await $fetch('/api/db/info', {
      method: 'GET'
    });
    return response.data;
  }

  static async deleteInfo(fakeid: string): Promise<void> {
    await $fetch('/api/db/info', {
      method: 'DELETE',
      body: { fakeid }
    });
  }
}