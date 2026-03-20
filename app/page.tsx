import Link from "next/link";
import { db } from "@/lib/db";
import { formatDistance, format } from "date-fns";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { TimelineSidebar } from "@/components/timeline-sidebar";

interface SearchParams {
  tag?: string;
}

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const { tag: selectedTag } = await searchParams;
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

  const allTags = await db.tag.findMany({
    orderBy: {
      name: "asc",
    },
  });

  const hasContent = collections.length > 0 || standalonePosts.length > 0;

  return (
    <main className="min-h-screen relative">
      <TimelineSidebar />

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 pt-24 pb-20 lg:pt-32 lg:pb-28">
          <div className="max-w-3xl animate-fade-up">
            <p className="text-[13px] font-medium uppercase tracking-[0.2em] text-primary mb-6">
              Journal & Stories
            </p>
            <h1 className="font-display text-5xl sm:text-6xl lg:text-7xl leading-[0.95] tracking-tight mb-8">
              Words, images,
              <br />
              <span className="text-primary italic">& everything</span>
              <br />
              in between.
            </h1>
            <p className="text-lg text-muted-foreground max-w-lg leading-relaxed animate-fade-up-delay-1">
              A personal space for stories, photography, and ideas worth sharing.
            </p>
          </div>
          {/* Decorative line */}
          <div className="mt-16 h-px bg-gradient-to-r from-border via-primary/20 to-transparent animate-fade-up-delay-2" />
        </div>
      </section>

      {/* Tag Filter */}
      {allTags.length > 0 && (
        <section className="max-w-7xl mx-auto px-6 pb-12 animate-fade-up-delay-2">
          <div className="flex items-center gap-6 flex-wrap">
            <span className="text-[11px] font-medium uppercase tracking-[0.2em] text-muted-foreground">
              Filter
            </span>
            <div className="flex flex-wrap gap-2">
              <Link href="/">
                <Badge
                  variant={!selectedTag ? "default" : "outline"}
                  className={`cursor-pointer text-[11px] uppercase tracking-[0.1em] px-3 py-1 rounded-full transition-all ${
                    !selectedTag
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "hover:border-primary/50 hover:text-primary"
                  }`}
                >
                  All
                </Badge>
              </Link>
              {allTags.map((tag) => (
                <Link key={tag.id} href={`/?tag=${tag.slug}`}>
                  <Badge
                    variant={selectedTag === tag.slug ? "default" : "outline"}
                    className={`cursor-pointer text-[11px] uppercase tracking-[0.1em] px-3 py-1 rounded-full transition-all ${
                      selectedTag === tag.slug
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "hover:border-primary/50 hover:text-primary"
                    }`}
                  >
                    {tag.name}
                  </Badge>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      <div className="max-w-7xl mx-auto px-6 pb-24">
        {!hasContent ? (
          <div className="text-center py-24">
            <p className="font-display text-2xl italic text-muted-foreground">
              Nothing here yet — check back soon.
            </p>
          </div>
        ) : (
          <div className="space-y-28">
            {/* Collections */}
            {collections.map((collection) => (
              <section key={collection.id} className="animate-fade-up">
                <div className="grid lg:grid-cols-2 gap-8 lg:gap-16 items-start">
                  {/* Collection cover */}
                  {collection.coverImage && (
                    <Link
                      href={`/collections/${collection.slug}`}
                      className="block group"
                    >
                      <div className="relative aspect-[4/3] overflow-hidden rounded-sm bg-muted">
                        <Image
                          src={collection.coverImage}
                          alt={collection.title}
                          fill
                          className="object-cover editorial-image"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                      </div>
                    </Link>
                  )}

                  {/* Collection info */}
                  <div
                    className={
                      collection.coverImage ? "" : "lg:col-span-2 max-w-2xl"
                    }
                  >
                    <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-primary mb-4">
                      Collection &middot; {collection.posts.length} posts
                    </p>
                    <Link href={`/collections/${collection.slug}`}>
                      <h2 className="font-display text-3xl sm:text-4xl tracking-tight mb-4 hover:text-primary transition-colors">
                        {collection.title}
                      </h2>
                    </Link>
                    {collection.description && (
                      <p className="text-muted-foreground leading-relaxed mb-6">
                        {collection.description}
                      </p>
                    )}
                    <div className="text-xs text-muted-foreground mb-8">
                      By {collection.author.name} &middot;{" "}
                      {formatDistance(
                        new Date(collection.createdAt),
                        new Date(),
                        { addSuffix: true },
                      )}
                    </div>

                    {/* Preview posts */}
                    <div className="space-y-4 border-t border-border pt-6">
                      {collection.posts.slice(0, 3).map((post, index) => (
                        <Link
                          key={post.id}
                          href={`/posts/${post.slug}`}
                          className="group flex items-baseline gap-4"
                        >
                          <span className="text-[11px] text-muted-foreground tabular-nums font-medium">
                            {String(index + 1).padStart(2, "0")}
                          </span>
                          <span className="text-sm font-medium group-hover:text-primary transition-colors">
                            {post.title}
                          </span>
                          {post.tags.length > 0 && (
                            <span className="hidden sm:inline text-[10px] uppercase tracking-[0.1em] text-muted-foreground">
                              {post.tags[0].name}
                            </span>
                          )}
                        </Link>
                      ))}
                      {collection.posts.length > 3 && (
                        <Link
                          href={`/collections/${collection.slug}`}
                          className="inline-block text-xs text-primary hover-line pt-2"
                        >
                          View all {collection.posts.length} posts
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              </section>
            ))}

            {/* Standalone Posts - Grouped by Event Date */}
            {Object.keys(groupedPosts).length > 0 && (
              <div className="space-y-24">
                {Object.entries(groupedPosts).map(([key, group]) => (
                  <section key={key}>
                    {/* Month header */}
                    <div className="flex items-baseline gap-4 mb-12">
                      <h2 className="font-display text-3xl sm:text-4xl tracking-tight">
                        {group.displayKey}
                      </h2>
                      <span className="text-[11px] font-medium uppercase tracking-[0.15em] text-muted-foreground">
                        {group.posts.length}{" "}
                        {group.posts.length === 1 ? "entry" : "entries"}
                      </span>
                      <div className="flex-1 h-px bg-border ml-4" />
                    </div>

                    <div className="space-y-20">
                      {group.posts.map((post, postIndex) => {
                        const isFeature = postIndex === 0 && post.coverImage;

                        if (isFeature) {
                          return (
                            <article key={post.id} className="group">
                              <Link href={`/posts/${post.slug}`}>
                                <div className="grid lg:grid-cols-5 gap-8 lg:gap-12">
                                  {/* Image - takes 3 cols */}
                                  <div className="lg:col-span-3 relative aspect-[3/2] overflow-hidden rounded-sm bg-muted">
                                    <Image
                                      src={post.coverImage!}
                                      alt={post.title}
                                      fill
                                      className="object-cover editorial-image"
                                    />
                                  </div>

                                  {/* Text - takes 2 cols */}
                                  <div className="lg:col-span-2 flex flex-col justify-center">
                                    {post.tags.length > 0 && (
                                      <div className="flex flex-wrap gap-2 mb-4">
                                        {post.tags.map((tag) => (
                                          <span
                                            key={tag.id}
                                            className="text-[10px] font-medium uppercase tracking-[0.15em] text-primary"
                                          >
                                            {tag.name}
                                          </span>
                                        ))}
                                      </div>
                                    )}
                                    <h3 className="font-display text-2xl sm:text-3xl lg:text-4xl tracking-tight mb-4 group-hover:text-primary transition-colors leading-[1.1]">
                                      {post.title}
                                    </h3>
                                    {post.excerpt && (
                                      <p className="text-muted-foreground leading-relaxed mb-6 line-clamp-3">
                                        {post.excerpt}
                                      </p>
                                    )}
                                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                      <span className="font-medium">
                                        {post.author.name}
                                      </span>
                                      <span className="w-1 h-1 rounded-full bg-muted-foreground/40" />
                                      {post.eventDate && (
                                        <>
                                          <time>
                                            {format(
                                              new Date(post.eventDate),
                                              "MMM d, yyyy",
                                            )}
                                          </time>
                                          <span className="w-1 h-1 rounded-full bg-muted-foreground/40" />
                                        </>
                                      )}
                                      <time>
                                        {formatDistance(
                                          new Date(post.createdAt),
                                          new Date(),
                                          { addSuffix: true },
                                        )}
                                      </time>
                                    </div>
                                  </div>
                                </div>
                              </Link>
                            </article>
                          );
                        }

                        return (
                          <article key={post.id} className="group">
                            <Link href={`/posts/${post.slug}`}>
                              {post.coverImage && (
                                <div className="relative w-full aspect-[21/9] mb-6 overflow-hidden rounded-sm bg-muted">
                                  <Image
                                    src={post.coverImage}
                                    alt={post.title}
                                    fill
                                    className="object-cover editorial-image"
                                  />
                                </div>
                              )}
                              <div className="max-w-2xl">
                                {post.tags.length > 0 && (
                                  <div className="flex flex-wrap gap-3 mb-3">
                                    {post.tags.map((tag) => (
                                      <span
                                        key={tag.id}
                                        className="text-[10px] font-medium uppercase tracking-[0.15em] text-primary"
                                      >
                                        {tag.name}
                                      </span>
                                    ))}
                                  </div>
                                )}
                                <h3 className="font-display text-2xl sm:text-3xl tracking-tight mb-3 group-hover:text-primary transition-colors leading-[1.15]">
                                  {post.title}
                                </h3>
                                {post.excerpt && (
                                  <p className="text-muted-foreground leading-relaxed mb-4 line-clamp-2">
                                    {post.excerpt}
                                  </p>
                                )}
                                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                  <span className="font-medium">
                                    {post.author.name}
                                  </span>
                                  <span className="w-1 h-1 rounded-full bg-muted-foreground/40" />
                                  {post.eventDate && (
                                    <>
                                      <time>
                                        {format(
                                          new Date(post.eventDate),
                                          "MMM d, yyyy",
                                        )}
                                      </time>
                                      <span className="w-1 h-1 rounded-full bg-muted-foreground/40" />
                                    </>
                                  )}
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
                        );
                      })}
                    </div>
                  </section>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="border-t border-border/40">
        <div className="max-w-7xl mx-auto px-6 py-12 flex flex-col sm:flex-row items-center justify-between gap-4">
          <span className="font-display text-lg text-muted-foreground">
            KdenTee
          </span>
          <p className="text-[11px] uppercase tracking-[0.15em] text-muted-foreground">
            &copy; {new Date().getFullYear()} &middot; All rights reserved
          </p>
        </div>
      </footer>
    </main>
  );
}
