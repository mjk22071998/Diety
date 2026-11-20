import * as Minio from 'minio';
import {
  IStoragePort,
  StorageBucket,
  PresignedUploadUrlParams,
  PresignedDownloadUrlParams,
  UploadBufferParams
} from '../../application/ports/storage.port';

export interface MinioAdapterConfig {
  client?: Minio.Client;
  bucketPrefix?: string;
}

/**
 * MinioS3Adapter
 * 
 * S3 object storage adapter using MinIO:
 * - Isolated buckets for identity verification docs and tribunal dispute evidence.
 * - Time-limited (15m default) presigned URLs for secure upload & download.
 * - Anti-tamper object path validation preventing path traversal.
 */
export class MinioS3Adapter implements IStoragePort {
  private readonly client: Minio.Client;
  private readonly bucketPrefix: string;

  private static readonly BUCKET_MAPPING: Record<StorageBucket, string> = {
    documents: 'documents',
    evidence: 'evidence',
    public: 'public'
  };

  constructor(config: MinioAdapterConfig = {}) {
    this.bucketPrefix = config.bucketPrefix ?? (process.env.MINIO_BUCKET_PREFIX || 'diety-');

    if (config.client) {
      this.client = config.client;
    } else {
      const endPoint = process.env.MINIO_ENDPOINT || 'localhost';
      const port = parseInt(process.env.MINIO_PORT || '9000', 10);
      const useSSL = process.env.MINIO_USE_SSL === 'true';
      const accessKey = process.env.MINIO_ACCESS_KEY || 'minioadmin';
      const secretKey = process.env.MINIO_SECRET_KEY || 'minioadmin';

      this.client = new Minio.Client({
        endPoint,
        port,
        useSSL,
        accessKey,
        secretKey
      });
    }
  }

  public resolveBucketName(bucket: StorageBucket): string {
    const base = MinioS3Adapter.BUCKET_MAPPING[bucket];
    return `${this.bucketPrefix}${base}`;
  }

  private validateObjectName(objectName: string): void {
    if (!objectName || objectName.trim().length === 0) {
      throw new Error('Object name cannot be empty');
    }
    if (objectName.includes('..') || objectName.startsWith('/')) {
      throw new Error(`Invalid object name containing path traversal characters: ${objectName}`);
    }
  }

  public async ensureBucketsExist(): Promise<void> {
    const buckets: StorageBucket[] = ['documents', 'evidence', 'public'];
    for (const b of buckets) {
      const bucketName = this.resolveBucketName(b);
      const exists = await this.client.bucketExists(bucketName);
      if (!exists) {
        await this.client.makeBucket(bucketName, 'us-east-1');
      }
    }
  }

  public async getPresignedUploadUrl(params: PresignedUploadUrlParams): Promise<string> {
    this.validateObjectName(params.objectName);
    const bucketName = this.resolveBucketName(params.bucket);
    const expiresIn = params.expiresInSeconds ?? 900; // 15 minutes default

    return await this.client.presignedPutObject(bucketName, params.objectName, expiresIn);
  }

  public async getPresignedDownloadUrl(params: PresignedDownloadUrlParams): Promise<string> {
    this.validateObjectName(params.objectName);
    const bucketName = this.resolveBucketName(params.bucket);
    const expiresIn = params.expiresInSeconds ?? 900; // 15 minutes default

    return await this.client.presignedGetObject(bucketName, params.objectName, expiresIn);
  }

  public async uploadBuffer(params: UploadBufferParams): Promise<void> {
    this.validateObjectName(params.objectName);
    const bucketName = this.resolveBucketName(params.bucket);
    const metadata = {
      'Content-Type': params.contentType,
      ...(params.metadata || {})
    };

    await this.client.putObject(
      bucketName,
      params.objectName,
      params.buffer,
      params.buffer.length,
      metadata
    );
  }

  public async deleteObject(bucket: StorageBucket, objectName: string): Promise<void> {
    this.validateObjectName(objectName);
    const bucketName = this.resolveBucketName(bucket);
    await this.client.removeObject(bucketName, objectName);
  }
}
