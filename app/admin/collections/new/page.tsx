"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UploadButton } from "@/components/upload-button";

export default function NewCollectionPage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [coverImage, setCoverImage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);

  const generateSlug = (text: string) => {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
  };

  const handleTitleChange = (value: string) => {
    setTitle(value);
    if (!slugManuallyEdited) {
      setSlug(generateSlug(value));
    }
  };

  const handleSlugChange = (value: string) => {
    setSlug(value);
    setSlugManuallyEdited(true);
  };

  const handleSubmit = async (published: boolean) => {
    setIsSubmitting(true);
    try {
      const response = await fetch("/api/collections", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title,
          slug,
          description,
          coverImage,
          published,
        }),
      });

      if (response.ok) {
        router.push("/admin/collections");
        router.refresh();
      } else {
        const data = await response.json();
        alert(data.error || "Failed to create collection");
      }
    } catch (error) {
      console.error("Error creating collection:", error);
      alert("Failed to create collection");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle>Create New Collection</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => handleTitleChange(e.target.value)}
                placeholder="e.g., Japan Vacation 2024"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="slug">Slug</Label>
              <Input
                id="slug"
                value={slug}
                onChange={(e) => handleSlugChange(e.target.value)}
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
                Publish
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={() => router.back()}
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
