import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const posts = await db.post.findMany({
      where: {
        published: true,
      },
      select: {
        id: true,
        title: true,
        slug: true,
        createdAt: true,
        eventDate: true,
      },
      orderBy: [
        {
          eventDate: "desc",
        },
        {
          createdAt: "desc",
        },
      ],
    });

    return NextResponse.json(posts);
  } catch (error: any) {
    console.error("Error fetching timeline:", error);
    return NextResponse.json(
      { error: error.message || "Internal Server Error" },
      { status: 500 },
    );
  }
}
