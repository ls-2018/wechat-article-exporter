export interface HtmlAsset {
  fakeid: string;
  url: string;
  html: string;
  created_at?: Date;
  updated_at?: Date;
}

export class HtmlService {
  static async upsertHtml(htmlAsset: HtmlAsset): Promise<void> {
    await $fetch('/api/db/html', {
      method: 'POST',
      body: htmlAsset
    });
  }

  static async getHtml(url: string): Promise<HtmlAsset | undefined> {
    const response = await $fetch('/api/db/html', {
      method: 'GET',
      query: { url }
    });
    return response.data;
  }

  static async getHtmlsByFakeid(fakeid: string): Promise<HtmlAsset[]> {
    const response = await $fetch('/api/db/html/by-fakeid', {
      method: 'GET',
      query: { fakeid }
    });
    return response.data;
  }

  static async deleteHtml(url: string): Promise<void> {
    await $fetch('/api/db/html', {
      method: 'DELETE',
      body: { url }
    });
  }

  static async deleteHtmlsByFakeid(fakeid: string): Promise<void> {
    await $fetch('/api/db/html/by-fakeid', {
      method: 'DELETE',
      body: { fakeid }
    });
  }
}