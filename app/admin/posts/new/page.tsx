"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Editor } from "@/components/editor";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { UploadButton } from "@/components/upload-button";
import { TagInput } from "@/components/tag-input";

interface Collection {
  id: string;
  title: string;
}

export default function NewPostPage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [content, setContent] = useState("");
  const [coverImage, setCoverImage] = useState("");
  const [collectionId, setCollectionId] = useState<string>("");
  const [collections, setCollections] = useState<Collection[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [eventDate, setEventDate] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);

  useEffect(() => {
    const fetchCollections = async () => {
      try {
        const response = await fetch("/api/collections");
        if (response.ok) {
          const data = await response.json();
          setCollections(data);
        }
      } catch (error) {
        console.error("Error fetching collections:", error);
      }
    };

    fetchCollections();
  }, []);

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
      const response = await fetch("/api/posts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title,
          slug,
          excerpt,
          content,
          coverImage,
          published,
          collectionId: collectionId || null,
          tags,
          eventDate: eventDate || null,
        }),
      });

      if (response.ok) {
        router.push("/admin/posts");
        router.refresh();
      } else {
        const data = await response.json();
        const errorMessage = data.error || "Failed to create post";
        console.error("Server error:", errorMessage);
        alert(errorMessage);
      }
    } catch (error) {
      console.error("Error creating post:", error);
      alert(
        "Failed to create post: " +
          (error instanceof Error ? error.message : String(error)),
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle>Create New Post</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => handleTitleChange(e.target.value)}
                placeholder="Enter post title"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="slug">Slug</Label>
              <Input
                id="slug"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="post-url-slug"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="eventDate">Event Date (Optional)</Label>
              <Input
                id="eventDate"
                type="date"
                value={eventDate}
                onChange={(e) => setEventDate(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                When did these events actually occur? Used for chronological
                grouping.
              </p>
            </div>

            <TagInput tags={tags} onChange={setTags} />

            <div className="space-y-2">
              <Label htmlFor="excerpt">Excerpt</Label>
              <Textarea
                id="excerpt"
                value={excerpt}
                onChange={(e) => setExcerpt(e.target.value)}
                placeholder="Brief description of the post"
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="collection">Collection (Optional)</Label>
              <Select value={collectionId} onValueChange={setCollectionId}>
                <SelectTrigger>
                  <SelectValue placeholder="No collection (standalone post)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No collection</SelectItem>
                  {collections.map((collection) => (
                    <SelectItem key={collection.id} value={collection.id}>
                      {collection.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Group this post with other related posts
              </p>
            </div>

            <div className="space-y-2">
              <Label>Cover Image</Label>
              {coverImage ? (
                <div className="space-y-2">
                  <div className="relative w-full h-48 rounded-md overflow-hidden">
                    <Image
                      src={coverImage}
                      alt="Cover"
                      fill
                      className="object-cover"
                    />
                  </div>
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

            <div className="space-y-2">
              <Label>Content</Label>
              <Editor content={content} onChange={setContent} />
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
