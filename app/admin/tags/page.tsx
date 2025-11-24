"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Pencil, Trash2 } from "lucide-react";

interface Tag {
  id: string;
  name: string;
  slug: string;
  _count: {
    posts: number;
  };
}

export default function TagsPage() {
  const [tags, setTags] = useState<Tag[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchTags();
  }, []);

  const fetchTags = async () => {
    try {
      const response = await fetch("/api/tags");
      if (response.ok) {
        const data = await response.json();
        setTags(data);
      }
    } catch (error) {
      console.error("Error fetching tags:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (tagId: string, tagName: string) => {
    if (
      !confirm(
        `Are you sure you want to delete "${tagName}"? It will be removed from all posts.`,
      )
    ) {
      return;
    }

    try {
      const response = await fetch(`/api/tags/${tagId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        fetchTags(); // Refresh the list
      } else {
        const data = await response.json();
        alert(data.error || "Failed to delete tag");
      }
    } catch (error) {
      console.error("Error deleting tag:", error);
      alert("Failed to delete tag");
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Loading tags...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Tag Management</CardTitle>
                <CardDescription>
                  Manage tags for organizing your blog posts
                </CardDescription>
              </div>
              <Link href="/admin/posts">
                <Button variant="outline">Back to Posts</Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {tags.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground mb-4">
                  No tags yet. Tags are created automatically when you add them
                  to posts.
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tag Name</TableHead>
                    <TableHead>Slug</TableHead>
                    <TableHead>Posts</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tags.map((tag) => (
                    <TableRow key={tag.id}>
                      <TableCell>
                        <Badge variant="secondary">{tag.name}</Badge>
                      </TableCell>
                      <TableCell className="font-mono text-sm text-muted-foreground">
                        {tag.slug}
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">
                          {tag._count.posts}{" "}
                          {tag._count.posts === 1 ? "post" : "posts"}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-2 justify-end">
                          <Link href={`/admin/tags/${tag.id}/edit`}>
                            <Button variant="ghost" size="sm">
                              <Pencil className="h-4 w-4" />
                            </Button>
                          </Link>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-destructive hover:text-destructive"
                            onClick={() => handleDelete(tag.id, tag.name)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
