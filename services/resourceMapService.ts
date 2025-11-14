export interface ResourceMapAsset {
  fakeid: string;
  url: string;
  local_path: string;
  created_at?: Date;
  updated_at?: Date;
}

export class ResourceMapService {
  static async upsertResourceMap(resourceMap: ResourceMapAsset): Promise<void> {
    await $fetch('/api/db/resource-map', {
      method: 'POST',
      body: resourceMap
    });
  }

  static async getResourceMap(url: string): Promise<ResourceMapAsset | undefined> {
    const response = await $fetch('/api/db/resource-map', {
      method: 'GET',
      query: { url }
    });
    return response.data;
  }

  static async getResourceMapsByFakeid(fakeid: string): Promise<ResourceMapAsset[]> {
    const response = await $fetch('/api/db/resource-map/by-fakeid', {
      method: 'GET',
      query: { fakeid }
    });
    return response.data;
  }

  static async deleteResourceMap(url: string): Promise<void> {
    await $fetch('/api/db/resource-map', {
      method: 'DELETE',
      body: { url }
    });
  }

  static async deleteResourceMapsByFakeid(fakeid: string): Promise<void> {
    await $fetch('/api/db/resource-map/by-fakeid', {
      method: 'DELETE',
      body: { fakeid }
    });
  }
}