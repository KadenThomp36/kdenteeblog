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
        authorId: session.user.id,
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
