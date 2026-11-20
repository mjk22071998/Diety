import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MinioS3Adapter } from '../../../src/bounded-contexts/shared/infrastructure/storage/minio-s3.adapter';
import * as Minio from 'minio';

describe('Task 3.4: MinIO S3 Vault Storage Adapter (Pure TDD)', () => {
  let mockMinioClient: Minio.Client;

  beforeEach(() => {
    mockMinioClient = {
      bucketExists: vi.fn(),
      makeBucket: vi.fn().mockResolvedValue(undefined),
      presignedPutObject: vi.fn().mockResolvedValue('https://minio.local/diety-documents/license.pdf?token=xyz'),
      presignedGetObject: vi.fn().mockResolvedValue('https://minio.local/diety-evidence/doc.pdf?token=abc'),
      putObject: vi.fn().mockResolvedValue({ etag: '1234567890' }),
      removeObject: vi.fn().mockResolvedValue(undefined)
    } as unknown as Minio.Client;
  });

  it('should initialize with default Minio.Client when client is omitted', () => {
    const adapter = new MinioS3Adapter();
    expect(adapter.resolveBucketName('documents')).toBe('diety-documents');
  });

  it('should resolve correct bucket names with default and custom prefix', () => {
    const defaultAdapter = new MinioS3Adapter({ client: mockMinioClient });
    expect(defaultAdapter.resolveBucketName('documents')).toBe('diety-documents');
    expect(defaultAdapter.resolveBucketName('evidence')).toBe('diety-evidence');
    expect(defaultAdapter.resolveBucketName('public')).toBe('diety-public');

    const customAdapter = new MinioS3Adapter({
      client: mockMinioClient,
      bucketPrefix: 'stage-acme-'
    });
    expect(customAdapter.resolveBucketName('documents')).toBe('stage-acme-documents');
    expect(customAdapter.resolveBucketName('evidence')).toBe('stage-acme-evidence');
  });

  it('should create missing buckets when ensureBucketsExist is called', async () => {
    // Say documents exists, but evidence and public do not
    (mockMinioClient.bucketExists as any).mockImplementation(async (bucket: string) => {
      return bucket === 'diety-documents';
    });

    const adapter = new MinioS3Adapter({ client: mockMinioClient });
    await adapter.ensureBucketsExist();

    expect(mockMinioClient.bucketExists).toHaveBeenCalledTimes(3);
    // makeBucket should only be called for evidence and public
    expect(mockMinioClient.makeBucket).toHaveBeenCalledTimes(2);
    expect(mockMinioClient.makeBucket).toHaveBeenCalledWith('diety-evidence', 'us-east-1');
    expect(mockMinioClient.makeBucket).toHaveBeenCalledWith('diety-public', 'us-east-1');
  });

  it('should generate presigned upload URL with default 900s (15 min) expiration', async () => {
    const adapter = new MinioS3Adapter({ client: mockMinioClient });
    const url = await adapter.getPresignedUploadUrl({
      bucket: 'documents',
      objectName: 'user-123/identity-license.pdf'
    });

    expect(url).toContain('https://minio.local/diety-documents');
    expect(mockMinioClient.presignedPutObject).toHaveBeenCalledWith(
      'diety-documents',
      'user-123/identity-license.pdf',
      900
    );
  });

  it('should generate presigned upload URL with custom expiration time', async () => {
    const adapter = new MinioS3Adapter({ client: mockMinioClient });
    await adapter.getPresignedUploadUrl({
      bucket: 'evidence',
      objectName: 'dispute-456/evidence-chat.png',
      expiresInSeconds: 300
    });

    expect(mockMinioClient.presignedPutObject).toHaveBeenCalledWith(
      'diety-evidence',
      'dispute-456/evidence-chat.png',
      300
    );
  });

  it('should generate presigned download URL for private documents with 15m expiration', async () => {
    const adapter = new MinioS3Adapter({ client: mockMinioClient });
    const url = await adapter.getPresignedDownloadUrl({
      bucket: 'documents',
      objectName: 'dietitian-99/degree-transcript.pdf'
    });

    expect(url).toContain('https://minio.local/diety-evidence');
    expect(mockMinioClient.presignedGetObject).toHaveBeenCalledWith(
      'diety-documents',
      'dietitian-99/degree-transcript.pdf',
      900
    );
  });

  it('should upload direct server-side buffer with proper headers and metadata', async () => {
    const adapter = new MinioS3Adapter({ client: mockMinioClient });
    const sampleBuffer = Buffer.from('Contract PDF binary content');

    await adapter.uploadBuffer({
      bucket: 'documents',
      objectName: 'contracts/signed-contract-1.pdf',
      buffer: sampleBuffer,
      contentType: 'application/pdf',
      metadata: { 'X-Contract-Id': '1' }
    });

    expect(mockMinioClient.putObject).toHaveBeenCalledWith(
      'diety-documents',
      'contracts/signed-contract-1.pdf',
      sampleBuffer,
      sampleBuffer.length,
      {
        'Content-Type': 'application/pdf',
        'X-Contract-Id': '1'
      }
    );
  });

  it('should delete object from specified bucket', async () => {
    const adapter = new MinioS3Adapter({ client: mockMinioClient });
    await adapter.deleteObject('evidence', 'dispute-456/temp.png');

    expect(mockMinioClient.removeObject).toHaveBeenCalledWith(
      'diety-evidence',
      'dispute-456/temp.png'
    );
  });

  it('should reject invalid object names containing path traversal or leading slash', async () => {
    const adapter = new MinioS3Adapter({ client: mockMinioClient });

    await expect(
      adapter.getPresignedUploadUrl({
        bucket: 'documents',
        objectName: '../../etc/passwd'
      })
    ).rejects.toThrow('path traversal');

    await expect(
      adapter.getPresignedDownloadUrl({
        bucket: 'documents',
        objectName: '/root/secret.key'
      })
    ).rejects.toThrow('path traversal');

    await expect(
      adapter.uploadBuffer({
        bucket: 'documents',
        objectName: '',
        buffer: Buffer.from('test'),
        contentType: 'text/plain'
      })
    ).rejects.toThrow('cannot be empty');
  });
});
