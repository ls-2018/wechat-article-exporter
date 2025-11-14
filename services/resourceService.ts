export interface ResourceAsset {
  fakeid: string;
  url: string;
  local_path: string;
  created_at?: Date;
  updated_at?: Date;
}

export class ResourceService {
  static async upsertResource(resource: ResourceAsset): Promise<void> {
    await $fetch('/api/db/resource', {
      method: 'POST',
      body: resource
    });
  }

  static async getResource(url: string): Promise<ResourceAsset | undefined> {
    const response = await $fetch('/api/db/resource', {
      method: 'GET',
      query: { url }
    });
    return response.data;
  }

  static async getResourcesByFakeid(fakeid: string): Promise<ResourceAsset[]> {
    const response = await $fetch('/api/db/resource/by-fakeid', {
      method: 'GET',
      query: { fakeid }
    });
    return response.data;
  }

  static async deleteResource(url: string): Promise<void> {
    await $fetch('/api/db/resource', {
      method: 'DELETE',
      body: { url }
    });
  }

  static async deleteResourcesByFakeid(fakeid: string): Promise<void> {
    await $fetch('/api/db/resource/by-fakeid', {
      method: 'DELETE',
      body: { fakeid }
    });
  }
}