import Link from "next/link";
import { db } from "@/lib/db";
import { formatDistance, format } from "date-fns";
import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FolderOpen, Calendar, Tag as TagIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface SearchParams {
  tag?: string;
}

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const { tag: selectedTag } = await searchParams;
  // Get all published collections with their posts
  const collections = await db.collection.findMany({
    where: {
      published: true,
    },
    include: {
      posts: {
        where: {
          published: true,
          ...(selectedTag && {
            tags: {
              some: {
                slug: selectedTag,
              },
            },
          }),
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
          tags: true,
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
      ...(selectedTag && {
        tags: {
          some: {
            slug: selectedTag,
          },
        },
      }),
    },
    include: {
      author: {
        select: {
          name: true,
          image: true,
        },
      },
      tags: true,
    },
    orderBy: [
      {
        eventDate: "desc",
      },
      {
        createdAt: "desc",
      },
    ],
  });

  // Group standalone posts by event date (year/month)
  const groupedPosts = standalonePosts.reduce(
    (acc, post) => {
      const date = post.eventDate || post.createdAt;
      const key = format(new Date(date), "yyyy-MM");
      const displayKey = format(new Date(date), "MMMM yyyy");

      if (!acc[key]) {
        acc[key] = {
          displayKey,
          posts: [],
        };
      }
      acc[key].posts.push(post);
      return acc;
    },
    {} as Record<string, { displayKey: string; posts: typeof standalonePosts }>,
  );

  // Get all tags for filtering
  const allTags = await db.tag.findMany({
    orderBy: {
      name: "asc",
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

        {/* Tag Filter */}
        {allTags.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <TagIcon className="h-5 w-5 text-muted-foreground" />
              <h2 className="text-lg font-semibold">Filter by tag</h2>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link href="/">
                <Badge
                  variant={!selectedTag ? "default" : "outline"}
                  className="cursor-pointer hover:bg-primary/80"
                >
                  All Posts
                </Badge>
              </Link>
              {allTags.map((tag) => (
                <Link key={tag.id} href={`/?tag=${tag.slug}`}>
                  <Badge
                    variant={selectedTag === tag.slug ? "default" : "outline"}
                    className="cursor-pointer hover:bg-primary/80"
                  >
                    {tag.name}
                  </Badge>
                </Link>
              ))}
            </div>
          </div>
        )}

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
                            {post.tags.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-2">
                                {post.tags.map((tag) => (
                                  <Badge
                                    key={tag.id}
                                    variant="secondary"
                                    className="text-xs"
                                  >
                                    {tag.name}
                                  </Badge>
                                ))}
                              </div>
                            )}
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

              {/* Standalone Posts - Grouped by Event Date */}
              {Object.keys(groupedPosts).length > 0 && (
                <div className="space-y-16">
                  {Object.entries(groupedPosts).map(([key, group]) => (
                    <div key={key} className="space-y-8">
                      <div className="flex items-center gap-3 border-b pb-3">
                        <Calendar className="h-6 w-6 text-primary" />
                        <h2 className="text-2xl font-bold tracking-tight">
                          {group.displayKey}
                        </h2>
                        <span className="text-sm text-muted-foreground">
                          ({group.posts.length}{" "}
                          {group.posts.length === 1 ? "post" : "posts"})
                        </span>
                      </div>

                      <div className="space-y-12">
                        {group.posts.map((post) => (
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
                                <h3 className="text-3xl font-bold tracking-tight group-hover:text-primary transition-colors">
                                  {post.title}
                                </h3>
                                {post.excerpt && (
                                  <p className="text-lg text-muted-foreground leading-relaxed">
                                    {post.excerpt}
                                  </p>
                                )}
                                <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                                  <span>{post.author.name}</span>
                                  <span>•</span>
                                  {post.eventDate && (
                                    <>
                                      <time className="flex items-center gap-1">
                                        <Calendar className="h-3 w-3" />
                                        {format(
                                          new Date(post.eventDate),
                                          "MMM d, yyyy",
                                        )}
                                      </time>
                                      <span>•</span>
                                    </>
                                  )}
                                  <time>
                                    Posted{" "}
                                    {formatDistance(
                                      new Date(post.createdAt),
                                      new Date(),
                                      { addSuffix: true },
                                    )}
                                  </time>
                                  {post.tags.length > 0 && (
                                    <>
                                      <span>•</span>
                                      <div className="flex flex-wrap gap-1">
                                        {post.tags.map((tag) => (
                                          <Link
                                            key={tag.id}
                                            href={`/?tag=${tag.slug}`}
                                            onClick={(e) => e.stopPropagation()}
                                          >
                                            <Badge
                                              variant="secondary"
                                              className="text-xs hover:bg-primary/20"
                                            >
                                              {tag.name}
                                            </Badge>
                                          </Link>
                                        ))}
                                      </div>
                                    </>
                                  )}
                                </div>
                              </div>
                            </Link>
                          </article>
                        ))}
                      </div>
                    </div>
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
