import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";

// Oracle Cloud Object Storage uses S3-compatible API
const OCI_NAMESPACE = process.env.OCI_NAMESPACE || "";
const OCI_BUCKET = process.env.OCI_BUCKET || "forge-fitness-uploads";
const OCI_REGION = process.env.OCI_REGION || "us-ashburn-1";
const OCI_ACCESS_KEY = process.env.OCI_ACCESS_KEY || "";
const OCI_SECRET_KEY = process.env.OCI_SECRET_KEY || "";

let _s3Client: S3Client | null = null;
function getS3Client(): S3Client {
  if (!_s3Client) {
    const endpoint = `https://${OCI_NAMESPACE}.compat.objectstorage.${OCI_REGION}.oraclecloud.com`;
    _s3Client = new S3Client({
      region: OCI_REGION,
      endpoint,
      forcePathStyle: true,
      credentials: {
        accessKeyId: OCI_ACCESS_KEY,
        secretAccessKey: OCI_SECRET_KEY,
      },
    });
  }
  return _s3Client;
}

// ─── Upload file ──────────────────────────────────────────────────────────

export async function uploadFile(
  buffer: Buffer,
  key: string,
  contentType: string
): Promise<string> {
  await getS3Client().send(
    new PutObjectCommand({
      Bucket: OCI_BUCKET,
      Key: key,
      Body: buffer,
      ContentType: contentType,
      ACL: "public-read",
    })
  );

  // Public URL for the uploaded file
  return `${endpoint}/n/${OCI_NAMESPACE}/b/${OCI_BUCKET}/o/${encodeURIComponent(key)}`;
}

// ─── Delete file ──────────────────────────────────────────────────────────

export async function deleteFile(key: string): Promise<void> {
  await getS3Client().send(
    new DeleteObjectCommand({
      Bucket: OCI_BUCKET,
      Key: key,
    })
  );
}

// ─── Generate a unique file key ───────────────────────────────────────────

export function generateFileKey(
  folder: string,
  filename: string,
  userId: string
): string {
  const timestamp = Date.now();
  const sanitized = filename.replace(/[^a-zA-Z0-9._-]/g, "_");
  return `${folder}/${userId}/${timestamp}-${sanitized}`;
}

// ─── File validation ──────────────────────────────────────────────────────

const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"];
const ALLOWED_VIDEO_TYPES = ["video/mp4", "video/quicktime", "video/x-msvideo", "video/webm"];
const ALLOWED_DOC_TYPES = ["application/pdf"];
const ALLOWED_AUDIO_TYPES = ["audio/mpeg", "audio/wav", "audio/ogg", "audio/mp4"];

const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_VIDEO_SIZE = 500 * 1024 * 1024; // 500MB
const MAX_DOC_SIZE = 20 * 1024 * 1024; // 20MB
const MAX_AUDIO_SIZE = 50 * 1024 * 1024; // 50MB

export type FileCategory = "image" | "video" | "document" | "audio";

export function validateFile(
  contentType: string,
  size: number,
  category: FileCategory
): { valid: boolean; error?: string } {
  switch (category) {
    case "image":
      if (!ALLOWED_IMAGE_TYPES.includes(contentType)) {
        return { valid: false, error: "Only JPG, PNG, GIF, and WebP images are allowed" };
      }
      if (size > MAX_IMAGE_SIZE) {
        return { valid: false, error: "Image must be under 5MB" };
      }
      break;
    case "video":
      if (!ALLOWED_VIDEO_TYPES.includes(contentType)) {
        return { valid: false, error: "Only MP4, MOV, AVI, and WebM videos are allowed" };
      }
      if (size > MAX_VIDEO_SIZE) {
        return { valid: false, error: "Video must be under 500MB" };
      }
      break;
    case "document":
      if (!ALLOWED_DOC_TYPES.includes(contentType)) {
        return { valid: false, error: "Only PDF documents are allowed" };
      }
      if (size > MAX_DOC_SIZE) {
        return { valid: false, error: "Document must be under 20MB" };
      }
      break;
    case "audio":
      if (!ALLOWED_AUDIO_TYPES.includes(contentType)) {
        return { valid: false, error: "Only MP3, WAV, OGG, and M4A audio files are allowed" };
      }
      if (size > MAX_AUDIO_SIZE) {
        return { valid: false, error: "Audio file must be under 50MB" };
      }
      break;
  }
  return { valid: true };
}
