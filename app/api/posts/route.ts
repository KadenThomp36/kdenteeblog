import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";

export async function POST(req: Request) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      console.error("No session or user ID found");
      return NextResponse.json(
        { error: "Unauthorized - Please log in" },
        { status: 401 },
      );
    }

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

    // Handle tags - create or connect existing ones
    const tagConnections =
      tags && tags.length > 0
        ? {
            connectOrCreate: await Promise.all(
              tags.map(async (tagName: string) => ({
                where: { slug: tagName.toLowerCase().replace(/\s+/g, "-") },
                create: {
                  name: tagName,
                  slug: tagName.toLowerCase().replace(/\s+/g, "-"),
                },
              })),
            ),
          }
        : undefined;

    const post = await db.post.create({
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
        authorId: session.user.id,
        tags: tagConnections,
      },
      include: {
        tags: true,
      },
    });

    return NextResponse.json(post);
  } catch (error: any) {
    console.error("Error creating post:", error);
    return NextResponse.json(
      { error: error.message || "Internal Server Error" },
      { status: 500 },
    );
  }
}
