import dotenv from "dotenv"
import { PrismaClient } from "@prisma/client"
import Database from "better-sqlite3"

// Load environment variables
dotenv.config({ path: ".env.local" })

const postgresDb = new PrismaClient()
const sqliteDb = new Database("prisma/dev.db", { readonly: true })

async function migrateSQLiteToPostgres() {
  console.log("🚀 Starting migration from SQLite to PostgreSQL...")

  try {
    // Migrate Users
    console.log("\n📥 Migrating users...")
    const users = sqliteDb.prepare("SELECT * FROM User").all() as any[]

    for (const user of users) {
      await postgresDb.user.create({
        data: {
          id: user.id,
          name: user.name,
          email: user.email,
          emailVerified: user.emailVerified ? new Date(user.emailVerified) : null,
          image: user.image,
          password: user.password,
          createdAt: new Date(user.createdAt),
          updatedAt: new Date(user.updatedAt),
        },
      })
      console.log(`  ✅ Migrated user: ${user.email}`)
    }

    // Migrate Collections
    console.log("\n📥 Migrating collections...")
    const collections = sqliteDb.prepare("SELECT * FROM Collection").all() as any[]

    for (const collection of collections) {
      await postgresDb.collection.create({
        data: {
          id: collection.id,
          title: collection.title,
          slug: collection.slug,
          description: collection.description,
          coverImage: collection.coverImage,
          published: collection.published === 1,
          authorId: collection.authorId,
          createdAt: new Date(collection.createdAt),
          updatedAt: new Date(collection.updatedAt),
        },
      })
      console.log(`  ✅ Migrated collection: ${collection.title}`)
    }

    // Migrate Posts
    console.log("\n📥 Migrating posts...")
    const posts = sqliteDb.prepare("SELECT * FROM Post").all() as any[]

    for (const post of posts) {
      await postgresDb.post.create({
        data: {
          id: post.id,
          title: post.title,
          slug: post.slug,
          content: post.content,
          excerpt: post.excerpt,
          coverImage: post.coverImage,
          published: post.published === 1,
          order: post.order || 0,
          authorId: post.authorId,
          collectionId: post.collectionId,
          createdAt: new Date(post.createdAt),
          updatedAt: new Date(post.updatedAt),
        },
      })
      console.log(`  ✅ Migrated post: ${post.title}`)
    }

    // Migrate Images
    console.log("\n📥 Migrating images...")
    const images = sqliteDb.prepare("SELECT * FROM Image").all() as any[]

    for (const image of images) {
      await postgresDb.image.create({
        data: {
          id: image.id,
          url: image.url,
          key: image.key,
          name: image.name,
          postId: image.postId,
          createdAt: new Date(image.createdAt),
        },
      })
      console.log(`  ✅ Migrated image: ${image.name}`)
    }

    console.log("\n" + "=".repeat(50))
    console.log("📊 Migration Summary:")
    console.log(`   ✅ Users:       ${users.length}`)
    console.log(`   ✅ Collections: ${collections.length}`)
    console.log(`   ✅ Posts:       ${posts.length}`)
    console.log(`   ✅ Images:      ${images.length}`)
    console.log("=".repeat(50))
    console.log("\n🎉 Migration completed successfully!")

  } catch (error) {
    console.error("\n💥 Migration failed:", error)
    process.exit(1)
  } finally {
    sqliteDb.close()
    await postgresDb.$disconnect()
  }
}

migrateSQLiteToPostgres()
