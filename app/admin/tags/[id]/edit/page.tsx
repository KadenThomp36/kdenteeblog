"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface Tag {
  id: string;
  name: string;
  slug: string;
}

export default function EditTagPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const [tagId, setTagId] = useState<string>("");
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const loadTag = async () => {
      const resolvedParams = await params;
      setTagId(resolvedParams.id);

      try {
        const response = await fetch(`/api/tags/${resolvedParams.id}`);
        if (response.ok) {
          const tag: Tag = await response.json();
          setName(tag.name);
          setSlug(tag.slug);
        } else {
          alert("Failed to load tag");
          router.push("/admin/tags");
        }
      } catch (error) {
        console.error("Error loading tag:", error);
        alert("Failed to load tag");
        router.push("/admin/tags");
      } finally {
        setIsLoading(false);
      }
    };

    loadTag();
  }, [params, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/tags/${tagId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          slug,
        }),
      });

      if (response.ok) {
        router.push("/admin/tags");
        router.refresh();
      } else {
        const data = await response.json();
        alert(data.error || "Failed to update tag");
      }
    } catch (error) {
      console.error("Error updating tag:", error);
      alert("Failed to update tag");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (
      !confirm(
        "Are you sure you want to delete this tag? It will be removed from all posts.",
      )
    ) {
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/tags/${tagId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        router.push("/admin/tags");
        router.refresh();
      } else {
        const data = await response.json();
        alert(data.error || "Failed to delete tag");
      }
    } catch (error) {
      console.error("Error deleting tag:", error);
      alert("Failed to delete tag");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Loading tag...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle>Edit Tag</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="name">Tag Name</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter tag name"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="slug">Slug</Label>
                <Input
                  id="slug"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  placeholder="tag-url-slug"
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Used in URLs for filtering posts
                </p>
              </div>

              <div className="flex gap-4">
                <Button type="submit" disabled={isSubmitting}>
                  Update Tag
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.back()}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <div className="flex-1" />
                <Button
                  type="button"
                  variant="destructive"
                  onClick={handleDelete}
                  disabled={isSubmitting}
                >
                  Delete Tag
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
