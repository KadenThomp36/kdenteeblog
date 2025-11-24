import { notFound } from "next/navigation"
import { db } from "@/lib/db"
import { formatDistance } from "date-fns"
import Image from "next/image"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const collection = await db.collection.findUnique({
    where: {
      slug,
    },
  })

  if (!collection) {
    return {}
  }

  return {
    title: collection.title,
    description: collection.description,
  }
}

export default async function CollectionPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const collection = await db.collection.findUnique({
    where: {
      slug,
    },
    include: {
      posts: {
        where: {
          published: true,
        },
        orderBy: {
          order: "asc",
        },
      },
      author: {
        select: {
          name: true,
        },
      },
    },
  })

  if (!collection || !collection.published) {
    notFound()
  }

  return (
    <main className="min-h-screen">
      <div className="max-w-4xl mx-auto px-4 py-16">
        {collection.coverImage && (
          <div className="relative w-full h-64 md:h-96 mb-8 rounded-lg overflow-hidden">
            <Image
              src={collection.coverImage}
              alt={collection.title}
              fill
              className="object-cover"
              priority
            />
          </div>
        )}

        <header className="mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 tracking-tight">
            {collection.title}
          </h1>
          {collection.description && (
            <p className="text-xl text-muted-foreground mb-4">
              {collection.description}
            </p>
          )}
          <div className="flex items-center gap-4 text-muted-foreground">
            <span>{collection.author.name}</span>
            <span>•</span>
            <span>{collection.posts.length} post{collection.posts.length !== 1 ? "s" : ""}</span>
            <span>•</span>
            <time>
              {formatDistance(new Date(collection.createdAt), new Date(), {
                addSuffix: true,
              })}
            </time>
          </div>
        </header>

        <div className="space-y-6">
          <h2 className="text-2xl font-semibold mb-4">Posts in this collection</h2>

          {collection.posts.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                No posts in this collection yet.
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {collection.posts.map((post, index) => (
                <Link key={post.id} href={`/posts/${post.slug}`}>
                  <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                    <CardHeader>
                      <div className="flex gap-4">
                        <div className="flex-shrink-0 w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary">
                          {index + 1}
                        </div>
                        <div className="flex-1">
                          <CardTitle className="mb-2">{post.title}</CardTitle>
                          {post.excerpt && (
                            <p className="text-sm text-muted-foreground line-clamp-2">
                              {post.excerpt}
                            </p>
                          )}
                          <p className="text-xs text-muted-foreground mt-2">
                            {formatDistance(new Date(post.createdAt), new Date(), {
                              addSuffix: true,
                            })}
                          </p>
                        </div>
                        {post.coverImage && (
                          <div className="relative w-24 h-24 rounded-md overflow-hidden flex-shrink-0">
                            <Image
                              src={post.coverImage}
                              alt={post.title}
                              fill
                              className="object-cover"
                            />
                          </div>
                        )}
                      </div>
                    </CardHeader>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>

        <div className="mt-12">
          <Link href="/" className="text-primary hover:underline">
            ← Back to all posts
          </Link>
        </div>
      </div>
    </main>
  )
}
