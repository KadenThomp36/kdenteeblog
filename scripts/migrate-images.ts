import dotenv from "dotenv";

// Load environment variables FIRST before any other imports
dotenv.config({ path: ".env.local" });

import { db } from "../lib/db";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { v4 as uuidv4 } from "uuid";

// Create S3 client after env vars are loaded
const s3Client = new S3Client({
  endpoint: process.env.MINIO_ENDPOINT!,
  region: "us-east-1",
  credentials: {
    accessKeyId: process.env.MINIO_ACCESS_KEY!,
    secretAccessKey: process.env.MINIO_SECRET_KEY!,
  },
  forcePathStyle: true,
});

const BUCKET_NAME = process.env.MINIO_BUCKET_NAME || "blog-images";

async function downloadImage(
  url: string,
): Promise<{ buffer: Buffer; contentType: string }> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to download image: ${response.statusText}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const contentType = response.headers.get("content-type") || "image/jpeg";

  return { buffer, contentType };
}

async function uploadToMinio(
  buffer: Buffer,
  contentType: string,
  originalUrl: string,
): Promise<string> {
  // Get file extension from content type or URL
  let extension = "jpg";
  if (contentType.includes("png")) extension = "png";
  else if (contentType.includes("gif")) extension = "gif";
  else if (contentType.includes("webp")) extension = "webp";
  else if (originalUrl.match(/\.(jpg|jpeg|png|gif|webp)$/i)) {
    extension = originalUrl.match(/\.(jpg|jpeg|png|gif|webp)$/i)![1];
  }

  const key = `${uuidv4()}.${extension}`;

  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
    Body: buffer,
    ContentType: contentType,
  });

  await s3Client.send(command);

  const minioUrl = `${process.env.MINIO_ENDPOINT}/${BUCKET_NAME}/${key}`;
  return minioUrl;
}

async function migrateImages() {
  console.log("🚀 Starting image migration from UploadThing to MinIO...");

  // Get all posts with cover images
  const posts = await db.post.findMany({
    where: {
      coverImage: {
        not: null,
      },
    },
    select: {
      id: true,
      title: true,
      coverImage: true,
    },
  });

  // Get all collections with cover images
  const collections = await db.collection.findMany({
    where: {
      coverImage: {
        not: null,
      },
    },
    select: {
      id: true,
      title: true,
      coverImage: true,
    },
  });

  const totalImages = posts.length + collections.length;
  console.log(
    `📊 Found ${totalImages} images to migrate (${posts.length} posts, ${collections.length} collections)`,
  );

  if (totalImages === 0) {
    console.log("✅ No images to migrate!");
    return;
  }

  let migrated = 0;
  let skipped = 0;
  let failed = 0;

  // Migrate post images
  for (const post of posts) {
    if (!post.coverImage) continue;

    // Skip if already on MinIO
    if (post.coverImage.includes(process.env.MINIO_ENDPOINT || "minio")) {
      console.log(`⏭️  Skipping "${post.title}" - already on MinIO`);
      skipped++;
      continue;
    }

    try {
      console.log(`📥 Downloading image for post: "${post.title}"`);
      const { buffer, contentType } = await downloadImage(post.coverImage);

      console.log(`📤 Uploading to MinIO...`);
      const newUrl = await uploadToMinio(buffer, contentType, post.coverImage);

      console.log(`💾 Updating database...`);
      await db.post.update({
        where: { id: post.id },
        data: { coverImage: newUrl },
      });

      console.log(`✅ Migrated: "${post.title}"`);
      console.log(`   Old: ${post.coverImage}`);
      console.log(`   New: ${newUrl}\n`);
      migrated++;
    } catch (error) {
      console.error(`❌ Failed to migrate "${post.title}":`, error);
      failed++;
    }
  }

  // Migrate collection images
  for (const collection of collections) {
    if (!collection.coverImage) continue;

    // Skip if already on MinIO
    if (collection.coverImage.includes(process.env.MINIO_ENDPOINT || "minio")) {
      console.log(
        `⏭️  Skipping collection "${collection.title}" - already on MinIO`,
      );
      skipped++;
      continue;
    }

    try {
      console.log(`📥 Downloading image for collection: "${collection.title}"`);
      const { buffer, contentType } = await downloadImage(
        collection.coverImage,
      );

      console.log(`📤 Uploading to MinIO...`);
      const newUrl = await uploadToMinio(
        buffer,
        contentType,
        collection.coverImage,
      );

      console.log(`💾 Updating database...`);
      await db.collection.update({
        where: { id: collection.id },
        data: { coverImage: newUrl },
      });

      console.log(`✅ Migrated collection: "${collection.title}"`);
      console.log(`   Old: ${collection.coverImage}`);
      console.log(`   New: ${newUrl}\n`);
      migrated++;
    } catch (error) {
      console.error(
        `❌ Failed to migrate collection "${collection.title}":`,
        error,
      );
      failed++;
    }
  }

  console.log("\n" + "=".repeat(50));
  console.log("📊 Migration Summary:");
  console.log(`   ✅ Migrated: ${migrated}`);
  console.log(`   ⏭️  Skipped:  ${skipped}`);
  console.log(`   ❌ Failed:   ${failed}`);
  console.log("=".repeat(50));

  if (failed > 0) {
    console.log("\n⚠️  Some images failed to migrate. Check the errors above.");
    process.exit(1);
  } else {
    console.log("\n🎉 Migration completed successfully!");
    process.exit(0);
  }
}

// Run the migration
migrateImages().catch((error) => {
  console.error("💥 Migration failed:", error);
  process.exit(1);
});
