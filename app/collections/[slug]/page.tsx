import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { formatDistance } from "date-fns";
import Image from "next/image";
import Link from "next/link";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const collection = await db.collection.findUnique({
    where: { slug },
  });

  if (!collection) return {};

  return {
    title: `${collection.title} — KdenTee`,
    description: collection.description,
  };
}

export default async function CollectionPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const collection = await db.collection.findUnique({
    where: { slug },
    include: {
      posts: {
        where: { published: true },
        orderBy: { order: "asc" },
        include: {
          tags: true,
        },
      },
      author: {
        select: { name: true },
      },
    },
  });

  if (!collection || !collection.published) {
    notFound();
  }

  return (
    <main className="min-h-screen">
      {/* Cover */}
      {collection.coverImage && (
        <div className="relative w-full h-[45vh] sm:h-[55vh] overflow-hidden bg-muted animate-fade-up">
          <Image
            src={collection.coverImage}
            alt={collection.title}
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/30 to-transparent" />
        </div>
      )}

      <div
        className={`max-w-4xl mx-auto px-6 ${collection.coverImage ? "-mt-24 relative z-10" : "pt-20"}`}
      >
        {/* Header */}
        <header className="mb-16 animate-fade-up">
          <div className="flex items-center gap-2 mb-6">
            <Link
              href="/"
              className="text-[11px] font-medium uppercase tracking-[0.15em] text-muted-foreground hover:text-primary transition-colors"
            >
              Home
            </Link>
            <span className="text-muted-foreground/40">/</span>
            <span className="text-[11px] font-medium uppercase tracking-[0.15em] text-muted-foreground">
              Collection
            </span>
          </div>

          <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl tracking-tight leading-[1.05] mb-6">
            {collection.title}
          </h1>
          {collection.description && (
            <p className="text-lg text-muted-foreground leading-relaxed mb-6 max-w-2xl">
              {collection.description}
            </p>
          )}
          <div className="flex items-center gap-3 text-sm text-muted-foreground pb-8 border-b border-border">
            <span className="font-medium text-foreground">
              {collection.author.name}
            </span>
            <span className="w-1 h-1 rounded-full bg-muted-foreground/40" />
            <span>
              {collection.posts.length} post
              {collection.posts.length !== 1 ? "s" : ""}
            </span>
            <span className="w-1 h-1 rounded-full bg-muted-foreground/40" />
            <time>
              {formatDistance(new Date(collection.createdAt), new Date(), {
                addSuffix: true,
              })}
            </time>
          </div>
        </header>

        {/* Posts list */}
        {collection.posts.length === 0 ? (
          <div className="text-center py-20">
            <p className="font-display text-xl italic text-muted-foreground">
              No posts in this collection yet.
            </p>
          </div>
        ) : (
          <div className="space-y-1 animate-fade-up-delay-1">
            {collection.posts.map((post, index) => (
              <Link
                key={post.id}
                href={`/posts/${post.slug}`}
                className="group block"
              >
                <div className="flex items-start gap-6 py-6 border-b border-border/60 hover:border-primary/30 transition-colors">
                  {/* Number */}
                  <span className="flex-shrink-0 w-10 text-right text-[13px] tabular-nums text-muted-foreground/60 font-medium pt-1">
                    {String(index + 1).padStart(2, "0")}
                  </span>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        {post.tags.length > 0 && (
                          <div className="flex flex-wrap gap-2 mb-2">
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
                        <h3 className="font-display text-xl sm:text-2xl tracking-tight group-hover:text-primary transition-colors leading-tight mb-2">
                          {post.title}
                        </h3>
                        {post.excerpt && (
                          <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                            {post.excerpt}
                          </p>
                        )}
                      </div>

                      {/* Thumbnail */}
                      {post.coverImage && (
                        <div className="flex-shrink-0 relative w-20 h-20 sm:w-28 sm:h-28 overflow-hidden rounded-sm bg-muted">
                          <Image
                            src={post.coverImage}
                            alt={post.title}
                            fill
                            className="object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* Back link */}
        <div className="mt-16 pb-24">
          <Link
            href="/"
            className="group flex items-center gap-3 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <span className="inline-block w-8 h-px bg-muted-foreground group-hover:bg-primary group-hover:w-12 transition-all" />
            Back to all posts
          </Link>
        </div>
      </div>
    </main>
  );
}
