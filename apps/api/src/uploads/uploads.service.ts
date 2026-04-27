import { Injectable, BadRequestException } from '@nestjs/common';
import { S3Client, HeadObjectCommand } from '@aws-sdk/client-s3';
import { createPresignedPost } from '@aws-sdk/s3-presigned-post';
import { randomUUID } from 'node:crypto';
import { loadEnv } from '../config/env.js';

const env = loadEnv();

export interface PresignedUpload {
  uploadId: string;
  url: string;
  fields: Record<string, string>;
  // What the client should treat as the eventual public URL.
  // The server will re-derive this on `confirmUpload` and only persist after
  // a successful HEAD against S3 — never trust the client's view.
  publicUrl: string;
  // Constraints surfaced for UX hints; ALSO enforced by the S3 policy below.
  maxBytes: number;
  allowedMime: string[];
}

@Injectable()
export class UploadsService {
  private readonly s3: S3Client;

  constructor() {
    this.s3 = new S3Client({
      endpoint: env.S3_ENDPOINT,
      region: env.S3_REGION,
      forcePathStyle: env.S3_FORCE_PATH_STYLE,
      credentials: {
        accessKeyId: env.S3_ACCESS_KEY,
        secretAccessKey: env.S3_SECRET_KEY,
      },
    });
  }

  // SECURITY: presigned POSTs constrain key, content-type, and size at the
  // S3 policy level. The client cannot deviate without invalidating the sig.
  // REGRESSION-GUARD: PUT-style presigning leaves content-type unconstrained;
  // POST policy is the safer primitive.
  async issueVideoUploadUrl(userId: string, contentType: string): Promise<PresignedUpload> {
    if (!env.ALLOWED_VIDEO_MIME.includes(contentType)) {
      throw new BadRequestException({
        error: 'unsupported_video_mime',
        allowed: env.ALLOWED_VIDEO_MIME,
      });
    }

    const uploadId = randomUUID();
    // Key namespaces by user → prevents cross-user enumeration via key guess.
    const key = `videos/${userId}/${uploadId}.bin`;

    const presigned = await createPresignedPost(this.s3, {
      Bucket: env.S3_BUCKET,
      Key: key,
      Conditions: [
        ['content-length-range', 0, env.MAX_VIDEO_BYTES],
        ['eq', '$Content-Type', contentType],
        ['starts-with', '$key', `videos/${userId}/`],
      ],
      Fields: {
        'Content-Type': contentType,
      },
      Expires: 600,
    });

    return {
      uploadId,
      url: presigned.url,
      fields: presigned.fields,
      publicUrl: this.publicUrlFor(key),
      maxBytes: env.MAX_VIDEO_BYTES,
      allowedMime: env.ALLOWED_VIDEO_MIME,
    };
  }

  // After the client uploads to S3, it calls this to get the platform URL.
  // The server independently HEADs the object so the URL returned is one we
  // verified exists.
  async confirmVideoUpload(userId: string, uploadId: string): Promise<{ url: string; bytes: number }> {
    const key = `videos/${userId}/${uploadId}.bin`;
    try {
      const head = await this.s3.send(new HeadObjectCommand({ Bucket: env.S3_BUCKET, Key: key }));
      const bytes = head.ContentLength ?? 0;
      if (bytes <= 0) throw new Error('empty');
      if (bytes > env.MAX_VIDEO_BYTES) throw new Error('oversize');
      return { url: this.publicUrlFor(key), bytes };
    } catch {
      throw new BadRequestException({ error: 'upload_not_found_or_invalid' });
    }
  }

  // The owner of a video URL — used to authorize challenge / entry creation.
  parseOwnerFromKey(key: string): string | null {
    const m = /^videos\/([0-9a-f-]{36})\/[0-9a-f-]{36}\.bin$/.exec(key);
    return m ? m[1]! : null;
  }

  publicUrlFor(key: string): string {
    // SECURITY: the public URL must point to the platform CDN host (or local
    // minio in dev) — never the raw S3 endpoint with creds in the URL.
    // We use the FIRST entry of S3_PUBLIC_HOSTS as the canonical host.
    const host = env.S3_PUBLIC_HOSTS[0]!;
    return host.startsWith('localhost')
      ? `${env.S3_ENDPOINT}/${env.S3_BUCKET}/${key}`
      : `https://${host}/${key}`;
  }
}
