"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UploadButton } from "@/components/upload-button";

interface Collection {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  coverImage: string | null;
  published: boolean;
}

export default function EditCollectionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const [collectionId, setCollectionId] = useState<string>("");
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [coverImage, setCoverImage] = useState("");
  const [published, setPublished] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const loadCollection = async () => {
      const resolvedParams = await params;
      setCollectionId(resolvedParams.id);

      try {
        const response = await fetch(`/api/collections/${resolvedParams.id}`);
        if (response.ok) {
          const collection: Collection = await response.json();
          setTitle(collection.title);
          setSlug(collection.slug);
          setDescription(collection.description || "");
          setCoverImage(collection.coverImage || "");
          setPublished(collection.published);
        } else {
          alert("Failed to load collection");
          router.push("/admin/collections");
        }
      } catch (error) {
        console.error("Error loading collection:", error);
        alert("Failed to load collection");
        router.push("/admin/collections");
      } finally {
        setIsLoading(false);
      }
    };

    loadCollection();
  }, [params, router]);

  const handleSubmit = async (shouldPublish: boolean) => {
    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/collections/${collectionId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title,
          slug,
          description,
          coverImage,
          published: shouldPublish,
        }),
      });

      if (response.ok) {
        router.push("/admin/collections");
        router.refresh();
      } else {
        const data = await response.json();
        alert(data.error || "Failed to update collection");
      }
    } catch (error) {
      console.error("Error updating collection:", error);
      alert("Failed to update collection");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (
      !confirm(
        "Are you sure you want to delete this collection? Posts in this collection will not be deleted.",
      )
    ) {
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/collections/${collectionId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        router.push("/admin/collections");
        router.refresh();
      } else {
        const data = await response.json();
        alert(data.error || "Failed to delete collection");
      }
    } catch (error) {
      console.error("Error deleting collection:", error);
      alert("Failed to delete collection");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Loading collection...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle>Edit Collection</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Japan Vacation 2024"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="slug">Slug</Label>
              <Input
                id="slug"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="japan-vacation-2024"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief description of this collection"
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label>Cover Image (Optional)</Label>
              {coverImage ? (
                <div className="space-y-2">
                  <img
                    src={coverImage}
                    alt="Cover"
                    className="w-full h-48 object-cover rounded-md"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setCoverImage("")}
                  >
                    Remove Image
                  </Button>
                </div>
              ) : (
                <UploadButton
                  onUploadComplete={(url) => setCoverImage(url)}
                  onUploadError={(error) => alert(`Upload failed: ${error}`)}
                />
              )}
            </div>

            <div className="flex gap-4">
              <Button
                onClick={() => handleSubmit(false)}
                disabled={isSubmitting || !title || !slug}
                variant="outline"
              >
                Save Draft
              </Button>
              <Button
                onClick={() => handleSubmit(true)}
                disabled={isSubmitting || !title || !slug}
              >
                {published ? "Update & Keep Published" : "Publish"}
              </Button>
              <Button
                type="button"
                variant="ghost"
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
                Delete Collection
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
