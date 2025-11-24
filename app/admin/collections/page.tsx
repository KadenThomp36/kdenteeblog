import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDistance } from "date-fns";
import { Plus, FolderOpen } from "lucide-react";

export default async function CollectionsPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const collections = await db.collection.findMany({
    include: {
      _count: {
        select: { posts: true },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h1 className="text-3xl font-bold">Collections</h1>
            <p className="text-muted-foreground mt-2">
              Group related posts together
            </p>
          </div>
          <Link href="/admin/collections/new">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New Collection
            </Button>
          </Link>
        </div>

        <div className="mb-8">
          <Link href="/admin/posts">
            <Button variant="outline" size="sm">
              ← Back to Posts
            </Button>
          </Link>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {collections.map((collection) => (
            <Card
              key={collection.id}
              className="hover:shadow-lg transition-shadow"
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="line-clamp-2">
                      {collection.title}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground mt-2">
                      {collection._count.posts} post
                      {collection._count.posts !== 1 ? "s" : ""}
                    </p>
                  </div>
                  <FolderOpen className="h-5 w-5 text-muted-foreground" />
                </div>
              </CardHeader>
              <CardContent>
                {collection.description && (
                  <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                    {collection.description}
                  </p>
                )}
                <div className="flex gap-2 items-center text-xs text-muted-foreground mb-4">
                  <span>
                    {formatDistance(
                      new Date(collection.createdAt),
                      new Date(),
                      {
                        addSuffix: true,
                      },
                    )}
                  </span>
                  <span>•</span>
                  <span
                    className={
                      collection.published ? "text-green-600" : "text-amber-600"
                    }
                  >
                    {collection.published ? "Published" : "Draft"}
                  </span>
                </div>
                <div className="flex gap-2">
                  <Link
                    href={`/admin/collections/${collection.id}/edit`}
                    className="flex-1"
                  >
                    <Button variant="outline" size="sm" className="w-full">
                      Edit
                    </Button>
                  </Link>
                  {collection.published && (
                    <Link
                      href={`/collections/${collection.slug}`}
                      className="flex-1"
                    >
                      <Button variant="ghost" size="sm" className="w-full">
                        View
                      </Button>
                    </Link>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {collections.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center">
              <FolderOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No collections yet</h3>
              <p className="text-muted-foreground mb-4">
                Create a collection to group related posts together
              </p>
              <Link href="/admin/collections/new">
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Your First Collection
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
