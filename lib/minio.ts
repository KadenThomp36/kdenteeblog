import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { v4 as uuidv4 } from "uuid";

const s3Client = new S3Client({
  endpoint: process.env.MINIO_ENDPOINT!,
  region: "us-east-1", // MinIO doesn't care about region, but SDK requires it
  credentials: {
    accessKeyId: process.env.MINIO_ACCESS_KEY!,
    secretAccessKey: process.env.MINIO_SECRET_KEY!,
  },
  forcePathStyle: true, // Required for MinIO
  requestHandler: {
    requestTimeout: 30000, // 30 seconds
    connectionTimeout: 10000, // 10 seconds
  },
});

const BUCKET_NAME = process.env.MINIO_BUCKET_NAME || "blog-images";

export async function uploadToMinio(
  file: File,
): Promise<{ url: string; key: string }> {
  console.log(`[MinIO] Starting upload for ${file.name}`);
  console.log(`[MinIO] Endpoint: ${process.env.MINIO_ENDPOINT}`);
  console.log(`[MinIO] Bucket: ${BUCKET_NAME}`);

  const buffer = Buffer.from(await file.arrayBuffer());
  console.log(`[MinIO] Buffer created, size: ${buffer.length} bytes`);

  const fileExtension = file.name.split(".").pop();
  const key = `${uuidv4()}.${fileExtension}`;

  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
    Body: buffer,
    ContentType: file.type,
  });

  console.log(`[MinIO] Sending upload command for key: ${key}`);
  await s3Client.send(command);
  console.log(`[MinIO] Upload successful for key: ${key}`);

  // Construct the public URL
  const url = `${process.env.MINIO_ENDPOINT}/${BUCKET_NAME}/${key}`;

  return { url, key };
}

export async function deleteFromMinio(key: string): Promise<void> {
  const command = new DeleteObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
  });

  await s3Client.send(command);
}

export { s3Client, BUCKET_NAME };
