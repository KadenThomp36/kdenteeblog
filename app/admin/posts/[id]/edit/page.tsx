"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
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

interface Post {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string;
  coverImage: string | null;
  published: boolean;
  collectionId: string | null;
}

interface Collection {
  id: string;
  title: string;
}

export default function EditPostPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const [postId, setPostId] = useState<string>("");
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [content, setContent] = useState("");
  const [coverImage, setCoverImage] = useState("");
  const [collectionId, setCollectionId] = useState<string>("");
  const [collections, setCollections] = useState<Collection[]>([]);
  const [published, setPublished] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const loadPost = async () => {
      const resolvedParams = await params;
      setPostId(resolvedParams.id);

      try {
        const response = await fetch(`/api/posts/${resolvedParams.id}`);
        if (response.ok) {
          const post: Post = await response.json();
          setTitle(post.title);
          setSlug(post.slug);
          setExcerpt(post.excerpt || "");
          setContent(post.content);
          setCoverImage(post.coverImage || "");
          setCollectionId(post.collectionId || "none");
          setPublished(post.published);
        } else {
          alert("Failed to load post");
          router.push("/admin/posts");
        }
      } catch (error) {
        console.error("Error loading post:", error);
        alert("Failed to load post");
        router.push("/admin/posts");
      } finally {
        setIsLoading(false);
      }
    };

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

    loadPost();
    fetchCollections();
  }, [params, router]);

  const handleSubmit = async (shouldPublish: boolean) => {
    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/posts/${postId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title,
          slug,
          excerpt,
          content,
          coverImage,
          published: shouldPublish,
          collectionId:
            collectionId && collectionId !== "none" ? collectionId : null,
        }),
      });

      if (response.ok) {
        router.push("/admin/posts");
        router.refresh();
      } else {
        const data = await response.json();
        const errorMessage = data.error || "Failed to update post";
        console.error("Server error:", errorMessage);
        alert(errorMessage);
      }
    } catch (error) {
      console.error("Error updating post:", error);
      alert(
        "Failed to update post: " +
          (error instanceof Error ? error.message : String(error)),
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (
      !confirm(
        "Are you sure you want to delete this post? This action cannot be undone.",
      )
    ) {
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/posts/${postId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        router.push("/admin/posts");
        router.refresh();
      } else {
        const data = await response.json();
        alert(data.error || "Failed to delete post");
      }
    } catch (error) {
      console.error("Error deleting post:", error);
      alert("Failed to delete post");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Loading post...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle>Edit Post</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
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
                Delete Post
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
