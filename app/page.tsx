import Link from "next/link";
import { db } from "@/lib/db";
import { formatDistance } from "date-fns";
import Image from "next/image";

export default async function Home() {
  const posts = await db.post.findMany({
    where: {
      published: true,
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
    take: 10,
  });

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

        <div className="space-y-12">
          {posts.length === 0 ? (
            <p className="text-muted-foreground">
              No posts yet. Check back soon!
            </p>
          ) : (
            posts.map((post) => (
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
                        {formatDistance(new Date(post.createdAt), new Date(), {
                          addSuffix: true,
                        })}
                      </time>
                    </div>
                  </div>
                </Link>
              </article>
            ))
          )}
        </div>
      </div>
    </main>
  );
}
