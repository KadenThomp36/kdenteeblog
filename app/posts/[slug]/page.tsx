import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { formatDistance, format } from "date-fns";
import Image from "next/image";
import Link from "next/link";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = await db.post.findUnique({
    where: { slug },
  });

  if (!post) return {};

  return {
    title: `${post.title} — KdenTee`,
    description: post.excerpt,
  };
}

export default async function PostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = await db.post.findUnique({
    where: { slug },
    include: {
      author: {
        select: {
          name: true,
          image: true,
        },
      },
      tags: true,
      collection: {
        select: {
          title: true,
          slug: true,
        },
      },
    },
  });

  if (!post || !post.published) {
    notFound();
  }

  return (
    <main className="min-h-screen">
      {/* Cover image - full width cinematic */}
      {post.coverImage && (
        <div className="relative w-full h-[50vh] sm:h-[60vh] lg:h-[70vh] overflow-hidden bg-muted animate-fade-up">
          <Image
            src={post.coverImage}
            alt={post.title}
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent" />
        </div>
      )}

      <article
        className={`max-w-3xl mx-auto px-6 ${post.coverImage ? "-mt-32 relative z-10" : "pt-20"}`}
      >
        {/* Header */}
        <header className="mb-16 animate-fade-up">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 mb-6">
            <Link
              href="/"
              className="text-[11px] font-medium uppercase tracking-[0.15em] text-muted-foreground hover:text-primary transition-colors"
            >
              Home
            </Link>
            {post.collection && (
              <>
                <span className="text-muted-foreground/40">/</span>
                <Link
                  href={`/collections/${post.collection.slug}`}
                  className="text-[11px] font-medium uppercase tracking-[0.15em] text-muted-foreground hover:text-primary transition-colors"
                >
                  {post.collection.title}
                </Link>
              </>
            )}
          </div>

          {/* Tags */}
          {post.tags.length > 0 && (
            <div className="flex flex-wrap gap-3 mb-6">
              {post.tags.map((tag) => (
                <Link key={tag.id} href={`/?tag=${tag.slug}`}>
                  <span className="text-[11px] font-medium uppercase tracking-[0.2em] text-primary hover:text-primary/70 transition-colors">
                    {tag.name}
                  </span>
                </Link>
              ))}
            </div>
          )}

          <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl tracking-tight leading-[1.05] mb-8">
            {post.title}
          </h1>

          {post.excerpt && (
            <p className="text-lg sm:text-xl text-muted-foreground leading-relaxed mb-8 max-w-2xl">
              {post.excerpt}
            </p>
          )}

          <div className="flex items-center gap-4 text-sm text-muted-foreground pb-8 border-b border-border">
            <span className="font-medium text-foreground">
              {post.author.name}
            </span>
            <span className="w-1 h-1 rounded-full bg-muted-foreground/40" />
            {post.eventDate && (
              <>
                <time>{format(new Date(post.eventDate), "MMMM d, yyyy")}</time>
                <span className="w-1 h-1 rounded-full bg-muted-foreground/40" />
              </>
            )}
            <time>
              {formatDistance(new Date(post.createdAt), new Date(), {
                addSuffix: true,
              })}
            </time>
          </div>
        </header>

        {/* Content */}
        <div
          className="prose prose-lg dark:prose-invert max-w-none animate-fade-up-delay-1 [&_.image-wrapper]:my-4 [&_.image-wrapper[data-float='left']]:float-left [&_.image-wrapper[data-float='left']]:mr-4 [&_.image-wrapper[data-float='left']]:mb-4 [&_.image-wrapper[data-float='left']]:max-w-[50%] [&_.image-wrapper[data-float='right']]:float-right [&_.image-wrapper[data-float='right']]:ml-4 [&_.image-wrapper[data-float='right']]:mb-4 [&_.image-wrapper[data-float='right']]:max-w-[50%] [&_.image-wrapper_img]:rounded-sm [&_.image-wrapper_img]:max-w-full [&_.image-wrapper_img]:h-auto"
          dangerouslySetInnerHTML={{ __html: post.content }}
        />

        {/* Post footer */}
        <div className="mt-20 pt-8 border-t border-border animate-fade-up-delay-2">
          <div className="flex items-center justify-between">
            <Link
              href="/"
              className="group flex items-center gap-3 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <span className="inline-block w-8 h-px bg-muted-foreground group-hover:bg-primary group-hover:w-12 transition-all" />
              Back to all posts
            </Link>
            {post.collection && (
              <Link
                href={`/collections/${post.collection.slug}`}
                className="group flex items-center gap-3 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                More from {post.collection.title}
                <span className="inline-block w-8 h-px bg-muted-foreground group-hover:bg-primary group-hover:w-12 transition-all" />
              </Link>
            )}
          </div>
        </div>

        {/* Spacer */}
        <div className="h-24" />
      </article>
    </main>
  );
}
