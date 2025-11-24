import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { formatDistance } from "date-fns";
import Image from "next/image";

export async function generateStaticParams() {
  const posts = await db.post.findMany({
    where: {
      published: true,
    },
    select: {
      slug: true,
    },
  });

  return posts.map((post) => ({
    slug: post.slug,
  }));
}

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
          className="prose prose-lg dark:prose-invert max-w-none"
          dangerouslySetInnerHTML={{ __html: post.content }}
        />
      </article>
    </main>
  );
}
