import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const post = await db.post.findUnique({
      where: {
        id,
      },
      include: {
        tags: true,
      },
    });

    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    return NextResponse.json(post);
  } catch (error: any) {
    console.error("Error fetching post:", error);
    return NextResponse.json(
      { error: error.message || "Internal Server Error" },
      { status: 500 },
    );
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      console.error("No session or user ID found");
      return NextResponse.json(
        { error: "Unauthorized - Please log in" },
        { status: 401 },
      );
    }

    const { id } = await params;
    const body = await req.json();
    const {
      title,
      slug,
      excerpt,
      content,
      coverImage,
      published,
      collectionId,
      tags,
      eventDate,
    } = body;

    if (!title || !slug || !content) {
      console.error("Missing required fields:", {
        title: !!title,
        slug: !!slug,
        content: !!content,
      });
      return NextResponse.json(
        {
          error:
            "Missing required fields: title, slug, and content are required",
        },
        { status: 400 },
      );
    }

    // Handle tags - disconnect all existing tags and reconnect with new ones
    const tagConnections =
      tags && tags.length > 0
        ? {
            set: [], // Disconnect all existing tags first
            connectOrCreate: tags.map((tagName: string) => ({
              where: { slug: tagName.toLowerCase().replace(/\s+/g, "-") },
              create: {
                name: tagName,
                slug: tagName.toLowerCase().replace(/\s+/g, "-"),
              },
            })),
          }
        : { set: [] }; // If no tags, just clear all

    const post = await db.post.update({
      where: {
        id,
      },
      data: {
        title,
        slug,
        excerpt: excerpt || null,
        content,
        coverImage: coverImage || null,
        published: published || false,
        collectionId:
          collectionId && collectionId !== "none" ? collectionId : null,
        eventDate: eventDate ? new Date(eventDate) : null,
        tags: tagConnections,
      },
      include: {
        tags: true,
      },
    });

    return NextResponse.json(post);
  } catch (error: any) {
    console.error("Error updating post:", error);
    return NextResponse.json(
      { error: error.message || "Internal Server Error" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized - Please log in" },
        { status: 401 },
      );
    }

    const { id } = await params;

    await db.post.delete({
      where: {
        id,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error deleting post:", error);
    return NextResponse.json(
      { error: error.message || "Internal Server Error" },
      { status: 500 },
    );
  }
}
