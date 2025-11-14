import type { ArticleMetadata } from '~/utils/download/types';

export interface Metadata extends ArticleMetadata {
  fakeid: string;
  url: string;
  title: string;
}

export class MetadataService {
  static async upsertMetadata(metadata: Metadata): Promise<void> {
    await $fetch('/api/db/metadata', {
      method: 'POST',
      body: metadata
    });
  }

  static async getMetadata(url: string): Promise<Metadata | undefined> {
    const response = await $fetch('/api/db/metadata', {
      method: 'GET',
      query: { url }
    });
    return response.data;
  }

  static async getMetadataByFakeid(fakeid: string): Promise<Metadata[]> {
    const response = await $fetch('/api/db/metadata/by-fakeid', {
      method: 'GET',
      query: { fakeid }
    });
    return response.data;
  }

  static async deleteMetadata(url: string): Promise<void> {
    await $fetch('/api/db/metadata', {
      method: 'DELETE',
      body: { url }
    });
  }

  static async deleteMetadataByFakeid(fakeid: string): Promise<void> {
    await $fetch('/api/db/metadata/by-fakeid', {
      method: 'DELETE',
      body: { fakeid }
    });
  }
}