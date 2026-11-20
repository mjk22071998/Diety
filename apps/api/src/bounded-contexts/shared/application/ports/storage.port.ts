/**
 * Diety Platform - Storage Port (Hexagonal Architecture)
 * 
 * Defines the contract for secure S3 object storage (MinIO):
 * - Presigned upload URLs (15-minute expiration) with content security
 * - Presigned download URLs (15-minute expiration) for private identity & clinical docs
 * - Server-side direct buffer upload & object deletion
 * - Isolated buckets for identity documents and dispute evidence
 */

export type StorageBucket = 'documents' | 'evidence' | 'public';

export interface PresignedUploadUrlParams {
  bucket: StorageBucket;
  objectName: string;
  expiresInSeconds?: number; // default: 900 (15 min)
}

export interface PresignedDownloadUrlParams {
  bucket: StorageBucket;
  objectName: string;
  expiresInSeconds?: number; // default: 900 (15 min)
}

export interface UploadBufferParams {
  bucket: StorageBucket;
  objectName: string;
  buffer: Buffer;
  contentType: string;
  metadata?: Record<string, string>;
}

export interface IStoragePort {
  ensureBucketsExist(): Promise<void>;
  getPresignedUploadUrl(params: PresignedUploadUrlParams): Promise<string>;
  getPresignedDownloadUrl(params: PresignedDownloadUrlParams): Promise<string>;
  uploadBuffer(params: UploadBufferParams): Promise<void>;
  deleteObject(bucket: StorageBucket, objectName: string): Promise<void>;
  resolveBucketName(bucket: StorageBucket): string;
}
