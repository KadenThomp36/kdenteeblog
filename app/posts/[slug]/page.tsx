import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { formatDistance } from "date-fns";
import Image from "next/image";

// Database is only accessible via Tailscale, so we use dynamic rendering
// Posts will be fetched on-demand when users visit them
export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = await db.post.findUnique({
    where: {
      slug,
    },
  });

  if (!post) {
    return {};
  }

  return {
    title: post.title,
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
    where: {
      slug,
    },
    include: {
      author: {
        select: {
          name: true,
          image: true,
        },
      },
    },
  });

  if (!post || !post.published) {
    notFound();
  }

  return (
    <main className="min-h-screen">
      <article className="max-w-3xl mx-auto px-4 py-16">
        {post.coverImage && (
          <div className="relative w-full h-64 md:h-96 mb-8 rounded-lg overflow-hidden">
            <Image
              src={post.coverImage}
              alt={post.title}
              fill
              className="object-cover"
              priority
            />
          </div>
        )}

        <header className="mb-8">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 tracking-tight">
            {post.title}
          </h1>
          <div className="flex items-center gap-4 text-muted-foreground">
            <span>{post.author.name}</span>
            <span>•</span>
            <time>
              {formatDistance(new Date(post.createdAt), new Date(), {
                addSuffix: true,
              })}
            </time>
          </div>
        </header>

        <div
          className="prose prose-lg dark:prose-invert max-w-none [&_.image-wrapper]:my-4 [&_.image-wrapper[data-float='left']]:float-left [&_.image-wrapper[data-float='left']]:mr-4 [&_.image-wrapper[data-float='left']]:mb-4 [&_.image-wrapper[data-float='left']]:max-w-[50%] [&_.image-wrapper[data-float='right']]:float-right [&_.image-wrapper[data-float='right']]:ml-4 [&_.image-wrapper[data-float='right']]:mb-4 [&_.image-wrapper[data-float='right']]:max-w-[50%] [&_.image-wrapper_img]:rounded-lg [&_.image-wrapper_img]:max-w-full [&_.image-wrapper_img]:h-auto"
          dangerouslySetInnerHTML={{ __html: post.content }}
        />
      </article>
    </main>
  );
}
