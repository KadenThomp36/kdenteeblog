import Link from "next/link";
import { db } from "@/lib/db";
import { formatDistance } from "date-fns";
import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FolderOpen } from "lucide-react";

export default async function Home() {
  // Get all published collections with their posts
  const collections = await db.collection.findMany({
    where: {
      published: true,
    },
    include: {
      posts: {
        where: {
          published: true,
        },
        orderBy: {
          order: "asc",
        },
        include: {
          author: {
            select: {
              name: true,
            },
          },
        },
      },
      author: {
        select: {
          name: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  // Get standalone posts (not in any collection)
  const standalonePosts = await db.post.findMany({
    where: {
      published: true,
      collectionId: null,
    },
    include: {
      author: {
        select: {
          name: true,
          image: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  const hasContent = collections.length > 0 || standalonePosts.length > 0;

  return (
    <main className="min-h-screen">
      <div className="max-w-4xl mx-auto px-4 py-16">
        <div className="mb-16">
          <h1 className="text-5xl md:text-6xl font-bold mb-6 tracking-tight">
            Welcome to the Blog
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl">
            A minimal, modern blog with beautiful typography. Discover stories,
            ideas, and insights.
          </p>
        </div>

        <div className="space-y-16">
          {!hasContent ? (
            <p className="text-muted-foreground">
              No posts yet. Check back soon!
            </p>
          ) : (
            <>
              {/* Collections */}
              {collections.map((collection) => (
                <div key={collection.id} className="space-y-6">
                  <div className="border-l-4 border-primary pl-4">
                    <div className="flex items-center gap-2 mb-2">
                      <FolderOpen className="h-5 w-5 text-primary" />
                      <h2 className="text-2xl font-bold tracking-tight">
                        {collection.title}
                      </h2>
                    </div>
                    {collection.description && (
                      <p className="text-muted-foreground mb-2">
                        {collection.description}
                      </p>
                    )}
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span>{collection.posts.length} posts</span>
                      <span>•</span>
                      <time>
                        {formatDistance(
                          new Date(collection.createdAt),
                          new Date(),
                          { addSuffix: true },
                        )}
                      </time>
                    </div>
                  </div>

                  {collection.coverImage && (
                    <Link href={`/collections/${collection.slug}`}>
                      <div className="relative w-full h-48 md:h-64 rounded-lg overflow-hidden group cursor-pointer">
                        <Image
                          src={collection.coverImage}
                          alt={collection.title}
                          fill
                          className="object-cover transition-transform group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-6">
                          <p className="text-white font-semibold">
                            View all {collection.posts.length} posts →
                          </p>
                        </div>
                      </div>
                    </Link>
                  )}

                  {/* Show first 3 posts from collection */}
                  <div className="grid gap-4 md:grid-cols-3">
                    {collection.posts.slice(0, 3).map((post, index) => (
                      <Link key={post.id} href={`/posts/${post.slug}`}>
                        <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer">
                          {post.coverImage && (
                            <div className="relative w-full h-32 overflow-hidden rounded-t-lg">
                              <Image
                                src={post.coverImage}
                                alt={post.title}
                                fill
                                className="object-cover"
                              />
                            </div>
                          )}
                          <CardHeader>
                            <div className="flex items-start gap-2">
                              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                                {index + 1}
                              </span>
                              <CardTitle className="text-base line-clamp-2">
                                {post.title}
                              </CardTitle>
                            </div>
                          </CardHeader>
                          {post.excerpt && (
                            <CardContent>
                              <p className="text-xs text-muted-foreground line-clamp-2">
                                {post.excerpt}
                              </p>
                            </CardContent>
                          )}
                        </Card>
                      </Link>
                    ))}
                  </div>

                  {collection.posts.length > 3 && (
                    <div className="text-center">
                      <Link
                        href={`/collections/${collection.slug}`}
                        className="text-primary hover:underline font-medium"
                      >
                        View all {collection.posts.length} posts in this
                        collection →
                      </Link>
                    </div>
                  )}
                </div>
              ))}

              {/* Standalone Posts */}
              {standalonePosts.length > 0 && (
                <div className="space-y-12">
                  {standalonePosts.map((post) => (
                    <article key={post.id} className="group">
                      <Link href={`/posts/${post.slug}`}>
                        {post.coverImage && (
                          <div className="relative w-full h-64 md:h-96 mb-6 rounded-lg overflow-hidden">
                            <Image
                              src={post.coverImage}
                              alt={post.title}
                              fill
                              className="object-cover transition-transform group-hover:scale-105"
                            />
                          </div>
                        )}
                        <div className="space-y-3">
                          <h2 className="text-3xl font-bold tracking-tight group-hover:text-primary transition-colors">
                            {post.title}
                          </h2>
                          {post.excerpt && (
                            <p className="text-lg text-muted-foreground leading-relaxed">
                              {post.excerpt}
                            </p>
                          )}
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span>{post.author.name}</span>
                            <span>•</span>
                            <time>
                              {formatDistance(
                                new Date(post.createdAt),
                                new Date(),
                                { addSuffix: true },
                              )}
                            </time>
                          </div>
                        </div>
                      </Link>
                    </article>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </main>
  );
}
