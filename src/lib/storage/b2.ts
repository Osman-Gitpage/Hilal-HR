// ─── Backblaze B2 Storage Utility ─────────────────────────────────────────────
// S3 uyumlu API ile dosya yükleme/indirme/silme işlemleri
// Kullanım: Yalnızca server-side (Server Actions, API Routes)

import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

// ─── S3 Client (Backblaze B2) ─────────────────────────────────────────────────

function getB2Client(): S3Client {
  const endpoint = process.env.B2_ENDPOINT;
  const keyId = process.env.B2_KEY_ID;
  const appKey = process.env.B2_APP_KEY;
  const region = process.env.B2_BUCKET_REGION;

  if (!endpoint || !keyId || !appKey || !region) {
    throw new Error(
      "B2 yapılandırması eksik: B2_ENDPOINT, B2_KEY_ID, B2_APP_KEY, B2_BUCKET_REGION gerekli."
    );
  }

  return new S3Client({
    endpoint: `https://${endpoint}`,
    region,
    credentials: {
      accessKeyId: keyId,
      secretAccessKey: appKey,
    },
    forcePathStyle: true,
  });
}

function getBucketName(): string {
  const bucket = process.env.B2_BUCKET_NAME;
  if (!bucket) {
    throw new Error("B2_BUCKET_NAME ortam değişkeni eksik.");
  }
  return bucket;
}

// ─── Presigned Upload URL ─────────────────────────────────────────────────────

/**
 * Client-side direct upload için presigned PUT URL üretir.
 * @param objectKey - B2'deki hedef dosya yolu
 * @param contentType - Dosya MIME tipi
 * @param expiresIn - URL geçerlilik süresi (saniye, varsayılan 10 dakika)
 * @returns Presigned PUT URL
 */
export async function getUploadPresignedUrl(
  objectKey: string,
  contentType: string,
  expiresIn = 600
): Promise<string> {
  const client = getB2Client();
  const bucket = getBucketName();

  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: objectKey,
    ContentType: contentType,
  });

  return getSignedUrl(client, command, { expiresIn });
}

// ─── Presigned Download URL ───────────────────────────────────────────────────

/**
 * Dosya görüntüleme/indirme için presigned GET URL üretir.
 * @param objectKey - B2'deki dosya yolu
 * @param expiresIn - URL geçerlilik süresi (saniye, varsayılan 1 saat)
 * @returns Presigned GET URL
 */
export async function getDownloadPresignedUrl(
  objectKey: string,
  expiresIn = 3600
): Promise<string> {
  const client = getB2Client();
  const bucket = getBucketName();

  const command = new GetObjectCommand({
    Bucket: bucket,
    Key: objectKey,
  });

  return getSignedUrl(client, command, { expiresIn });
}

// ─── Dosya Silme ──────────────────────────────────────────────────────────────

/**
 * B2'den dosya siler.
 * @param objectKey - Silinecek dosyanın B2 object key'i
 */
export async function deleteB2Object(objectKey: string): Promise<void> {
  const client = getB2Client();
  const bucket = getBucketName();

  const command = new DeleteObjectCommand({
    Bucket: bucket,
    Key: objectKey,
  });

  await client.send(command);
}

// ─── Toplu Silme ──────────────────────────────────────────────────────────────

/**
 * Birden fazla dosyayı B2'den siler.
 * Hata oluşan dosyaları atlar, hepsini dener.
 * @returns Başarısız silme sayısı
 */
export async function deleteB2Objects(objectKeys: string[]): Promise<number> {
  let basarisiz = 0;
  for (const key of objectKeys) {
    try {
      await deleteB2Object(key);
    } catch (err) {
      console.error(`B2 silme hatası (${key}):`, err);
      basarisiz++;
    }
  }
  return basarisiz;
}
