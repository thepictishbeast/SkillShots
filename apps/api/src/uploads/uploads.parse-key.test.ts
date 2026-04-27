import { describe, it, expect, beforeEach } from 'vitest';

// Minimal smoke: the parseOwnerFromKey logic — we test it in isolation
// without spinning up an S3 client.
beforeEach(() => {
  process.env['NODE_ENV'] = 'test';
  process.env['DATABASE_URL'] = 'postgresql://x:y@localhost:5432/z';
  process.env['JWT_ACCESS_SECRET'] = 'a'.repeat(64);
  process.env['JWT_REFRESH_SECRET'] = 'b'.repeat(64);
  process.env['CORS_ORIGINS'] = 'http://localhost:8081';
  process.env['S3_ENDPOINT'] = 'http://localhost:9000';
  process.env['S3_REGION'] = 'us-east-1';
  process.env['S3_BUCKET'] = 'sk';
  process.env['S3_ACCESS_KEY'] = 'k';
  process.env['S3_SECRET_KEY'] = 's';
  process.env['S3_PUBLIC_HOSTS'] = 'cdn.example.com';
  process.env['ALLOWED_VIDEO_MIME'] = 'video/mp4';
});

describe('UploadsService.parseOwnerFromKey', () => {
  it('extracts owner from a valid key', async () => {
    const { UploadsService } = await import('./uploads.service.js');
    const svc = new UploadsService();
    const owner = svc.parseOwnerFromKey(
      'videos/8e9e0c3c-4b0a-4d0a-9b0a-1c2d3e4f5a6b/8e9e0c3c-4b0a-4d0a-9b0a-1c2d3e4f5a6b.bin',
    );
    expect(owner).toBe('8e9e0c3c-4b0a-4d0a-9b0a-1c2d3e4f5a6b');
  });

  it('returns null on malformed key', async () => {
    const { UploadsService } = await import('./uploads.service.js');
    const svc = new UploadsService();
    expect(svc.parseOwnerFromKey('videos/abc/def.bin')).toBeNull();
    expect(svc.parseOwnerFromKey('not-a-key')).toBeNull();
    expect(svc.parseOwnerFromKey('videos/../../etc/passwd')).toBeNull();
  });
});
