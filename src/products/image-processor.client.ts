import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/**
 * Deletes product images from object storage.
 *
 * A trimmed copy of the gateway's client — delete only. Uploads stay in the
 * gateway (it owns the multipart controllers); this exists because the sweep
 * that retires sold products runs here, and marketplace owns the `images[]`
 * keys it is clearing.
 *
 * Every failure is swallowed. An orphaned object costs storage; a throw here
 * would abort the sweep and leave products un-purged, which is worse.
 */
@Injectable()
export class ImageProcessorClient {
  private readonly logger = new Logger(ImageProcessorClient.name);

  constructor(private readonly config: ConfigService) {}

  /** True when the service is configured; false disables image cleanup. */
  get isConfigured(): boolean {
    return Boolean(this.baseUrl && this.token);
  }

  private get baseUrl(): string | undefined {
    return this.config.get<string>('IMAGE_PROCESSOR_URL');
  }

  private get token(): string | undefined {
    return this.config.get<string>('IMAGE_PROCESSOR_TOKEN');
  }

  /** Deletes one stored object by key. Never throws. */
  async delete(key: string): Promise<boolean> {
    if (!key || !this.isConfigured) return false;

    const encoded = key.split('/').map(encodeURIComponent).join('/');
    try {
      const res = await fetch(`${this.baseUrl}/objects/${encoded}`, {
        method: 'DELETE',
        headers: { 'X-Internal-Token': this.token! },
      });
      // 404 means it's already gone — the desired end state either way.
      if (res.ok || res.status === 404) return true;

      const text = await res.text().catch(() => '');
      this.logger.warn(
        `image-processor delete ${res.status} for key=${key}: ${text || '(no body)'}`,
      );
      return false;
    } catch (error) {
      this.logger.warn(`image-processor unreachable for key=${key}`, error);
      return false;
    }
  }

  /** Deletes many keys, reporting how many are now gone. */
  async deleteMany(keys: string[]): Promise<number> {
    if (keys.length === 0 || !this.isConfigured) return 0;
    const results = await Promise.all(keys.map((key) => this.delete(key)));
    return results.filter(Boolean).length;
  }
}
